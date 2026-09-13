import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db, FirebaseUser } from './firebase';
import {
  UserProfile,
  Visitor,
  Complaint,
  MaintenanceBill,
  Facility,
  Notice,
  Election,
  Nomination,
  Vote,
  CommitteeMember,
} from '../types';
import {
  INITIAL_VISITORS,
  INITIAL_COMPLAINTS,
  INITIAL_BILLS,
  INITIAL_FACILITIES,
  INITIAL_NOTICES,
  INITIAL_ELECTIONS,
  INITIAL_NOMINATIONS,
  INITIAL_COMMITTEE_MEMBERS,
} from '../mock/initialData';

// Collection references
const USERS_COL = 'users';
const VISITORS_COL = 'visitors';
const COMPLAINTS_COL = 'complaints';
const BILLS_COL = 'bills';
const FACILITIES_COL = 'facilities';
const NOTICES_COL = 'notices';
const ELECTIONS_COL = 'elections';
const NOMINATIONS_COL = 'nominations';
const VOTES_COL = 'votes';

/**
 * Recursively strip undefined properties from an object so Firestore setDoc / updateDoc never rejects.
 * Uses JSON serialization + custom fallback to guarantee zero undefined properties.
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

  // Deep sanitization
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

  // Secondary guarantee: JSON parse/stringify drops any undefined keys that might have survived
  try {
    return JSON.parse(JSON.stringify(result));
  } catch {
    return result;
  }
}

/**
 * Fetch existing profile or create a skeleton profile when a user logs in.
 */
export async function syncUserProfile(
  firebaseUser: FirebaseUser,
  defaultRole: UserProfile['role'] = 'resident'
): Promise<UserProfile> {
  const userRef = doc(db, USERS_COL, firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    return sanitizeFirestoreData(data) as UserProfile;
  }

  // Pre-fill fields from Google or email auth without undefined fields
  // New users always enter as verified residents linking flat; admins promote to higher roles.
  const newProfile: Record<string, any> = {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Resident User'),
    role: 'resident',
    phone: firebaseUser.phoneNumber || '',
    type: 'Owner',
    isProfileComplete: false, // Triggers mandatory profile completion UI
    createdAt: new Date().toISOString(),
    flat: '',
    tower: 'Tower B',
  };

  if (firebaseUser.photoURL) {
    newProfile.avatar = firebaseUser.photoURL;
  }

  const cleanProfile = sanitizeFirestoreData(newProfile);
  await setDoc(userRef, cleanProfile);
  return cleanProfile as UserProfile;
}

/**
 * Update user profile in Firestore (marks profile as complete and removes undefined values)
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, USERS_COL, userId);
  const cleanData = sanitizeFirestoreData({ ...data, isProfileComplete: true });

  // Specifically ensure no undefined or unwanted gateNumber/badgeId for non-security roles
  if (cleanData.role !== 'security' || !cleanData.gateNumber) {
    delete cleanData.gateNumber;
  }
  if (cleanData.role !== 'security' || !cleanData.badgeId) {
    delete cleanData.badgeId;
  }

  await setDoc(userRef, cleanData, { merge: true });
}

/**
 * Update a user's role and designations (e.g. promoting someone to Society Admin)
 */
export async function updateUserRoleInFirestore(
  userId: string,
  role: UserProfile['role'],
  designation?: string
): Promise<void> {
  const userRef = doc(db, USERS_COL, userId);
  const payload: Record<string, any> = { role };
  if (designation) {
    payload.designation = designation;
  }
  const cleanPayload = sanitizeFirestoreData(payload);
  await setDoc(userRef, cleanPayload, { merge: true });
}

/**
 * Real-time listener for all registered users in the society
 */
export function subscribeUsers(callback: (users: UserProfile[]) => void) {
  const q = query(collection(db, USERS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as UserProfile);
      });
      callback(list);
    },
    (err) => console.warn('[Firestore] Users listener warning:', err)
  );
}

/**
 * Seed Firestore with initial realistic society data if collections are empty.
 */
export async function seedFirestoreInitialData(): Promise<void> {
  try {
    const electionSnap = await getDocs(collection(db, ELECTIONS_COL));
    if (!electionSnap.empty) {
      console.log('[Firestore] Database already populated.');
      return;
    }

    console.log('[Firestore] Seeding database with realistic society records...');
    const batch = writeBatch(db);

    // Seed elections
    for (const el of INITIAL_ELECTIONS) {
      batch.set(doc(db, ELECTIONS_COL, el.id), el);
    }

    // Seed nominations
    for (const nom of INITIAL_NOMINATIONS) {
      batch.set(doc(db, NOMINATIONS_COL, nom.id), nom);
    }

    // Seed visitors
    for (const vis of INITIAL_VISITORS) {
      batch.set(doc(db, VISITORS_COL, vis.id), vis);
    }

    // Seed complaints
    for (const comp of INITIAL_COMPLAINTS) {
      batch.set(doc(db, COMPLAINTS_COL, comp.id), comp);
    }

    // Seed bills
    for (const bill of INITIAL_BILLS) {
      batch.set(doc(db, BILLS_COL, bill.id), bill);
    }

    // Seed facilities
    for (const fac of INITIAL_FACILITIES) {
      batch.set(doc(db, FACILITIES_COL, fac.id), fac);
    }

    // Seed notices
    for (const notif of INITIAL_NOTICES) {
      batch.set(doc(db, NOTICES_COL, notif.id), notif);
    }

    await batch.commit();
    console.log('[Firestore] Seeding completed successfully.');
  } catch (error) {
    console.warn('[Firestore] Seeding skipped or encountered error:', error);
  }
}

// ----------------- VISITORS -----------------
export function subscribeVisitors(callback: (visitors: Visitor[]) => void) {
  const q = query(collection(db, VISITORS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Visitor[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Visitor);
      });
      callback(list);
    },
    (err) => console.warn('[Firestore] Visitors listener warning:', err)
  );
}

export async function createFirestoreVisitor(visitor: Visitor): Promise<void> {
  await setDoc(doc(db, VISITORS_COL, visitor.id), sanitizeFirestoreData(visitor));
}

export async function updateFirestoreVisitorStatus(
  visitorId: string,
  updates: Partial<Visitor>
): Promise<void> {
  await updateDoc(doc(db, VISITORS_COL, visitorId), sanitizeFirestoreData(updates));
}

// ----------------- COMPLAINTS -----------------
export function subscribeComplaints(callback: (complaints: Complaint[]) => void) {
  const q = query(collection(db, COMPLAINTS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Complaint[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Complaint);
      });
      callback(list);
    },
    (err) => console.warn('[Firestore] Complaints listener warning:', err)
  );
}

export async function createFirestoreComplaint(complaint: Complaint): Promise<void> {
  await setDoc(doc(db, COMPLAINTS_COL, complaint.id), sanitizeFirestoreData(complaint));
}

export async function updateFirestoreComplaint(
  complaintId: string,
  updates: Partial<Complaint>
): Promise<void> {
  await updateDoc(doc(db, COMPLAINTS_COL, complaintId), sanitizeFirestoreData(updates));
}

// ----------------- BILLS -----------------
export function subscribeBills(callback: (bills: MaintenanceBill[]) => void) {
  const q = query(collection(db, BILLS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: MaintenanceBill[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as MaintenanceBill);
      });
      callback(list);
    },
    (err) => console.warn('[Firestore] Bills listener warning:', err)
  );
}

export async function updateFirestoreBillPayment(
  billId: string,
  paymentMethod: string,
  receiptNumber: string,
  transactionId: string
): Promise<void> {
  await updateDoc(doc(db, BILLS_COL, billId), {
    status: 'Paid',
    paymentMethod,
    receiptNumber,
    transactionId,
    paidAt: new Date().toISOString(),
  });
}

// ----------------- ELECTIONS, NOMINATIONS & VOTING -----------------
export function subscribeElections(callback: (elections: Election[]) => void) {
  const q = query(collection(db, ELECTIONS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Election[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Election);
      });
      callback(list);
    },
    (err) => console.warn('[Firestore] Elections listener warning:', err)
  );
}

export async function createFirestoreElection(election: Election): Promise<void> {
  await setDoc(doc(db, ELECTIONS_COL, election.id), sanitizeFirestoreData(election));
}

export async function updateFirestoreElection(
  electionId: string,
  updates: Partial<Election>
): Promise<void> {
  await updateDoc(doc(db, ELECTIONS_COL, electionId), sanitizeFirestoreData(updates));
}

export function subscribeNominations(callback: (nominations: Nomination[]) => void) {
  const q = query(collection(db, NOMINATIONS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Nomination[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Nomination);
      });
      callback(list);
    },
    (err) => console.warn('[Firestore] Nominations listener warning:', err)
  );
}

export async function submitFirestoreNomination(nomination: Nomination): Promise<void> {
  await setDoc(doc(db, NOMINATIONS_COL, nomination.id), sanitizeFirestoreData(nomination));
}

export async function updateFirestoreNominationStatus(
  nominationId: string,
  status: Nomination['status']
): Promise<void> {
  await updateDoc(doc(db, NOMINATIONS_COL, nominationId), { status });
}

export function subscribeVotes(electionId: string, callback: (votes: Vote[]) => void) {
  const q = query(collection(db, VOTES_COL), where('electionId', '==', electionId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Vote[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Vote);
      });
      callback(list);
    },
    (err) => console.warn('[Firestore] Votes listener warning:', err)
  );
}

export async function castFirestoreVote(vote: Vote): Promise<void> {
  const batch = writeBatch(db);
  // 1. Record vote document
  batch.set(doc(db, VOTES_COL, vote.id), sanitizeFirestoreData(vote));

  // 2. Increment candidate vote count
  const nomRef = doc(db, NOMINATIONS_COL, vote.candidateId);
  batch.update(nomRef, { voteCount: increment(1) });

  // 3. Increment election total votes cast
  const elecRef = doc(db, ELECTIONS_COL, vote.electionId);
  batch.update(elecRef, { totalVotesCast: increment(1) });

  await batch.commit();
}

// ----------------- NOTICES -----------------
export function subscribeNotices(callback: (notices: Notice[]) => void) {
  const q = query(collection(db, NOTICES_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Notice[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Notice);
      });
      callback(list);
    },
    (err) => console.warn('[Firestore] Notices listener warning:', err)
  );
}

export async function createFirestoreNotice(notice: Notice): Promise<void> {
  await setDoc(doc(db, NOTICES_COL, notice.id), sanitizeFirestoreData(notice));
}
