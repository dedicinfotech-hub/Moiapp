#!/bin/bash
# MoiApp Load Test Runner with Report Generation
# Usage: ./run-load-test.sh [url] [duration] [vus]

BASE_URL="${1:-http://localhost:8888/MoiApp}"
DURATION="${2:-3m}"
VUS="${3:-50}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="load-test-results"
mkdir -p "$RESULTS_DIR"

JSON_FILE="$RESULTS_DIR/results_${TIMESTAMP}.json"
HTML_FILE="$RESULTS_DIR/report_${TIMESTAMP}.html"
TEXT_FILE="$RESULTS_DIR/summary_${TIMESTAMP}.txt"

echo "=========================================="
echo "  MoiApp Load Test"
echo "=========================================="
echo "Target:      $BASE_URL"
echo "Duration:    $DURATION"
echo "Virtual Users: $VUS"
echo "Results:     $RESULTS_DIR/"
echo "=========================================="
echo ""

# Run k6 with JSON output
k6 run \
  -e BASE_URL="$BASE_URL" \
  --vus "$VUS" \
  --duration "$DURATION" \
  --out json="$JSON_FILE" \
  load-test.js 2>&1 | tee "$TEXT_FILE"

echo ""
echo "=========================================="
echo "  Generating HTML Report..."
echo "=========================================="

# Try to generate HTML report (k6 v0.45+)
if command -v k6 &> /dev/null; then
    k6 html-report "$JSON_FILE" --output "$HTML_FILE" 2>/dev/null || {
        echo "k6 html-report not available, generating custom report..."
        python3 generate_load_report.py "$JSON_FILE" "$HTML_FILE" 2>/dev/null || {
            echo "Custom report generation skipped."
        }
    }
fi

echo ""
echo "=========================================="
echo "  Test Complete!"
echo "=========================================="
echo "JSON:   $JSON_FILE"
echo "Text:   $TEXT_FILE"
if [ -f "$HTML_FILE" ]; then
    echo "HTML:   $HTML_FILE"
fi
echo "=========================================="
