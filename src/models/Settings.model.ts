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
  headOfficeAddress: string;
  branchOfficeAddress?: string;
  website: string;
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
    headOfficeAddress: {
      type: String,
      default: 'Level 4, Corporate Heights, Barakhamba Road, Connaught Place, New Delhi 110001',
    },
    branchOfficeAddress: {
      type: String,
      default: 'Cabin 12, Level 2, Trade Centre, BKC, Bandra East, Mumbai 400051',
    },
    website: { type: String, default: 'https://blscompany.com' },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
export const SettingsModel = Settings;
