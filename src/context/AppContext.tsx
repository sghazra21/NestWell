import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { doc, updateDoc } from 'firebase/firestore';
import {
  UserRole,
  UserProfile,
  ResidentProfile,
  Visitor,
  Complaint,
  MaintenanceBill,
  BillLineItem,
  Facility,
  FacilityBooking,
  Notice,
  ActivityEvent,
  SocietyInfo,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  Election,
  Nomination,
  Vote,
  CommitteeMember,
  ElectionPosition,
  Society,
  Tower,
  Flat,
  SocietyMember,
  Vehicle,
  PlatformUser,
  PlatformAnalytics,
  SupportSession,
  AuditLog,
  PaymentRecord,
  AppNotification,
  ExpenseRecord,
  ExpenseCategory,
  TreasuryTransaction,
} from '../types';
import {
  auth,
  db,
  onAuthStateChanged,
  firebaseSignOut,
  FirebaseUser,
} from '../lib/firebase';
import {
  syncPlatformUser,
  subscribePlatformUser,
  subscribeSocieties,
  subscribeSociety,
  createSocietyRecord,
  updateSocietyStatus as updateSocietyStatusInDb,
  updateSocietySettings as updateSocietySettingsInDb,
  deleteSocietyRecord,
  subscribeTowers,
  createTowerRecord,
  subscribeFlats,
  createFlatRecord,
  createFacilityRecord,
  updateFacilityRecord,
  archiveFacilityRecord,
  updateFlatRecord,
  subscribeMembers,
  createOrUpdateMemberRecord,
  updateMemberRole as updateMemberRoleInDb,
  updateMemberStatus as updateMemberStatusInDb,
  createSocietyInvite,
  subscribeVisitors,
  createVisitorRecord,
  updateVisitorStatusRecord,
  subscribeComplaints,
  createComplaintRecord,
  updateComplaintStatusRecord,
  updateComplaintNotes as updateComplaintNotesInDb,
  updateMemberRecord as updateMemberRecordInDb,
  subscribeBills,
  createBillRecord,
  processServerConfirmedPayment,
  subscribeFacilities,
  subscribeFacilityBookings,
  createFacilityBookingRecord,
  subscribeNotices,
  createNoticeRecord,
  subscribeElections,
  createElectionRecord,
  updateElectionRecord,
  subscribeNominations,
  submitNominationRecord,
  updateNominationRecord,
  subscribeVotes,
  castVoteRecord,
  subscribeAuditLogs,
  recordAuditLog,
  subscribePlatformAnalytics,
  subscribeSupportSessions,
  createSupportSessionRecord,
  endSupportSessionRecord,
  sanitizeFirestoreData,
  createPaymentRecord,
  updatePaymentRecord,
  subscribePayments,
  createNotificationRecord,
  subscribeNotifications,
  markNotificationRead as markNotificationReadInDb,
  markAllNotificationsRead as markAllNotificationsReadInDb,
  createTreasuryTransaction as createTreasuryTx,
  subscribeTreasuryTransactions,
  createExpenseRecord as createExpenseRecordInDb,
  cancelExpenseRecord as cancelExpenseRecordInDb,
  subscribeExpenseRecords,
} from '../lib/firestoreService';

interface AppContextType {
  // Multi-Tenant state & controls
  currentSocietyId: string;
  setCurrentSocietyId: (id: string) => void;
  currentSociety: Society | null;
  societies: Society[];
  platformUser: PlatformUser | null;
  isPlatformAdmin: boolean;
  activeView: 'app' | 'platform_admin';
  setActiveView: (view: 'app' | 'platform_admin') => void;
  towers: Tower[];
  flats: Flat[];
  members: SocietyMember[];
  currentMembership: SocietyMember | null;
  createSociety: (data: Partial<Society> & { name: string; city: string }) => Promise<Society>;
  updateSocietyStatus: (societyId: string, status: Society['status']) => Promise<void>;
  updateSocietySettings: (settings: Record<string, unknown>) => Promise<void>;
  deleteSociety: (societyId: string) => Promise<number>;
  createTower: (data: Omit<Tower, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>) => Promise<Tower>;
  createFlat: (data: Omit<Flat, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>) => Promise<Flat>;
  createFacility: (data: Omit<Facility, 'id' | 'societyId'>) => Promise<Facility>;
  updateFacility: (facilityId: string, data: Partial<Facility>) => Promise<void>;
  archiveFacility: (facilityId: string) => Promise<void>;
  updateFlat: (flatId: string, data: Partial<Flat>) => Promise<void>;
  startSupportSession: (societyId: string, reason: string) => Promise<void>;
  endSupportSession: () => Promise<void>;
  activeSupportSession: SupportSession | null;
  supportSessions: SupportSession[];
  platformAnalytics: PlatformAnalytics[];
  auditLogs: AuditLog[];

  // User & Auth State
  role: UserRole;
  setRole: (role: UserRole) => void;
  viewMode: 'admin' | 'resident';
  setViewMode: (mode: 'admin' | 'resident') => void;
  canAccessAdminView: boolean;
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isProfileCompletionOpen: boolean;
  setIsProfileCompletionOpen: (open: boolean) => void;
  isElectionModalOpen: boolean;
  setIsElectionModalOpen: (open: boolean) => void;
  isPaymentsResearchOpen: boolean;
  setIsPaymentsResearchOpen: (open: boolean) => void;
  promoteToSocietyAdmin: (targetIdentifier: string, newRole: UserRole, designation?: string) => Promise<void>;
  setMemberStatus: (uid: string, status: 'active' | 'suspended' | 'removed') => Promise<void>;
  inviteMember: (email: string, intendedRole: 'resident' | 'security' | 'committee' | 'society_admin', flatId?: string) => Promise<string>;
  registeredUsers: UserProfile[];
  completeUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;

  // Backwards-Compatible Entity State & Handlers
  society: SocietyInfo | null;
  resident: ResidentProfile;
  setResident: React.Dispatch<React.SetStateAction<ResidentProfile>>;
  residents: ResidentProfile[];
  addResident: (resident: Partial<ResidentProfile>) => void;
  visitors: Visitor[];
  inviteVisitor: (data: {
    name: string;
    phone: string;
    purpose: string;
    expectedDate: string;
    expectedTime: string;
    type?: Visitor['type'];
    company?: string;
  }) => Visitor;
  updateVisitorStatus: (id: string, status: Visitor['status']) => void;
  securityCheckIn: (visitorId: string) => void;
  securityCheckOut: (visitorId: string) => void;
  approveVisitor: (id: string) => void;
  rejectVisitor: (id: string) => void;
  cancelVisitorPass: (id: string) => void;
  complaints: Complaint[];
  submitComplaint: (data: {
    category: ComplaintCategory;
    title: string;
    description: string;
    priority?: ComplaintPriority;
    photoUrl?: string;
  }) => Complaint;
  updateComplaintStatus: (id: string, status: ComplaintStatus) => void;
  assignComplaint: (id: string, name: string, role: string, phone: string) => void;
  addComplaintComment: (id: string, text: string) => void;
  updateComplaintNotes: (id: string, data: { resolutionNotes?: string; internalNotes?: string }) => void;
  updateResident: (uid: string, data: { name?: string; phone?: string; type?: 'Owner' | 'Tenant' }) => Promise<void>;
  deactivateResident: (uid: string) => Promise<void>;
  reassignResidentFlat: (uid: string, newFlatId: string, newFlatNumber: string, newTowerName: string) => Promise<void>;
  bills: MaintenanceBill[];
  createBill: (
    flatId: string,
    flatNumber: string,
    towerName: string,
    residentName: string,
    month: string,
    year: number,
    amount: number,
    dueDate: string,
    lineItems?: MaintenanceBill['lineItems']
  ) => Promise<string>;
  generateBulkBills: (
    billingPeriod: string,
    month: string,
    year: number,
    dueDate: string,
    lineItems: BillLineItem[],
    scope: { towers?: string[]; occupantFilter?: 'all' | 'owner' | 'tenant' }
  ) => Promise<{ created: number; skipped: number; failed: number }>;
  payMaintenanceBill: (billId: string, paymentMethod: string) => { receiptNumber: string; transactionId: string };
  markBillPaidManually: (billId: string, method: string) => Promise<void>;
  payments: PaymentRecord[];
  submitPaymentClaim: (billId: string, amount: number, utr: string, notes?: string) => Promise<string>;
  verifyPayment: (paymentId: string) => Promise<void>;
  rejectPayment: (paymentId: string, reason: string) => Promise<void>;
  facilities: Facility[];
  facilityBookings: FacilityBooking[];
  bookFacilitySlot: (facilityId: string, slotTime: string, date: string) => boolean;
  notices: Notice[];
  createNotice: (data: {
    title: string;
    message: string;
    audience: Notice['audience'];
    targetBlock?: string;
    priority?: Notice['priority'];
    attachmentName?: string;
  }) => Notice;
  activities: ActivityEvent[];

  // Elections, Nominations & Governance
  elections: Election[];
  nominations: Nomination[];
  votes: Vote[];
  committeeMembers: CommitteeMember[];
  castVote: (data: {
    electionId: string;
    position: ElectionPosition;
    candidateId: string;
    voterId: string;
    voterFlat: string;
  }) => Promise<void>;
  submitNomination: (
    data: Omit<Nomination, 'id' | 'status' | 'voteCount' | 'nominatedAt'>
  ) => Promise<void>;
  updateNominationStatus: (electionId: string, nominationId: string, status: Nomination['status']) => Promise<void>;
  createElection: (
    data: Omit<Election, 'id' | 'totalVotesCast' | 'createdAt'>
  ) => Promise<void>;
  updateElectionStatus: (id: string, status: Election['status']) => Promise<void>;

  // Gate simulation states
  gateAlert: {
    active: boolean;
    visitor?: Visitor;
    message?: string;
  };
  dismissGateAlert: () => void;
  previewMode: 'auto' | 'mobile_frame';
  setPreviewMode: (mode: 'auto' | 'mobile_frame') => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;

  // Treasury
  treasuryTransactions: TreasuryTransaction[];
  cashInHand: number;
  createTreasuryTransaction: (tx: Omit<TreasuryTransaction, 'id'>) => Promise<TreasuryTransaction>;

  // Expenses
  expenses: ExpenseRecord[];
  totalExpensesThisMonth: number;
  createExpense: (
    data: Omit<ExpenseRecord, 'id' | 'societyId' | 'status' | 'createdBy' | 'createdAt'>
  ) => Promise<ExpenseRecord>;
  cancelExpense: (expenseId: string, reason: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Multi-Tenant Context State
  // No default society: empty string means "no tenant selected".
  // A society exists only if a real Platform Admin creates it.
  const [currentSocietyId, setCurrentSocietyIdState] = useState<string>(() => {
    return localStorage.getItem('nestwell_current_society_id') || '';
  });
  const [currentSociety, setCurrentSociety] = useState<Society | null>(null);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [members, setMembers] = useState<SocietyMember[]>([]);
  const [currentMembership, setCurrentMembership] = useState<SocietyMember | null>(null);
  const [supportSessions, setSupportSessions] = useState<SupportSession[]>([]);
  const [activeSupportSession, setActiveSupportSession] = useState<SupportSession | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Auth & Global User state
  // userProfile and role are resolved from Firebase Auth + society membership.
  // localStorage is never trusted for authentication or authorization.
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRoleState] = useState<UserRole>('resident');
  const [activeView, setActiveView] = useState<'app' | 'platform_admin'>('app');

  // Modals & Navigation
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileCompletionOpen, setIsProfileCompletionOpen] = useState(false);
  const [isElectionModalOpen, setIsElectionModalOpen] = useState(false);
  const [isPaymentsResearchOpen, setIsPaymentsResearchOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'auto' | 'mobile_frame'>('auto');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tenant Collections (Loaded 100% from live Firestore)
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityBookings, setFacilityBookings] = useState<FacilityBooking[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [treasuryTransactions, setTreasuryTransactions] = useState<TreasuryTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // Resident profile for the current user, populated from society membership.
  // Empty until the user's membership and flat assignment resolve.
  const [resident, setResident] = useState<ResidentProfile>({
    id: '',
    name: '',
    flat: '',
    tower: '',
    phone: '',
    email: '',
    type: 'Owner',
    status: 'Pending Verification',
    familyMembers: [],
    vehicles: [],
    dues: 0,
  });

  // Dynamic gate alert state
  const [gateAlert, setGateAlert] = useState<{
    active: boolean;
    visitor?: Visitor;
    message?: string;
  }>({
    active: false,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Platform admin is resolved ONLY from the platformUsers document.
  // Never from email allowlists, localStorage, or client-side flags.
  const isPlatformAdmin = platformUser?.platformRole === 'platform_admin';

  const [viewMode, setViewModeState] = useState<'admin' | 'resident'>('admin');

  const canAccessAdminView = Boolean(
    role === 'admin' ||
    role === 'committee' ||
    isPlatformAdmin ||
    currentMembership?.role === 'society_admin' ||
    currentMembership?.role === 'committee'
  );

  const setViewMode = (mode: 'admin' | 'resident') => {
    setViewModeState(mode);
    showToast(
      mode === 'admin'
        ? 'Switched to Society Admin Console'
        : 'Switched to Resident Portal (Viewing as Resident)'
    );
  };

  const setCurrentSocietyId = (newId: string) => {
    setCurrentSocietyIdState(newId);
    localStorage.setItem('nestwell_current_society_id', newId);
    showToast(`Active society context switched to ${newId}`);
  };

  const setRole = (newRole: UserRole) => {
    if (newRole === 'admin' && !isPlatformAdmin && currentMembership?.role !== 'society_admin') {
      showToast('Administrative privileges required. Contact Society Admin.');
      return;
    }
    setRoleState(newRole);
    showToast(`Switched interface to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)} view`);
  };

  // -------------------------------------------------------------
  // 1. INITIAL MOUNT & AUTH (no seeding, no mock data)
  // -------------------------------------------------------------
  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const pUser = await syncPlatformUser(fbUser);
          setPlatformUser(pUser);

          // Build profile from auth identity only.
          // Role is resolved from society membership, not assigned here.
          const profile: UserProfile = {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Resident User',
            role: 'resident',
            phone: fbUser.phoneNumber || '',
            avatar: fbUser.photoURL || '',
            flat: '',
            tower: '',
            type: 'Owner',
            isProfileComplete: false,
            createdAt: new Date().toISOString(),
          };
          setUserProfile(profile);
        } catch (e) {
          console.warn('Auth sync notice:', e);
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // -------------------------------------------------------------
  // 1b. PLATFORM SUBSCRIPTIONS (signed-in users only)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setSocieties([]);
      setPlatformAnalytics([]);
      setSupportSessions([]);
      return;
    }

    // Societies directory (rules filter to visible statuses for non-admins).
    // No auto-select: the user picks a society explicitly via SocietyPicker.
    const unsubSocieties = subscribeSocieties((socList) => {
      setSocieties(socList);
    });

    const unsubPlatformAnalytics = subscribePlatformAnalytics((aList) => {
      setPlatformAnalytics(aList);
    });

    const unsubSupportSessions = subscribeSupportSessions((sList) => {
      setSupportSessions(sList);
    });

    return () => {
      unsubSocieties();
      unsubPlatformAnalytics();
      unsubSupportSessions();
    };
  }, [user?.uid]);

  // -------------------------------------------------------------
  // 2. TENANT-ISOLATED REAL-TIME SUBSCRIPTIONS
  // Use refs for values that change frequently but shouldn't
  // re-subscribe all Firestore listeners.
  // -------------------------------------------------------------
  const residentFlatRef = useRef(resident.flat);
  residentFlatRef.current = resident.flat;
  const residentFlatIdRef = useRef(resident.flatId || '');
  residentFlatIdRef.current = resident.flatId || '';
  const roleRef = useRef(role);
  roleRef.current = role;

  useEffect(() => {
    if (!currentSocietyId) return;

    // Single society metadata
    const unsubSoc = subscribeSociety(currentSocietyId, (s) => setCurrentSociety(s));

    // Towers & Flats
    const unsubTowers = subscribeTowers(currentSocietyId, (tList) => setTowers(tList));
    const unsubFlats = subscribeFlats(currentSocietyId, (fList) => setFlats(fList));

    // Society Members
    const unsubMembers = subscribeMembers(currentSocietyId, (mList) => {
      setMembers(mList);
      if (user?.uid) {
        const found = mList.find((m) => m.uid === user.uid);
        if (found) setCurrentMembership(found);
      }
    });
    // Visitors
    const unsubVisitors = subscribeVisitors(currentSocietyId, (vList) => {
      setVisitors(vList);
      const waitingVisitor = vList.find(
        (v) => v.status === 'waiting' && (v.flat === residentFlatRef.current || roleRef.current === 'admin')
      );
      if (waitingVisitor) {
        setGateAlert({
          active: true,
          visitor: waitingVisitor,
          message: `${waitingVisitor.name} is waiting at ${waitingVisitor.gateNumber || 'Gate 1'}.`,
        });
      }
    });

    // Complaints
    const unsubComplaints = subscribeComplaints(currentSocietyId, (cList) => setComplaints(cList));

    // Bills
    const unsubBills = subscribeBills(currentSocietyId, (bList) => {
      setBills(bList);
      const myDue = bList.find((b) => {
        const matchByFlatId = residentFlatIdRef.current && b.flatId
          ? b.flatId === residentFlatIdRef.current
          : b.flat?.trim().toUpperCase() === residentFlatRef.current?.trim().toUpperCase();
        return matchByFlatId && b.status !== 'Paid';
      });
      if (myDue) {
        setResident((prev) => ({ ...prev, dues: myDue.totalAmount }));
      } else if (bList.length > 0) {
        setResident((prev) => ({ ...prev, dues: 0 }));
      }
    });

    // Facilities & Bookings
    const unsubFacilities = subscribeFacilities(currentSocietyId, (facList) => setFacilities(facList));
    const unsubBookings = subscribeFacilityBookings(currentSocietyId, (bkList) => setFacilityBookings(bkList));

    // Notices
    const unsubNotices = subscribeNotices(currentSocietyId, (nList) => setNotices(nList));

    // Elections & Ballots — track nested subscriptions to avoid leaks
    let unsubNoms: (() => void) | null = null;
    let unsubVts: (() => void) | null = null;
    const unsubElections = subscribeElections(currentSocietyId, (eList) => {
      setElections(eList);
      // Clean up previous nested subscriptions
      unsubNoms?.();
      unsubVts?.();
      if (eList.length > 0) {
        const primaryElection = eList[0];
        unsubNoms = subscribeNominations(currentSocietyId, primaryElection.id, (nomList) => setNominations(nomList));
        unsubVts = subscribeVotes(currentSocietyId, primaryElection.id, (vtList) => setVotes(vtList));
      } else {
        setNominations([]);
        setVotes([]);
      }
    });

    // Payments (UPI / UTR verification)
    const unsubPayments = subscribePayments(currentSocietyId, (pList) => setPayments(pList));

    // Notifications
    const unsubNotifications = user?.uid
      ? subscribeNotifications(currentSocietyId, user.uid, (nList) => setNotifications(nList))
      : () => {};

    // Audit logs
    const unsubAudit = subscribeAuditLogs(currentSocietyId, (logs) => setAuditLogs(logs));

    // Treasury
    const unsubTreasury = subscribeTreasuryTransactions(currentSocietyId, (txList) => setTreasuryTransactions(txList));

    // Expenses
    const unsubExpenses = subscribeExpenseRecords(currentSocietyId, (expList) => setExpenses(expList));

    return () => {
      unsubSoc();
      unsubTowers();
      unsubFlats();
      unsubMembers();
      unsubVisitors();
      unsubComplaints();
      unsubBills();
      unsubFacilities();
      unsubBookings();
      unsubNotices();
      unsubElections();
      unsubNoms?.();
      unsubVts?.();
      unsubPayments();
      unsubNotifications();
      unsubAudit();
      unsubTreasury();
      unsubExpenses();
    };
  }, [currentSocietyId, user?.uid]);

  // -------------------------------------------------------------
  // 2c. BACKFILL: Add flatId to existing bills missing it
  // -------------------------------------------------------------
  useEffect(() => {
    if (bills.length > 0 && flats.length > 0 && currentSocietyId) {
      const billsNeedingFlatId = bills.filter(b => !b.flatId && b.flat);
      for (const bill of billsNeedingFlatId) {
        const matchingFlat = flats.find(f => f.number?.trim().toUpperCase() === bill.flat?.trim().toUpperCase());
        if (matchingFlat) {
          updateDoc(doc(db, 'societies', currentSocietyId, 'bills', bill.id), { flatId: matchingFlat.id }).catch(() => {});
        }
      }
    }
  }, [bills, flats, currentSocietyId]);

  // -------------------------------------------------------------
  // 2b. ROLE DERIVATION (membership is authoritative)
  // Role is derived from the user's membership in the current society.
  // It is never set manually, never read from localStorage.
  // -------------------------------------------------------------
  useEffect(() => {
    if (currentMembership) {
      const mapped: UserRole =
        currentMembership.role === 'society_admin'
          ? 'admin'
          : (currentMembership.role as UserRole);
      setRoleState((prev) => (prev === mapped ? prev : mapped));
      setUserProfile((prev) =>
        prev && prev.role === mapped
          ? prev
          : prev
            ? { ...prev, role: mapped }
            : prev
      );
      // Backfill Google photo onto older member records that lack one.
      if (!currentMembership.avatar && user?.photoURL && user?.uid) {
        createOrUpdateMemberRecord(currentSocietyId, {
          uid: user.uid,
          email: currentMembership.email,
          name: currentMembership.name,
          avatar: user.photoURL,
        }).catch(() => {});
      }
    }
  }, [currentMembership, user?.uid, user?.photoURL]);

  // Synchronize resident profile for the authenticated user (including admins viewing as residents)
  useEffect(() => {
    if (currentMembership) {
      setResident((prev) => ({
        ...prev,
        id: currentMembership.uid || user?.uid || prev.id,
        name: currentMembership.name || user?.displayName || userProfile?.name || prev.name || 'Resident',
        email: currentMembership.email || user?.email || prev.email,
        phone: currentMembership.phone || user?.phoneNumber || prev.phone,
        flat: currentMembership.flatNumber || prev.flat || (flats.length > 0 ? flats[0].number : 'A-101'),
        flatId: currentMembership.flatId || prev.flatId,
        tower: currentMembership.towerName || prev.tower || (towers.length > 0 ? towers[0].name : 'Tower A'),
        type: currentMembership.type || prev.type || 'Owner',
        status: 'Active',
        familyMembers: currentMembership.familyMembers || prev.familyMembers || [],
        vehicles: currentMembership.vehicles || prev.vehicles || [],
        dues: prev.dues,
        avatar: currentMembership.avatar || user?.photoURL || prev.avatar,
      }));
    } else if (user && (!resident.name || !resident.flat)) {
      setResident((prev) => ({
        ...prev,
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Resident',
        email: user.email || '',
        phone: user.phoneNumber || '',
        flat: prev.flat || (flats.length > 0 ? flats[0].number : 'A-101'),
        tower: prev.tower || (towers.length > 0 ? towers[0].name : 'Tower A'),
        status: 'Active',
        avatar: user.photoURL || prev.avatar,
      }));
    }
  }, [currentMembership, user, userProfile?.name, flats, towers]);

  // Derive registered users for AdminPeople table
  const registeredUsers: UserProfile[] = members.map((m) => ({
    id: m.uid,
    email: m.email,
    name: m.name,
    role: m.role === 'society_admin' ? 'admin' : (m.role as UserRole),
    phone: m.phone,
    flat: m.flatNumber,
    tower: m.towerName,
    type: m.type || 'Owner',
    isProfileComplete: m.profileComplete,
    designation: m.designation,
    createdAt: m.createdAt,
  }));

  // Derive SocietyInfo for UI header from the real society document.
  // Null when no society is selected: the UI must render an empty state.
  const society: SocietyInfo | null = currentSociety
    ? {
        name: currentSociety.name,
        subTitle: currentSociety.legalName,
        city: currentSociety.city,
        registeredNumber: currentSociety.registeredNumber || '',
        totalFlats: currentSociety.totalFlats ?? flats.length,
        totalResidents: currentSociety.totalResidents ?? members.length,
        towers: towers.map((t) => t.name),
      }
    : null;

  // Derive CommitteeMembers from real membership records only.
  const committeeMembers: CommitteeMember[] = members
    .filter((m) => m.role === 'committee' || m.role === 'society_admin')
    .map((m) => ({
      id: m.id,
      name: m.name,
      position: (m.designation as ElectionPosition) || 'President',
      flat: m.flatNumber || '',
      tower: m.towerName || '',
      phone: m.phone || '',
      email: m.email,
      term: '',
      responsibilities: [],
    }));

  // Derive residents list from real flats and member records.
  const residents: ResidentProfile[] = flats.map((f) => {
    const occupant = members.find(
      (m) =>
        (m.flatId && m.flatId === f.id) ||
        (m.flatNumber &&
          m.flatNumber.toUpperCase() === f.number.toUpperCase() &&
          (!m.towerName || !f.towerName || m.towerName === f.towerName)) ||
        (f.primaryResidentName && m.name === f.primaryResidentName)
    );
    const memberVehicles = occupant?.vehicles || [];
    const flatVehicles = (f.vehicles || []).map((v) => ({
      number: v.number,
      type: v.type as Vehicle['type'],
      ownerName: occupant?.name || f.primaryResidentName || '',
      slot: v.slot,
    }));
    const seen = new Set(flatVehicles.map((v) => v.number.toUpperCase()));
    const vehicles = [
      ...flatVehicles,
      ...memberVehicles
        .filter((v) => !seen.has((v.number || '').toUpperCase()))
        .map((v) => ({ number: v.number || '', type: v.type, ownerName: v.ownerName || occupant?.name || '', slot: v.slot || '' })),
    ];
    return {
      id: f.id,
      name: occupant?.name || f.primaryResidentName || f.ownerNames?.[0] || '',
      flat: f.number,
      tower: f.towerName || '',
      phone: occupant?.phone || f.primaryResidentPhone || '',
      email: occupant?.email || '',
      type: occupant?.type || 'Owner',
      status: occupant || f.status === 'active' ? 'Active' : 'Pending Verification',
      familyMembers: occupant?.familyMembers || [],
      vehicles,
      dues: f.dues || 0,
    };
  });

  // Derive live Activity feed
  const activities: ActivityEvent[] = [
    ...visitors.slice(0, 5).map((v) => ({
      id: `act-vis-${v.id}`,
      time: v.entryTime || 'Recent',
      title: `Visitor: ${v.name} (${v.type})`,
      flat: v.flat,
      type: 'visitor' as const,
      icon: 'UserCheck',
    })),
    ...complaints.slice(0, 4).map((c) => ({
      id: `act-comp-${c.id}`,
      time: 'Recent',
      title: `Complaint: ${c.title} (${c.category})`,
      flat: c.flat,
      type: 'complaint' as const,
      icon: 'Wrench',
    })),
    ...notices.slice(0, 3).map((n) => ({
      id: `act-not-${n.id}`,
      time: n.date || 'Today',
      title: `Notice: ${n.title}`,
      flat: 'Society Broadcast',
      type: 'notice' as const,
      icon: 'Megaphone',
    })),
  ];

  // -------------------------------------------------------------
  // 3. MUTATION ACTIONS & SERVICES (Direct to Cloud Firestore)
  // -------------------------------------------------------------

  const createSociety = async (data: Partial<Society> & { name: string; city: string }) => {
    const soc = await createSocietyRecord(data);
    await recordAuditLog(soc.id, {
      actorId: user?.uid || 'platform-admin',
      actorName: userProfile?.name || 'Platform Super Admin',
      actorRole: 'platform_admin',
      action: 'PROVISION_SOCIETY',
      targetType: 'Society',
      targetId: soc.id,
      reason: `Provisioned tenant ${soc.name}`,
    });
    return soc;
  };

  const updateSocietyStatus = async (socId: string, status: Society['status']) => {
    await updateSocietyStatusInDb(socId, status);
    await recordAuditLog(socId, {
      actorId: user?.uid || 'platform-admin',
      actorName: userProfile?.name || 'Platform Super Admin',
      actorRole: 'platform_admin',
      action: 'UPDATE_SOCIETY_STATUS',
      targetType: 'Society',
      targetId: socId,
      reason: `Status changed to ${status}`,
    });
    showToast(`Society status updated to ${status}`);
  };

  const updateSocietySettings = async (settings: Record<string, unknown>) => {
    if (!currentSocietyId) {
      showToast('No society selected.');
      return;
    }
    await updateSocietySettingsInDb(currentSocietyId, settings);
    await recordAuditLog(currentSocietyId, {
      actorId: user?.uid || 'admin',
      actorName: userProfile?.name || 'Admin',
      actorRole: role,
      action: 'UPDATE_SOCIETY_SETTINGS',
      targetType: 'Society',
      targetId: currentSocietyId,
      reason: 'Society settings updated',
    });
    showToast('Society settings saved to Firestore.');
  };

  const deleteSociety = async (socId: string): Promise<number> => {
    const soc = societies.find((s) => s.id === socId);
    const { deleted } = await deleteSocietyRecord(socId);
    if (currentSocietyId === socId) {
      setCurrentSocietyIdState('');
      localStorage.removeItem('nestwell_current_society_id');
    }
    showToast(`“${soc?.name || socId}” deleted (${deleted} documents removed).`);
    return deleted;
  };

  const createTower = async (data: Omit<Tower, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>) => {
    return createTowerRecord(currentSocietyId, data);
  };

  const createFlat = async (data: Omit<Flat, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>) => {
    return createFlatRecord(currentSocietyId, data);
  };

  const createFacility = async (data: Omit<Facility, 'id' | 'societyId'>) => {
    return createFacilityRecord(currentSocietyId, data);
  };

  const updateFacility = async (facilityId: string, data: Partial<Facility>) => {
    await updateFacilityRecord(currentSocietyId, facilityId, data);
    showToast('Facility updated.');
  };

  const archiveFacility = async (facilityId: string) => {
    await archiveFacilityRecord(currentSocietyId, facilityId);
    showToast('Facility archived.');
  };

  const updateFlat = async (flatId: string, data: Partial<Flat>) => {
    await updateFlatRecord(currentSocietyId, flatId, data);
  };

  const startSupportSession = async (socId: string, reason: string) => {
    if (!user?.uid || !user?.email) return;
    const session = await createSupportSessionRecord({
      platformAdminId: user.uid,
      platformAdminEmail: user.email,
      societyId: socId,
      societyName: societies.find((s) => s.id === socId)?.name || socId,
      reason,
      expiresAt: new Date(Date.now() + 3600 * 1000 * 2).toISOString(),
    });

    await recordAuditLog(socId, {
      actorId: user?.uid || 'platform-admin',
      actorName: userProfile?.name || 'Platform Super Admin',
      actorRole: 'platform_admin',
      action: 'START_SUPPORT_SESSION',
      targetType: 'SupportSession',
      targetId: socId,
      reason,
    });

    setActiveSupportSession(session);
  };

  const endSupportSession = async () => {
    if (!activeSupportSession) return;
    try {
      await endSupportSessionRecord(activeSupportSession.id);
      await recordAuditLog(activeSupportSession.societyId, {
        actorId: user?.uid || 'platform-admin',
        actorName: userProfile?.name || 'Platform Super Admin',
        actorRole: 'platform_admin',
        action: 'END_SUPPORT_SESSION',
        targetType: 'SupportSession',
        targetId: activeSupportSession.societyId,
        reason: `Support session ended for ${activeSupportSession.societyName}`,
      });
      setActiveSupportSession(null);
      setCurrentSocietyIdState('');
      localStorage.removeItem('nestwell_current_society_id');
      setActiveView('platform_admin');
      showToast('Support session ended. Returned to Platform Console.');
    } catch (err) {
      console.error(err);
      showToast('Failed to end support session.');
    }
  };

  // Promote a member or resident
  const promoteToSocietyAdmin = async (
    targetIdentifier: string,
    newRole: UserRole = 'admin',
    designation: string = 'Society Admin & Executive Officer'
  ) => {
    const socRole = newRole === 'admin' ? 'society_admin' : (newRole as any);
    await updateMemberRoleInDb(currentSocietyId, targetIdentifier, socRole, designation);

    await recordAuditLog(currentSocietyId, {
      actorId: user?.uid || 'admin',
      actorName: userProfile?.name || 'Admin',
      actorRole: role,
      action: 'PROMOTE_MEMBER_ROLE',
      targetType: 'SocietyMember',
      targetId: targetIdentifier,
      reason: `Promoted to ${newRole} (${designation})`,
    });

    showToast(`Role updated to ${newRole.toUpperCase()} in Cloud Firestore.`);
  };

  // Approve / suspend / remove a membership (join-request review)
  const setMemberStatus = async (uid: string, status: 'active' | 'suspended' | 'removed') => {
    await updateMemberStatusInDb(currentSocietyId, uid, status);
    await recordAuditLog(currentSocietyId, {
      actorId: user?.uid || 'admin',
      actorName: userProfile?.name || 'Admin',
      actorRole: role,
      action: status === 'active' ? 'APPROVE_MEMBERSHIP' : 'UPDATE_MEMBERSHIP_STATUS',
      targetType: 'SocietyMember',
      targetId: uid,
      reason: `Membership status set to ${status}`,
    });
    showToast(`Membership ${status === 'active' ? 'approved' : `marked ${status}`}.`);
  };

  // Invite a member by email; returns the invitation code to share
  const inviteMember = async (
    email: string,
    intendedRole: 'resident' | 'security' | 'committee' | 'society_admin',
    flatId?: string
  ): Promise<string> => {
    const invite = await createSocietyInvite(currentSocietyId, {
      email,
      intendedRole,
      flatId,
      createdBy: user?.uid || 'admin',
    });
    return invite.id;
  };

  // Complete User Profile
  const completeUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.uid) return;
    const cleanUpdates = sanitizeFirestoreData(updates);
    const updated = {
      ...(userProfile || {}),
      ...cleanUpdates,
      isProfileComplete: true,
    } as UserProfile;

    setUserProfile(updated);

    // Resolve the selected flat so the membership links to a real flat record.
    const flatNo = (updated.flat || '').trim().toUpperCase();
    const towerName = (updated.tower || '').trim();
    const flatMatch = flats.find(
      (f) =>
        f.number.toUpperCase() === flatNo &&
        (!towerName || f.towerName === towerName || f.towerId === towerName)
    );

    await createOrUpdateMemberRecord(currentSocietyId, {
      uid: user.uid,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      flatId: flatMatch?.id || '',
      flatNumber: updated.flat,
      towerName: updated.tower,
      type: updated.type,
      profileComplete: true,
      familyMembers: updated.familyMembers || [],
      vehicles: updated.vehicles || [],
    });

    // Mark the flat occupied and record ownership/tenancy.
    if (flatMatch) {
      const isOwner = (updated.type || 'Owner') === 'Owner';
      const existing = isOwner ? flatMatch.ownerIds || [] : flatMatch.tenantIds || [];
      const ids = existing.includes(user.uid) ? existing : [...existing, user.uid];
      await updateFlatRecord(currentSocietyId, flatMatch.id, {
        status: 'active',
        ...(isOwner ? { ownerIds: ids } : { tenantIds: ids }),
        primaryResidentName: updated.name,
        primaryResidentPhone: updated.phone,
      });
    }

    setIsProfileCompletionOpen(false);
    showToast('Profile completed and saved to Firestore.');
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setUser(null);
    setUserProfile(null);
    setPlatformUser(null);
    setCurrentMembership(null);
    setRoleState('resident');
    localStorage.removeItem('nestwell_current_society_id');
    setCurrentSocietyIdState('');
    showToast('Logged out of society account.');
  };

  // Notification Operations
  const markNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    markNotificationReadInDb(currentSocietyId, notificationId).catch((err) =>
      console.warn('Firestore notification read error:', err)
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (user?.uid) {
      markAllNotificationsReadInDb(currentSocietyId, user.uid).catch((err) =>
        console.warn('Firestore mark all read error:', err)
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const cashInHand = treasuryTransactions.reduce((sum, tx) => {
    if (tx.type === 'CASH_IN') return sum + tx.amount;
    if (tx.type === 'CASH_OUT') return sum - tx.amount;
    if (tx.type === 'ADJUSTMENT') return sum + tx.amount;
    return sum;
  }, 0);

  // Treasury Operations
  const createTreasuryTransaction = async (tx: Omit<TreasuryTransaction, 'id'>): Promise<TreasuryTransaction> => {
    return createTreasuryTx(currentSocietyId, tx);
  };

  // Expense Operations
  const totalExpensesThisMonth = expenses
    .filter((e) => {
      if (e.status === 'CANCELLED') return false;
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const createExpense = async (
    data: Omit<ExpenseRecord, 'id' | 'societyId' | 'status' | 'createdBy' | 'createdAt'>
  ): Promise<ExpenseRecord> => {
    const record = await createExpenseRecordInDb(currentSocietyId, {
      ...data,
      societyId: currentSocietyId,
      status: 'RECORDED',
      createdBy: userProfile?.name || user?.email || 'Admin',
      createdAt: new Date().toISOString(),
    });
    // Auto-create CASH_OUT treasury transaction only for cash expenses
    if (data.paymentMethod === 'Cash') {
      await createTreasuryTx(currentSocietyId, {
        societyId: currentSocietyId,
        type: 'CASH_OUT',
        amount: data.amount,
        category: data.category,
        description: `${data.category} — ${data.vendor || data.description}`,
        sourceType: 'EXPENSE',
        expenseId: record.id,
        createdAt: new Date().toISOString(),
        createdBy: userProfile?.name || user?.email || 'Admin',
      });
    }
    await recordAuditLog(currentSocietyId, {
      actorId: user?.uid || 'admin',
      actorName: userProfile?.name || 'Admin',
      actorRole: role,
      action: 'CREATE_EXPENSE',
      targetType: 'ExpenseRecord',
      targetId: record.id,
      reason: `Expense recorded: ${data.category} — ₹${data.amount.toLocaleString()} to ${data.vendor}`,
    });
    showToast(`Expense of ₹${data.amount.toLocaleString()} recorded.`);
    return record;
  };

  const cancelExpense = async (expenseId: string, reason: string): Promise<void> => {
    await cancelExpenseRecordInDb(currentSocietyId, expenseId, userProfile?.name || user?.email || 'Admin', reason);
    await recordAuditLog(currentSocietyId, {
      actorId: user?.uid || 'admin',
      actorName: userProfile?.name || 'Admin',
      actorRole: role,
      action: 'CANCEL_EXPENSE',
      targetType: 'ExpenseRecord',
      targetId: expenseId,
      reason: `Expense cancelled: ${reason}`,
    });
    showToast('Expense cancelled.');
  };

  // Visitor Operations
  const inviteVisitor = (data: {
    name: string;
    phone: string;
    purpose: string;
    expectedDate: string;
    expectedTime: string;
    type?: Visitor['type'];
    company?: string;
  }) => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const newVisitorData: Omit<Visitor, 'id' | 'createdAt'> = {
      societyId: currentSocietyId,
      name: data.name,
      phone: data.phone,
      flat: resident.flat,
      tower: resident.tower,
      residentName: resident.name,
      purpose: data.purpose,
      type: data.type || 'Guest',
      company: data.company,
      expectedDate: data.expectedDate,
      expectedTime: data.expectedTime,
      passNumber: `NW-${randomCode}`,
      qrCode: `QR-NW-${randomCode}`,
      status: 'expected',
      gateNumber: 'Gate 1',
    };

    // Optimistically create with temporary id
    const tempVisitor: Visitor = {
      ...newVisitorData,
      id: `vis-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setVisitors((prev) => [tempVisitor, ...prev]);

    // Persist to Cloud Firestore
    createVisitorRecord(currentSocietyId, newVisitorData).catch((err) =>
      console.warn('Firestore visitor error:', err)
    );

    // Create notification for the resident
    if (user?.uid) {
      createNotificationRecord(currentSocietyId, {
        societyId: currentSocietyId,
        userId: user.uid,
        type: 'visitor_arrived',
        title: 'Visitor Expected',
        message: `${data.name} is expected on ${data.expectedDate} at ${data.expectedTime}.`,
        read: false,
        relatedEntityType: 'visitor',
        relatedEntityId: '',
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }

    showToast(`Visitor pass created for ${data.name}.`);
    return tempVisitor;
  };

  const updateVisitorStatus = (id: string, status: Visitor['status']) => {
    const extraFields: Record<string, any> = {};
    if (status === 'inside') {
      extraFields.entryTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (status === 'exited') {
      extraFields.exitTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    setVisitors((prev) => prev.map((v) => (v.id === id ? { ...v, status, ...extraFields } : v)));
    updateVisitorStatusRecord(currentSocietyId, id, status, extraFields).catch((err) =>
      console.warn('Firestore visitor update error:', err)
    );
  };

  const approveVisitor = (id: string) => {
    const visitor = visitors.find((v) => v.id === id);
    if (!visitor) return;
    updateVisitorStatus(id, 'inside');
    setGateAlert({ active: false });
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    // Notify the resident whose visitor was approved
    if (user?.uid) {
      createNotificationRecord(currentSocietyId, {
        societyId: currentSocietyId,
        userId: user.uid,
        type: 'visitor_approved',
        title: 'Visitor Approved',
        message: `${visitor.name} has been approved and granted entry.`,
        read: false,
        relatedEntityType: 'visitor',
        relatedEntityId: visitor.id,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }
    showToast(`Approved! Barrier gate opened for ${visitor.name}.`);
  };

  const rejectVisitor = (id: string) => {
    const visitor = visitors.find((v) => v.id === id);
    updateVisitorStatus(id, 'rejected');
    setGateAlert({ active: false });
    showToast(`Entry denied for ${visitor?.name || 'Visitor'}. Guard notified.`);
  };

  const cancelVisitorPass = (id: string) => {
    updateVisitorStatus(id, 'rejected');
    showToast('Visitor pass cancelled.');
  };

  const securityCheckIn = (visitorId: string) => {
    const visitor = visitors.find((v) => v.id === visitorId);
    if (!visitor) return;
    const now = new Date();
    const entryTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setVisitors((prev) => prev.map((v) => (v.id === visitorId ? { ...v, status: 'inside' as Visitor['status'], entryTime } : v)));
    updateVisitorStatusRecord(currentSocietyId, visitorId, 'inside', { entryTime }).catch((err) =>
      console.warn('Firestore security check-in error:', err)
    );
    setGateAlert({ active: false });
    showToast(`${visitor.name} checked in at gate.`);
  };

  const securityCheckOut = (visitorId: string) => {
    const visitor = visitors.find((v) => v.id === visitorId);
    if (!visitor) return;
    const now = new Date();
    const exitTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setVisitors((prev) => prev.map((v) => (v.id === visitorId ? { ...v, status: 'exited' as Visitor['status'], exitTime } : v)));
    updateVisitorStatusRecord(currentSocietyId, visitorId, 'exited', { exitTime }).catch((err) =>
      console.warn('Firestore security check-out error:', err)
    );
    showToast(`${visitor.name} checked out from gate.`);
  };

  // Complaint Operations
  const submitComplaint = (data: {
    category: ComplaintCategory;
    title: string;
    description: string;
    priority?: ComplaintPriority;
    photoUrl?: string;
  }) => {
    const tempTicket = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newComplaintData: Omit<Complaint, 'id' | 'ticketNumber' | 'reportedAt'> = {
      societyId: currentSocietyId,
      title: data.title,
      category: data.category,
      description: data.description,
      flat: resident.flat,
      tower: resident.tower,
      residentName: resident.name,
      residentPhone: resident.phone,
      status: 'reported',
      priority: data.priority || 'Normal',
      photoUrl: data.photoUrl,
      timeline: [
        {
          step: 'reported',
          title: 'Ticket Logged',
          time: 'Just now',
          note: 'Complaint registered in society maintenance queue',
          done: true,
        },
      ],
      comments: [
        {
          author: 'System',
          role: 'System Automated',
          time: 'Just now',
          text: 'Ticket created and forwarded to maintenance desk.',
        },
      ],
    };

    const tempComplaint: Complaint = {
      ...newComplaintData,
      id: `cmp-${Date.now()}`,
      ticketNumber: tempTicket,
      reportedAt: new Date().toISOString(),
    };
    setComplaints((prev) => [tempComplaint, ...prev]);

    createComplaintRecord(currentSocietyId, newComplaintData).catch((err) =>
      console.warn('Firestore complaint error:', err)
    );

    showToast(`Ticket #${tempTicket} logged in Firestore.`);
    return tempComplaint;
  };

  const updateComplaintStatus = (id: string, status: ComplaintStatus) => {
    const complaint = complaints.find((c) => c.id === id);
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
    updateComplaintStatusRecord(currentSocietyId, id, status).catch((err) =>
      console.warn('Firestore complaint update error:', err)
    );
    // Notify the complaint reporter
    if (complaint) {
      createNotificationRecord(currentSocietyId, {
        societyId: currentSocietyId,
        userId: user?.uid || '',
        type: 'complaint_update',
        title: 'Complaint Updated',
        message: `Your complaint "${complaint.title}" (#${complaint.ticketNumber}) status changed to ${status}.`,
        read: false,
        relatedEntityType: 'complaint',
        relatedEntityId: id,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }
    showToast(`Complaint status updated to ${status}.`);
  };

  const assignComplaint = (id: string, name: string, roleTitle: string, phone: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'assigned',
              assignedTo: { name, role: roleTitle, phone },
            }
          : c
      )
    );
    updateComplaintStatusRecord(currentSocietyId, id, 'assigned').catch((err) =>
      console.warn('Firestore complaint assign error:', err)
    );
    showToast(`Assigned ticket to technician ${name}.`);
  };

  const addComplaintComment = (id: string, text: string) => {
    const comp = complaints.find((c) => c.id === id);
    if (!comp) return;
    const comments = [
      ...comp.comments,
      {
        author: resident.name,
        role: role === 'admin' ? 'Admin' : 'Resident',
        time: 'Just now',
        text,
      },
    ];
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, comments } : c))
    );
    updateComplaintStatusRecord(currentSocietyId, id, comp.status, comments).catch((err) =>
      console.warn('Firestore complaint comment error:', err)
    );
    showToast('Comment posted.');
  };

  const updateComplaintNotes = (id: string, data: { resolutionNotes?: string; internalNotes?: string }) => {
    const comp = complaints.find((c) => c.id === id);
    if (!comp) return;
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
    updateComplaintNotesInDb(currentSocietyId, id, data).catch((err) =>
      console.warn('Firestore complaint notes error:', err)
    );
    showToast('Notes saved.');
  };

  const updateResident = async (uid: string, data: { name?: string; phone?: string; type?: 'Owner' | 'Tenant' }) => {
    await updateMemberRecordInDb(currentSocietyId, uid, data);
    showToast('Resident updated.');
  };

  const deactivateResident = async (uid: string) => {
    await updateMemberStatusInDb(currentSocietyId, uid, 'removed');
    showToast('Resident deactivated.');
  };

  const reassignResidentFlat = async (uid: string, newFlatId: string, newFlatNumber: string, newTowerName: string) => {
    const member = members.find((m) => m.uid === uid);
    const oldFlatId = member?.flatId;
    const oldFlatNumber = member?.flatNumber;

    await updateMemberRecordInDb(currentSocietyId, uid, {
      flatId: newFlatId,
      flatNumber: newFlatNumber,
      towerName: newTowerName,
    });

    if (oldFlatId) {
      await updateFlatRecord(currentSocietyId, oldFlatId, { status: 'vacant' }).catch(() => {});
    }
    await updateFlatRecord(currentSocietyId, newFlatId, { status: 'active' }).catch(() => {});

    setResidents((prev) =>
      prev.map((r) =>
        r.id === uid ? { ...r, flat: newFlatNumber, flatId: newFlatId, tower: newTowerName } : r
      )
    );

    await recordAuditLog(currentSocietyId, {
      actorId: user?.uid || 'system',
      actorName: resident.name,
      actorRole: role === 'admin' ? 'society_admin' : 'resident',
      action: 'FLAT_REASSIGNMENT',
      targetType: 'SocietyMember',
      targetId: uid,
      reason: `Flat reassigned from ${oldFlatNumber || 'N/A'} to ${newFlatNumber}`,
    });

    showToast(`Resident reassigned to Flat ${newFlatNumber}.`);
  };

  // Payment Operations (Server-confirmed simulation)
  // Resident-initiated payment: attempts server confirmation first.
  // Until the Phase 12 payment backend exists, resident bill writes are
  // rejected by security rules — surfaced as "not enabled", never faked.
  const payMaintenanceBill = (billId: string, paymentMethod: string) => {
    const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const transactionId = `UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const bill = bills.find((b) => b.id === billId);

    processServerConfirmedPayment(currentSocietyId, billId, {
      method: paymentMethod,
      transactionId,
      amount: bill?.totalAmount || 0,
    })
      .then(() => {
        setBills((prev) =>
          prev.map((b) =>
            b.id === billId
              ? { ...b, status: 'Paid', paidAt: new Date().toISOString(), paymentMethod, transactionId }
              : b
          )
        );
        setResident((prev) => ({ ...prev, dues: 0 }));
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        showToast('Payment confirmed and recorded.');
      })
      .catch(() => {
        showToast('Online payments are not yet enabled for this society. Please pay at the society office.');
      });
    return { receiptNumber, transactionId };
  };

  // UPI Payment Claim — resident submits UTR, status = PENDING_VERIFICATION
  const submitPaymentClaim = async (
    billId: string,
    amount: number,
    utr: string,
    notes?: string
  ): Promise<string> => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) throw new Error('Bill not found');

    const flat = flats.find((f) => f.number === resident.flat);
    const paymentId = await createPaymentRecord(currentSocietyId, {
      societyId: currentSocietyId,
      billId,
      residentId: user?.uid || '',
      flatId: flat?.id || '',
      flatNumber: resident.flat,
      amount,
      currency: 'INR',
      paymentMethod: 'UPI',
      paymentReference: bill.billNumber,
      utr,
      status: 'PENDING_VERIFICATION',
      submittedAt: new Date().toISOString(),
      submittedBy: resident.name,
      notes,
    });

    await recordAuditLog(currentSocietyId, {
      actorId: user?.uid || 'resident',
      actorName: resident.name || userProfile?.name || 'Resident',
      actorRole: role,
      action: 'PAYMENT_CLAIM_SUBMITTED',
      targetType: 'PaymentRecord',
      targetId: paymentId,
      reason: `UPI payment claim submitted — ₹${amount} for bill ${bill.billNumber} (UTR: ${utr})`,
    });

    showToast('Payment submitted for verification. Your bill will be updated once the admin verifies.');
    return paymentId;
  };

  // Admin: verify a payment claim
  const verifyPayment = async (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    await updatePaymentRecord(currentSocietyId, paymentId, {
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      verifiedBy: userProfile?.name || 'Admin',
    });

    // Update bill status to Paid
    await processServerConfirmedPayment(currentSocietyId, payment.billId, {
      method: `UPI (UTR: ${payment.utr || 'N/A'})`,
      transactionId: payment.utr || `UTR-${Date.now()}`,
      amount: payment.amount,
    });

    setBills((prev) =>
      prev.map((b) =>
        b.id === payment.billId
          ? {
              ...b,
              status: 'Paid' as const,
              paidAt: new Date().toISOString(),
              paymentMethod: 'UPI',
              transactionId: payment.utr || '',
            }
          : b
      )
    );

    await recordAuditLog(currentSocietyId, {
      actorId: user?.uid || 'admin',
      actorName: userProfile?.name || 'Admin',
      actorRole: role,
      action: 'PAYMENT_VERIFIED',
      targetType: 'PaymentRecord',
      targetId: paymentId,
      reason: `Verified UPI payment of ₹${payment.amount} for bill ${payment.paymentReference}`,
    });

    // Notify the resident about payment verification
    createNotificationRecord(currentSocietyId, {
      societyId: currentSocietyId,
      userId: payment.residentId,
      type: 'payment_verified',
      title: 'Payment Verified',
      message: `Your payment of ₹${payment.amount} for ${payment.paymentReference} has been verified.`,
      read: false,
      relatedEntityType: 'payment',
      relatedEntityId: paymentId,
      createdAt: new Date().toISOString(),
    }).catch(() => {});

    showToast('Payment verified and bill marked as Paid.');
  };

  // Admin: reject a payment claim
  const rejectPayment = async (paymentId: string, reason: string) => {
    await updatePaymentRecord(currentSocietyId, paymentId, {
      status: 'REJECTED',
      rejectionReason: reason,
      verifiedAt: new Date().toISOString(),
      verifiedBy: userProfile?.name || 'Admin',
    });

    const payment = payments.find((p) => p.id === paymentId);
    await recordAuditLog(currentSocietyId, {
      actorId: user?.uid || 'admin',
      actorName: userProfile?.name || 'Admin',
      actorRole: role,
      action: 'PAYMENT_REJECTED',
      targetType: 'PaymentRecord',
      targetId: paymentId,
      reason: `Rejected payment: ${reason}`,
    });

    // Notify the resident about payment rejection
    if (payment) {
      createNotificationRecord(currentSocietyId, {
        societyId: currentSocietyId,
        userId: payment.residentId,
        type: 'payment_rejected',
        title: 'Payment Rejected',
        message: `Your payment of ₹${payment.amount} for ${payment.paymentReference} was rejected. Reason: ${reason}`,
        read: false,
        relatedEntityType: 'payment',
        relatedEntityId: paymentId,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }

    showToast('Payment rejected. Resident will be notified.');
  };

  // Admin records an offline payment (cash/cheque/bank transfer).
  // Society admins may write bills per security rules; fully audited.
  const markBillPaidManually = async (billId: string, method: string) => {
    const transactionId = `OFFLINE-${Math.floor(100000 + Math.random() * 900000)}`;
    await processServerConfirmedPayment(currentSocietyId, billId, {
      method,
      transactionId,
      amount: bills.find((b) => b.id === billId)?.totalAmount || 0,
    });
    await recordAuditLog(currentSocietyId, {
      actorId: user?.uid || 'admin',
      actorName: userProfile?.name || 'Admin',
      actorRole: role,
      action: 'RECORD_OFFLINE_PAYMENT',
      targetType: 'MaintenanceBill',
      targetId: billId,
      reason: `Offline payment recorded via ${method}`,
    });

    // Auto-create treasury entry for cash payments
    if (method === 'Cash') {
      const bill = bills.find((b) => b.id === billId);
      if (bill) {
        createTreasuryTx(currentSocietyId, {
          societyId: currentSocietyId,
          type: 'CASH_IN',
          amount: bill.totalAmount,
          category: 'Maintenance',
          description: `Cash payment for ${bill.billNumber} — Flat ${bill.flat}`,
          sourceType: 'PAYMENT',
          paymentId: transactionId,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || 'admin',
        }).catch((err) => console.warn('Treasury entry error:', err));
      }
    }

    showToast('Offline payment recorded.');
  };

  const createBill = async (
    flatId: string,
    flatNumber: string,
    towerName: string,
    residentName: string,
    month: string,
    year: number,
    amount: number,
    dueDate: string,
    lineItems?: MaintenanceBill['lineItems']
  ): Promise<string> => {
    const subtotal = lineItems ? lineItems.reduce((sum, item) => sum + item.amount, 0) : amount;
    const billingPeriod = `${month} ${year}`;
    const newBill = await createBillRecord(currentSocietyId, {
      societyId: currentSocietyId,
      flatId: flatId,
      flat: flatNumber,
      tower: towerName,
      residentName,
      month,
      year,
      maintenanceFee: lineItems?.find((i) => i.type === 'maintenance')?.amount ?? amount,
      parkingFee: lineItems?.find((i) => i.type === 'parking')?.amount ?? 0,
      lateFee: lineItems?.find((i) => i.type === 'late_fee')?.amount ?? 0,
      totalAmount: amount,
      status: 'Pending',
      dueDate,
      lineItems,
      subtotal,
      billingPeriod,
    });
    await recordAuditLog(currentSocietyId, {
      actorId: user?.uid || 'admin',
      actorName: userProfile?.name || 'Admin',
      actorRole: role,
      action: 'CREATE_BILL',
      targetType: 'MaintenanceBill',
      targetId: newBill.id,
      reason: `Bill created for Flat ${flatNumber} — ${billingPeriod} — ₹${amount.toLocaleString()}`,
    });
    // Notify the resident about the new bill
    createNotificationRecord(currentSocietyId, {
      societyId: currentSocietyId,
      userId: user?.uid || '',
      type: 'bill_generated',
      title: 'New Bill Generated',
      message: `Bill for Flat ${flatNumber} — ${billingPeriod} — ₹${amount.toLocaleString()} is due by ${dueDate}.`,
      read: false,
      relatedEntityType: 'bill',
      relatedEntityId: newBill.id,
      createdAt: new Date().toISOString(),
    }).catch(() => {});
    showToast(`Bill created for Flat ${flatNumber} — ${billingPeriod}`);
    return newBill.id;
  };

  // Bulk Bill Generation
  const generateBulkBills = async (
    billingPeriod: string,
    month: string,
    year: number,
    dueDate: string,
    lineItems: BillLineItem[],
    scope: { towers?: string[]; occupantFilter?: 'all' | 'owner' | 'tenant' }
  ): Promise<{ created: number; skipped: number; failed: number }> => {
    const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

    // 1. Get all flats matching scope
    let targetFlats = flats.filter((f) => f.status === 'active');
    if (scope.towers && scope.towers.length > 0) {
      targetFlats = targetFlats.filter((f) => scope.towers!.includes(f.towerName || f.towerId));
    }
    if (scope.occupantFilter === 'owner') {
      targetFlats = targetFlats.filter((f) => f.ownerIds && f.ownerIds.length > 0);
    } else if (scope.occupantFilter === 'tenant') {
      targetFlats = targetFlats.filter((f) => f.tenantIds && f.tenantIds.length > 0);
    }

    let created = 0;
    let skipped = 0;
    let failed = 0;

    // 2. For each flat, check duplicate then create
    for (const flat of targetFlats) {
      // Duplicate check: same billingPeriod + flat number
      const exists = bills.some(
        (b) => b.billingPeriod === billingPeriod && b.flat === flat.number
      );
      if (exists) {
        skipped++;
        continue;
      }

      const member = members.find(
        (m) => m.flatId === flat.id || m.flatNumber === flat.number
      );
      const residentName = member?.name || flat.primaryResidentName || 'Resident';

      try {
        await createBillRecord(currentSocietyId, {
          societyId: currentSocietyId,
          flatId: flat.id,
          flat: flat.number,
          tower: flat.towerName || flat.towerId,
          residentName,
          month,
          year,
          maintenanceFee: lineItems.find((i) => i.type === 'maintenance')?.amount ?? 0,
          parkingFee: lineItems.find((i) => i.type === 'parking')?.amount ?? 0,
          lateFee: 0,
          totalAmount,
          status: 'Pending',
          dueDate,
          lineItems,
          subtotal: totalAmount,
          billingPeriod,
        });
        created++;
      } catch {
        failed++;
      }
    }

    if (created > 0) {
      showToast(
        `Created ${created} bill${created !== 1 ? 's' : ''}, skipped ${skipped} duplicate${skipped !== 1 ? 's' : ''}, ${failed} failed`
      );
    } else if (skipped > 0) {
      showToast(`All ${skipped} flats already have bills for ${billingPeriod}.`);
    } else {
      showToast('No flats matched the selected scope.');
    }

    return { created, skipped, failed };
  };

  // Facility Booking Operations
  const bookFacilitySlot = (facilityId: string, slotTime: string, date: string) => {
    const fac = facilities.find((f) => f.id === facilityId);
    createFacilityBookingRecord(currentSocietyId, {
      facilityId,
      facilityName: fac?.name || 'Amenity',
      flat: resident.flat,
      residentName: resident.name,
      date,
      timeSlot: slotTime,
      totalCost: fac?.pricePerHour || 0,
    }).catch((err) => console.warn('Firestore booking error:', err));

    // Notify the resident about the booking
    if (user?.uid) {
      createNotificationRecord(currentSocietyId, {
        societyId: currentSocietyId,
        userId: user.uid,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `${fac?.name || 'Facility'} booked for ${date} at ${slotTime}.`,
        read: false,
        relatedEntityType: 'facilityBooking',
        relatedEntityId: facilityId,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }

    showToast(`Booking confirmed for ${fac?.name || 'Facility'} at ${slotTime}.`);
    return true;
  };

  // Notice Operations
  const createNotice = (data: {
    title: string;
    message: string;
    audience: Notice['audience'];
    targetBlock?: string;
    priority?: Notice['priority'];
    attachmentName?: string;
  }) => {
    const newNoticeData: Omit<Notice, 'id' | 'createdAt'> = {
      societyId: currentSocietyId,
      title: data.title,
      category: 'general',
      message: data.message,
      audience: data.audience,
      targetBlock: data.targetBlock,
      date: 'Today',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: data.priority || 'normal',
      attachmentName: data.attachmentName,
      publishedBy: 'Managing Committee RWA',
      read: false,
    };

    const tempNotice: Notice = {
      ...newNoticeData,
      id: `not-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setNotices((prev) => [tempNotice, ...prev]);

    createNoticeRecord(currentSocietyId, newNoticeData).catch((err) =>
      console.warn('Firestore notice error:', err)
    );

    // Notify all members about the new notice
    if (user?.uid) {
      createNotificationRecord(currentSocietyId, {
        societyId: currentSocietyId,
        userId: user.uid,
        type: 'notice_published',
        title: 'New Notice Published',
        message: `"${data.title}" — ${data.message.substring(0, 100)}${data.message.length > 100 ? '...' : ''}`,
        read: false,
        relatedEntityType: 'notice',
        relatedEntityId: tempNotice.id,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }

    showToast('Community notice broadcast to all residents.');
    return tempNotice;
  };

  const addResident = (newRes: Partial<ResidentProfile>) => {
    if (!newRes.flat) {
      showToast('Flat number is required.');
      return;
    }
    createFlatRecord(currentSocietyId, {
      number: newRes.flat,
      towerId: `tower-${(newRes.tower || 'A').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      towerName: newRes.tower || '',
      floor: parseInt((newRes.flat.match(/\d+/) || ['1'])[0].slice(0, -2) || '1', 10) || 1,
      type: '2BHK',
      status: 'vacant',
      ownerIds: [],
      ownerNames: newRes.name ? [newRes.name] : [],
      tenantIds: [],
      primaryResidentName: newRes.name || '',
      primaryResidentPhone: newRes.phone || '',
      dues: 0,
    }).catch((err) => console.warn(err));

    showToast(`Unit ${newRes.flat} added to society directory.`);
  };

  // Election Operations
  const castVote = async (data: {
    electionId: string;
    position: ElectionPosition;
    candidateId: string;
    voterId: string;
    voterFlat: string;
  }) => {
    await castVoteRecord(currentSocietyId, data.electionId, {
      electionId: data.electionId,
      position: data.position,
      candidateId: data.candidateId,
      voterId: data.voterId,
      voterFlat: data.voterFlat,
    });
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    showToast('Your secret ballot was cryptographically recorded.');
  };

  const submitNomination = async (
    data: Omit<Nomination, 'id' | 'status' | 'voteCount' | 'nominatedAt'>
  ) => {
    await submitNominationRecord(currentSocietyId, data.electionId, {
      ...data,
      status: 'Pending Review',
    });
    showToast('Nomination filed successfully. Under Committee Review.');
  };

  const updateNominationStatus = async (electionId: string, nominationId: string, status: Nomination['status']) => {
    setNominations((prev) => prev.map((n) => (n.id === nominationId ? { ...n, status } : n)));
    updateNominationRecord(currentSocietyId, electionId, nominationId, { status }).catch((err) =>
      console.warn('Firestore nomination update error:', err)
    );
    showToast(`Nomination status updated to ${status}.`);
  };

  const createElection = async (
    data: Omit<Election, 'id' | 'totalVotesCast' | 'createdAt'>
  ) => {
    await createElectionRecord(currentSocietyId, data);
    showToast('Election cycle initialized.');
  };

  const updateElectionStatus = async (id: string, status: Election['status']) => {
    setElections((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    updateElectionRecord(currentSocietyId, id, { status }).catch((err) =>
      console.warn('Firestore election update error:', err)
    );
    showToast(`Election status updated to ${status}.`);
  };

  // Gate simulation helper
  const dismissGateAlert = () => {
    setGateAlert({ active: false });
  };

  return (
    <AppContext.Provider
      value={{
        currentSocietyId,
        setCurrentSocietyId,
        currentSociety,
        societies,
        platformUser,
        isPlatformAdmin,
        activeView,
        setActiveView,
        towers,
        flats,
        members,
        currentMembership,
        createSociety,
        updateSocietyStatus,
        updateSocietySettings,
        deleteSociety,
        createTower,
        createFlat,
        createFacility,
        updateFacility,
        archiveFacility,
        updateFlat,
        startSupportSession,
        endSupportSession,
        activeSupportSession,
        supportSessions,
        platformAnalytics,
        auditLogs,
        role,
        setRole,
        viewMode,
        setViewMode,
        canAccessAdminView,
        user,
        userProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isProfileCompletionOpen,
        setIsProfileCompletionOpen,
        isElectionModalOpen,
        setIsElectionModalOpen,
        isPaymentsResearchOpen,
        setIsPaymentsResearchOpen,
        promoteToSocietyAdmin,
        setMemberStatus,
        inviteMember,
        registeredUsers,
        completeUserProfile,
        logout,
        society,
        resident,
        setResident,
        residents,
        addResident,
        visitors,
        inviteVisitor,
        updateVisitorStatus,
        securityCheckIn,
        securityCheckOut,
        approveVisitor,
        rejectVisitor,
        cancelVisitorPass,
        complaints,
        submitComplaint,
        updateComplaintStatus,
        assignComplaint,
        addComplaintComment,
        updateComplaintNotes,
        updateResident,
        deactivateResident,
        reassignResidentFlat,
        bills,
        createBill,
        generateBulkBills,
        payMaintenanceBill,
        markBillPaidManually,
        payments,
        submitPaymentClaim,
        verifyPayment,
        rejectPayment,
        facilities,
        facilityBookings,
        bookFacilitySlot,
        notices,
        createNotice,
        activities,
        elections,
        nominations,
        votes,
        committeeMembers,
        castVote,
        submitNomination,
        updateNominationStatus,
        createElection,
        updateElectionStatus,
        gateAlert,
        dismissGateAlert,
        previewMode,
        setPreviewMode,
        toastMessage,
        showToast,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
        treasuryTransactions,
        cashInHand,
        createTreasuryTransaction,
        expenses,
        totalExpensesThisMonth,
        createExpense,
        cancelExpense,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
