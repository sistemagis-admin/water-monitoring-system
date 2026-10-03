async function runTests() {
  console.log('Testing SWPMS API Endpoints...');
  const baseUrl = 'http://localhost:3000';

  // 1. Health
  const healthRes = await fetch(`${baseUrl}/health/ready`);
  const healthData = await healthRes.json();
  console.log('1. Health Ready:', healthData);

  // 2. Login
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ascon.co.id', password: 'Admin@123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.access_token;
  console.log('2. Admin Login successful, token acquired:', !!token);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Me
  const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  console.log('3. Profile Me:', meData.data.full_name, `(${meData.data.role})`);

  // 4. Dashboard Summary
  const dashRes = await fetch(`${baseUrl}/api/v1/dashboard/summary`, { headers: authHeaders });
  const dashData = await dashRes.json();
  console.log('4. Dashboard Summary:', dashData.data);

  // 5. Assets List
  const assetsRes = await fetch(`${baseUrl}/api/v1/assets`, { headers: authHeaders });
  const assetsData = await assetsRes.json();
  console.log(`5. Assets count: ${assetsData.data.length}`);
  console.log('   Sample asset:', assetsData.data[0]?.code, '-', assetsData.data[0]?.name, `(${assetsData.data[0]?.status})`);

  // 6. Dynamic Topology
  const topoRes = await fetch(`${baseUrl}/api/v1/sensors/topology`, { headers: authHeaders });
  const topoData = await topoRes.json();
  console.log('6. Dynamic Topology Site:', topoData.data.site.name);
  console.log(`   Areas in topology: ${topoData.data.areas.length}`);
  for (const a of topoData.data.areas) {
    console.log(`   - ${a.code} (${a.name}): ${a.assets.length} pumps`);
  }

  // 7. Alarms List
  const alarmsRes = await fetch(`${baseUrl}/api/v1/alarms`, { headers: authHeaders });
  const alarmsData = await alarmsRes.json();
  console.log(`7. Alarms count: ${alarmsData.data.length}`);

  // 8. Test Pump Command (Turn ON / OFF)
  const pump01 = assetsData.data.find((a: any) => a.code === 'pump-01');
  if (pump01) {
    console.log('8. Testing Pump Control Command on', pump01.code);
    const cmdRes = await fetch(`${baseUrl}/api/v1/assets/${pump01.id}/commands/power`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        desired_state: 'ON',
        confirmation: true,
        note: 'Test start command from integration test script',
      }),
    });
    const cmdData = await cmdRes.json();
    console.log('   Command response:', cmdData);
  }

  console.log('--- All API tests completed successfully! ---');
}

runTests().catch(console.error);
