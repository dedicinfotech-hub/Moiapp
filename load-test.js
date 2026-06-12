    // load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Warm up
    { duration: '3m', target: 50 },    // Sustained load
    { duration: '1m', target: 200 },   // Spike
    { duration: '3m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Test 1: Public event listing
  let res = http.get(`${__ENV.BASE_URL}/api/events.php?public=1`);
  check(res, { 'events status 200': (r) => r.status === 200 });

  // Test 2: Public event page
  res = http.get(`${__ENV.BASE_URL}/api/events.php?slug=test-event`);
  check(res, { 'event status 200': (r) => r.status === 200 });

  sleep(1);
}
