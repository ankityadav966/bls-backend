import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  companyName: string;
  tagline: string;
  registrationNumber: string;
  frn: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  whatsappNumber?: string;
  headOfficeAddress: string;
  branchOfficeAddress?: string;
  website: string;

  // Website CMS & Layout Settings
  topBarAnnouncement?: string;
  navbarBrandTitle?: string;
  navbarBrandSubtitle?: string;
  footerAboutText?: string;
  footerCopyright?: string;
  workingHours?: string;

  // Email & Notifications Settings
  adminNotificationEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;

  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    companyName: { type: String, default: 'BLS AND COMPANY' },
    tagline: { type: String, default: 'Chartered Accountants, Taxation & Corporate Advisory Services' },
    registrationNumber: { type: String, default: 'ICAI-FRN-029811N' },
    frn: { type: String, default: '029811N' },
    gstin: { type: String, default: '07AAAFB2981N1ZG' },
    pan: { type: String, default: 'AAAFB2981N' },
    email: { type: String, default: 'info@blscompany.com' },
    phone: { type: String, default: '+91 11 4982 3000' },
    alternatePhone: { type: String, default: '+91 98110 44211' },
    whatsappNumber: { type: String, default: '+91 98290 12345' },
    headOfficeAddress: {
      type: String,
      default: 'Level 4, Corporate Heights, Barakhamba Road, Connaught Place, New Delhi 110001',
    },
    branchOfficeAddress: {
      type: String,
      default: 'Cabin 12, Level 2, Trade Centre, BKC, Bandra East, Mumbai 400051',
    },
    website: { type: String, default: 'https://blscompany.com' },

    // CMS & Header/Footer Dynamic Content
    topBarAnnouncement: {
      type: String,
      default: 'Advisory Desk Open • Serving 5,000+ Businesses Across India'
    },
    navbarBrandTitle: {
      type: String,
      default: 'BLS AND COMPANY'
    },
    navbarBrandSubtitle: {
      type: String,
      default: 'Chartered Accountants & Advisors'
    },
    footerAboutText: {
      type: String,
      default: 'BLS AND COMPANY is a premier multi-disciplinary Chartered Accountancy and corporate advisory firm delivering excellence across Direct Tax, Indirect Tax (GST), Corporate Law, Audit, and Business Consulting.'
    },
    footerCopyright: {
      type: String,
      default: '© 2026 BLS AND COMPANY. All rights reserved. Registered with the Institute of Chartered Accountants of India (ICAI).'
    },
    workingHours: {
      type: String,
      default: 'Mon – Sat: 9:30 AM – 7:00 PM'
    },

    // Email & Notification Coordinates
    adminNotificationEmail: {
      type: String,
      default: 'admin@blscompany.com'
    },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
export const SettingsModel = Settings;
