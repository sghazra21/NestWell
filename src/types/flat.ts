export type FlatType = '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'Penthouse' | 'Studio';
export type FlatStatus = 'active' | 'vacant' | 'blocked';

export interface Flat {
  id: string;
  societyId: string;
  number: string;
  towerId: string;
  towerName?: string;
  floor: number;
  type: FlatType;
  status: FlatStatus;
  ownerIds: string[];
  ownerNames?: string[];
  tenantIds: string[];
  tenantNames?: string[];
  primaryResidentName?: string;
  primaryResidentPhone?: string;
  dues?: number;
  vehicles?: { number: string; type: 'Car' | 'Two-Wheeler'; slot: string }[];
  createdAt: string;
  updatedAt: string;
}
