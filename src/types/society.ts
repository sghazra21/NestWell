export type SocietyStatus =
  | 'draft'
  | 'pending_admin'
  | 'onboarding'
  | 'active'
  | 'suspended'
  | 'archived';

export interface FeatureFlags {
  facilityBooking: boolean;
  visitorManagement: boolean;
  maintenanceBilling: boolean;
  complaints: boolean;
  elections: boolean;
  notices: boolean;
}

export interface Society {
  id: string;
  name: string;
  legalName: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  status: SocietyStatus;
  timezone: string;
  currency: string;
  features: FeatureFlags;
  registeredNumber?: string;
  totalFlats?: number;
  totalResidents?: number;
  createdAt: string;
  createdBy: string;
  activatedAt?: string;
  updatedAt: string;
}

export interface Tower {
  id: string;
  societyId: string;
  name: string;
  code: string;
  floors: number;
  totalFlats: number;
  status: 'active' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}
