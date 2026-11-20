# Deploying the Swift AI website on AWS

The site is a static website (plain HTML, CSS and a little JavaScript). `npm run build` creates a `dist/` folder, and that folder is the whole website.
There are two parts: **the website** (EC2 + nginx, or S3 + CloudFront) and **the chat assistant** (one small AWS Lambda). Lead forms use a form service.

## 0. Before you start
- Confirm your domain (the site assumes `swift-ai.in`; change it in `src/data/site.ts`, `astro.config.mjs` and `public/robots.txt` if different).
- Create a free form endpoint at Formspree (formspree.io) or Web3Forms and keep its URL.
- Optional, for the chat assistant: an Anthropic API key (console.anthropic.com) with a monthly spend limit set.
- Copy `.env.example` to `.env` and fill `PUBLIC_FORM_ENDPOINT` (and `PUBLIC_CHAT_ENDPOINT` once the Lambda exists). These are read when you build.

## Option A: EC2 + nginx (fastest, uses your existing instance)
1. **Open ports.** EC2 > Security Groups > your instance's group > inbound: SSH 22 (your IP only), HTTP 80 and HTTPS 443 (anywhere).
2. **Give it a fixed IP.** EC2 > Elastic IPs > Allocate > Associate with the instance. (AWS charges for public IPv4 addresses outside the free allowance, so check Billing.)
3. **Point your domain.** At your domain registrar (or Route 53), create `A` records for `swift-ai.in` and `www` pointing to the Elastic IP. DNS can take minutes to hours.
4. **Install nginx on the server** (Ubuntu): `sudo apt update && sudo apt install -y nginx`
5. **Create the web folder:** `sudo mkdir -p /var/www/swiftai && sudo chown $USER:$USER /var/www/swiftai`
6. **Install the nginx config:** copy `deploy/nginx-swiftai.conf` to the server as `/etc/nginx/sites-available/swiftai`, then
   `sudo ln -s /etc/nginx/sites-available/swiftai /etc/nginx/sites-enabled/swiftai && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx`
7. **Build and upload from your computer** (needs Node 20+): `scripts/deploy-ec2.sh ubuntu@YOUR_ELASTIC_IP path/to/key.pem`
8. **Turn on HTTPS (free):** on the server, `sudo snap install --classic certbot && sudo certbot --nginx -d swift-ai.in -d www.swift-ai.in`. Choose to redirect HTTP to HTTPS. Renewal is automatic.
9. **Check:** open `https://swift-ai.in`, click through pages, open `/sitemap-index.xml`, `/robots.txt` and `/llms.txt`.

To update the site later: change files, then run step 7 again.

## Option B: S3 + CloudFront (no server to maintain, global speed)
1. Create an S3 bucket (block public access ON). Upload with `aws s3 sync dist/ s3://YOUR_BUCKET --delete`.
2. Request a certificate in **ACM in us-east-1** for `swift-ai.in` and `www.swift-ai.in` and validate it through DNS.
3. Create a CloudFront distribution: origin = the bucket with **Origin Access Control**, default root object `index.html`, viewer protocol "redirect to HTTPS", the ACM certificate, alternate domain names set.
4. Add a **CloudFront Function** on viewer-request so folder URLs work:
   ```js
   function handler(event) {
     var r = event.request, u = r.uri;
     if (u.endsWith('/')) r.uri = u + 'index.html';
     else if (!u.includes('.')) r.uri = u + '/index.html';
     return r;
   }
   ```
5. Custom error response: 403/404 -> `/404.html` with status 404.
6. Point the domain's `A`/`AAAA` alias records to the CloudFront distribution. After each deploy, invalidate `/*`.

## The chat assistant (AWS Lambda)
1. On your computer: `npm run build:chat`, then zip the file `infra/chat/dist/index.mjs` (the zip must contain `index.mjs` at its top level).
2. AWS Lambda > Create function > Node.js 22 > upload the zip. Handler: `index.handler`.
3. Configuration > Environment variables: `ANTHROPIC_API_KEY` (your key), `ALLOWED_ORIGIN` = `https://swift-ai.in`, optional `CHAT_MODEL`, and `CHAT_DISABLED=1` only when you want to switch the assistant off.
4. Configuration > Function URL > Create, auth type NONE. Copy the URL.
5. Configuration > Concurrency: reserve about 5 so cost stays bounded. Timeout: 30 seconds. Memory: 256 MB.
6. Put the Function URL in `.env` as `PUBLIC_CHAT_ENDPOINT`, then rebuild and redeploy the website.
7. Set a spend limit on the Anthropic key. Without `PUBLIC_CHAT_ENDPOINT` the widget shows a contact message instead.

## After launch
- Verify the Google Tag Manager tag fires (GTM Preview).
- Submit `https://swift-ai.in/sitemap-index.xml` in Google Search Console and Bing Webmaster Tools.
- Submit a test form and confirm it reaches your inbox.
- Have the Privacy and Terms pages reviewed by a lawyer; add a cookie banner if you serve EU or UK visitors.

## Cost notes
Check AWS Billing for your free-tier or credit status. A small EC2 instance, an Elastic IP, Route 53 hosted zone (about $0.50 a month), Lambda (a free allowance applies), and CloudFront (a free monthly allowance applies) are the cost items. The Anthropic API is billed separately for chat usage.
