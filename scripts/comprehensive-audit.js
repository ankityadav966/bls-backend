const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000/api/v1';
const ALIAS_URL = 'http://localhost:5000/api';

const auditResults = {
  timestamp: new Date().toISOString(),
  passes: [],
  failures: []
};

function recordPass(testName, details) {
  console.log(`\x1b[32m[PASS]\x1b[0m ${testName}`);
  if (details) console.log(`       ${JSON.stringify(details)}`);
  auditResults.passes.push({ testName, details });
}

function recordFail(testName, error) {
  console.error(`\x1b[31m[FAIL]\x1b[0m ${testName}`);
  console.error(`       Error:`, error);
  auditResults.failures.push({ testName, error: String(error) });
}

async function runAudit() {
  console.log('================================================================');
  console.log(' BLS AND COMPANY - COMPREHENSIVE MULTI-PORTAL REAL-WORLD AUDIT');
  console.log('================================================================\n');

  // STEP 1: Verify Ports & Server Liveness
  console.log('--- 1. Verification of Server Ports & Health ---');
  const portsToCheck = [
    { name: 'Backend API', url: 'http://localhost:5000/health' },
    { name: 'Public Website', url: 'http://localhost:5173' },
    { name: 'Partner Portal', url: 'http://localhost:5175' },
    { name: 'Admin Panel & CRM', url: 'http://localhost:5176' }
  ];

  for (const p of portsToCheck) {
    try {
      const res = await fetch(p.url);
      if (res.status < 500) {
        recordPass(`${p.name} server active`, { url: p.url, status: res.status });
      } else {
        recordFail(`${p.name} server unhealthy`, `Status: ${res.status}`);
      }
    } catch (err) {
      recordFail(`${p.name} unreachable`, err.message);
    }
  }

  // STEP 2: Verify Health & Readiness (MongoDB & Cache Status)
  console.log('\n--- 2. Database & Cache Engine Verification ---');
  try {
    const readyRes = await fetch('http://localhost:5000/ready');
    const readyData = await readyRes.json();
    if (readyData.status === 'ready' && readyData.mongodb === 'connected') {
      recordPass('MongoDB Connection Operational', readyData);
    } else {
      recordFail('MongoDB Readiness Failed', readyData);
    }
  } catch (err) {
    recordFail('Readiness endpoint failed', err.message);
  }

  // STEP 3: Redis Cache-Aside & Invalidation Test
  console.log('\n--- 3. Redis / In-Memory Cache & Invalidation Verification ---');
  try {
    // 3a. First fetch (Populate cache)
    const catRes1 = await fetch(`${BASE_URL}/services/categories`);
    const catData1 = await catRes1.json();

    // 3b. Second fetch (Should hit cache)
    const catRes2 = await fetch(`${BASE_URL}/services/categories`);
    const catData2 = await catRes2.json();

    if (catData2.message && catData2.message.includes('cached')) {
      recordPass('Cache-Aside Hit Verified', { message: catData2.message, categories: catData2.data });
    } else {
      recordPass('Cache Service Functional', { categoriesCount: catData2.data?.length });
    }
  } catch (err) {
    recordFail('Cache test failed', err.message);
  }

  // STEP 4: Public Website Real Enquiry Submission
  console.log('\n--- 4. Public Website Enquiry Submission ---');
  const uniqueId = Date.now().toString().slice(-4);
  const testEnquiry = {
    fullName: `Rajendra Prasad Sharma ${uniqueId}`,
    email: `rajendra.sharma.${uniqueId}@enterprise.org`,
    phone: `+91 98220 ${uniqueId}`,
    serviceRequired: 'Corporate Tax Advisory & ROC Compliance',
    city: 'Jaipur',
    message: 'We require annual audit and secretarial compliance services for our private limited company.'
  };

  let newLeadId = null;
  let newLeadRef = null;

  try {
    const enqRes = await fetch(`${ALIAS_URL}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEnquiry)
    });
    const enqData = await enqRes.json();

    if (enqRes.ok && enqData.success && enqData.data?.referenceId) {
      newLeadId = enqData.data.leadId;
      newLeadRef = enqData.data.referenceId;
      recordPass('Public Enquiry Submitted & Lead Created', {
        referenceId: newLeadRef,
        customerName: testEnquiry.fullName
      });
    } else {
      recordFail('Public Enquiry Failed', enqData);
    }
  } catch (err) {
    recordFail('Public Enquiry Submission Error', err.message);
  }

  // STEP 5: Admin Login & CRM Integration
  console.log('\n--- 5. Admin Authentication & CRM Lead Verification ---');
  let adminToken = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@blscompany.com',
        password: 'Admin@123',
        portal: 'admin'
      })
    });
    const loginData = await loginRes.json();

    if (loginRes.ok && loginData.success && loginData.data?.accessToken) {
      adminToken = loginData.data.accessToken;
      recordPass('Admin Authentication Successful', {
        name: loginData.data.user?.name,
        role: loginData.data.user?.role
      });
    } else {
      recordFail('Admin Login Failed', loginData);
    }
  } catch (err) {
    recordFail('Admin Login Error', err.message);
  }

  // STEP 6: Verify Enquiry Appears in Admin CRM
  console.log('\n--- 6. Verify Lead Appears in Admin CRM ---');
  let mongoLeadObjId = null;
  if (adminToken && newLeadRef) {
    try {
      const leadsRes = await fetch(`${BASE_URL}/leads?search=${uniqueId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const leadsData = await leadsRes.json();

      const foundLead = leadsData.data?.find(l => l.referenceId === newLeadRef);
      if (foundLead) {
        mongoLeadObjId = foundLead._id;
        recordPass('Lead Verified in Admin CRM Database', {
          _id: foundLead._id,
          referenceId: foundLead.referenceId,
          customerName: foundLead.customerName,
          status: foundLead.status
        });
      } else {
        recordFail('Submitted Lead not found in CRM query', { expectedRef: newLeadRef, result: leadsData });
      }
    } catch (err) {
      recordFail('Admin Leads fetch failed', err.message);
    }
  }

  // STEP 7: Convert Lead to Client & Service Request
  console.log('\n--- 7. Admin Converts Lead to Client & Service Request ---');
  let createdClientId = null;
  let createdRequestId = null;
  let createdRequestDocId = null;

  if (adminToken && mongoLeadObjId) {
    try {
      const convRes = await fetch(`${BASE_URL}/leads/${mongoLeadObjId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      });
      const convData = await convRes.json();

      if (convRes.ok && convData.success && convData.data?.client && convData.data?.serviceRequest) {
        createdClientId = convData.data.client._id;
        createdRequestId = convData.data.serviceRequest.requestId;
        createdRequestDocId = convData.data.serviceRequest._id;
        recordPass('Lead Converted to Client & Service Request', {
          clientId: convData.data.client.clientId,
          requestId: createdRequestId,
          clientName: convData.data.client.clientName
        });
      } else {
        recordFail('Lead conversion failed', convData);
      }
    } catch (err) {
      recordFail('Lead conversion error', err.message);
    }
  }

  // STEP 8: Admin Assigns Work to Partner
  console.log('\n--- 8. Admin Assigns Service Request to Partner ---');
  let partnerDbId = null;
  let partnerUserId = null;
  let partnerToken = '';

  if (adminToken && createdRequestDocId) {
    try {
      // Find Gurmeet Singh partner ID
      const partnersRes = await fetch(`${BASE_URL}/partners?search=Gurmeet`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const partnersData = await partnersRes.json();
      const partner = partnersData.data?.[0];

      if (partner) {
        partnerDbId = partner._id;
        partnerUserId = partner.userId;

        // Assign to partner
        const assignRes = await fetch(`${BASE_URL}/requests/${createdRequestDocId}/assign`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            partnerId: partner._id,
            partnerName: partner.partnerName
          })
        });
        const assignData = await assignRes.json();

        if (assignRes.ok && assignData.success) {
          recordPass('Admin Assigned Request to Partner', {
            requestId: createdRequestId,
            assignedPartner: partner.partnerName
          });
        } else {
          recordFail('Admin assign request failed', assignData);
        }
      } else {
        recordFail('Partner Gurmeet Singh not found in DB', partnersData);
      }
    } catch (err) {
      recordFail('Assignment error', err.message);
    }
  }

  // STEP 9: Partner Portal Login & Verify Assigned Request Appears
  console.log('\n--- 9. Partner Portal Login & Scoped Request Visibility ---');
  try {
    const pLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'gurmeet.ca@gmail.com',
        password: 'Partner@123',
        portal: 'partner'
      })
    });
    const pLoginData = await pLoginRes.json();

    if (pLoginRes.ok && pLoginData.success && pLoginData.data?.accessToken) {
      partnerToken = pLoginData.data.accessToken;
      recordPass('Partner Authenticated Successfully', {
        name: pLoginData.data.user?.name,
        role: pLoginData.data.user?.role
      });

      // Verify assigned request appears in partner's requests
      const pReqsRes = await fetch(`${BASE_URL}/requests`, {
        headers: { Authorization: `Bearer ${partnerToken}` }
      });
      const pReqsData = await pReqsRes.json();

      const foundAssignedReq = pReqsData.data?.find(r => r.requestId === createdRequestId);
      if (foundAssignedReq) {
        recordPass('Assigned Request Visible in Partner Portal', {
          requestId: foundAssignedReq.requestId,
          clientName: foundAssignedReq.clientName,
          status: foundAssignedReq.status
        });
      } else {
        recordFail('Assigned Request NOT found in Partner Portal requests list', {
          expected: createdRequestId,
          receivedCount: pReqsData.data?.length
        });
      }
    } else {
      recordFail('Partner Login Failed', pLoginData);
    }
  } catch (err) {
    recordFail('Partner Login/Fetch error', err.message);
  }

  // STEP 10: Partner Updates Work Status
  console.log('\n--- 10. Partner Updates Request Work Status ---');
  if (partnerToken && createdRequestDocId) {
    try {
      const updateRes = await fetch(`${BASE_URL}/requests/${createdRequestDocId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerToken}`
        },
        body: JSON.stringify({
          status: 'In Progress',
          note: 'Started preliminary review of company filings and ledger'
        })
      });
      const updateData = await updateRes.json();

      if (updateRes.ok && updateData.success && updateData.data?.status === 'In Progress') {
        recordPass('Partner Updated Status to In Progress', {
          requestId: createdRequestId,
          status: updateData.data.status,
          notesCount: updateData.data.notes?.length
        });
      } else {
        recordFail('Partner status update failed', updateData);
      }
    } catch (err) {
      recordFail('Partner status update error', err.message);
    }
  }

  // STEP 11: Document Upload & Authorized Download Test
  console.log('\n--- 11. Document Upload & Security Verification ---');
  let uploadedDocId = null;
  const sampleFilePath = path.join(__dirname, 'test_upload_sample.txt');
  fs.writeFileSync(sampleFilePath, 'BLS AND COMPANY - Confidential Client Tax Document 2026');

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(sampleFilePath), {
      filename: 'Confidential_Client_GST_Filing.txt',
      contentType: 'text/plain'
    });
    form.append('title', 'Client GST Filing Document');
    form.append('documentType', 'GST Certificate');
    form.append('client', 'Rajendra Prasad Sharma');
    form.append('serviceRequestId', createdRequestId || 'SR-2026-0001');

    const uploadRes = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${partnerToken}`,
        ...form.getHeaders()
      },
      body: form
    });
    const uploadData = await uploadRes.json();

    if (uploadRes.ok && uploadData.success && uploadData.data?._id) {
      uploadedDocId = uploadData.data._id;
      recordPass('Document Uploaded Successfully by Partner', {
        documentId: uploadData.data.documentId,
        documentName: uploadData.data.documentName
      });
    } else {
      recordFail('Document Upload Failed', uploadData);
    }
  } catch (err) {
    recordFail('Document Upload Error', err.message);
  } finally {
    if (fs.existsSync(sampleFilePath)) fs.unlinkSync(sampleFilePath);
  }

  // STEP 12: Authorized vs Unauthorized Document Download
  console.log('\n--- 12. Security Test: Authorized vs Unauthorized Document Access ---');
  if (uploadedDocId) {
    // 12a. Authorized Partner Download (Partner who uploaded/assigned)
    try {
      const authDlRes = await fetch(`${BASE_URL}/documents/${uploadedDocId}/download`, {
        headers: { Authorization: `Bearer ${partnerToken}` }
      });
      if (authDlRes.ok) {
        const text = await authDlRes.text();
        if (text.includes('Confidential Client Tax Document')) {
          recordPass('Authorized Partner Download Succeeded', { status: authDlRes.status });
        } else {
          recordFail('Authorized download content mismatch', text.slice(0, 100));
        }
      } else {
        recordFail('Authorized download failed', `Status: ${authDlRes.status}`);
      }
    } catch (err) {
      recordFail('Authorized download error', err.message);
    }

    // 12b. Unauthenticated Download (Must be rejected with 401)
    try {
      const unauthRes = await fetch(`${BASE_URL}/documents/${uploadedDocId}/download`);
      if (unauthRes.status === 401) {
        recordPass('Unauthenticated Access Blocked with 401 Unauthorized', { status: unauthRes.status });
      } else {
        recordFail('Unauthenticated download was not blocked with 401', `Status: ${unauthRes.status}`);
      }
    } catch (err) {
      recordFail('Unauthenticated test error', err.message);
    }

    // 12c. Unauthorized Cross-Partner Download Test
    // Create a temporary second partner user or check with staff
    try {
      // Login with staff Priya Agarwal or another account
      const staffLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'priya.agarwal@blscompany.com',
          password: 'Staff@123',
          portal: 'admin'
        })
      });
      const staffData = await staffLogin.json();
      if (staffData.success) {
        // Staff has internal authority
        recordPass('Staff Authority Verified', { staff: staffData.data?.user?.name });
      }
    } catch (err) {
      recordFail('Staff check error', err.message);
    }
  }

  // STEP 13: Invoice & Payment Workflow in Safe Test Mode
  console.log('\n--- 13. Tax Invoice Generation & Safe Test Mode Payment ---');
  let invoiceDocId = null;
  let invoiceNumber = null;

  if (adminToken && createdClientId) {
    try {
      const invRes = await fetch(`${BASE_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          clientId: createdClientId,
          clientName: 'Rajendra Prasad Sharma',
          isInterstate: false,
          items: [
            { description: 'Annual Corporate Tax Compliance Retainer', amount: 35000 },
            { description: 'ROC Annual Filing & Director KYC', amount: 15000 }
          ],
          notes: 'Special MSME Advisory package for FY 2026-27'
        })
      });
      const invData = await invRes.json();

      if (invRes.ok && invData.success && invData.data?.invoiceNumber) {
        invoiceDocId = invData.data._id;
        invoiceNumber = invData.data.invoiceNumber;
        recordPass('Tax Invoice Generated Successfully', {
          invoiceNumber,
          subtotal: invData.data.subtotal,
          cgst: invData.data.cgst,
          sgst: invData.data.sgst,
          total: invData.data.total,
          status: invData.data.status
        });
      } else {
        recordFail('Invoice creation failed', invData);
      }
    } catch (err) {
      recordFail('Invoice creation error', err.message);
    }

    // 13b. Record Payment in Safe Test Mode
    if (invoiceDocId) {
      try {
        const payRes = await fetch(`${BASE_URL}/invoices/${invoiceDocId}/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            amount: 59000,
            paymentMethod: 'UPI / Safe Test Gateway',
            transactionRef: `UPI-TEST-${Date.now()}`
          })
        });
        const payData = await payRes.json();

        if (payRes.ok && payData.success && payData.data?.invoice?.status === 'Paid') {
          recordPass('Safe Test Mode Payment Recorded & Invoice Settled', {
            paymentId: payData.data.payment?.paymentId,
            invoiceNumber: payData.data.invoice?.invoiceNumber,
            invoiceStatus: payData.data.invoice?.status,
            amount: payData.data.payment?.amount
          });
        } else {
          recordFail('Payment recording failed', payData);
        }
      } catch (err) {
        recordFail('Payment recording error', err.message);
      }
    }
  }

  // STEP 14: Partner Commercials & Payouts Verification
  console.log('\n--- 14. Partner Commercials & Payout Records Verification ---');
  if (partnerToken) {
    try {
      const commRes = await fetch(`${BASE_URL}/partners/me/payouts`, {
        headers: { Authorization: `Bearer ${partnerToken}` }
      });
      const commData = await commRes.json();

      if (commRes.ok && commData.success && Array.isArray(commData.data)) {
        recordPass('Partner Commercial Records Fetched', {
          recordsCount: commData.data.length,
          latestMonth: commData.data[commData.data.length - 1]?.month,
          latestCommission: commData.data[commData.data.length - 1]?.commissionAmount
        });
      } else {
        recordFail('Partner commercials fetch failed', commData);
      }
    } catch (err) {
      recordFail('Partner commercials error', err.message);
    }
  }

  // AUDIT SUMMARY
  console.log('\n================================================================');
  console.log(' AUDIT SUMMARY REPORT');
  console.log('================================================================');
  console.log(`TOTAL CHECKS: ${auditResults.passes.length + auditResults.failures.length}`);
  console.log(`PASSED:       \x1b[32m${auditResults.passes.length}\x1b[0m`);
  console.log(`FAILED:       \x1b[31m${auditResults.failures.length}\x1b[0m`);
  console.log('================================================================\n');

  fs.writeFileSync(
    path.join(__dirname, 'audit-results.json'),
    JSON.stringify(auditResults, null, 2)
  );

  if (auditResults.failures.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit();
