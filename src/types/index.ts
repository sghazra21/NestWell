export * from './society';
export * from './flat';
export * from './membership';
export * from './platform';
import { FamilyMember, Vehicle } from './membership';

export type UserRole = 'resident' | 'security' | 'admin' | 'committee' | 'platform_admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  flat?: string;
  flatId?: string;
  tower?: string;
  towerId?: string;
  type?: 'Owner' | 'Tenant';
  isProfileComplete: boolean;
  avatar?: string;
  gateNumber?: string;
  badgeId?: string;
  designation?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  societyId?: string;
  platformRole?: 'platform_admin' | null;
  familyMembers?: FamilyMember[];
  vehicles?: Vehicle[];
  createdAt: string;
}

export interface SocietyInfo {
  name: string;
  subTitle: string;
  city: string;
  registeredNumber: string;
  totalFlats: number;
  totalResidents: number;
  towers: string[];
}

export type NoticePriority = 'normal' | 'urgent';

export interface AppNotification {
  id: string;
  societyId: string;
  userId: string;
  type: 'visitor_arrived' | 'visitor_approved' | 'complaint_update' | 'notice_published' | 'booking_confirmed' | 'bill_generated' | 'payment_verified' | 'payment_rejected' | 'election_opened';
  title: string;
  message: string;
  read: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

// Payment types for UPI QR workflow (Phase 31)
export type PaymentMethod = 'UPI' | 'Cash' | 'Cheque' | 'BankTransfer';
export type PaymentStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface PaymentRecord {
  id: string;
  societyId: string;
  billId: string;
  residentId: string;
  flatId: string;
  flatNumber: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  utr?: string;
  status: PaymentStatus;
  submittedAt: string;
  submittedBy: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface ResidentProfile {
  id: string;
  name: string;
  flat: string;
  flatId?: string;
  tower: string;
  phone: string;
  email: string;
  type: 'Owner' | 'Tenant';
  status: 'Active' | 'Pending Verification';
  moveInDate?: string;
  occupancyDate?: string;
  familyMembers: FamilyMember[];
  vehicles: Vehicle[];
  dues: number;
  avatar?: string;
  societyRole?: UserRole;
  designation?: string;
}

export type Resident = ResidentProfile;

export type VisitorStatus = 'expected' | 'waiting' | 'inside' | 'exited' | 'rejected';
export type VisitorType = 'Guest' | 'Delivery' | 'Service' | 'Cab';

export interface Visitor {
  id: string;
  societyId?: string;
  name: string;
  phone: string;
  flat: string;
  tower: string;
  residentName: string;
  purpose: string;
  type: VisitorType;
  company?: string; // e.g. 'Swiggy', 'Zomato', 'Amazon', 'Urban Company', 'Uber'
  expectedDate: string;
  expectedTime: string;
  passNumber: string;
  qrCode: string;
  status: VisitorStatus;
  entryTime?: string;
  exitTime?: string;
  vehicleNumber?: string;
  avatar?: string;
  gateNumber: string;
  createdAt: string;
}

export type ComplaintCategory = 'Plumbing' | 'Electrical' | 'Lift' | 'Cleaning' | 'Water' | 'Security' | 'Other';
export type ComplaintStatus = 'reported' | 'assigned' | 'started' | 'resolved';
export type ComplaintPriority = 'Normal' | 'High' | 'Urgent';

export interface ComplaintTimelineEvent {
  step: ComplaintStatus;
  title: string;
  time: string;
  note?: string;
  done: boolean;
}

export interface Complaint {
  id: string;
  societyId?: string;
  ticketNumber: string;
  title: string;
  category: ComplaintCategory;
  description: string;
  flat: string;
  tower: string;
  residentName: string;
  residentPhone: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  reportedAt: string;
  assignedTo?: {
    name: string;
    role: string;
    phone: string;
  };
  photoUrl?: string;
  timeline: ComplaintTimelineEvent[];
  comments: { author: string; role: string; time: string; text: string }[];
}

export type LineItemType = 'maintenance' | 'parking' | 'late_fee' | 'water' | 'electricity' | 'other';

export interface BillLineItem {
  description: string;
  amount: number;
  type: LineItemType;
}

export interface MaintenanceBill {
  id: string;
  societyId?: string;
  flatId?: string;
  billNumber: string;
  flat: string;
  tower: string;
  residentName: string;
  month: string;
  year: number;
  maintenanceFee: number;
  parkingFee: number;
  lateFee: number;
  totalAmount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt?: string;
  lineItems?: BillLineItem[];
  subtotal?: number;
  billingPeriod?: string;
}

export interface Facility {
  id: string;
  societyId?: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  timings: string;
  icon: string;
  availableDays: string[];
  slots: { time: string; status: 'Available' | 'Booked' | 'Selected'; bookedBy?: string }[];
}

export interface FacilityBooking {
  id: string;
  societyId?: string;
  facilityId: string;
  facilityName: string;
  flat: string;
  residentName: string;
  date: string;
  timeSlot: string;
  totalCost: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  bookedAt: string;
}

export interface Notice {
  id: string;
  societyId?: string;
  title: string;
  category: 'maintenance' | 'event' | 'security' | 'general';
  message: string;
  audience: 'Entire Society' | 'Building' | 'Selected Flats';
  targetBlock?: string;
  date: string;
  time?: string;
  priority: 'normal' | 'urgent';
  attachmentName?: string;
  publishedBy: string;
  createdAt: string;
  read?: boolean;
}

export interface ActivityEvent {
  id: string;
  societyId?: string;
  time: string;
  title: string;
  flat: string;
  type: 'visitor' | 'payment' | 'complaint' | 'notice' | 'facility';
  icon: string;
}

// Society Committee, Nomination & Election Types
export type ElectionStatus = 'Draft' | 'Nomination Open' | 'Voting Active' | 'Completed';

export type ElectionPosition =
  | 'President'
  | 'General Secretary'
  | 'Treasurer'
  | 'Cultural Secretary'
  | 'Maintenance & Facilities Head'
  | 'Security Committee Head';

export interface Nomination {
  id: string;
  societyId?: string;
  electionId: string;
  position: ElectionPosition;
  candidateId: string;
  candidateName: string;
  flat: string;
  tower: string;
  phone: string;
  email: string;
  profession: string;
  yearsInSociety: number;
  manifesto: string;
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Withdrawn';
  voteCount: number;
  avatar?: string;
  nominatedAt: string;
}

export interface Vote {
  id: string;
  societyId?: string;
  electionId: string;
  position: ElectionPosition;
  candidateId: string;
  voterId: string;
  voterFlat: string;
  castAt: string;
}

export interface Election {
  id: string;
  societyId?: string;
  title: string;
  term: string; // e.g. "2026-2028"
  description: string;
  positions: ElectionPosition[];
  nominationStart: string;
  nominationEnd: string;
  votingStart: string;
  votingEnd: string;
  status: ElectionStatus;
  eligibleVotersCount: number;
  totalVotesCast: number;
  createdAt: string;
  completedAt?: string;
  resultsDeclared?: boolean;
}

export interface CommitteeMember {
  id: string;
  name: string;
  position: ElectionPosition;
  flat: string;
  tower: string;
  phone: string;
  email: string;
  term: string;
  avatar?: string;
  responsibilities: string[];
}
