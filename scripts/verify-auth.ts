
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001/api/auth';

async function main() {
  console.log('Testing Login...');
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'aziz@gosokind.com',
      password: 'password123',
    }),
  });

  if (!loginRes.ok) {
    const text = await loginRes.text();
    console.error('Login Failed:', loginRes.status, text);
    process.exit(1);
  }

  const loginData = await loginRes.json();
  console.log('Login Success. Token received.');
  const token = loginData.data.token;

  console.log('\nTesting Me endpoint...');
  const meRes = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!meRes.ok) {
    const text = await meRes.text();
    console.error('Me Failed:', meRes.status, text);
    process.exit(1);
  }

  const meData = await meRes.json();
  console.log('Me Success:', meData);
  console.log('\nAll tests passed!');
}

// Wait for server to start roughly
setTimeout(() => {
    main().catch(console.error);
}, 2000);
