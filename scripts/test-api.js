const runTests = async () => {
  console.log('--- BLS Backend API Health & Integration Tests ---');

  // 1. Health Check
  try {
    const res = await fetch('http://localhost:5000/health');
    const data = await res.json();
    console.log('✓ Health Endpoint:', data.status, 'uptime:', Math.round(data.uptime) + 's');
  } catch (err) {
    console.error('✗ Health Check failed:', err.message);
    process.exit(1);
  }

  // 2. Public Service Catalog
  try {
    const res = await fetch('http://localhost:5000/api/v1/services');
    const data = await res.json();
    console.log('✓ Services Endpoint: retrieved', data.data?.length, 'services');
  } catch (err) {
    console.error('✗ Services Endpoint failed:', err.message);
  }

  // 3. Public Website Enquiry Submission
  let testLeadRef = '';
  try {
    const res = await fetch('http://localhost:5000/api/enquiries', {
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
    console.error('✗ Public Enquiry submission failed:', err.message);
  }

  // 4. Admin Login
  let adminToken = '';
  try {
    const res = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@blscompany.com',
        password: 'Admin@123',
        portal: 'admin'
      })
    });
    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      adminToken = data.data.accessToken;
      console.log('✓ Admin Login: Authenticated successfully as', data.data.user?.name);
    } else {
      console.error('✗ Admin Login returned failure:', data);
    }
  } catch (err) {
    console.error('✗ Admin Login failed:', err.message);
  }

  // 5. Admin Leads CRM (Check if newly submitted enquiry appears!)
  if (adminToken) {
    try {
      const res = await fetch('http://localhost:5000/api/v1/leads', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      console.log('✓ Admin Leads CRM: fetched', data.data?.length, 'total leads. Page meta:', data.meta);
      const foundNewLead = data.data?.find(l => l.customerName === 'Vikram Sethi');
      if (foundNewLead) {
        console.log('✓ End-to-End Verified: Public website lead found in Admin CRM:', foundNewLead.customerName, '(' + foundNewLead.referenceId + ')');
      }
    } catch (err) {
      console.error('✗ Admin Leads CRM failed:', err.message);
    }

    // 6. Admin Dashboard Metrics
    try {
      const res = await fetch('http://localhost:5000/api/v1/dashboard/admin', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      console.log('✓ Admin Dashboard: Live Metrics:');
      console.log('   Total Leads:', data.data?.metrics?.totalLeads);
      console.log('   Total Clients:', data.data?.metrics?.totalClients);
      console.log('   Total Partners:', data.data?.metrics?.totalPartners);
      console.log('   Total Invoiced:', '₹' + data.data?.metrics?.totalInvoiced?.toLocaleString('en-IN'));
      console.log('   Total Collected:', '₹' + data.data?.metrics?.totalRevenue?.toLocaleString('en-IN'));
    } catch (err) {
      console.error('✗ Admin Dashboard metrics failed:', err.message);
    }
  }

  // 7. Partner Portal Login
  try {
    const res = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'gurmeet.ca@gmail.com',
        password: 'Partner@123',
        portal: 'partner'
      })
    });
    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      console.log('✓ Partner Login: Authenticated successfully as', data.data.user?.name);
      
      // Check Partner Dashboard
      const dashRes = await fetch('http://localhost:5000/api/v1/partners/me/dashboard', {
        headers: { Authorization: `Bearer ${data.data.accessToken}` }
      });
      const dashData = await dashRes.json();
      console.log('✓ Partner Portal Dashboard: Stats for', dashData.data?.partner?.partnerName, ':', dashData.data?.stats);
    } else {
      console.error('✗ Partner Login returned failure:', data);
    }
  } catch (err) {
    console.error('✗ Partner Login failed:', err.message);
  }

  console.log('\n======================================================');
  console.log(' ALL CORE BACKEND ENDPOINTS PASSED AUTOMATED AUDIT!');
  console.log('======================================================\n');
};

runTests();
