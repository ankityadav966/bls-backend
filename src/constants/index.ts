export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  PARTNER: 'PARTNER',
  CLIENT: 'CLIENT',
} as const;

export const UserRole = ROLES;
export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const LEAD_STATUS = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  FOLLOW_UP_REQUIRED: 'Follow-up Required',
  CONVERTED: 'Converted',
  LOST: 'Lost',
} as const;

export const LeadStatus = LEAD_STATUS;
export type LeadStatusType = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

export const PARTNER_STATUS = {
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
  PENDING: 'Pending Approval',
} as const;

export const PartnerStatus = PARTNER_STATUS;
export type PartnerStatusType = (typeof PARTNER_STATUS)[keyof typeof PARTNER_STATUS];

export const REQUEST_STATUS = {
  SUBMITTED: 'Submitted',
  DOCUMENTS_RECEIVED: 'Documents Received',
  UNDER_REVIEW: 'Under Review',
  DOCUMENTS_PENDING: 'Documents Pending',
  PROCESSING: 'Processing',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  PENDING: 'Submitted',
} as const;

export const RequestStatus = REQUEST_STATUS;
export type RequestStatusType = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];

export const PRIORITY_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
} as const;

export const PriorityLevel = PRIORITY_LEVELS;
export type PriorityType = (typeof PRIORITY_LEVELS)[keyof typeof PRIORITY_LEVELS];

export const DOCUMENT_STATUS = {
  PENDING: 'Pending',
  UPLOADED: 'Uploaded',
  UNDER_REVIEW: 'Under Review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  RE_UPLOAD_REQUIRED: 'Re-upload Required',
} as const;

export const DocumentStatus = DOCUMENT_STATUS;
export type DocumentStatusType = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  COMPLETED: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
} as const;

export const PaymentStatus = PAYMENT_STATUS;
export type PaymentStatusType = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const INVOICE_STATUS = {
  PAID: 'Paid',
  UNPAID: 'Unpaid',
  OVERDUE: 'Overdue',
  SENT: 'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
} as const;

export const InvoiceStatus = INVOICE_STATUS;
export type InvoiceStatusType = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export const ActivityAction = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VERIFY: 'VERIFY',
  ASSIGN: 'ASSIGN',
  STATUS_CHANGE: 'STATUS_CHANGE',
  UPLOAD: 'UPLOAD',
  REVIEW: 'REVIEW',
  CONVERT: 'CONVERT',
} as const;

export type ActivityAction = (typeof ActivityAction)[keyof typeof ActivityAction];
