# Deploying the Swift AI website on AWS (your EC2 instance)

Two things run on the server:
1. **The website**: static files (`dist/`) served by nginx.
2. **The API**: a small Node service (`swiftai-api`) on `127.0.0.1:3100`. nginx forwards `/api/` to it. It saves forms into MySQL, sends notification emails through ZeptoMail, and hosts the chat assistant. (This replaces Formspree and AWS Lambda.)

SingleQR keeps running as it does today. We add a separate nginx site file, a separate database and a separate service on a different port. Nothing of SingleQR is edited.

## 0. Before you start
- Domain: the site assumes `swift-ai.in` (change it in `src/data/site.ts`, `astro.config.mjs`, `public/robots.txt` and `deploy/nginx-swiftai.conf` if different).
- Check the port is free on the server: `sudo ss -ltnp | grep 3100` should print nothing. If it is used, pick another port and use it in the env file and nginx config.
- Node 20+ on the server: `node -v` (SingleQR already uses Node; if it is older than 20, install Node 20 with nvm or NodeSource).
- ZeptoMail: add and verify your sending domain (swift-ai.in), create a **Mail Agent**, and copy its **Send Mail token**. Note which data centre you use (`.com`, `.in`, `.eu`): it decides `ZEPTOMAIL_API_HOST`.
- Optional, for the chat assistant: an Anthropic API key with a monthly spend limit.

## 0b. Amazon Linux (ec2-user) differences
If your instance runs Amazon Linux, use these instead of the Ubuntu-style commands below. Everywhere the guide says `ubuntu@`, use `ec2-user@`.
- **nginx config:** there is no `sites-available` or `sites-enabled`. Copy the file to `/etc/nginx/conf.d/swiftai.conf` (nginx already includes everything in `conf.d`), then `sudo nginx -t && sudo systemctl reload nginx`. Leave SingleQR's existing file alone.
- **Node for the service:** the service runs as its own user and cannot use a Node installed under your home folder (for example nvm). Run `which node`. If it prints `/usr/bin/node` or `/usr/local/bin/node`, you are fine. If it is under `/home/ec2-user/...`, run `sudo cp "$(which node)" /usr/local/bin/node` and set `ExecStart=/usr/local/bin/node /opt/swiftai-api/main.mjs` in the service file.
- **Service user:** `sudo useradd --system --no-create-home --shell /sbin/nologin swiftai`
- **HTTPS (certbot):** `sudo dnf install -y augeas-libs python3-pip && sudo python3 -m venv /opt/certbot && sudo /opt/certbot/bin/pip install certbot certbot-nginx && sudo ln -sf /opt/certbot/bin/certbot /usr/bin/certbot`, then `sudo certbot --nginx -d swift-ai.in -d www.swift-ai.in`. Renewal: `echo "0 3 * * * root /opt/certbot/bin/certbot renew -q" | sudo tee /etc/cron.d/certbot-renew`.
- **MySQL:** the client is `mysql` and the service is `mysqld` or `mariadb` (check with `systemctl list-units | grep -Ei "mysql|maria"`). If MySQL runs in Docker, put `docker exec -i <container>` in front of `mysql` commands.
- **Installing nginx** (if it is not there yet): `sudo dnf install -y nginx && sudo systemctl enable --now nginx`.

## 1. Server basics (once)
1. Security group: allow 22 (your IP only), 80 and 443 (anywhere). Do NOT open 3100 or 3306 to the internet.
2. Elastic IP attached to the instance (if SingleQR already uses one, you do not need another). Point `A` records for `swift-ai.in` and `www` at the instance's IP.
3. Install nginx if it is not already there: `sudo apt update && sudo apt install -y nginx`.
   Because SingleQR is already served from this instance, nginx is probably installed. Keep its existing site files as they are.

## 2. The database (once)
Use a separate database and a user that can only touch it. Run as the MySQL admin (`sudo mysql` or `mysql -u root -p`):
```sql
CREATE DATABASE swiftai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'swiftai'@'127.0.0.1' IDENTIFIED BY 'PUT-A-LONG-RANDOM-PASSWORD-HERE';
GRANT SELECT, INSERT, UPDATE ON swiftai.* TO 'swiftai'@'127.0.0.1';
FLUSH PRIVILEGES;
```
Create the tables: `mysql -u root -p swiftai < server/schema.sql` (copy `server/schema.sql` to the server first). It is safe to run again.
MySQL should listen on localhost only (`bind-address = 127.0.0.1`). Later phases will need extra privileges and tables; the schema file will tell you.

## 3. The API service (once)
1. Create a service user and folder:
   ```bash
   sudo useradd --system --no-create-home --shell /usr/sbin/nologin swiftai
   sudo mkdir -p /opt/swiftai-api && sudo chown $USER:$USER /opt/swiftai-api
   ```
2. Create the secrets file from `deploy/server.env.example`:
   ```bash
   sudo nano /etc/swiftai-api.env      # paste the example, fill DB_PASSWORD, ZEPTOMAIL_TOKEN, etc.
   sudo chown root:swiftai /etc/swiftai-api.env && sudo chmod 640 /etc/swiftai-api.env
   ```
   Secrets stay in this file only. They are never in the repository or the website.
3. Install the service: `sudo cp deploy/swiftai-api.service /etc/systemd/system/` then `sudo systemctl daemon-reload && sudo systemctl enable swiftai-api`.
4. Upload and start it (from your computer): `scripts/deploy-api.sh ubuntu@YOUR_SERVER_IP path/to/key.pem`.
   It runs the tests, builds, uploads, installs dependencies on the server, restarts the service and prints `{"ok":true}` when healthy.
5. See the log if needed: `sudo journalctl -u swiftai-api -n 50 --no-pager`.

## 4. nginx and HTTPS
1. Copy `deploy/nginx-swiftai.conf` to `/etc/nginx/sites-available/swiftai`, then:
   ```bash
   sudo ln -s /etc/nginx/sites-available/swiftai /etc/nginx/sites-enabled/swiftai
   sudo nginx -t && sudo systemctl reload nginx
   ```
   (Do not remove SingleQR's site file. `default` can be removed only if SingleQR does not use it.)
2. Upload the website: `scripts/deploy-ec2.sh ubuntu@YOUR_SERVER_IP path/to/key.pem` (first create the folder: `sudo mkdir -p /var/www/swiftai && sudo chown $USER:$USER /var/www/swiftai`).
3. Free HTTPS: `sudo snap install --classic certbot && sudo certbot --nginx -d swift-ai.in -d www.swift-ai.in` (choose redirect to HTTPS). Renewal is automatic.

## 5. Check everything
- `curl https://swift-ai.in/api/health` returns `{"ok":true}`.
- Open the site, submit the Contact form. You should see the success message, receive a notification email, and find the row:
  `mysql -u root -p swiftai -e "SELECT id, form_name, email_sent, created_at FROM form_submissions ORDER BY id DESC LIMIT 5;"`
- `email_sent = 0` with an `email_error` means the lead was saved but the email failed (wrong token, unverified domain or wrong host). Fix the env file, then `sudo systemctl restart swiftai-api`.
- The chat widget answers (needs `ANTHROPIC_API_KEY`), and shows the contact message if the key is empty.
- `/sitemap-index.xml`, `/robots.txt` and `/llms.txt` open.

## 6. Backups (do this on day one)
Nightly dump kept for 14 days (as root: `sudo crontab -e`):
```
15 2 * * * mkdir -p /var/backups/swiftai && mysqldump --single-transaction swiftai | gzip > /var/backups/swiftai/swiftai-$(date +\%F).sql.gz && find /var/backups/swiftai -name '*.sql.gz' -mtime +14 -delete
```
Copy the backups off the instance regularly (for example to an S3 bucket) because they hold personal data.

## 7. Updating later
- Website changes: `scripts/deploy-ec2.sh ...`
- API changes: `scripts/deploy-api.sh ...`

## 8. After launch
- Verify the Google Tag Manager tag (GTM Preview) and submit `https://swift-ai.in/sitemap-index.xml` in Google Search Console.
- Have the Privacy and Terms pages reviewed. You now store personal data (names, emails, phone numbers, CTO rates): keep the database private, back it up, delete data on request, and add a cookie banner if you serve EU or UK visitors.

## Optional: S3 + CloudFront for the website files
Possible later, but the API still needs the server. Not needed now.
