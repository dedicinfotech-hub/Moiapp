# "Connection Reset by Peer" — Diagnosis & Fix

## What This Error Means

```
read tcp 192.168.1.3:53588->82.25.125.106:443: read: connection reset by peer
```

The **server (82.25.125.106 = dsitesai.com)** is actively closing the TCP connection before k6 can complete the HTTP request. This is a **server-side issue**, not a k6 problem.

---

## Likely Causes (Hostinger Shared Hosting)

### 1. ModSecurity / WAF Blocking (MOST LIKELY)
Hostinger's Web Application Firewall sees k6's rapid requests as a bot/attack and drops connections.

**Symptoms:** Connections reset immediately, no response body.

**Fix:** Ask Hostinger support to whitelist your IP or disable ModSecurity for your domain.

### 2. PHP-FPM Worker Exhaustion
Shared hosting has limited PHP workers (often 5–10). When all workers are busy, new connections are dropped.

**Symptoms:** First few requests work, then all connections fail.

**Fix:** Reduce VUs in test, or upgrade hosting plan.

### 3. Connection Rate Limiting
Hostinger limits concurrent connections per IP (often 10–20).

**Symptoms:** Works with low VUs, fails above threshold.

**Fix:** Use lower VUs with longer think time.

### 4. Cloudflare Rate Limiting
If Cloudflare is in front, it may block rapid requests from same IP.

**Symptoms:** 429 errors or connection resets after initial requests.

**Fix:** Add Cloudflare exception for your IP, or test with `--rps` limit.

---

## Immediate Solutions

### Solution 1: Test Against Local MAMP First
Verify your test script works before testing live:

```bash
# Test locally first (no server blocking)
k6 run -e BASE_URL=http://localhost:8888/MoiApp load-test.js

# If local works but live fails → server-side blocking
```

### Solution 2: Reduce Load Intensity
Use lighter parameters to avoid triggering limits:

```bash
# Very gentle test
k6 run -e BASE_URL=https://dsitesai.com/moiapp \
  --vus 5 \
  --duration 1m \
  --rps 10 \
  load-test.js

# With think time (sleep between requests)
```

Update `load-test.js` to add more sleep:
```javascript
export default function () {
  // ... requests ...
  sleep(2); // Increase from 1s to 2s
}
```

### Solution 3: Use k6's `--rps` Flag
Limit requests per second to stay under rate limits:

```bash
k6 run -e BASE_URL=https://dsitesai.com/moiapp \
  --vus 10 \
  --duration 2m \
  --rps 5 \
  load-test.js
```

### Solution 4: Whitelist Your IP
1. Find your public IP: `curl ifconfig.me`
2. Ask Hostinger support to whitelist it
3. Or add to `.htaccess`:
```apache
<IfModule mod_evasive20.c>
  DOSHashTableSize 3097
  DOSPageCount 2
  DOSSiteCount 50
  DOSPageInterval 1
  DOSSiteInterval 1
  DOSBlockingPeriod 10
  DOSWhitelist 192.168.1.3  # Your IP
</IfModule>
```

### Solution 5: Disable ModSecurity (Temporary)
```bash
# Via cPanel or ask Hostinger support
# Or in .htaccess:
<IfModule mod_security.c>
  SecRuleEngine Off
</IfModule>
```

---

## Recommended Test Progression

### Step 1: Verify Locally
```bash
k6 run -e BASE_URL=http://localhost:8888/MoiApp load-test.js
```
Expected: All requests succeed, report shows green checks.

### Step 2: Single User Live Test
```bash
k6 run -e BASE_URL=https://dsitesai.com/moiapp \
  --vus 1 \
  --duration 30s \
  load-test.js
```
Expected: Should work (single user shouldn't trigger limits).

### Step 3: Gentle Load Test
```bash
k6 run -e BASE_URL=https://dsitesai.com/moiapp \
  --vus 5 \
  --duration 1m \
  --rps 5 \
  load-test.js
```
If this fails → server is blocking even gentle traffic.

### Step 4: If All Fail — Use Alternative Tools
```bash
# Apache Bench (simpler, often not blocked)
ab -n 100 -c 5 https://dsitesai.com/moiapp/api/events.php?public=1

# curl in loop
for i in {1..50}; do curl -s -o /dev/null -w "%{http_code}\n" https://dsitesai.com/moiapp/api/events.php?public=1; done
```

---

## For DigitalOcean Deployment

Once you move to DO, you control the server and won't have these issues:

```bash
# On DO droplet, test without WAF blocking
k6 run -e BASE_URL=https://your-domain.com/moiapp \
  --vus 50 \
  --duration 3m \
  load-test.js
```

---

## Quick Diagnostic Commands

```bash
# Test if API is reachable at all
curl -v https://dsitesai.com/moiapp/api/auth.php?action=ping

# Test with browser (should work)
# Visit: https://dsitesai.com/moiapp/api/events.php?public=1

# Check if it's rate limiting
for i in {1..10}; do curl -s -o /dev/null -w "%{http_code}\n" https://dsitesai.com/moiapp/api/events.php?public=1; sleep 1; done

# Test with custom headers (sometimes helps)
k6 run -e BASE_URL=https://dsitesai.com/moiapp \
  --vus 5 \
  --duration 30s \
  -e USER_AGENT="Mozilla/5.0 (compatible; LoadTest/1.0)" \
  load-test.js
```
