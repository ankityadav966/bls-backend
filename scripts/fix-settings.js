/**
 * One-time fix script: Update MongoDB Settings to CA Bhanwar Lal Saini correct details
 * Run: node scripts/fix-settings.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

const SettingsSchema = new mongoose.Schema({}, { strict: false });
const Settings = mongoose.model('Settings', SettingsSchema);

async function fixSettings() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const correctSettings = {
      companyName: 'BLS AND COMPANY',
      tagline: 'Precision in Taxation, Excellence in Corporate Advisory',
      phone: '+91 97843 43068',
      alternatePhone: '+91 97843 43068',
      whatsappNumber: '919784343068',
      email: 'Mohansaini995062@gmail.com',
      headOfficeAddress: 'Shop No 11, Krishna Vihar, Jaipur Rd, near Shivdhara Hospital, Magadh Nagar, Chomu, Rajasthan 303702',
      branchOfficeAddress: 'Jaipur Road, Opp. Commercial Hub, Jaipur, Rajasthan 302001',
      website: 'https://bls-public-website.vercel.app',
      topBarAnnouncement: 'Advisory Desk Open • CA Bhanwar Lal Saini • Chomu & Jaipur',
      navbarBrandTitle: 'BLS AND COMPANY',
      navbarBrandSubtitle: 'Chartered Accountants & Advisors',
      footerAboutText: 'BLS AND COMPANY, led by CA Bhanwar Lal Saini, is a premier multi-disciplinary Chartered Accountancy and corporate advisory firm delivering excellence across Direct Tax, Indirect Tax (GST), Corporate Law, Audit, and Business Consulting. Offices in Chomu & Jaipur, Rajasthan.',
      footerCopyright: `© ${new Date().getFullYear()} BLS AND COMPANY • CA Bhanwar Lal Saini & Associates. All rights reserved.`,
      workingHours: 'Monday – Saturday: 9:30 AM – 6:30 PM (IST)',
      adminNotificationEmail: 'Mohansaini995062@gmail.com',
      updatedAt: new Date(),
    };

    const result = await Settings.findOneAndUpdate(
      {}, // match first document
      { $set: correctSettings },
      { upsert: true, new: true }
    );

    console.log('\n✅ Settings updated successfully in MongoDB!\n');
    console.log('📋 Updated values:');
    console.log(`  Phone:        ${correctSettings.phone}`);
    console.log(`  WhatsApp:     ${correctSettings.whatsappNumber}`);
    console.log(`  Email:        ${correctSettings.email}`);
    console.log(`  Head Office:  ${correctSettings.headOfficeAddress}`);
    console.log(`  Admin Email:  ${correctSettings.adminNotificationEmail}`);
    console.log(`  Document ID:  ${result._id}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB. Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSettings();
