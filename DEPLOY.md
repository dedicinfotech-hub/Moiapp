# MoiApp — Deployment Guide
**Target:** `https://dsitesai.com/moiapp`  
**Host:** Hostinger shared hosting  
**Stack:** PHP 8+ backend · Next.js 14 frontend (static export)

---

## 1. Export your local database

```bash
bash scripts/export-db.sh
# Creates: scripts/moiapp_export_YYYYMMDD_HHMMSS.sql
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

Upload the entire project **except** `frontend/` to Hostinger via **File Manager** or FTP.

Target path on server:
```
public_html/moiapp/
  api/
  config/
  uploads/
  .htaccess
```

> **Tip:** Use Hostinger File Manager → Upload → select a zip, then Extract.

### 4a. Create the production `.env`

On the server, create `public_html/moiapp/config/.env` with:

```ini
DB_HOST=localhost
DB_USER=u123456_moiapp        # your Hostinger DB user
DB_PASS=your_db_password
DB_NAME=u123456_moiapp        # your Hostinger DB name

APP_URL=https://dsitesai.com/moiapp
CORS_ORIGIN=https://dsitesai.com

AWS_ACCESS_KEY=               # leave blank if not using S3
AWS_SECRET_KEY=
AWS_REGION=ap-south-1
AWS_BUCKET=moiapp-photos
```

> You can also edit `config/.env.production` locally, fill in the values,
> then upload it renamed to `config/.env`.

### 4b. Protect the config directory

Add `public_html/moiapp/config/.htaccess`:
```apache
Deny from all
```
This prevents anyone from downloading your `.env` file via the browser.

---

## 5. Build the Next.js frontend

```bash
cd frontend

# Install deps
npm install

# Build for production (uses .env.production automatically)
npm run build
```

This produces `frontend/out/` — a fully static site.

---

## 6. Upload the frontend

Upload the contents of `frontend/out/` to:
```
public_html/moiapp/   ← merge with the PHP files already there
```

The final structure on the server should look like:
```
public_html/moiapp/
  _next/              ← Next.js static assets
  api/                ← PHP endpoints
  config/             ← PHP config (with .env)
  uploads/            ← writable by PHP
  .htaccess
  index.html          ← Next.js home page
  dashboard.html      ← (etc.)
  404.html
```

---

## 7. Fix the `.htaccess` for static Next.js + PHP API

Replace `public_html/moiapp/.htaccess` with:

```apache
Options -Indexes
RewriteEngine On

# Pass auth headers to PHP
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteRule .* - [E=HTTP_X_AUTH_TOKEN:%{HTTP:X-Auth-Token}]
SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
SetEnvIf X-Auth-Token "(.*)" HTTP_X_AUTH_TOKEN=$1

# CORS preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Route /moiapp/api/* → PHP files (already in api/ folder, no rewrite needed)

# Route everything else to Next.js static files
# If the file exists, serve it directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Otherwise try .html extension (Next.js static export)
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]

# Fallback to index.html for client-side routing
RewriteRule ^ index.html [L]
```

---

## 8. Make `uploads/` writable

In Hostinger File Manager, right-click `moiapp/uploads/` → **Permissions** → set to `755`.

---

## 9. Verify

| Check | URL |
|-------|-----|
| Home page | `https://dsitesai.com/moiapp` |
| API health | `https://dsitesai.com/moiapp/api/auth.php?action=ping` |
| Login | `https://dsitesai.com/moiapp/login` |
| Dashboard | `https://dsitesai.com/moiapp/dashboard` |

---

## Local ↔ Production quick reference

| Setting | Local (MAMP) | Production (Hostinger) |
|---------|-------------|----------------------|
| `config/.env` | `DB_HOST=localhost`, `DB_USER=root` | Hostinger DB credentials |
| `CORS_ORIGIN` | `http://localhost:3000` | `https://dsitesai.com` |
| `frontend/.env` | `.env.local` | `.env.production` |
| `NEXT_PUBLIC_BASE_PATH` | *(empty)* | `/moiapp` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8888/MoiApp/api` | `https://dsitesai.com/moiapp/api` |
| Build command | `npm run dev` | `npm run build` |

---

## Updating after changes

```bash
# 1. Build
cd frontend && npm run build

# 2. Upload frontend/out/* to public_html/moiapp/ (overwrite)

# 3. Upload changed PHP files to public_html/moiapp/api/ or config/
#    (never overwrite config/.env on the server)
```
