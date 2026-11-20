# Shared rules for the swift-ai.in site. Install: sudo cp deploy/swiftai-locations.inc /etc/nginx/swiftai-locations.inc
# Included by both deploy/nginx-swiftai.conf (HTTP) and deploy/nginx-swiftai-ssl.conf (HTTPS).
root /var/www/swiftai;
index index.html;
charset utf-8;

# compression
gzip on;
gzip_comp_level 5;
gzip_min_length 512;
gzip_types text/css application/javascript application/json application/xml image/svg+xml text/plain;

# security headers (kept at server level so every normal response gets them)
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "SAMEORIGIN" always;

# Let's Encrypt certificate checks (webroot method)
location ^~ /.well-known/acme-challenge/ {
    default_type text/plain;
    try_files $uri =404;
}

# block hidden files (.env, .git, .aws ...) but allow Let's Encrypt
location ~ /\.(?!well-known) {
    return 404;
}

# this is a static site: PHP and WordPress scanner requests are never valid
location ~* \.php(?:/|$) {
    return 404;
}
location ~* /(wp-admin|wp-content|wp-includes|wp-json|wordpress)(/|$) {
    return 404;
}
location ~* /(phpinfo|_profiler|server-status|server-info) {
    return 404;
}

# API: forwarded to the Node service on localhost (forms and chat)
location ^~ /api/ {
    limit_req zone=swiftai_api burst=15 nodelay;
    client_max_body_size 64k;
    proxy_pass http://127.0.0.1:3100;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;   # the real visitor IP, never a client-supplied value
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}

# hashed build assets never change: cache for a year
location ^~ /_astro/ {
    expires 1y;
    access_log off;
}

# images and fonts: cache for 30 days
location ~* \.(png|jpg|jpeg|svg|ico|webp|woff2)$ {
    expires 30d;
    access_log off;
    try_files $uri =404;
}

# pages are folders with index.html (for example /about/ -> /about/index.html)
location / {
    try_files $uri $uri/ =404;
}

error_page 404 /404.html;
location = /404.html {
    internal;
}
