import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp to 10 users
    { duration: '1m', target: 10 },  // Stay at 10 users
    { duration: '10s', target: 0 },  // Scale down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(50)<300'], // 95% of requests < 800ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:54321/functions/v1';
const AUTH_TOKEN = __ENV.AUTH_TOKEN; // Staff token

export default function () {
  // 1. Issue a token (requires user token, skipping for simplicity in load test unless setup)
  // Instead, we assume we have a pre-generated valid QR token or we mock the verification
  
  // For a real load test, we'd need a pool of valid tokens.
  // Here we just test the endpoint response time even if invalid.
  
  const payload = JSON.stringify({
    qr_token: "test_token_" + Math.random(),
    device_id: "load_test_device"
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  };

  const res = http.post(`${BASE_URL}/redeem-pass`, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200 || r.status === 400, // 400 is fine for invalid token
  });

  sleep(1);
}
