import fs from 'fs';
import path from 'path';

async function addSecondBlog() {
  const imgPath = path.resolve('uploads', 'wp4289722_1790064396032_e7b9d204.png');
  const imgBuffer = fs.readFileSync(imgPath);
  const blob = new Blob([imgBuffer], { type: 'image/png' });

  const formData = new FormData();
  formData.append('title', 'GST Scrutiny & Notice Representation: Standard Operating Procedures for 2026');
  formData.append('slug', 'gst-scrutiny-notice-representation-sop-2026');
  formData.append('category', 'Taxation & GST');
  formData.append('tags', JSON.stringify(['GSTNotice', 'ASMT10', 'DRC01', 'TaxLitigation']));
  formData.append('author', 'CA Bhanwar Lal Saini');
  formData.append('authorRole', 'Senior Partner & Tax Advisor');
  formData.append(
    'excerpt',
    'Strategic legal analysis on replying to Form ASMT-10 notices, DRC-01 show-cause intimations, and handling department reconciliations.'
  );
  formData.append(
    'content',
    '## Standard Protocol for Notice Handling\n\nTaxpayers receiving automated system-generated intimations under Section 61 must submit pointwise replies in Form ASMT-11 within 30 days.\n\n### Core Verification Stages\n\n• **Turnover Discrepancies**: Resolving GSTR-1 vs GSTR-3B tax mismatches.\n• **Ineligible ITC Demands**: Proving genuine vendor supply chain trail with e-Way bills and bank statements.\n• **Interest Computations**: Applying Section 50(1) net cash liability rules.\n\n> "Never ignore an ASMT-10 query; failure to reply leads directly to DRC-01 adjudication and bank attachment risk."\n\n### Consultation\n\nOur specialized tax litigation desk prepares point-by-point tabular submissions to settle matters at the assessment stage.'
  );
  formData.append('featured', 'false');
  formData.append('status', 'Published');
  formData.append('coverImage', blob, 'gst_scrutiny_sop.png');

  const res = await fetch('http://localhost:5000/api/v1/blogs', {
    method: 'POST',
    body: formData,
  });
  const data = (await res.json()) as any;
  console.log('Second Blog Created:', data.success, data.data?.title);
}

addSecondBlog().catch(console.error);
