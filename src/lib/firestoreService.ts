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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, FirebaseUser } from './firebase';
import {
  Society,
  Tower,
  Flat,
  SocietyMember,
  SocietyRole,
  SocietyInvite,
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
  PaymentRecord,
  AppNotification,
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
 * Log-only variant for real-time subscription error callbacks.
 * Subscriptions must never throw: permission-denied simply means the
 * listener yields no data (logged out, non-member, suspended tenant).
 */
export function logFirestoreWarning(error: unknown, operationType: OperationType, path: string | null) {
  const code = (error as { code?: string })?.code || 'unknown';
  console.warn(`[Firestore] ${operationType} ${path || ''}: ${code}`);
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

    if (snap.exists()) {
      const existing = snap.data() as PlatformUser;
      // Backfill avatar from auth provider (Google photo) when missing.
      if (!existing.avatar && firebaseUser.photoURL) {
        const updated = { ...existing, avatar: firebaseUser.photoURL };
        await setDoc(userRef, updated, { merge: true });
        return updated;
      }
      return existing;
    }

    // New users are NEVER granted platform_admin here.
    // Platform Admin is assigned only via the trusted Admin SDK bootstrap script.
    // New users start with no societies; they join via invitation or join request.
    const newUser: PlatformUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Resident User'),
      avatar: firebaseUser.photoURL || '',
      platformRole: null,
      societyIds: [],
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
    (error) => logFirestoreWarning(error, OperationType.GET, path)
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
    (error) => logFirestoreWarning(error, OperationType.GET, path)
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
      latitude: data.latitude,
      longitude: data.longitude,
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

export async function updateSocietySettings(
  societyId: string,
  settings: Record<string, unknown>
): Promise<void> {
  const path = `societies/${societyId}`;
  try {
    const clean = sanitizeFirestoreData(settings);
    await updateDoc(doc(db, 'societies', societyId), {
      ...clean,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Subcollections wiped on society deletion (elections handled recursively
// because nominations/votes nest one level deeper).
const SOCIETY_SUBCOLLECTIONS = [
  'towers',
  'flats',
  'members',
  'visitors',
  'complaints',
  'bills',
  'payments',
  'facilities',
  'facilityBookings',
  'notices',
  'elections',
  'auditLogs',
];

/**
 * Permanently delete a society and its entire subtree. Platform admin only
 * (enforced by security rules). Active societies must be suspended first —
 * callers should enforce this; the function double-checks.
 */
export async function deleteSocietyRecord(societyId: string): Promise<{ deleted: number }> {
  const path = `societies/${societyId}`;
  const socSnap = await getDoc(doc(db, 'societies', societyId));
  if (!socSnap.exists()) {
    throw new Error('Society not found.');
  }
  if ((socSnap.data() as Society).status === 'active') {
    throw new Error('Suspend the society before deleting it.');
  }

  let deleted = 0;
  let batch = writeBatch(db);
  let ops = 0;
  const commits: Promise<void>[] = [];
  const queueDelete = (ref: Parameters<typeof batch.delete>[0]) => {
    batch.delete(ref);
    ops += 1;
    if (ops >= 400) {
      commits.push(batch.commit());
      batch = writeBatch(db);
      ops = 0;
    }
  };

  for (const col of SOCIETY_SUBCOLLECTIONS) {
    const snap = await getDocs(collection(db, 'societies', societyId, col));
    for (const d of snap.docs) {
      if (col === 'elections') {
        for (const nested of ['nominations', 'votes']) {
          const nestedSnap = await getDocs(
            collection(db, 'societies', societyId, 'elections', d.id, nested)
          );
          for (const nd of nestedSnap.docs) {
            queueDelete(nd.ref);
            deleted += 1;
          }
        }
      }
      queueDelete(d.ref);
      deleted += 1;
    }
  }
  queueDelete(doc(db, 'societies', societyId));
  deleted += 1;

  // Remove related invites and analytics rollup
  const invitesSnap = await getDocs(
    query(collection(db, 'societyInvites'), where('societyId', '==', societyId))
  );
  for (const d of invitesSnap.docs) {
    queueDelete(d.ref);
    deleted += 1;
  }
  const analyticsRef = doc(db, 'platformAnalytics', societyId);
  if ((await getDoc(analyticsRef)).exists()) {
    queueDelete(analyticsRef);
    deleted += 1;
  }
  commits.push(batch.commit());
  await Promise.all(commits);

  // Detach the society from member platform profiles
  try {
    const usersSnap = await getDocs(
      query(collection(db, 'platformUsers'), where('societyIds', 'array-contains', societyId))
    );
    for (const u of usersSnap.docs) {
      const ids = ((u.data().societyIds as string[]) || []).filter((id) => id !== societyId);
      await updateDoc(u.ref, {
        societyIds: ids,
        ...(u.data().currentSocietyId === societyId ? { currentSocietyId: '' } : {}),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'platformUsers');
  }

  return { deleted };
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
    (error) => logFirestoreWarning(error, OperationType.GET, path)
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
        towerName: memberData.towerName || '',
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

export async function updateMemberStatus(
  societyId: string,
  uid: string,
  status: MembershipStatus
): Promise<void> {
  const path = `societies/${societyId}/members/${uid}`;
  try {
    await updateDoc(doc(db, 'societies', societyId, 'members', uid), {
      status,
      updatedAt: new Date().toISOString(),
    });
    if (status === 'active') {
      await linkSocietyToPlatformUser(uid, societyId);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// -------------------------------------------------------------
// 4b. SOCIETY INVITES & JOIN WORKFLOWS
// Invite code is the document ID (high-entropy, single-use secret).
// Acceptance validates email match + expiry + pending status.
// -------------------------------------------------------------

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 10; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NW-${suffix}`;
}

export async function createSocietyInvite(
  societyId: string,
  data: { email: string; intendedRole: SocietyRole; flatId?: string; createdBy: string }
): Promise<SocietyInvite> {
  const code = generateInviteCode();
  const path = `societyInvites/${code}`;
  try {
    const invite: SocietyInvite = {
      id: code,
      societyId,
      email: data.email.trim().toLowerCase(),
      intendedRole: data.intendedRole,
      flatId: data.flatId || '',
      tokenHash: '',
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'societyInvites', code), sanitizeFirestoreData(invite));
    await recordAuditLog(societyId, {
      actorId: data.createdBy,
      actorName: data.createdBy,
      actorRole: 'society_admin',
      action: 'INVITE_MEMBER',
      targetType: 'SocietyInvite',
      targetId: code,
      reason: `Invited ${invite.email} as ${data.intendedRole}`,
    });
    return invite;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function getInviteByCode(code: string): Promise<SocietyInvite | null> {
  const path = `societyInvites/${code.trim().toUpperCase()}`;
  try {
    const snap = await getDoc(doc(db, 'societyInvites', code.trim().toUpperCase()));
    if (!snap.exists()) return null;
    return snap.data() as SocietyInvite;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
}

export async function acceptSocietyInvite(
  code: string,
  fbUser: FirebaseUser
): Promise<{ societyId: string }> {
  const normalized = code.trim().toUpperCase();

  // Direct path: invite code is a high-entropy single-use secret, the
  // invite email must match the signed-in user, and acceptance is audited.
  const invite = await getInviteByCode(normalized);
  if (!invite) {
    throw new Error('Invitation code not found. Please check the code and try again.');
  }
  if (invite.status !== 'pending') {
    throw new Error(`This invitation is ${invite.status} and can no longer be used.`);
  }
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    await updateDoc(doc(db, 'societyInvites', normalized), { status: 'expired' });
    throw new Error('This invitation has expired. Please ask for a new one.');
  }
  const userEmail = (fbUser.email || '').trim().toLowerCase();
  if (!userEmail || userEmail !== invite.email) {
    throw new Error('This invitation was sent to a different email address. Please sign in with the invited email.');
  }

  // Atomic: create active membership + mark invite accepted + link society
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const memberRef = doc(db, 'societies', invite.societyId, 'members', fbUser.uid);
  batch.set(
    memberRef,
    sanitizeFirestoreData({
      id: fbUser.uid,
      uid: fbUser.uid,
      societyId: invite.societyId,
      name: fbUser.displayName || userEmail.split('@')[0],
      email: userEmail,
      phone: fbUser.phoneNumber || '',
      avatar: fbUser.photoURL || '',
      role: invite.intendedRole,
      status: 'active',
      flatId: invite.flatId || '',
      flatNumber: '',
      towerName: '',
      type: 'Owner',
      profileComplete: false,
      invitedBy: invite.createdBy,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
    { merge: true }
  );
  batch.update(doc(db, 'societyInvites', normalized), {
    status: 'accepted',
    acceptedBy: fbUser.uid,
    acceptedAt: now,
  });
  await batch.commit();

  await linkSocietyToPlatformUser(fbUser.uid, invite.societyId);

  // First society_admin acceptance moves the society into onboarding.
  if (invite.intendedRole === 'society_admin') {
    try {
      const socRef = doc(db, 'societies', invite.societyId);
      const socSnap = await getDoc(socRef);
      if (socSnap.exists() && (socSnap.data() as Society).status === 'pending_admin') {
        await updateDoc(socRef, { status: 'onboarding', updatedAt: now });
      }
    } catch {
      // Non-fatal: platform admin can advance the lifecycle manually.
    }
  }

  await recordAuditLog(invite.societyId, {
    actorId: fbUser.uid,
    actorName: userEmail,
    actorRole: invite.intendedRole,
    action: 'ACCEPT_INVITATION',
    targetType: 'SocietyInvite',
    targetId: normalized,
    reason: `Joined as ${invite.intendedRole}`,
  });
  return { societyId: invite.societyId };
}

export async function requestSocietyMembership(
  societyId: string,
  fbUser: FirebaseUser
): Promise<void> {
  const path = `societies/${societyId}/members/${fbUser.uid}`;
  try {
    const userEmail = (fbUser.email || '').trim().toLowerCase();
    const now = new Date().toISOString();
    await setDoc(
      doc(db, 'societies', societyId, 'members', fbUser.uid),
      sanitizeFirestoreData({
        id: fbUser.uid,
        uid: fbUser.uid,
        societyId,
        name: fbUser.displayName || userEmail.split('@')[0] || 'New Member',
        email: userEmail,
        phone: fbUser.phoneNumber || '',
        avatar: fbUser.photoURL || '',
        role: 'resident',
        status: 'pending',
        flatId: '',
        flatNumber: '',
        towerName: '',
        type: 'Owner',
        profileComplete: false,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
      { merge: true }
    );
    await recordAuditLog(societyId, {
      actorId: fbUser.uid,
      actorName: userEmail,
      actorRole: 'resident',
      action: 'REQUEST_MEMBERSHIP',
      targetType: 'SocietyMember',
      targetId: fbUser.uid,
      reason: 'Join request via society search',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function revokeSocietyInvite(code: string, actorId: string): Promise<void> {
  const path = `societyInvites/${code}`;
  try {
    await updateDoc(doc(db, 'societyInvites', code), { status: 'revoked' });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
  // Direct path: society admins may record payments (rules enforce
  // admin-write-only on bills); residents are rejected by security rules
  // and the UI surfaces payments as unavailable to them.
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
    throw error;
  }
}

// -------------------------------------------------------------
// 7b. PAYMENT RECORDS (UPI QR / UTR Verification)
// -------------------------------------------------------------

export async function createPaymentRecord(
  societyId: string,
  payment: Omit<PaymentRecord, 'id'>
): Promise<string> {
  const id = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const path = `societies/${societyId}/payments/${id}`;
  try {
    const record = { ...payment, id };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'payments', id), clean);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updatePaymentRecord(
  societyId: string,
  paymentId: string,
  updates: Partial<PaymentRecord>
): Promise<void> {
  const path = `societies/${societyId}/payments/${paymentId}`;
  try {
    const clean = sanitizeFirestoreData(updates);
    await updateDoc(doc(db, 'societies', societyId, 'payments', paymentId), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export function subscribePayments(
  societyId: string,
  callback: (payments: PaymentRecord[]) => void
): () => void {
  const path = `societies/${societyId}/payments`;
  return onSnapshot(
    collection(db, 'societies', societyId, 'payments'),
    (snapshot) => {
      const list: PaymentRecord[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as PaymentRecord));
      callback(list);
    },
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
  );
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
  );
}

export async function createFacilityRecord(
  societyId: string,
  facility: Omit<Facility, 'id' | 'societyId'>
): Promise<Facility> {
  const id = `fac-${facility.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  const path = `societies/${societyId}/facilities/${id}`;
  try {
    const record: Facility = { ...facility, id, societyId } as Facility;
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'facilities', id), clean);
    return clean;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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

export async function updateElectionRecord(
  societyId: string,
  electionId: string,
  updates: Partial<Election>
): Promise<void> {
  const path = `societies/${societyId}/elections/${electionId}`;
  try {
    const clean = sanitizeFirestoreData(updates);
    await updateDoc(doc(db, 'societies', societyId, 'elections', electionId), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateNominationRecord(
  societyId: string,
  electionId: string,
  nominationId: string,
  updates: Partial<Nomination>
): Promise<void> {
  const path = `societies/${societyId}/elections/${electionId}/nominations/${nominationId}`;
  try {
    const clean = sanitizeFirestoreData(updates);
    await updateDoc(doc(db, 'societies', societyId, 'elections', electionId, 'nominations', nominationId), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
  );
}

export async function castVoteRecord(societyId: string, electionId: string, vote: Omit<Vote, 'id' | 'castAt'>): Promise<Vote> {
  // Deterministic vote ID: one vote per voter per position.
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
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
// 13. NOTIFICATIONS (Tenant Subcollection)
// -------------------------------------------------------------

export async function createNotificationRecord(
  societyId: string,
  notification: Omit<AppNotification, 'id'>
): Promise<string> {
  const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const path = `societies/${societyId}/notifications/${id}`;
  try {
    const record = { ...notification, id };
    const clean = sanitizeFirestoreData(record);
    await setDoc(doc(db, 'societies', societyId, 'notifications', id), clean);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export function subscribeNotifications(
  societyId: string,
  userId: string,
  callback: (notifications: AppNotification[]) => void
): () => void {
  const path = `societies/${societyId}/notifications`;
  return onSnapshot(
    query(
      collection(db, 'societies', societyId, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    ),
    (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as AppNotification));
      callback(list);
    },
    (error) => logFirestoreWarning(error, OperationType.LIST, path)
  );
}

export async function markNotificationRead(
  societyId: string,
  notificationId: string
): Promise<void> {
  const path = `societies/${societyId}/notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'societies', societyId, 'notifications', notificationId), {
      read: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsRead(
  societyId: string,
  userId: string
): Promise<void> {
  const path = `societies/${societyId}/notifications`;
  try {
    const snap = await getDocs(
      query(
        collection(db, 'societies', societyId, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      )
    );
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// 14. FIREBASE STORAGE (File Uploads)
// -------------------------------------------------------------

const storage = getStorage();

export async function uploadComplaintPhoto(
  societyId: string,
  complaintId: string,
  file: File
): Promise<string> {
  const path = `societies/${societyId}/complaints/${complaintId}/${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadNoticeAttachment(
  societyId: string,
  noticeId: string,
  file: File
): Promise<string> {
  const path = `societies/${societyId}/notices/${noticeId}/${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
