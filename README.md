# Node.js backend for a **Telegram Web App**
Demo: [visit @react_node_web_app_bot](https://t.me/react_node_web_app_bot)

## Frontend
Frontend repo: [frontend](https://github.com/pavelkhmara/tg-app2-react)

## Overview

- Sends messages via `node-telegram-bot-api` (polling mode).
- Receives POSTs from the frontend at `POST /web-data` and replies to the user with `answerWebAppQuery`.
- Runs behind **Nginx** (TLS on 443 → proxy to a local port).
- **HTTPS** is required by Telegram Web Apps.

---

## Tech Stack

- **Node.js 18+ / npm**
- **Express**
- **node-telegram-bot-api**
- **PM2** (process manager)
- **Nginx + Let’s Encrypt (TLS)**

---

## Quick Start (local)

```sh
git clone <repo-url>
cd tg-app2-nodejs
cp .env.example .env     # create your env file (see below)
npm install
node index.js            # or: npm start
```

---

## Environment Variables

Create a `.env` file:

```env
# Telegram bot
TELEGRAM_BOT_TOKEN=123456:ABC...

# Public URL of the frontend (no port; HTTPS; what the bot will open)
PUBLIC_URL=https://<your-domain.com>

# Optional (informational)
HOST=<your-domain.com>
BACKEND_PORT=8000
FRONTEND_PORT=8001
```

> In code, links for `web_app` buttons are built from `PUBLIC_URL` so users open `https://<domain>` (443). Nginx terminates TLS and proxies to your internal ports.

---

## API

### POST `/web-data`

**Body:**
```json
{
  "queryId": "string",
  "products": [{ "id": "...", "title": "...", "price": 0, "description": "..." }],
  "totalPrice": 0
}
```

**Response:**  
- `200` on success  
- `500` on failure (e.g., invalid/expired queryId)

---

## Production (PM2 + Nginx)

Start and persist:

```sh
pm2 start index.js --name tg-webapp-backend
pm2 save
pm2 logs tg-webapp-backend
```

---

### Example Nginx (pair with the frontend block below):

```nginx
server {
    listen 80;
    server_name <your-domain.com>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name <your-domain.com>;

    ssl_certificate     /etc/letsencrypt/live/<your-domain.com>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<your-domain.com>/privkey.pem;

    # API → backend:8000
    location ^~ /web-data {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
    }

    # Frontend → serve:8001 (see frontend README)
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
    }
}
```

---

### Let’s Encrypt (example):

```sh
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d <your-domain.com>
```

---

## Testing

**Direct to backend (bypasses Nginx):**
```sh
curl -i -X POST 'http://127.0.0.1:8000/web-data' \
  -H 'Content-Type: application/json' \
  --data '{"queryId":"test","products":[],"totalPrice":0}'
```

**Through HTTPS + Nginx:**
```sh
curl -i -X POST 'https://<your-domain.com>/web-data' \
  -H 'Content-Type: application/json' \
  --data '{"queryId":"test","products":[],"totalPrice":0}'
```

---

## Common Pitfalls

- **404 at `/web-data` over HTTPS** → your request hits the frontend location; ensure the `location ^~ /web-data { ... }` block is inside the TLS (443) server block and Nginx was reloaded.
- **ERR_SSL_PROTOCOL_ERROR at `https://domain:8001`** → TLS is only on 443. Always open `https://<domain>` (no port); Nginx proxies to internal ports.
- **CORS** → not needed when frontend and backend share the same domain through Nginx.

---

## Credits

This project follows and adapts the tutorial on YouTube:  
https://www.youtube.com/watch?v=MzO-0IYkZMU