export type PlatformRole = 'platform_admin' | null;

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  platformRole: PlatformRole;
  societyIds: string[];
  currentSocietyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAnalytics {
  societyId: string;
  societyName: string;
  city: string;
  status: string;
  totalResidents: number;
  activeComplaints: number;
  outstandingAmount: number;
  paymentsCollected: number;
  visitorCountLast30Days: number;
  facilityBookingsThisMonth: number;
  lastUpdatedAt: string;
}

export interface SupportSession {
  id: string;
  platformAdminId: string;
  platformAdminEmail: string;
  societyId: string;
  societyName: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
  status: 'active' | 'closed';
}

export interface AuditLog {
  id: string;
  societyId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
