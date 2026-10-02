import fs from 'fs';
import path from 'path';

async function testBlogCreation() {
  console.log('1. Logging in as Admin...');
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@blscompany.com', password: 'Admin@123', portal: 'admin' }),
  });
  const loginData = (await loginRes.json()) as any;
  const token = loginData.data?.token;
  console.log('Login status:', loginData.success, 'Token length:', token ? token.length : 0);

  // 2. Prepare sample local image
  const imgPath = path.resolve('uploads', 'wp4289722_1790064396028_eddcdf7a.png');
  const imgBuffer = fs.readFileSync(imgPath);
  const blob = new Blob([imgBuffer], { type: 'image/png' });

  // 3. Create FormData
  const formData = new FormData();
  formData.append('title', 'Mastering Corporate Tax Audits: Essential Checklists for FY 2026-27');
  formData.append('slug', 'mastering-corporate-tax-audits-checklist-2026');
  formData.append('category', 'Direct Tax & Audits');
  formData.append('tags', JSON.stringify(['TaxAudit', 'Form3CD', 'DirectTax', 'CorporateCompliance']));
  formData.append('author', 'CA Bhanwar Lal Saini');
  formData.append('authorRole', 'Senior Partner & Tax Advisor');
  formData.append('excerpt', 'A step-by-step practical guide on navigating Form 3CD clauses, MSME payment disclosures under Section 43B(h), and preventing statutory scrutiny notices.');
  formData.append(
    'content',
    '## Navigating Form 3CD Disclosures\n\nCorporate tax audits under Section 44AB have grown increasingly rigorous with real-time AIS/TIS data integration.\n\n### Key Scrutiny Areas\n\n• **Section 43B(h) MSME Compliance**: Ensuring timely payments to micro and small enterprises within 45/15 days.\n• **TDS/TCS Reconciliation**: Verifying deductions and remittances against Form 26AS.\n• **Depreciation Schedule Verification**: Matching block-wise additions with GST invoices and e-Way bills.\n\n> "Accurate documentation during tax audit is the primary shield against onerous appellate litigation."\n\n### Recommendation for Chief Financial Officers\n\nReview draft audit reports at least two weeks before statutory cut-offs to address reporting anomalies with your statutory auditor.'
  );
  formData.append('featured', 'true');
  formData.append('status', 'Published');
  formData.append('coverImage', blob, 'tax_audit_2026.png');

  // 4. Send request
  console.log('2. Sending blog creation request with local file upload...');
  const blogRes = await fetch('http://localhost:5000/api/v1/blogs', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
    },
    body: formData,
  });

  const blogData = await blogRes.json();
  console.log('Blog Creation Result:', JSON.stringify(blogData, null, 2));
}

testBlogCreation().catch(console.error);
