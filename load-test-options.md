# k6 Load Test — Reporting Options

## 1. Terminal Output (Default)
```bash
k6 run -e BASE_URL=https://dsitesai.com/moiapp load-test.js
```
Shows real-time stats in terminal:
```
     ✓ events status 200
     ✓ event status 200
     ✓ moi status 200

     checks.........................: 100.00% ✓ 3000  ✗ 0
     data_received..................: 1.2 MB  4.0 kB/s
     data_sent......................: 350 kB  1.2 kB/s
     http_req_duration..............: avg=45ms  min=12ms  med=38ms  max=230ms
     http_req_failed................: 0.00%   ✓ 0      ✗ 3000
     http_reqs......................: 3000   10.0/s
```

## 2. JSON Output (For Custom Reports)
```bash
k6 run -e BASE_URL=https://dsitesai.com/moiapp --out json=results.json load-test.js
```
Then generate HTML:
```bash
k6 html-report results.json --output report.html
```

## 3. Built-in HTML Report (k6 v0.45+)
```bash
k6 run -e BASE_URL=https://dsitesai.com/moiapp --out html=report.html load-test.js
```

## 4. InfluxDB + Grafana (Ongoing Monitoring)
```bash
k6 run -e BASE_URL=https://dsitesai.com/moiapp --out influxdb=http://localhost:8086/k6 load-test.js
```

## Quick Start Script
```bash
# Run test and save results
./run-load-test.sh https://dsitesai.com/moiapp 3m 50

# Results saved to: load-test-results/
# - results_YYYYMMDD_HHMMSS.json
# - summary_YYYYMMDD_HHMMSS.txt
# - report_YYYYMMDD_HHMMSS.html (if k6 html-report available)
```
