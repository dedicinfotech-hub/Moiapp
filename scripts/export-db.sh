#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# export-db.sh  –  Dump local MAMP database ready for Hostinger import
# Usage:  bash scripts/export-db.sh
# Output: scripts/moiapp_export_<timestamp>.sql
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config (edit if your MAMP MySQL port/path differs) ───────────────────────
MYSQL_HOST="127.0.0.1"
MYSQL_PORT="8889"          # MAMP default; change to 3306 if needed
MYSQL_USER="root"
MYSQL_PASS="root"
DB_NAME="moiapp"
OUT_DIR="$(dirname "$0")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUT_FILE="${OUT_DIR}/moiapp_export_${TIMESTAMP}.sql"

# ── Locate mysqldump (MAMP ships its own) ────────────────────────────────────
MYSQLDUMP=""
for candidate in \
    "/Applications/MAMP/Library/bin/mysqldump" \
    "/Applications/MAMP PRO/Library/bin/mysqldump" \
    "$(which mysqldump 2>/dev/null || true)"; do
  if [[ -x "$candidate" ]]; then
    MYSQLDUMP="$candidate"
    break
  fi
done

if [[ -z "$MYSQLDUMP" ]]; then
  echo "❌  mysqldump not found. Make sure MAMP is installed."
  exit 1
fi

echo "📦  Exporting database '${DB_NAME}' → ${OUT_FILE}"

"$MYSQLDUMP" \
  -h "$MYSQL_HOST" \
  -P "$MYSQL_PORT" \
  -u "$MYSQL_USER" \
  -p"$MYSQL_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --set-gtid-purged=OFF \
  --column-statistics=0 \
  "$DB_NAME" > "$OUT_FILE"

echo "✅  Done. File size: $(du -sh "$OUT_FILE" | cut -f1)"
echo ""
echo "Next steps:"
echo "  1. Log in to Hostinger hPanel → Databases → phpMyAdmin"
echo "  2. Select (or create) your database"
echo "  3. Click Import → choose ${OUT_FILE}"
