import { LeadModel } from '../models/Lead.model';
import { PartnerModel } from '../models/Partner.model';
import { ClientModel } from '../models/Client.model';
import { ServiceRequestModel } from '../models/ServiceRequest.model';
import { InvoiceModel } from '../models/Invoice.model';
import { StaffModel } from '../models/Staff.model';
import { DocumentModel } from '../models/Document.model';
import { FollowUpModel } from '../models/FollowUp.model';

export async function generateUniqueLeadId(): Promise<string> {
  const year = new Date().getFullYear();
  let num = 1;
  const latest = await LeadModel.findOne({ referenceId: new RegExp(`^LD-${year}-`) }).sort({ referenceId: -1 }).lean();
  if (latest?.referenceId) {
    const parts = latest.referenceId.split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) num = parsed + 1;
  }
  let candidate = `LD-${year}-${String(num).padStart(4, '0')}`;
  while (await LeadModel.exists({ referenceId: candidate })) {
    num++;
    candidate = `LD-${year}-${String(num).padStart(4, '0')}`;
  }
  return candidate;
}

export async function generateUniquePartnerId(): Promise<string> {
  const year = new Date().getFullYear();
  let num = 1;
  const latest = await PartnerModel.findOne({ partnerId: new RegExp(`^PTR-${year}-`) }).sort({ partnerId: -1 }).lean();
  if (latest?.partnerId) {
    const parts = latest.partnerId.split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) num = parsed + 1;
  }
  let candidate = `PTR-${year}-${String(num).padStart(4, '0')}`;
  while (await PartnerModel.exists({ partnerId: candidate })) {
    num++;
    candidate = `PTR-${year}-${String(num).padStart(4, '0')}`;
  }
  return candidate;
}

export async function generateUniqueClientId(): Promise<string> {
  const year = new Date().getFullYear();
  let num = 1;
  const latest = await ClientModel.findOne({ clientId: new RegExp(`^CLI-${year}-`) }).sort({ clientId: -1 }).lean();
  if (latest?.clientId) {
    const parts = latest.clientId.split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) num = parsed + 1;
  }
  let candidate = `CLI-${year}-${String(num).padStart(4, '0')}`;
  while (await ClientModel.exists({ clientId: candidate })) {
    num++;
    candidate = `CLI-${year}-${String(num).padStart(4, '0')}`;
  }
  return candidate;
}

export async function generateUniqueRequestId(): Promise<string> {
  const year = new Date().getFullYear();
  let num = 1;
  const latest = await ServiceRequestModel.findOne({ requestId: new RegExp(`^REQ-${year}-`) }).sort({ requestId: -1 }).lean();
  if (latest?.requestId) {
    const parts = latest.requestId.split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) num = parsed + 1;
  }
  let candidate = `REQ-${year}-${String(num).padStart(4, '0')}`;
  while (await ServiceRequestModel.exists({ requestId: candidate })) {
    num++;
    candidate = `REQ-${year}-${String(num).padStart(4, '0')}`;
  }
  return candidate;
}

export async function generateUniqueInvoiceId(): Promise<string> {
  const year = new Date().getFullYear();
  let num = 1;
  const latest = await InvoiceModel.findOne({ invoiceNumber: new RegExp(`^INV-${year}-`) }).sort({ invoiceNumber: -1 }).lean();
  if (latest?.invoiceNumber) {
    const parts = latest.invoiceNumber.split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) num = parsed + 1;
  }
  let candidate = `INV-${year}-${String(num).padStart(4, '0')}`;
  while (await InvoiceModel.exists({ invoiceNumber: candidate })) {
    num++;
    candidate = `INV-${year}-${String(num).padStart(4, '0')}`;
  }
  return candidate;
}

export async function generateUniqueStaffId(): Promise<string> {
  let num = 101;
  const latest = await StaffModel.findOne({ staffId: new RegExp(`^STF-`) }).sort({ staffId: -1 }).lean();
  if (latest?.staffId) {
    const parts = latest.staffId.split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) num = parsed + 1;
  }
  let candidate = `STF-${num}`;
  while (await StaffModel.exists({ staffId: candidate })) {
    num++;
    candidate = `STF-${num}`;
  }
  return candidate;
}

export async function generateUniqueDocumentId(): Promise<string> {
  const year = new Date().getFullYear();
  let num = 1;
  const latest = await DocumentModel.findOne({ documentId: new RegExp(`^DOC-${year}-`) }).sort({ documentId: -1 }).lean();
  if (latest?.documentId) {
    const parts = latest.documentId.split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) num = parsed + 1;
  }
  let candidate = `DOC-${year}-${String(num).padStart(4, '0')}`;
  while (await DocumentModel.exists({ documentId: candidate })) {
    num++;
    candidate = `DOC-${year}-${String(num).padStart(4, '0')}`;
  }
  return candidate;
}

export async function generateUniqueFollowUpId(): Promise<string> {
  const year = new Date().getFullYear();
  let num = 1;
  const latest = await FollowUpModel.findOne({ followUpId: new RegExp(`^FLP-${year}-`) }).sort({ followUpId: -1 }).lean();
  if (latest?.followUpId) {
    const parts = latest.followUpId.split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsed)) num = parsed + 1;
  }
  let candidate = `FLP-${year}-${String(num).padStart(4, '0')}`;
  while (await FollowUpModel.exists({ followUpId: candidate })) {
    num++;
    candidate = `FLP-${year}-${String(num).padStart(4, '0')}`;
  }
  return candidate;
}
