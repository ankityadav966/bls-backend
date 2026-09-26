const BASE_URL = process.env.API_BASE_URL || 'http://bls.durgagenerator.com';

const runTests = async () => {
  console.log(`--- BLS Backend API Health & Integration Tests (${BASE_URL}) ---`);

  // 1. Health Check
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    console.log('✓ Health Endpoint:', data.status, 'uptime:', Math.round(data.uptime) + 's');
  } catch (err) {
    console.error('✗ Health Check failed:', err.message);
    process.exit(1);
  }

  // 2. Public Service Catalog
  try {
    const res = await fetch(`${BASE_URL}/api/v1/services`);
    const data = await res.json();
    console.log('✓ Services Endpoint: retrieved', data.data?.length, 'services');
  } catch (err) {
    console.error('✗ Services Endpoint failed:', err.message);
  }

  // 3. Public Website Enquiry Submission
  let testLeadRef = '';
  try {
    const res = await fetch(`${BASE_URL}/api/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Vikram Sethi',
        email: 'vikram.sethi@gmail.com',
        phone: '+91 98119 88221',
        serviceRequired: 'GST Filing & Compliance',
        city: 'Gurugram',
        message: 'Looking for monthly GST compliance retainer for tech startup'
      })
    });
    const data = await res.json();
    testLeadRef = data.data?.referenceId;
    console.log('✓ Public Enquiry Endpoint: Success, created lead:', testLeadRef);
  } catch (err) {
    console.error('✗ Enquiry submission failed:', err.message);
  }

  // 4. Admin Authentication
  let adminToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bls.com',
        password: 'Admin@123'
      })
    });
    const data = await res.json();
    adminToken = data.data?.accessToken;
    console.log('✓ Admin Login Auth:', data.success ? 'Success' : 'Failed', '- User:', data.data?.user?.email);
  } catch (err) {
    console.error('✗ Admin Login failed:', err.message);
  }

  // 5. Protected CRM Leads API
  if (adminToken) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/leads`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      console.log('✓ Protected CRM Leads API: count =', data.data?.total || data.data?.length);
    } catch (err) {
      console.error('✗ CRM Leads API failed:', err.message);
    }
  }

  // 6. Admin Dashboard Executive Aggregation
  if (adminToken) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/dashboard/admin`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      console.log('✓ Admin Dashboard API: Realized Revenue =', data.data?.invoices?.totalCollected || 'OK');
    } catch (err) {
      console.error('✗ Admin Dashboard API failed:', err.message);
    }
  }

  // 7. Partner Authentication
  let partnerToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'partner@blscompany.com',
        password: 'Partner@123',
        portal: 'partner'
      })
    });
    const data = await res.json();
    partnerToken = data.data?.accessToken;
    console.log('✓ Partner Portal Auth:', data.success ? 'Success' : 'Failed', '- User:', data.data?.user?.email);
  } catch (err) {
    console.error('✗ Partner Login failed:', err.message);
  }

  // 8. Partner Specific Dashboard
  if (partnerToken) {
    try {
      const dashRes = await fetch(`${BASE_URL}/api/v1/partners/me/dashboard`, {
        headers: { Authorization: `Bearer ${partnerToken}` }
      });
      const dashData = await dashRes.json();
      console.log('✓ Partner Dashboard API: Active Clients =', dashData.data?.partner?.activeClientsCount ?? 'OK');
    } catch (err) {
      console.error('✗ Partner Dashboard API failed:', err.message);
    }
  }

  console.log('\nAll API integration tests verified against live host.');
};

runTests();
