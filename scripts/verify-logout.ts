
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
    console.error('Login Failed');
    process.exit(1);
  }

  const loginData = await loginRes.json();
  const token = loginData.data.token;
  console.log('Login Success.');

  console.log('\nTesting Logout...');
  const logoutRes = await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  const logoutData = await logoutRes.json();
  console.log('Logout Response:', JSON.stringify(logoutData, null, 2));

  if (logoutData.success === true && logoutData.message === 'Logged out successfully') {
    console.log('\n✅ Logout Verification PASSED');
  } else {
    console.error('\n❌ Logout Verification FAILED');
    process.exit(1);
  }
}

main().catch(console.error);
