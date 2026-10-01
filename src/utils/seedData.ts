import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { env } from '../config/env.js';
import { logger } from './logger.js';

// Import Models
import { User } from '../models/User.model.js';
import { Staff } from '../models/Staff.model.js';
import { Partner } from '../models/Partner.model.js';
import { Client } from '../models/Client.model.js';
import { Lead } from '../models/Lead.model.js';
import { Service } from '../models/Service.model.js';
import { ServiceRequest } from '../models/ServiceRequest.model.js';
import { WorkAssignment } from '../models/WorkAssignment.model.js';
import { DocumentModel } from '../models/Document.model.js';
import { Invoice } from '../models/Invoice.model.js';
import { Payment } from '../models/Payment.model.js';
import { FollowUp } from '../models/FollowUp.model.js';
import { SupportTicket } from '../models/SupportTicket.model.js';
import { Knowledge } from '../models/Knowledge.model.js';
import { Notification } from '../models/Notification.model.js';
import { Settings } from '../models/Settings.model.js';
import { ROLES } from '../constants/index.js';

dotenv.config();

export const seedDatabase = async (): Promise<void> => {
  try {
    logger.info('[Seeder] Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('[Seeder] Connected. Clearing collections for fresh consistent state...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Staff.deleteMany({}),
      Partner.deleteMany({}),
      Client.deleteMany({}),
      Lead.deleteMany({}),
      Service.deleteMany({}),
      ServiceRequest.deleteMany({}),
      WorkAssignment.deleteMany({}),
      DocumentModel.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      FollowUp.deleteMany({}),
      SupportTicket.deleteMany({}),
      Knowledge.deleteMany({}),
      Notification.deleteMany({}),
      Settings.deleteMany({}),
    ]);

    logger.info('[Seeder] Collections cleared. Seeding Master Data...');

    // 1. Password hashes
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const partnerPasswordHash = await bcrypt.hash('Partner@123', 10);
    const staffPasswordHash = await bcrypt.hash('Staff@123', 10);

    // 2. Staff members
    const staffList = await Staff.insertMany([
      {
        staffId: 'STF-101',
        name: 'CA Rajesh Sharma',
        email: 'rajesh.sharma@blscompany.com',
        mobile: '+91 98110 44211',
        department: 'Direct Tax',
        role: 'Admin',
        assignedTasks: 14,
        status: 'Active',
        joinedDate: '2021-04-10',
      },
      {
        staffId: 'STF-102',
        name: 'CA Priya Agarwal',
        email: 'priya.agarwal@blscompany.com',
        mobile: '+91 98722 88310',
        department: 'Indirect Tax / GST',
        role: 'Manager',
        assignedTasks: 19,
        status: 'Active',
        joinedDate: '2022-01-15',
      },
      {
        staffId: 'STF-103',
        name: 'CS Vikramaditya Singhania',
        email: 'vikram.singh@blscompany.com',
        mobile: '+91 99341 22904',
        department: 'Corporate Law & ROC',
        role: 'Manager',
        assignedTasks: 11,
        status: 'Active',
        joinedDate: '2022-06-01',
      },
      {
        staffId: 'STF-104',
        name: 'Amitabh Verma',
        email: 'amitabh.verma@blscompany.com',
        mobile: '+91 97180 55198',
        department: 'Business Advisory',
        role: 'Staff',
        assignedTasks: 8,
        status: 'Active',
        joinedDate: '2023-03-20',
      },
      {
        staffId: 'STF-105',
        name: 'Sneha Kulkarni',
        email: 'sneha.kulkarni@blscompany.com',
        mobile: '+91 98450 33812',
        department: 'Audit & Assurance',
        role: 'Staff',
        assignedTasks: 12,
        status: 'Active',
        joinedDate: '2023-08-11',
      },
    ]);

    // 3. User Accounts (Admin, Staff, Partner)
    await User.insertMany([
      {
        name: 'CA Rajesh Sharma',
        email: 'admin@blscompany.com',
        passwordHash: adminPasswordHash,
        phone: '+91 98110 44211',
        role: ROLES.ADMIN,
        status: 'ACTIVE',
        staffId: staffList[0]._id,
      },
      {
        name: 'CA Priya Agarwal',
        email: 'priya.agarwal@blscompany.com',
        passwordHash: staffPasswordHash,
        phone: '+91 98722 88310',
        role: ROLES.STAFF,
        status: 'ACTIVE',
        staffId: staffList[1]._id,
      },
      {
        name: 'CA Gurmeet Singh',
        email: 'gurmeet.ca@gmail.com',
        passwordHash: partnerPasswordHash,
        phone: '+91 98140 33219',
        role: ROLES.PARTNER,
        status: 'ACTIVE',
      },
    ]);

    // 4. Partners
    const partnerList = await Partner.insertMany([
      {
        partnerId: 'PTR-8821',
        partnerName: 'CA Gurmeet Singh & Associates',
        email: 'gurmeet.ca@gmail.com',
        mobile: '+91 98140 33219',
        city: 'Ludhiana',
        state: 'Punjab',
        qualification: 'FCA (Chartered Accountant)',
        firmName: 'M/s Gurmeet Singh & Co.',
        registrationDate: '2024-02-14',
        totalReferrals: 18,
        activeClientsCount: 14,
        status: 'Approved',
        bankAccount: '918010045239102',
        ifsc: 'HDFC0001824',
        commercials: [
          {
            month: 'August 2026',
            clientCount: 4,
            serviceRevenue: 120000,
            commissionRate: 15,
            commissionAmount: 18000,
            status: 'Settled',
            paidDate: '2026-09-05',
          },
          {
            month: 'September 2026',
            clientCount: 3,
            serviceRevenue: 85000,
            commissionRate: 15,
            commissionAmount: 12750,
            status: 'Processing',
          },
        ],
        notes: 'Key regional partner in Punjab for industrial CMA & project reports.',
      },
      {
        partnerId: 'PTR-8822',
        partnerName: 'Aditi Mukhopadhyay',
        email: 'aditi.taxadvocate@yahoo.com',
        mobile: '+91 98311 90214',
        city: 'Kolkata',
        state: 'West Bengal',
        qualification: 'Advocate & Tax Consultant',
        firmName: 'Eastern Tax Law Chambers',
        registrationDate: '2024-04-18',
        totalReferrals: 11,
        activeClientsCount: 8,
        status: 'Approved',
        bankAccount: '330104882190',
        ifsc: 'SBIN0000012',
        commercials: [
          {
            month: 'August 2026',
            clientCount: 2,
            serviceRevenue: 45000,
            commissionRate: 12,
            commissionAmount: 5400,
            status: 'Settled',
            paidDate: '2026-09-05',
          },
        ],
      },
      {
        partnerId: 'PTR-8823',
        partnerName: 'CS Sanjay Deshmukh & Associates',
        email: 'sanjay.deshmukh.cs@gmail.com',
        mobile: '+91 98220 77112',
        city: 'Nagpur',
        state: 'Maharashtra',
        qualification: 'FCS (Company Secretary)',
        firmName: 'Deshmukh Corporate Advisory',
        registrationDate: '2026-09-18',
        totalReferrals: 2,
        activeClientsCount: 0,
        status: 'Pending Approval',
        bankAccount: '0029100038192',
        ifsc: 'ICIC0000029',
        commercials: [],
      },
    ]);

    // Link partner user account
    await User.updateOne({ email: 'gurmeet.ca@gmail.com' }, { partnerId: partnerList[0]._id });

    // 5. Services Catalog
    const serviceList = await Service.insertMany([
      {
        serviceId: 'SRV-001',
        name: 'Private Limited Company Incorporation',
        category: 'Registration Services',
        baseFee: 14999,
        turnaroundDays: 7,
        description: 'Complete SPICe+ MCA filing, DSC, DIN, MOA, AOA, PAN, TAN and Bank Account assistance.',
        documentsRequired: ['Director PAN', 'Director Aadhaar', 'Address Proof', 'NOC from landlord'],
      },
      {
        serviceId: 'SRV-002',
        name: 'LLP Registration',
        category: 'Registration Services',
        baseFee: 11999,
        turnaroundDays: 8,
        description: 'Name reservation, LLP Agreement drafting, Form 1 & Form 2 filings with MCA.',
        documentsRequired: ['Partner KYC', 'Address proof'],
      },
      {
        serviceId: 'SRV-003',
        name: 'GST Registration',
        category: 'Registration Services',
        baseFee: 3499,
        turnaroundDays: 3,
        description: 'New GSTIN application with Aadhaar authentication and officer clarification resolution.',
        documentsRequired: ['PAN', 'Aadhaar', 'Electricity Bill', 'Bank statement'],
      },
      {
        serviceId: 'SRV-004',
        name: 'Monthly GST Return Filing (GSTR-1 & 3B)',
        category: 'Taxation & Return Filing',
        baseFee: 4500,
        turnaroundDays: 4,
        description: 'Reconciliation of sales register, purchase GSTR-2B ITC matching, and timely portal filing.',
        documentsRequired: ['Sales register', 'Purchase register'],
      },
      {
        serviceId: 'SRV-005',
        name: 'Corporate Income Tax Return (ITR-6)',
        category: 'Taxation & Return Filing',
        baseFee: 24999,
        turnaroundDays: 12,
        description: 'Balance sheet finalization, MAT calculation, Form 3CD tax audit linkage, and e-filing.',
        documentsRequired: ['Audited Financials', 'Form 3CD', '26AS & AIS'],
      },
      {
        serviceId: 'SRV-006',
        name: 'GST Assessment & SCN Reply (DRC-01)',
        category: 'Notice & Representation',
        baseFee: 16500,
        turnaroundDays: 7,
        description: 'In-depth reconciliation between GSTR-1, GSTR-3B and GSTR-2B, drafting legal objection.',
        documentsRequired: ['Notice DRC-01', 'Tax payment challans'],
      },
      {
        serviceId: 'SRV-007',
        name: 'CMA Report & Bank Loan Project Report',
        category: 'Business & Advisory Services',
        baseFee: 28000,
        turnaroundDays: 14,
        description: 'Multi-year financial projections, ratio analysis, DSCR calculation for working capital.',
        documentsRequired: ['Audited balance sheets (3 years)', 'Sanction letter copy'],
      },
    ]);

    // 6. Clients
    const clientList = await Client.insertMany([
      {
        clientId: 'CLI-5001',
        clientName: 'Naveen Jindal',
        businessName: 'Apex Industrial Machinery Ltd',
        email: 'accounts@apexmachinery.com',
        mobile: '+91 98101 22910',
        pan: 'AABCA9912M',
        gstin: '07AABCA9912M1Z8',
        city: 'Delhi',
        state: 'Delhi (07)',
        totalServices: 4,
        paymentStatus: 'Paid',
        accountStatus: 'Active',
        joinedDate: '2024-03-15',
        services: ['Corporate Income Tax Return (ITR-6)', 'Monthly GST Return Filing (GSTR-1 & 3B)'],
      },
      {
        clientId: 'CLI-5002',
        clientName: 'Rameshwar Reddy',
        businessName: 'HydraTech Cloud Labs Pvt Ltd',
        email: 'finance@hydratechlabs.io',
        mobile: '+91 98480 11920',
        pan: 'ABCPR4418P',
        gstin: '36ABCPR4418P1Z5',
        city: 'Hyderabad',
        state: 'Telangana (36)',
        totalServices: 2,
        paymentStatus: 'Paid',
        accountStatus: 'Active',
        joinedDate: '2024-06-20',
        services: ['Private Limited Company Incorporation', 'GST Registration'],
      },
      {
        clientId: 'CLI-5003',
        clientName: 'Ananya Roy',
        businessName: 'Bengal Artisan Exports LLP',
        email: 'ananya@bengalartisan.com',
        mobile: '+91 98300 44819',
        pan: 'AABCB1890L',
        gstin: '19AABCB1890L1ZT',
        city: 'Kolkata',
        state: 'West Bengal (19)',
        totalServices: 2,
        paymentStatus: 'Pending',
        accountStatus: 'Active',
        joinedDate: '2024-09-02',
        services: ['LLP Registration', 'GST Registration'],
      },
    ]);

    // 7. Leads
    await Lead.insertMany([
      {
        referenceId: 'LED-1001',
        customerName: 'Aakash Singhania',
        mobile: '+91 98112 34567',
        email: 'aakash@vertexlogistics.in',
        city: 'New Delhi',
        serviceInterested: 'Private Limited Company Incorporation',
        requirement: 'Seeking company incorporation with 2 directors for freight logistics business.',
        leadSource: 'Public Website',
        assignedStaffId: staffList[2]._id,
        assignedStaffName: staffList[2].name,
        status: 'Interested',
        estimatedValue: 14999,
        notes: [
          {
            author: 'CS Vikramaditya Singhania',
            content: 'Director KYC documents received. Name approval application run for Vertex Logistics.',
            createdAt: new Date('2026-09-19T11:30:00Z'),
          },
        ],
        timeline: [
          { action: 'Lead Created', actor: 'Website Enquiry Form', timestamp: new Date('2026-09-18T10:45:00Z') },
        ],
      },
      {
        referenceId: 'LED-1002',
        customerName: 'Meenakshi Sundaram',
        mobile: '+91 94440 98123',
        email: 'meenakshi@chennaispices.co',
        city: 'Chennai',
        serviceInterested: 'GST Assessment & SCN Reply (DRC-01)',
        requirement: 'Received DRC-01 notice related to ITC mismatch under Section 73 for FY 2022-23.',
        leadSource: 'WhatsApp',
        assignedStaffId: staffList[1]._id,
        assignedStaffName: staffList[1].name,
        status: 'Follow-up Required',
        estimatedValue: 16500,
        notes: [
          {
            author: 'CA Priya Agarwal',
            content: 'Demand amount Rs 3.4 Lakhs. Reply draft preparation in progress.',
            createdAt: new Date('2026-09-20T14:45:00Z'),
          },
        ],
        timeline: [
          { action: 'Lead Captured', actor: 'WhatsApp Bot', timestamp: new Date('2026-09-19T09:20:00Z') },
        ],
      },
      {
        referenceId: 'LED-1003',
        customerName: 'Harpreet Singh Chadha',
        mobile: '+91 98765 43210',
        email: 'harpreet@amritsarexports.com',
        city: 'Ludhiana',
        serviceInterested: 'CMA Report & Bank Loan Project Report',
        requirement: 'Renewal of Rs 5 Crore CC limit with PNB for textile export unit.',
        leadSource: 'Partner Referral',
        assignedStaffId: staffList[3]._id,
        assignedStaffName: staffList[3].name,
        status: 'New',
        estimatedValue: 28000,
        notes: [],
        timeline: [
          { action: 'Referred by Partner', actor: 'Partner Portal (PTR-8821)', timestamp: new Date('2026-09-21T08:30:00Z') },
        ],
      },
    ]);

    // 8. Service Requests
    const requestList = await ServiceRequest.insertMany([
      {
        requestId: 'REQ-7001',
        clientName: 'Apex Industrial Machinery Ltd',
        clientId: clientList[0]._id,
        service: 'Corporate Income Tax Return (ITR-6)',
        category: 'Taxation & Return Filing',
        requestSource: 'Direct Client',
        assignedStaff: staffList[0].name,
        assignedStaffId: staffList[0]._id,
        submissionDate: '2026-09-15',
        dueDate: '2026-10-15',
        priority: 'High',
        status: 'In Review',
        feeAmount: 24999,
        notes: ['Draft balance sheet received. Tax audit linkage verified.'],
        documentsCount: 4,
      },
      {
        requestId: 'REQ-7002',
        clientName: 'HydraTech Cloud Labs Pvt Ltd',
        clientId: clientList[1]._id,
        service: 'Private Limited Company Incorporation',
        category: 'Registration Services',
        requestSource: 'Direct Client',
        assignedStaff: staffList[2].name,
        assignedStaffId: staffList[2]._id,
        submissionDate: '2026-09-17',
        dueDate: '2026-09-28',
        priority: 'Medium',
        status: 'Processing',
        feeAmount: 14999,
        notes: ['SPICe+ Part A name approved. Filing Part B today.'],
        documentsCount: 3,
      },
      {
        requestId: 'REQ-7003',
        clientName: 'Amritsar Exports Group',
        service: 'CMA Report & Bank Loan Project Report',
        category: 'Business & Advisory Services',
        requestSource: 'Partner Portal',
        partnerName: partnerList[0].partnerName,
        partnerId: partnerList[0]._id,
        assignedStaff: staffList[3].name,
        assignedStaffId: staffList[3]._id,
        submissionDate: '2026-09-21',
        dueDate: '2026-10-05',
        priority: 'High',
        status: 'Documents Pending',
        feeAmount: 28000,
        notes: ['Waiting for 6 months bank statement.'],
        documentsCount: 1,
      },
    ]);

    // 9. Work Assignments
    await WorkAssignment.insertMany([
      {
        taskId: 'WRK-201',
        serviceRequestId: 'REQ-7001',
        serviceRequest: requestList[0]._id,
        client: 'Apex Industrial Machinery Ltd',
        clientId: clientList[0]._id,
        service: 'Corporate Income Tax Return (ITR-6)',
        assignedStaff: staffList[0].name,
        assignedStaffId: staffList[0]._id,
        startDate: '2026-09-15',
        dueDate: '2026-10-10',
        priority: 'High',
        status: 'In Progress',
        completionPercentage: 60,
        checklistItems: [
          { text: 'Collect audited financial statements & 3CD report', completed: true },
          { text: 'Verify TDS credits against AIS & Form 26AS', completed: true },
          { text: 'Compute taxable income and MAT liabilities', completed: false },
          { text: 'Partner review and e-filing verification', completed: false },
        ],
      },
      {
        taskId: 'WRK-202',
        serviceRequestId: 'REQ-7002',
        serviceRequest: requestList[1]._id,
        client: 'HydraTech Cloud Labs Pvt Ltd',
        clientId: clientList[1]._id,
        service: 'Private Limited Company Incorporation',
        assignedStaff: staffList[2].name,
        assignedStaffId: staffList[2]._id,
        startDate: '2026-09-17',
        dueDate: '2026-09-25',
        priority: 'Medium',
        status: 'In Progress',
        completionPercentage: 80,
        checklistItems: [
          { text: 'Name reservation SPICe+ Part A', completed: true },
          { text: 'Prepare MOA, AOA & INC-9 declarations', completed: true },
          { text: 'AGILE-PRO-S bank account verification', completed: true },
          { text: 'MCA V3 portal digital signature upload', completed: false },
        ],
      },
    ]);

    // 10. Documents
    await DocumentModel.insertMany([
      {
        documentId: 'DOC-8001',
        documentName: 'Audited_Balance_Sheet_FY25_Apex.pdf',
        client: 'Apex Industrial Machinery Ltd',
        clientId: clientList[0]._id,
        serviceRequest: 'Corporate Income Tax Return (ITR-6)',
        serviceRequestId: 'REQ-7001',
        documentType: 'Financial Statement',
        fileSize: '4.8 MB',
        filePath: 'uploads/Audited_Balance_Sheet_FY25_Apex.pdf',
        uploadDate: '2026-09-16',
        reviewStatus: 'Accepted',
        remarks: 'Signed by statutory auditors and directors.',
      },
      {
        documentId: 'DOC-8002',
        documentName: 'Tax_Audit_Report_Form_3CD.pdf',
        client: 'Apex Industrial Machinery Ltd',
        clientId: clientList[0]._id,
        serviceRequest: 'Corporate Income Tax Return (ITR-6)',
        serviceRequestId: 'REQ-7001',
        documentType: 'Audit Report',
        fileSize: '2.1 MB',
        filePath: 'uploads/Tax_Audit_Report_Form_3CD.pdf',
        uploadDate: '2026-09-17',
        reviewStatus: 'Under Review',
      },
    ]);

    // 11. Invoices & Payments
    const invoiceList = await Invoice.insertMany([
      {
        invoiceNumber: 'BLS/2026-27/0412',
        clientId: clientList[0]._id,
        clientName: 'Apex Industrial Machinery Ltd',
        clientGstin: '07AABCA9912M1Z8',
        clientAddress: 'Plot 44, Okhla Industrial Area Phase-III, New Delhi 110020',
        issueDate: '2026-09-15',
        dueDate: '2026-09-25',
        items: [
          {
            description: 'Professional Fee for Corporate ITR-6 preparation and tax audit linkage for FY 2025-26',
            sacCode: '998231',
            amount: 24999,
          },
        ],
        subtotal: 24999,
        cgst: 2249.91,
        sgst: 2249.91,
        igst: 0,
        total: 29498.82,
        status: 'Paid',
        notes: 'Payment received via NEFT ref: UTR9182319412.',
      },
      {
        invoiceNumber: 'BLS/2026-27/0415',
        clientId: clientList[1]._id,
        clientName: 'HydraTech Cloud Labs Pvt Ltd',
        clientGstin: '36ABCPR4418P1Z5',
        clientAddress: 'Suite 302, Cyber Towers, Hitec City, Hyderabad 500081',
        issueDate: '2026-09-17',
        dueDate: '2026-09-27',
        items: [
          {
            description: 'Consultancy and Filing Services for Company Incorporation',
            sacCode: '998311',
            amount: 14999,
          },
        ],
        subtotal: 14999,
        cgst: 0,
        sgst: 0,
        igst: 2699.82,
        total: 17698.82,
        status: 'Paid',
        notes: 'Paid through UPI transaction ID: 4261908812.',
      },
    ]);

    await Payment.insertMany([
      {
        paymentId: 'PAY-901',
        clientId: clientList[0]._id,
        client: 'Apex Industrial Machinery Ltd',
        service: 'Corporate Income Tax Return (ITR-6)',
        invoiceNumber: 'BLS/2026-27/0412',
        invoiceId: invoiceList[0]._id,
        amount: 29498.82,
        paymentMethod: 'Bank Transfer / NEFT',
        paymentDate: '2026-09-16',
        paymentStatus: 'Paid',
        transactionRef: 'UTR9182319412',
      },
      {
        paymentId: 'PAY-902',
        clientId: clientList[1]._id,
        client: 'HydraTech Cloud Labs Pvt Ltd',
        service: 'Company Incorporation',
        invoiceNumber: 'BLS/2026-27/0415',
        invoiceId: invoiceList[1]._id,
        amount: 17698.82,
        paymentMethod: 'UPI',
        paymentDate: '2026-09-17',
        paymentStatus: 'Paid',
        transactionRef: 'UPI-4261908812',
      },
    ]);

    // 12. Follow-ups
    await FollowUp.insertMany([
      {
        followUpId: 'FL-301',
        customer: 'Meenakshi Sundaram',
        relatedType: 'Lead',
        relatedId: 'LED-1002',
        assignedStaff: 'CA Priya Agarwal',
        assignedStaffId: staffList[1]._id,
        followUpDate: new Date().toISOString().split('T')[0],
        followUpTime: '12:30 PM',
        notes: 'Call client to request supplier reconciliation copy for DRC-01.',
        status: 'Today',
        priority: 'Urgent',
      },
      {
        followUpId: 'FL-302',
        customer: 'Harpreet Singh Chadha',
        relatedType: 'Lead',
        relatedId: 'LED-1003',
        assignedStaff: 'Amitabh Verma',
        assignedStaffId: staffList[3]._id,
        followUpDate: new Date().toISOString().split('T')[0],
        followUpTime: '04:00 PM',
        notes: 'Introductory call with CFO regarding PNB CMA report projections.',
        status: 'Today',
        priority: 'High',
      },
    ]);

    // 13. Support Tickets
    await SupportTicket.insertMany([
      {
        ticketId: 'TCK-501',
        requester: 'CA Gurmeet Singh (Partner)',
        requesterType: 'Partner',
        requesterEmail: 'gurmeet.ca@gmail.com',
        subject: 'Commission Payout Status for August 2026',
        category: 'Billing & Commercials',
        priority: 'High',
        assignedStaff: 'CA Rajesh Sharma',
        assignedStaffId: staffList[0]._id,
        createdDate: '2026-09-18',
        status: 'In Progress',
        messages: [
          {
            sender: 'CA Gurmeet Singh',
            senderRole: 'Partner',
            message: 'August payout calculation shows Rs 18,000 settled, checking for bank credit slip.',
            timestamp: new Date('2026-09-18T10:14:00Z'),
          },
          {
            sender: 'CA Rajesh Sharma',
            senderRole: 'Admin',
            message: 'Disbursed via HDFC NEFT. Furnishing bank UTR slip shortly.',
            timestamp: new Date('2026-09-18T14:40:00Z'),
          },
        ],
      },
    ]);

    // 14. Knowledge Centre Articles
    await Knowledge.insertMany([
      {
        articleId: 'KNO-101',
        title: 'Standard Operating Procedure: Filing Reply to GST DRC-01 Notices',
        category: 'GST Compliance',
        author: 'CA Priya Agarwal',
        status: 'Published',
        summary: 'A step-by-step internal SOP for verifying ITC discrepancies between GSTR-3B, GSTR-2B, and GSTR-9.',
        content: 'Comprehensive instructions for Section 73/74 replies citing CBIC circulars.',
        views: 142,
      },
      {
        articleId: 'KNO-102',
        title: 'Checklist for Private Limited Company Incorporation under SPICe+ Part B',
        category: 'Corporate Law',
        author: 'CS Vikramaditya Singhania',
        status: 'Published',
        summary: 'Master checklist of mandatory attachments, PAN/TAN declarations, and AGILE-PRO-S compliance.',
        content: 'Directors KYC, Registered office utility bill (<2 months), INC-9 declarations.',
        views: 298,
      },
    ]);

    // 15. Notifications
    await Notification.insertMany([
      {
        notificationId: 'NTF-01',
        title: 'New Website Lead Received',
        description: 'Aakash Singhania submitted enquiry for Private Limited Company Incorporation.',
        category: 'Enquiry',
        timestamp: '15 mins ago',
        read: false,
        link: '/leads',
        targetRole: 'ADMIN',
      },
      {
        notificationId: 'NTF-02',
        title: 'Payment Received',
        description: 'Apex Industrial Machinery Ltd paid Rs 29,498 for Corporate ITR-6.',
        category: 'Payment',
        timestamp: 'Yesterday',
        read: true,
        link: '/payments',
        targetRole: 'ADMIN',
      },
    ]);

    // 16. Company Master Settings
    await Settings.create({
      companyName: 'BLS AND COMPANY',
      tagline: 'Precision in Taxation, Excellence in Corporate Advisory',
      registrationNumber: 'ICAI-FRN-CA-Bhanwar-Lal-Saini',
      email: 'Mohansaini995062@gmail.com',
      phone: '+91 97843 43068',
      alternatePhone: '+91 97843 43068',
      whatsappNumber: '919784343068',
      headOfficeAddress: 'Shop No 11, Krishna Vihar, Jaipur Rd, near Shivdhara Hospital, Magadh Nagar, Chomu, Rajasthan 303702',
      branchOfficeAddress: 'Jaipur Road, Opp. Commercial Hub, Jaipur, Rajasthan 302001',
      website: 'https://bls-public-website.vercel.app',
      topBarAnnouncement: 'Advisory Desk Open • CA Bhanwar Lal Saini • Chomu & Jaipur',
      navbarBrandTitle: 'BLS AND COMPANY',
      navbarBrandSubtitle: 'Chartered Accountants & Advisors',
      footerAboutText: 'BLS AND COMPANY, led by CA Bhanwar Lal Saini, is a premier multi-disciplinary Chartered Accountancy and corporate advisory firm. Offices in Chomu & Jaipur, Rajasthan.',
      footerCopyright: `© ${new Date().getFullYear()} BLS AND COMPANY • CA Bhanwar Lal Saini & Associates. All rights reserved.`,
      workingHours: 'Monday – Saturday: 9:30 AM – 6:30 PM (IST)',
      adminNotificationEmail: 'Mohansaini995062@gmail.com',
    });

    logger.info('[Seeder] Master database successfully seeded with realistic CA firm operational data!');
    process.exit(0);
  } catch (error: any) {
    logger.error(`[Seeder] Seed failed: ${error.message}`);
    process.exit(1);
  }
};

// Direct script execution
seedDatabase();
