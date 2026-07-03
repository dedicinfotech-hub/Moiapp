# MoiApp Backend (PHP)

PHP REST API for MoiApp. The Next.js frontend and mobile app call `/api/*` — Apache rewrites those requests to `backend/api/*` via the root `.htaccess`.

## Structure

```
backend/
  api/          # REST endpoints (auth.php, events.php, moi.php, …)
  config/       # .env, database, CORS, mail, SMS
  uploads/      # User-uploaded photos (served at /uploads/*)
  scripts/      # Migrations, cron jobs, export-db.sh
  vendor/       # Composer dependencies (PHPMailer)
  schema.sql    # Local dev schema
```

## Local setup (MAMP)

1. Copy `config/.env.example` → `config/.env` and fill in DB credentials.
2. Run `composer install` in this directory.
3. Import `schema.sql` into MySQL.
4. Point MAMP document root at the **repo root** (`MoiApp/`), not `backend/`.
5. API is available at `http://localhost:8888/MoiApp/api/ping.php`.

For Next.js dev, `frontend/next.config.mjs` proxies `/api/*` → `http://localhost:8888/MoiApp/backend/api/*`.

## Production

See [DEPLOY.md](../DEPLOY.md). Upload the entire `backend/` folder to `public_html/backend/` on Hostinger.
