export type SocietyRole = 'society_admin' | 'committee' | 'security' | 'resident';
export type MembershipStatus = 'pending' | 'active' | 'suspended' | 'removed';

export interface SocietyMember {
  id: string;
  uid: string;
  societyId: string;
  name: string;
  email: string;
  phone: string;
  role: SocietyRole;
  status: MembershipStatus;
  avatar?: string;
  flatId?: string;
  flatNumber?: string;
  towerName?: string;
  type?: 'Owner' | 'Tenant';
  designation?: string;
  profileComplete: boolean;
  invitedBy?: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocietyInvite {
  id: string;
  societyId: string;
  societyName?: string;
  email: string;
  intendedRole: SocietyRole;
  flatId?: string;
  tokenHash: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  createdBy: string;
  acceptedBy?: string;
  acceptedAt?: string;
  createdAt: string;
}
