import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db, auth, FirebaseUser } from './firebase';
import {
  Society,
  Tower,
  Flat,
  SocietyMember,
  SocietyRole,
  MembershipStatus,
  PlatformUser,
  PlatformAnalytics,
  SupportSession,
  AuditLog,
  Visitor,
  Complaint,
  MaintenanceBill,
  Facility,
  FacilityBooking,
  Notice,
  Election,
  Nomination,
  Vote,
  UserProfile,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Deeply sanitizes any object to prevent undefined values in Firestore writes.
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? sanitizeFirestoreData(item) : item));
  }
  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        result[key] = sanitizeFirestoreData(value);
      } else {
        result[key] = value;
      }
    }
  }

  try {
    return JSON.parse(JSON.stringify(result));
  } catch {
    return result;
  }
}

// -------------------------------------------------------------
// 1. PLATFORM USERS (Global Identity Index)
// -------------------------------------------------------------

export async function syncPlatformUser(firebaseUser: FirebaseUser): Promise<PlatformUser> {
  const path = `platformUsers/${firebaseUser.uid}`;
  try {
    const userRef = doc(db, 'platformUsers', firebaseUser.uid);
    const snap = await getDoc(userRef);

    const isPlatformSuperAdmin =
      firebaseUser.email?.toLowerCase() === 'sghazra21@gmail.com' ||
      firebaseUser.email?.toLowerCase() === 'admin@greenwood.in';

    if (snap.exists()) {
      const existing = snap.data() as PlatformUser;
      if (isPlatformSuperAdmin && existing.platformRole !== 'platform_admin') {
        const updated = { ...existing, platformRole: 'platform_admin' as const };
        await setDoc(userRef, updated, { merge: true });
        return updated;
      }
      return existing;
    }

    const newUser: PlatformUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Resident User'),
      platformRole: isPlatformSuperAdmin ? 'platform_admin' : null,
      societyIds: ['greenwood-heights'], // default initial tenant
      currentSocietyId: 'greenwood-heights',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const clean = sanitizeFirestoreData(newUser);
    await setDoc(userRef, clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export function subscribePlatformUser(uid: string, callback: (user: PlatformUser | null) => void) {
  const path = `platformUsers/${uid}`;
  return onSnapshot(
    doc(db, 'platformUsers', uid),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as PlatformUser);
      } else {
        callback(null);
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export async function linkSocietyToPlatformUser(uid: string, societyId: string): Promise<void> {
  const path = `platformUsers/${uid}`;
  try {
    const userRef = doc(db, 'platformUsers', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as PlatformUser;
      const ids = Array.from(new Set([...(data.societyIds || []), societyId]));
      await updateDoc(userRef, { societyIds: ids, currentSocietyId: societyId });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// 2. SOCIETIES (Tenants)
// -------------------------------------------------------------

export function subscribeSocieties(callback: (societies: Society[]) => void) {
  const path = 'societies';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: Society[] = [];
      snapshot.forEach((d) => list.push(d.data() as Society));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeSociety(societyId: string, callback: (society: Society | null) => void) {
  const path = `societies/${societyId}`;
  return onSnapshot(
    doc(db, 'societies', societyId),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Society);
      } else {
        callback(null);
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export async function createSocietyRecord(data: Partial<Society> & { name: string; city: string }): Promise<Society> {
  const id = data.id || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
  const path = `societies/${id}`;
  try {
    const newSociety: Society = {
      id,
      name: data.name,
      legalName: data.legalName || `${data.name} Apartment Owners Welfare Association`,
      city: data.city,
      address: data.address || `${data.name}, ${data.city}`,
      status: data.status || 'active',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      features: data.features || {
        facilityBooking: true,
        visitorManagement: true,
        maintenanceBilling: true,
        complaints: true,
        elections: true,
        notices: true,
      },
      registeredNumber: data.registeredNumber || `RWA-${data.city.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      totalFlats: data.totalFlats || 0,
      totalResidents: data.totalResidents || 0,
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser?.uid || 'system',
      updatedAt: new Date().toISOString(),
    };

    const clean = sanitizeFirestoreData(newSociety);
    await setDoc(doc(db, 'societies', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateSocietyStatus(societyId: string, status: Society['status']): Promise<void> {
  const path = `societies/${societyId}`;
  try {
    await updateDoc(doc(db, 'societies', societyId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// 3. TOWERS & FLATS (First-Class Units)
// -------------------------------------------------------------

export function subscribeTowers(societyId: string, callback: (towers: Tower[]) => void) {
  const path = `societies/${societyId}/towers`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'towers'),
    (snapshot) => {
      const list: Tower[] = [];
      snapshot.forEach((d) => list.push(d.data() as Tower));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function createTowerRecord(societyId: string, tower: Omit<Tower, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>): Promise<Tower> {
  const id = `tower-${tower.code.toLowerCase()}`;
  const path = `societies/${societyId}/towers/${id}`;
  try {
    const record: Tower = {
      ...tower,
      id,
      societyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'towers', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export function subscribeFlats(societyId: string, callback: (flats: Flat[]) => void) {
  const path = `societies/${societyId}/flats`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'flats'),
    (snapshot) => {
      const list: Flat[] = [];
      snapshot.forEach((d) => list.push(d.data() as Flat));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function createFlatRecord(societyId: string, flat: Omit<Flat, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>): Promise<Flat> {
  const id = `flat-${flat.number.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const path = `societies/${societyId}/flats/${id}`;
  try {
    const record: Flat = {
      ...flat,
      id,
      societyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'flats', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateFlatRecord(societyId: string, flatId: string, data: Partial<Flat>): Promise<void> {
  const path = `societies/${societyId}/flats/${flatId}`;
  try {
    const clean = sanitizeFirestoreData({ ...data, updatedAt: new Date().toISOString() });
    await updateDoc(doc(db, 'societies', societyId, 'flats', flatId), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// 4. SOCIETY MEMBERS (Authoritative Roles)
// -------------------------------------------------------------

export function subscribeMembers(societyId: string, callback: (members: SocietyMember[]) => void) {
  const path = `societies/${societyId}/members`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'members'),
    (snapshot) => {
      const list: SocietyMember[] = [];
      snapshot.forEach((d) => list.push(d.data() as SocietyMember));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeMember(societyId: string, uid: string, callback: (member: SocietyMember | null) => void) {
  const path = `societies/${societyId}/members/${uid}`;
  return onSnapshot(
    doc(db, 'societies', societyId, 'members', uid),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as SocietyMember);
      } else {
        callback(null);
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export async function createOrUpdateMemberRecord(
  societyId: string,
  memberData: Partial<SocietyMember> & { uid: string; email: string; name: string }
): Promise<SocietyMember> {
  const path = `societies/${societyId}/members/${memberData.uid}`;
  try {
    const memberRef = doc(db, 'societies', societyId, 'members', memberData.uid);
    const snap = await getDoc(memberRef);

    let finalRecord: SocietyMember;
    if (snap.exists()) {
      const existing = snap.data() as SocietyMember;
      finalRecord = {
        ...existing,
        ...memberData,
        updatedAt: new Date().toISOString(),
      };
    } else {
      finalRecord = {
        id: memberData.uid,
        uid: memberData.uid,
        societyId,
        name: memberData.name,
        email: memberData.email,
        phone: memberData.phone || '',
        role: memberData.role || 'resident',
        status: memberData.status || 'active',
        flatId: memberData.flatId || '',
        flatNumber: memberData.flatNumber || '',
        towerName: memberData.towerName || 'Tower B',
        type: memberData.type || 'Owner',
        designation: memberData.designation || 'Resident',
        profileComplete: memberData.profileComplete ?? true,
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const clean = sanitizeFirestoreData(finalRecord);
    await setDoc(memberRef, clean, { merge: true });
    await linkSocietyToPlatformUser(memberData.uid, societyId);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function updateMemberRole(
  societyId: string,
  uid: string,
  role: SocietyRole,
  designation?: string
): Promise<void> {
  const path = `societies/${societyId}/members/${uid}`;
  try {
    const payload: Record<string, any> = {
      role,
      updatedAt: new Date().toISOString(),
    };
    if (designation) {
      payload.designation = designation;
    }
    const clean = sanitizeFirestoreData(payload);
    await updateDoc(doc(db, 'societies', societyId, 'members', uid), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// 5. VISITORS & GATE LOGS (Tenant Subcollection)
// -------------------------------------------------------------

export function subscribeVisitors(societyId: string, callback: (visitors: Visitor[]) => void) {
  const path = `societies/${societyId}/visitors`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'visitors'),
    (snapshot) => {
      const list: Visitor[] = [];
      snapshot.forEach((d) => list.push(d.data() as Visitor));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function createVisitorRecord(societyId: string, visitor: Omit<Visitor, 'id' | 'createdAt'>): Promise<Visitor> {
  const id = `vis-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const path = `societies/${societyId}/visitors/${id}`;
  try {
    const record: Visitor = {
      ...visitor,
      id,
      societyId,
      createdAt: new Date().toISOString(),
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'visitors', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateVisitorStatusRecord(
  societyId: string,
  visitorId: string,
  status: Visitor['status'],
  extraFields: Record<string, any> = {}
): Promise<void> {
  const path = `societies/${societyId}/visitors/${visitorId}`;
  try {
    const clean = sanitizeFirestoreData({ status, ...extraFields });
    await updateDoc(doc(db, 'societies', societyId, 'visitors', visitorId), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// 6. COMPLAINTS (Tenant Subcollection)
// -------------------------------------------------------------

export function subscribeComplaints(societyId: string, callback: (complaints: Complaint[]) => void) {
  const path = `societies/${societyId}/complaints`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'complaints'),
    (snapshot) => {
      const list: Complaint[] = [];
      snapshot.forEach((d) => list.push(d.data() as Complaint));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function createComplaintRecord(societyId: string, complaint: Omit<Complaint, 'id' | 'ticketNumber' | 'reportedAt'>): Promise<Complaint> {
  const id = `comp-${Date.now()}`;
  const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
  const path = `societies/${societyId}/complaints/${id}`;
  try {
    const record: Complaint = {
      ...complaint,
      id,
      societyId,
      ticketNumber,
      reportedAt: new Date().toISOString(),
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'complaints', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateComplaintStatusRecord(
  societyId: string,
  complaintId: string,
  status: Complaint['status'],
  comments?: Complaint['comments']
): Promise<void> {
  const path = `societies/${societyId}/complaints/${complaintId}`;
  try {
    const payload: Record<string, any> = { status };
    if (comments) payload.comments = comments;
    const clean = sanitizeFirestoreData(payload);
    await updateDoc(doc(db, 'societies', societyId, 'complaints', complaintId), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// 7. BILLS & PAYMENTS (Tenant Subcollection)
// -------------------------------------------------------------

export function subscribeBills(societyId: string, callback: (bills: MaintenanceBill[]) => void) {
  const path = `societies/${societyId}/bills`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'bills'),
    (snapshot) => {
      const list: MaintenanceBill[] = [];
      snapshot.forEach((d) => list.push(d.data() as MaintenanceBill));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function createBillRecord(societyId: string, bill: Omit<MaintenanceBill, 'id' | 'billNumber'>): Promise<MaintenanceBill> {
  const id = `bill-${Date.now()}`;
  const billNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const path = `societies/${societyId}/bills/${id}`;
  try {
    const record: MaintenanceBill = {
      ...bill,
      id,
      societyId,
      billNumber,
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'bills', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function processServerConfirmedPayment(
  societyId: string,
  billId: string,
  paymentDetails: { method: string; transactionId: string; amount: number }
): Promise<void> {
  const path = `societies/${societyId}/bills/${billId}`;
  try {
    const billRef = doc(db, 'societies', societyId, 'bills', billId);
    const clean = sanitizeFirestoreData({
      status: 'Paid',
      paidAt: new Date().toISOString(),
      paymentMethod: paymentDetails.method,
      transactionId: paymentDetails.transactionId,
    });
    await updateDoc(billRef, clean);

    // Also record payment document
    const paymentId = `pay-${Date.now()}`;
    await setDoc(doc(db, 'societies', societyId, 'payments', paymentId), sanitizeFirestoreData({
      id: paymentId,
      societyId,
      billId,
      amount: paymentDetails.amount,
      currency: 'INR',
      provider: paymentDetails.method,
      providerTransactionId: paymentDetails.transactionId,
      status: 'confirmed',
      initiatedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      receiptId: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// 8. FACILITIES & BOOKINGS (Tenant Subcollection)
// -------------------------------------------------------------

export function subscribeFacilities(societyId: string, callback: (facilities: Facility[]) => void) {
  const path = `societies/${societyId}/facilities`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'facilities'),
    (snapshot) => {
      const list: Facility[] = [];
      snapshot.forEach((d) => list.push(d.data() as Facility));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeFacilityBookings(societyId: string, callback: (bookings: FacilityBooking[]) => void) {
  const path = `societies/${societyId}/facilityBookings`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'facilityBookings'),
    (snapshot) => {
      const list: FacilityBooking[] = [];
      snapshot.forEach((d) => list.push(d.data() as FacilityBooking));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function createFacilityBookingRecord(
  societyId: string,
  booking: Omit<FacilityBooking, 'id' | 'bookedAt' | 'status'>
): Promise<FacilityBooking> {
  const id = `book-${Date.now()}`;
  const path = `societies/${societyId}/facilityBookings/${id}`;
  try {
    const record: FacilityBooking = {
      ...booking,
      id,
      societyId,
      status: 'Confirmed',
      bookedAt: new Date().toISOString(),
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'facilityBookings', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// 9. NOTICES (Tenant Subcollection)
// -------------------------------------------------------------

export function subscribeNotices(societyId: string, callback: (notices: Notice[]) => void) {
  const path = `societies/${societyId}/notices`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'notices'),
    (snapshot) => {
      const list: Notice[] = [];
      snapshot.forEach((d) => list.push(d.data() as Notice));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function createNoticeRecord(societyId: string, notice: Omit<Notice, 'id' | 'createdAt'>): Promise<Notice> {
  const id = `notice-${Date.now()}`;
  const path = `societies/${societyId}/notices/${id}`;
  try {
    const record: Notice = {
      ...notice,
      id,
      societyId,
      createdAt: new Date().toISOString(),
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'notices', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// 10. ELECTIONS & BALLOTS (Tenant Subcollection)
// -------------------------------------------------------------

export function subscribeElections(societyId: string, callback: (elections: Election[]) => void) {
  const path = `societies/${societyId}/elections`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'elections'),
    (snapshot) => {
      const list: Election[] = [];
      snapshot.forEach((d) => list.push(d.data() as Election));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function createElectionRecord(societyId: string, election: Omit<Election, 'id' | 'createdAt' | 'totalVotesCast'>): Promise<Election> {
  const id = `elec-${Date.now()}`;
  const path = `societies/${societyId}/elections/${id}`;
  try {
    const record: Election = {
      ...election,
      id,
      societyId,
      totalVotesCast: 0,
      createdAt: new Date().toISOString(),
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'elections', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export function subscribeNominations(societyId: string, electionId: string, callback: (nominations: Nomination[]) => void) {
  const path = `societies/${societyId}/elections/${electionId}/nominations`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'elections', electionId, 'nominations'),
    (snapshot) => {
      const list: Nomination[] = [];
      snapshot.forEach((d) => list.push(d.data() as Nomination));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function submitNominationRecord(
  societyId: string,
  electionId: string,
  nomination: Omit<Nomination, 'id' | 'nominatedAt' | 'voteCount'>
): Promise<Nomination> {
  const id = `nom-${Date.now()}`;
  const path = `societies/${societyId}/elections/${electionId}/nominations/${id}`;
  try {
    const record: Nomination = {
      ...nomination,
      id,
      societyId,
      electionId,
      voteCount: 0,
      nominatedAt: new Date().toISOString(),
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'elections', electionId, 'nominations', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export function subscribeVotes(societyId: string, electionId: string, callback: (votes: Vote[]) => void) {
  const path = `societies/${societyId}/elections/${electionId}/votes`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'elections', electionId, 'votes'),
    (snapshot) => {
      const list: Vote[] = [];
      snapshot.forEach((d) => list.push(d.data() as Vote));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function castVoteRecord(societyId: string, electionId: string, vote: Omit<Vote, 'id' | 'castAt'>): Promise<Vote> {
  const id = `vote-${vote.voterId}-${vote.position.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const path = `societies/${societyId}/elections/${electionId}/votes/${id}`;
  try {
    const record: Vote = {
      ...vote,
      id,
      societyId,
      electionId,
      castAt: new Date().toISOString(),
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'elections', electionId, 'votes', id), clean);

    // Increment nomination vote count
    const nomRef = doc(db, 'societies', societyId, 'elections', electionId, 'nominations', vote.candidateId);
    try {
      await updateDoc(nomRef, { voteCount: increment(1) });
    } catch {
      // safe fallback
    }

    // Increment election total votes cast
    const elecRef = doc(db, 'societies', societyId, 'elections', electionId);
    try {
      await updateDoc(elecRef, { totalVotesCast: increment(1) });
    } catch {
      // safe fallback
    }

    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// 11. AUDIT LOGS (Tenant Subcollection)
// -------------------------------------------------------------

export function subscribeAuditLogs(societyId: string, callback: (logs: AuditLog[]) => void) {
  const path = `societies/${societyId}/auditLogs`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'auditLogs'),
    (snapshot) => {
      const list: AuditLog[] = [];
      snapshot.forEach((d) => list.push(d.data() as AuditLog));
      list.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function recordAuditLog(
  societyId: string,
  log: Omit<AuditLog, 'id' | 'societyId' | 'timestamp'>
): Promise<void> {
  const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const path = `societies/${societyId}/auditLogs/${id}`;
  try {
    const record: AuditLog = {
      ...log,
      id,
      societyId,
      timestamp: new Date().toISOString(),
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'auditLogs', id), clean);
  } catch (error) {
    console.warn('Audit log write error:', error);
  }
}

// -------------------------------------------------------------
// 12. PLATFORM ANALYTICS & SUPPORT SESSIONS
// -------------------------------------------------------------

export function subscribePlatformAnalytics(callback: (analytics: PlatformAnalytics[]) => void) {
  const path = 'platformAnalytics';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: PlatformAnalytics[] = [];
      snapshot.forEach((d) => list.push(d.data() as PlatformAnalytics));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeSupportSessions(callback: (sessions: SupportSession[]) => void) {
  const path = 'supportSessions';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: SupportSession[] = [];
      snapshot.forEach((d) => list.push(d.data() as SupportSession));
      callback(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function createSupportSessionRecord(
  session: Omit<SupportSession, 'id' | 'startedAt' | 'status'>
): Promise<SupportSession> {
  const id = `support-${Date.now()}`;
  const path = `supportSessions/${id}`;
  try {
    const record: SupportSession = {
      ...session,
      id,
      startedAt: new Date().toISOString(),
      status: 'active',
    };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'supportSessions', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// 13. REAL PRODUCTION TENANT INITIALIZER (Zero-Mock Bootstrap)
// -------------------------------------------------------------

/**
 * Initializes the default production tenant "greenwood-heights" directly into Cloud Firestore
 * if the database is currently empty. This eliminates reliance on in-memory mock datasets.
 */
export async function bootstrapProductionTenantIfEmpty(): Promise<void> {
  const societyId = 'greenwood-heights';
  try {
    const societyDoc = await getDoc(doc(db, 'societies', societyId));
    if (societyDoc.exists()) {
      return;
    }

    console.log('[NestWell Multi-Tenant] Initializing Greenwood Heights in Cloud Firestore...');
    const batch = writeBatch(db);

    // 1. Society Record
    const society: Society = {
      id: societyId,
      name: 'Greenwood Heights RWA',
      legalName: 'Greenwood Heights Apartment Owners Association',
      city: 'Bengaluru, KA',
      address: 'Near Sarjapur Road, Bellandur, Bengaluru, Karnataka 560103',
      status: 'active',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      registeredNumber: 'RWA-BLR-2019-742',
      features: {
        facilityBooking: true,
        visitorManagement: true,
        maintenanceBilling: true,
        complaints: true,
        elections: true,
        notices: true,
      },
      totalFlats: 144,
      totalResidents: 480,
      createdAt: new Date().toISOString(),
      createdBy: 'system-bootstrap',
      activatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(doc(db, 'societies', societyId), sanitizeFirestoreData(society));

    // 2. Towers
    const towers: Tower[] = [
      { id: 'tower-a', societyId, name: 'Tower A', code: 'A', floors: 12, totalFlats: 48, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'tower-b', societyId, name: 'Tower B', code: 'B', floors: 12, totalFlats: 48, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'tower-c', societyId, name: 'Tower C', code: 'C', floors: 12, totalFlats: 48, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    for (const t of towers) {
      batch.set(doc(db, 'societies', societyId, 'towers', t.id), sanitizeFirestoreData(t));
    }

    // 3. First-Class Flats
    const sampleFlats: Flat[] = [
      { id: 'flat-a-101', societyId, number: 'A-101', towerId: 'tower-a', towerName: 'Tower A', floor: 1, type: '2BHK', status: 'active', ownerIds: [], ownerNames: ['Vikram Sharma'], tenantIds: [], primaryResidentName: 'Vikram Sharma', primaryResidentPhone: '+91 98450 12345', dues: 0, vehicles: [{ number: 'KA 03 MX 1100', type: 'Car', slot: 'A-P01' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'flat-b-402', societyId, number: 'B-402', towerId: 'tower-b', towerName: 'Tower B', floor: 4, type: '3BHK', status: 'active', ownerIds: [], ownerNames: ['Sayan Ghosh'], tenantIds: [], primaryResidentName: 'Sayan Ghosh', primaryResidentPhone: '+91 98765 43210', dues: 4600, vehicles: [{ number: 'KA 03 MX 8412', type: 'Car', slot: 'B-P12' }, { number: 'KA 03 EV 2109', type: 'Two-Wheeler', slot: 'B-T04' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'flat-b-403', societyId, number: 'B-403', towerId: 'tower-b', towerName: 'Tower B', floor: 4, type: '3BHK', status: 'active', ownerIds: [], ownerNames: ['Ananya Rao'], tenantIds: [], primaryResidentName: 'Ananya Rao', primaryResidentPhone: '+91 98112 33445', dues: 0, vehicles: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'flat-c-201', societyId, number: 'C-201', towerId: 'tower-c', towerName: 'Tower C', floor: 2, type: '2BHK', status: 'active', ownerIds: [], ownerNames: ['Rajesh Iyer'], tenantIds: [], primaryResidentName: 'Rajesh Iyer', primaryResidentPhone: '+91 99000 88776', dues: 0, vehicles: [{ number: 'KA 05 Z 9911', type: 'Car', slot: 'C-P05' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    for (const f of sampleFlats) {
      batch.set(doc(db, 'societies', societyId, 'flats', f.id), sanitizeFirestoreData(f));
    }

    // 4. Facilities
    const facilities: Facility[] = [
      { id: 'fac-clubhouse', societyId, name: 'Club House & Banquet', description: 'Central air-conditioned multi-purpose hall with audio system', capacity: 120, pricePerHour: 1500, timings: '08:00 AM - 10:00 PM', icon: 'Building2', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], slots: [] },
      { id: 'fac-badminton', societyId, name: 'Indoor Badminton Court', description: 'Wooden synthetic court with professional LED lighting', capacity: 6, pricePerHour: 200, timings: '06:00 AM - 10:00 PM', icon: 'Activity', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], slots: [] },
      { id: 'fac-pool', societyId, name: 'Olympic Swimming Pool', description: 'Temperature-regulated adult pool with separate kids splash zone', capacity: 40, pricePerHour: 0, timings: '06:00 AM - 08:00 PM', icon: 'Waves', availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], slots: [] },
    ];
    for (const fac of facilities) {
      batch.set(doc(db, 'societies', societyId, 'facilities', fac.id), sanitizeFirestoreData(fac));
    }

    // 5. Initial Notices
    const notices: Notice[] = [
      { id: 'not-agm', societyId, title: 'Annual General Meeting (AGM) Notification', category: 'event', message: 'The 7th Annual General Meeting of Greenwood Heights RWA is scheduled for Sunday at 10:30 AM in the Clubhouse. All flat owners and residents are requested to attend.', audience: 'Entire Society', priority: 'urgent', publishedBy: 'Managing Committee RWA', date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), createdAt: new Date().toISOString() },
      { id: 'not-filter', societyId, title: 'Quarterly Water Filter Cleaning Scheduled', category: 'maintenance', message: 'Main overhead water tanks for Tower A & Tower B will be cleaned tomorrow between 10:00 AM and 02:00 PM. Please store adequate water.', audience: 'Entire Society', priority: 'normal', publishedBy: 'Maintenance Supervisor', date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), createdAt: new Date().toISOString() },
    ];
    for (const n of notices) {
      batch.set(doc(db, 'societies', societyId, 'notices', n.id), sanitizeFirestoreData(n));
    }

    // 6. Initial Active Election
    const election: Election = {
      id: 'elec-2026-28',
      societyId,
      title: 'Greenwood Heights RWA Executive Committee Election 2026-2028',
      term: '2026-2028',
      description: 'Biennial democratic digital ballot to elect the executive officers of the association.',
      positions: ['President', 'General Secretary', 'Treasurer', 'Maintenance & Facilities Head'],
      nominationStart: '01 Mar 2026',
      nominationEnd: '15 Mar 2026',
      votingStart: '16 Mar 2026',
      votingEnd: '25 Mar 2026',
      status: 'Voting Active',
      eligibleVotersCount: 144,
      totalVotesCast: 32,
      createdAt: new Date().toISOString(),
    };
    batch.set(doc(db, 'societies', societyId, 'elections', election.id), sanitizeFirestoreData(election));

    // 7. Initial Nomination
    const nomination: Nomination = {
      id: 'nom-vikram-pres',
      societyId,
      electionId: election.id,
      position: 'President',
      candidateId: 'cand-vikram',
      candidateName: 'Vikram Sharma',
      flat: 'A-101',
      tower: 'Tower A',
      phone: '+91 98450 12345',
      email: 'vikram.sharma@example.com',
      profession: 'Senior Architect',
      yearsInSociety: 5,
      manifesto: 'Complete solar power installation for common areas to cut electricity bills by 35%, and high-speed Wi-Fi in the clubhouse.',
      status: 'Approved',
      voteCount: 18,
      nominatedAt: new Date().toISOString(),
    };
    batch.set(doc(db, 'societies', societyId, 'elections', election.id, 'nominations', nomination.id), sanitizeFirestoreData(nomination));

    // 8. Initial Maintenance Bill for Flat B-402
    const bill: MaintenanceBill = {
      id: 'bill-b402-current',
      societyId,
      billNumber: 'INV-2026-8419',
      flat: 'B-402',
      tower: 'Tower B',
      residentName: 'Sayan Ghosh',
      month: 'September',
      year: 2026,
      maintenanceFee: 3800,
      parkingFee: 500,
      lateFee: 300,
      totalAmount: 4600,
      status: 'Pending',
      dueDate: '15 Sep 2026',
      createdAt: new Date().toISOString(),
    };
    batch.set(doc(db, 'societies', societyId, 'bills', bill.id), sanitizeFirestoreData(bill));

    // 9. Initial Analytics Rollup
    const analytics: PlatformAnalytics = {
      societyId,
      societyName: 'Greenwood Heights RWA',
      city: 'Bengaluru, KA',
      status: 'active',
      totalResidents: 480,
      activeComplaints: 3,
      outstandingAmount: 18400,
      paymentsCollected: 342000,
      visitorCountLast30Days: 418,
      facilityBookingsThisMonth: 28,
      lastUpdatedAt: new Date().toISOString(),
    };
    batch.set(doc(db, 'platformAnalytics', societyId), sanitizeFirestoreData(analytics));

    await batch.commit();
    console.log('[NestWell Multi-Tenant] Greenwood Heights successfully provisioned into Firestore.');
  } catch (error) {
    console.warn('[NestWell Multi-Tenant] Tenant bootstrap skipped or encountered issue:', error);
  }
}
