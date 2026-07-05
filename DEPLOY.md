# MoiApp — Deployment Guide
**Target:** `https://moipassbook.com`  
**Host:** Hostinger shared hosting  
**Stack:** PHP 8+ backend · Next.js 14 frontend (static export)

---

## Project layout

```
MoiApp/
  backend/          ← PHP API, config, uploads, scripts (upload this + frontend/out)
    api/
    config/
    uploads/
    scripts/
    vendor/
  frontend/         ← Next.js source (build locally, upload out/)
  mobile/           ← React Native / Expo app
  .htaccess         ← routes /api/* → backend/api/*, serves Next.js static files
```

Public URLs stay the same: `/api/*` and `/uploads/*` (`.htaccess` maps them into `backend/`).

---

## 1. Export your local database

```bash
bash backend/scripts/export-db.sh
# Creates: backend/scripts/moiapp_export_YYYYMMDD_HHMMSS.sql
```

---

## 2. Create the database on Hostinger

1. Log in to **hPanel** → **Databases** → **MySQL Databases**
2. Create a new database, e.g. `u123456_moiapp`
3. Create a database user and assign it **all privileges** on that database
4. Note down: **DB_NAME**, **DB_USER**, **DB_PASS** (host is always `localhost`)

---

## 3. Import the database

1. hPanel → **Databases** → **phpMyAdmin** → select your new database
2. Click **Import** → choose the `.sql` file from step 1 → **Go**

---

## 4. Upload the PHP backend

Upload the **`backend/`** folder to Hostinger via **File Manager** or FTP.

Also upload the root **`.htaccess`** (same folder as `backend/` and `index.html`).

Target path on server (docroot for `moipassbook.com`):
```
public_html/
  backend/
    api/
    config/
    uploads/
    vendor/
  .htaccess
```

> **Tip:** Zip `backend/` + `.htaccess`, upload, then Extract.

### 4a. Create the production `.env`

On the server, create `public_html/backend/config/.env` with:

```ini
DB_HOST=localhost
DB_USER=u123456_moiapp        # your Hostinger DB user
DB_PASS=your_db_password
DB_NAME=u123456_moiapp        # your Hostinger DB name

APP_URL=https://moipassbook.com
CORS_ORIGIN=https://moipassbook.com,https://www.moipassbook.com,http://localhost:3000,capacitor://localhost,https://localhost,null

MAIL_FROM_EMAIL=noreply@moipassbook.com
MAIL_SMTP_HOST=smtp.hostinger.com
MAIL_SMTP_PORT=587
MAIL_SMTP_USER=noreply@moipassbook.com
MAIL_SMTP_PASS=your-email-account-password
MAIL_SMTP_SECURE=tls

AWS_ACCESS_KEY=               # leave blank if not using S3
AWS_SECRET_KEY=
AWS_REGION=ap-south-1
AWS_BUCKET=moiapp-photos
```

> Pick **one** canonical host (`moipassbook.com` or `www.moipassbook.com`) and redirect the other in hPanel.

### 4b. Install PHP dependencies (if `vendor/` not uploaded)

```bash
cd public_html/backend && composer install --no-dev
```

### 4c. Protect the config directory

`backend/config/.htaccess` should contain:
```apache
Deny from all
```

---

## 5. Build the Next.js frontend

```bash
cd frontend

# Install deps
npm install

# Build for moipassbook.com (root domain, no /moiapp prefix)
npm run build:moipassbook
```

This uses `frontend/.env.production.subdomain` and produces `frontend/out/` — a fully static site.

---

## 6. Upload the frontend

Upload the contents of `frontend/out/` to `public_html/` (merge with `backend/` and `.htaccess`).

Final structure:
```
public_html/
  _next/              ← Next.js static assets
  backend/            ← PHP (not browsable directly)
    api/
    config/
    uploads/
  .htaccess
  index.html
  dashboard.html
  ...
```

---

## 7. Make `backend/uploads/` writable

In Hostinger File Manager, right-click `backend/uploads/` → **Permissions** → set to `755`.

---

## 8. Verify

| Check | URL |
|-------|-----|
| Home page | `https://moipassbook.com/` |
| API health | `https://moipassbook.com/api/ping.php` |
| Login | `https://moipassbook.com/login` |
| Dashboard | `https://moipassbook.com/dashboard` |
| Guest link | `https://moipassbook.com/g/{token}` |

---

## 9. Third-party services

| Service | URL / setting |
|---------|----------------|
| **Razorpay webhook** | `https://moipassbook.com/api/payment.php?action=webhook` |
| **MSG91** | Whitelist server outbound IP (`/api/health.php?outbound_ip=1`) |
| **SMTP** | `noreply@moipassbook.com` mailbox in hPanel |

---

## Local ↔ Production quick reference

| Setting | Local (MAMP) | Production (`moipassbook.com`) |
|---------|-------------|-------------------------------|
| `backend/config/.env` | `DB_HOST=localhost`, `DB_USER=root` | Hostinger DB credentials |
| `APP_URL` | `http://localhost:8888/MoiApp` | `https://moipassbook.com` |
| `CORS_ORIGIN` | `http://localhost:3000` | `https://moipassbook.com,https://www.moipassbook.com,...` |
| `frontend/.env` | `.env.local` | `.env.production.subdomain` |
| `NEXT_PUBLIC_BASE_PATH` | *(empty)* | *(empty)* |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8888/MoiApp/api` | `https://moipassbook.com/api` |
| Build command | `npm run dev` | `npm run build:moipassbook` |
| Dev API proxy | `next.config.mjs` → `MoiApp/backend/api` | N/A (static export) |

---

## Updating after changes

```bash
# 1. Build frontend
cd frontend && npm run build:moipassbook

# 2. Upload frontend/out/* to public_html/ (overwrite)

# 3. Upload changed PHP files to public_html/backend/api/ or backend/config/
#    (never overwrite backend/config/.env on the server)
```
