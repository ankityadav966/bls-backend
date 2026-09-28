import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../utils/logger';
import { SettingsModel } from '../models/Settings.model';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: Transporter | null = null;

  /**
   * Initializes or returns a cached nodemailer transporter
   */
  private static async getTransporter(): Promise<Transporter | null> {
    try {
      const dbSettings = await SettingsModel.findOne().lean();

      const smtpHost = dbSettings?.smtpHost || process.env.SMTP_HOST;
      const smtpPort = Number(dbSettings?.smtpPort || process.env.SMTP_PORT || 587);
      const smtpUser = dbSettings?.smtpUser || process.env.SMTP_USER;
      const smtpPass = dbSettings?.smtpPass || process.env.SMTP_PASS;

      // If user provided credentials
      if (smtpUser && smtpPass) {
        if (smtpHost && smtpHost.includes('gmail')) {
          return nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: smtpPass
            }
          });
        }

        return nodemailer.createTransport({
          host: smtpHost || 'smtp.gmail.com',
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
      }

      // Default fallback or mailtrap test
      if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.mailtrap.io') {
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || ''
          } : undefined
        });
      }

      return null;
    } catch (err: any) {
      logger.warn(`[EmailService] Could not initialize SMTP transporter: ${err.message}`);
      return null;
    }
  }

  /**
   * Sends an email, safely logging if live SMTP is not yet configured
   */
  public static async sendMail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      const senderAddress = process.env.EMAIL_FROM || 'notifications@blscompany.com';
      const senderName = 'BLS AND COMPANY';

      if (transporter) {
        const info = await transporter.sendMail({
          from: `"${senderName}" <${senderAddress}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]+>/g, '')
        });
        logger.info(`[EmailService] Live email dispatched to ${options.to}. MessageId: ${info.messageId}`);
        return true;
      } else {
        logger.info(`[EmailService] [Simulation] Email ready for dispatch:\n  To: ${options.to}\n  Subject: ${options.subject}\n  (Add SMTP_USER & SMTP_PASS in .env or Settings to transmit via real SMTP server)`);
        return true;
      }
    } catch (error: any) {
      logger.error(`[EmailService] Failed to send email to ${options.to}: ${error.message}`);
      return false;
    }
  }

  /**
   * 1. Send Welcome & Credentials Email to Partner
   */
  public static async sendPartnerWelcomeEmail(params: {
    partnerName: string;
    email: string;
    partnerId: string;
    qualification?: string;
    firmName?: string;
    password?: string;
  }): Promise<void> {
    const loginUrl = 'https://bls-partner-portal.vercel.app/login';
    const pwd = params.password || 'Partner@2026';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #0f172a; padding: 28px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; }
        .body { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .credentials-box { background: #f1f5f9; border-radius: 12px; border: 1px solid #cbd5e1; padding: 20px; margin-bottom: 24px; }
        .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .cred-row:last-child { border-bottom: none; }
        .cred-label { color: #64748b; font-weight: 600; }
        .cred-val { color: #0f172a; font-weight: 700; font-family: monospace; }
        .btn-wrap { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background: #0f172a; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; }
        .footer { padding: 20px; text-align: center; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>BLS AND COMPANY</h1>
          <p>Channel Alliance Partner Network</p>
        </div>
        <div class="body">
          <div class="greeting">Welcome aboard, ${params.partnerName}!</div>
          <div class="desc">
            We are pleased to confirm your appointment and onboarding to the BLS AND COMPANY Partner Network. Your dedicated Partner Portal account has been officially activated.
          </div>

          <div class="credentials-box">
            <div style="margin-bottom: 12px; font-weight: 800; font-size: 13px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
              Your Portal Login Access
            </div>
            <div class="cred-row">
              <span class="cred-label">Partner Code:</span>
              <span class="cred-val">${params.partnerId}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Login ID / Email:</span>
              <span class="cred-val">${params.email}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Password:</span>
              <span class="cred-val">${pwd}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Designation / Role:</span>
              <span class="cred-val">${params.qualification || 'Authorized Partner'}</span>
            </div>
          </div>

          <div class="btn-wrap">
            <a href="${loginUrl}" class="btn">Log In to Partner Portal &rarr;</a>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            You can use the portal to view client enquiries assigned directly to you, track case deliverables, upload audit & compliance documents, and review referral commercials.
          </p>
        </div>
        <div class="footer">
          &copy; 2026 BLS AND COMPANY &bull; Level 4, Barakhamba Road, Connaught Place, New Delhi 110001
        </div>
      </div>
    </body>
    </html>
    `;

    await this.sendMail({
      to: params.email,
      subject: `Welcome to BLS Partner Network – Your Portal Access & Credentials [${params.partnerId}]`,
      html
    });
  }

  /**
   * 2. Send New Enquiry Notification Email to Admin
   */
  public static async sendNewEnquiryAlertToAdmin(params: {
    referenceId: string;
    customerName: string;
    mobile: string;
    email: string;
    serviceInterested: string;
    city?: string;
    notes?: string;
  }): Promise<void> {
    const dbSettings = await SettingsModel.findOne().lean();
    const adminEmail = dbSettings?.adminNotificationEmail || process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@blscompany.com';
    const adminLeadsUrl = 'https://bls-admin-panel.vercel.app/leads';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .badge { display: inline-block; background: #22c55e; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 8px; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 800; }
        .body { padding: 28px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .label { color: #64748b; font-weight: 600; }
        .val { color: #0f172a; font-weight: 700; text-align: right; }
        .notes-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 18px; font-size: 13px; color: #334155; }
        .btn-wrap { text-align: center; margin-top: 24px; }
        .btn { display: inline-block; background: #0f172a; color: #ffffff !important; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 8px; }
        .footer { padding: 16px; text-align: center; background: #f8fafc; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="badge">New Inbound Lead</div>
          <h1>Public Website Enquiry Received</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1;">Reference: ${params.referenceId}</p>
        </div>
        <div class="body">
          <div class="detail-row">
            <span class="label">Reference ID:</span>
            <span class="val" style="font-family: monospace; color: #2563eb;">${params.referenceId}</span>
          </div>
          <div class="detail-row">
            <span class="label">Client / Contact:</span>
            <span class="val">${params.customerName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Mobile Number:</span>
            <span class="val"><a href="tel:${params.mobile}" style="color: #0f172a; text-decoration: none;">${params.mobile}</a></span>
          </div>
          <div class="detail-row">
            <span class="label">Email Address:</span>
            <span class="val">${params.email || 'Not provided'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Service Required:</span>
            <span class="val" style="color: #059669;">${params.serviceInterested}</span>
          </div>
          <div class="detail-row">
            <span class="label">Location / City:</span>
            <span class="val">${params.city || 'India'}</span>
          </div>

          ${params.notes ? `
          <div class="notes-box">
            <strong>Client Requirement / Note:</strong><br>
            ${params.notes}
          </div>
          ` : ''}

          <div class="btn-wrap">
            <a href="${adminLeadsUrl}" class="btn">Open Admin CRM & Assign to Partner &rarr;</a>
          </div>
        </div>
        <div class="footer">
          BLS AND COMPANY Automated Notification System
        </div>
      </div>
    </body>
    </html>
    `;

    await this.sendMail({
      to: adminEmail,
      subject: `🚨 [New Enquiry] ${params.serviceInterested} - ${params.customerName} (${params.referenceId})`,
      html
    });
  }

  /**
   * 3. Send Confirmation Email to Client / Customer
   */
  public static async sendEnquiryConfirmationToCustomer(params: {
    referenceId: string;
    customerName: string;
    email: string;
    serviceInterested: string;
  }): Promise<void> {
    if (!params.email) return;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 800; }
        .body { padding: 28px; font-size: 14px; line-height: 1.6; color: #334155; }
        .ref-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; text-align: center; margin: 20px 0; }
        .ref-num { font-size: 18px; font-weight: 800; color: #166534; font-family: monospace; }
        .footer { padding: 16px; text-align: center; background: #f8fafc; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>BLS AND COMPANY</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1;">Chartered Accountants & Advisory</p>
        </div>
        <div class="body">
          <p>Dear <strong>${params.customerName}</strong>,</p>
          <p>
            Thank you for reaching out to BLS AND COMPANY regarding <strong>${params.serviceInterested}</strong>. Your enquiry has been securely logged in our advisory desk.
          </p>

          <div class="ref-box">
            <div style="font-size: 12px; color: #15803d; font-weight: 600; margin-bottom: 4px;">YOUR ENQUIRY REFERENCE NUMBER</div>
            <div class="ref-num">${params.referenceId}</div>
          </div>

          <p>
            A dedicated subject-matter associate will review your requirements and connect with you shortly via phone or email.
          </p>
          <p style="margin-top: 24px;">
            Warm regards,<br>
            <strong>Advisory Desk &bull; BLS AND COMPANY</strong><br>
            Phone: +91 11 4982 3000 &bull; Email: info@blscompany.com
          </p>
        </div>
        <div class="footer">
          &copy; 2026 BLS AND COMPANY &bull; All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    await this.sendMail({
      to: params.email,
      subject: `Enquiry Registered Successfully [${params.referenceId}] – BLS AND COMPANY`,
      html
    });
  }

  /**
   * 4. Send Case Assignment Alert to Partner
   */
  public static async sendCaseAssignedToPartnerEmail(params: {
    partnerName: string;
    partnerEmail: string;
    referenceId: string;
    clientName: string;
    serviceInterested: string;
    mobile: string;
    email?: string;
    notes?: string;
  }): Promise<void> {
    const partnerPortalUrl = 'https://bls-partner-portal.vercel.app/requests';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: #1e1b4b; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 800; }
        .body { padding: 28px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .label { color: #64748b; font-weight: 600; }
        .val { color: #0f172a; font-weight: 700; text-align: right; }
        .btn-wrap { text-align: center; margin-top: 24px; }
        .btn { display: inline-block; background: #4338ca; color: #ffffff !important; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 8px; }
        .footer { padding: 16px; text-align: center; background: #f8fafc; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>New Client Case Assigned</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #c7d2fe;">BLS Partner Case Assignment</p>
        </div>
        <div class="body">
          <p style="font-size: 14px; color: #334155; margin-bottom: 18px;">
            Dear <strong>${params.partnerName}</strong>,<br>
            BLS Admin has assigned a new client case / enquiry directly to your partner account.
          </p>

          <div class="detail-row">
            <span class="label">Reference ID:</span>
            <span class="val" style="font-family: monospace; color: #4338ca;">${params.referenceId}</span>
          </div>
          <div class="detail-row">
            <span class="label">Client Name:</span>
            <span class="val">${params.clientName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Client Phone:</span>
            <span class="val">${params.mobile}</span>
          </div>
          <div class="detail-row">
            <span class="label">Client Email:</span>
            <span class="val">${params.email || 'Not provided'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Service Required:</span>
            <span class="val" style="color: #059669;">${params.serviceInterested}</span>
          </div>

          ${params.notes ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 13px;">
            <strong>Requirement / Notes:</strong><br>
            ${params.notes}
          </div>
          ` : ''}

          <div class="btn-wrap">
            <a href="${partnerPortalUrl}" class="btn">View Case in Partner Portal &rarr;</a>
          </div>
        </div>
        <div class="footer">
          BLS AND COMPANY &bull; Partner Advisory Operations
        </div>
      </div>
    </body>
    </html>
    `;

    await this.sendMail({
      to: params.partnerEmail,
      subject: `💼 [Case Assigned] ${params.serviceInterested} - ${params.clientName} (${params.referenceId})`,
      html
    });
  }
}
