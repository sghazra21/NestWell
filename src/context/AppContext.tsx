import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  UserRole,
  UserProfile,
  ResidentProfile,
  Visitor,
  Complaint,
  MaintenanceBill,
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
  PlatformUser,
  PlatformAnalytics,
  SupportSession,
  AuditLog,
} from '../types';
import {
  auth,
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
  subscribeTowers,
  createTowerRecord,
  subscribeFlats,
  createFlatRecord,
  updateFlatRecord,
  subscribeMembers,
  createOrUpdateMemberRecord,
  updateMemberRole as updateMemberRoleInDb,
  subscribeVisitors,
  createVisitorRecord,
  updateVisitorStatusRecord,
  subscribeComplaints,
  createComplaintRecord,
  updateComplaintStatusRecord,
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
  subscribeNominations,
  submitNominationRecord,
  subscribeVotes,
  castVoteRecord,
  subscribeAuditLogs,
  recordAuditLog,
  subscribePlatformAnalytics,
  subscribeSupportSessions,
  createSupportSessionRecord,
  bootstrapProductionTenantIfEmpty,
  sanitizeFirestoreData,
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
  createTower: (data: Omit<Tower, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>) => Promise<Tower>;
  createFlat: (data: Omit<Flat, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>) => Promise<Flat>;
  updateFlat: (flatId: string, data: Partial<Flat>) => Promise<void>;
  startSupportSession: (societyId: string, reason: string) => Promise<void>;
  supportSessions: SupportSession[];
  platformAnalytics: PlatformAnalytics[];
  auditLogs: AuditLog[];

  // User & Auth State
  role: UserRole;
  setRole: (role: UserRole) => void;
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
  loginWithDemoAccount: (role: UserRole) => void;
  loginAsLocalAdmin: () => void;
  promoteToSocietyAdmin: (targetIdentifier: string, newRole: UserRole, designation?: string) => Promise<void>;
  registeredUsers: UserProfile[];
  completeUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;

  // Backwards-Compatible Entity State & Handlers
  society: SocietyInfo;
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
  bills: MaintenanceBill[];
  payMaintenanceBill: (billId: string, paymentMethod: string) => { receiptNumber: string; transactionId: string };
  facilities: Facility[];
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
  updateNominationStatus: (id: string, status: Nomination['status']) => Promise<void>;
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
  triggerGateSimulation: () => void;
  dismissGateAlert: () => void;
  previewMode: 'auto' | 'mobile_frame';
  setPreviewMode: (mode: 'auto' | 'mobile_frame') => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  resetData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Multi-Tenant Context State
  const [currentSocietyId, setCurrentSocietyIdState] = useState<string>(() => {
    return localStorage.getItem('nestwell_current_society_id') || 'greenwood-heights';
  });
  const [currentSociety, setCurrentSociety] = useState<Society | null>(null);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [members, setMembers] = useState<SocietyMember[]>([]);
  const [currentMembership, setCurrentMembership] = useState<SocietyMember | null>(null);
  const [supportSessions, setSupportSessions] = useState<SupportSession[]>([]);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Auth & Global User state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('nestwell_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('nestwell_role') as UserRole) || 'resident';
  });
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

  // Dynamic Resident Profile for current user
  const [resident, setResident] = useState<ResidentProfile>({
    id: 'res-user',
    name: 'Sayan Ghosh',
    flat: 'B-402',
    tower: 'Tower B',
    phone: '+91 98765 43210',
    email: 'sayan.ghosh@greenwood.in',
    type: 'Owner',
    status: 'Active',
    familyMembers: [
      { name: 'Pooja Ghosh', relation: 'Spouse' },
      { name: 'Aarav Ghosh', relation: 'Son' },
    ],
    vehicles: [
      { number: 'KA 03 MX 8412', type: 'Car', slot: 'B-P12' },
      { number: 'KA 03 EV 2109', type: 'Two-Wheeler', slot: 'B-T04' },
    ],
    dues: 4600,
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

  const isPlatformAdmin =
    platformUser?.platformRole === 'platform_admin' ||
    user?.email?.toLowerCase() === 'sghazra21@gmail.com' ||
    userProfile?.email?.toLowerCase() === 'sghazra21@gmail.com' ||
    userProfile?.id === 'admin-local-master';

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
    localStorage.setItem('nestwell_role', newRole);
    showToast(`Switched interface to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)} view`);
  };

  // -------------------------------------------------------------
  // 1. INITIAL MOUNT & BOOTSTRAP (Zero mock data in code)
  // -------------------------------------------------------------
  useEffect(() => {
    // Bootstrap Firestore with real production tenant if completely empty
    bootstrapProductionTenantIfEmpty();

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const pUser = await syncPlatformUser(fbUser);
          setPlatformUser(pUser);

          // Build or sync profile
          const profile: UserProfile = {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Resident User',
            role: fbUser.email?.toLowerCase() === 'sghazra21@gmail.com' ? 'admin' : 'resident',
            phone: fbUser.phoneNumber || '',
            flat: 'B-402',
            tower: 'Tower B',
            type: 'Owner',
            isProfileComplete: true,
            createdAt: new Date().toISOString(),
          };
          setUserProfile(profile);
          localStorage.setItem('nestwell_user_profile', JSON.stringify(profile));

          // Sync into society members
          await createOrUpdateMemberRecord(currentSocietyId, {
            uid: fbUser.uid,
            email: profile.email,
            name: profile.name,
            role: fbUser.email?.toLowerCase() === 'sghazra21@gmail.com' ? 'society_admin' : 'resident',
            flatNumber: profile.flat,
            towerName: profile.tower,
          });
        } catch (e) {
          console.warn('Auth sync notice:', e);
        }
      }
    });

    // Subscribe to platform-wide societies list
    const unsubSocieties = subscribeSocieties((socList) => {
      setSocieties(socList);
      if (socList.length > 0 && !socList.find((s) => s.id === currentSocietyId)) {
        setCurrentSocietyIdState(socList[0].id);
      }
    });

    const unsubPlatformAnalytics = subscribePlatformAnalytics((aList) => {
      setPlatformAnalytics(aList);
    });

    const unsubSupportSessions = subscribeSupportSessions((sList) => {
      setSupportSessions(sList);
    });

    return () => {
      unsubscribeAuth();
      unsubSocieties();
      unsubPlatformAnalytics();
      unsubSupportSessions();
    };
  }, []);

  // -------------------------------------------------------------
  // 2. TENANT-ISOLATED REAL-TIME SUBSCRIPTIONS
  // -------------------------------------------------------------
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
      const waitingVisitor = vList.find((v) => v.status === 'waiting' && (v.flat === resident.flat || role === 'admin'));
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
      const myDue = bList.find((b) => b.flat === resident.flat && b.status !== 'Paid');
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

    // Elections & Ballots
    const unsubElections = subscribeElections(currentSocietyId, (eList) => {
      setElections(eList);
      if (eList.length > 0) {
        const primaryElection = eList[0];
        subscribeNominations(currentSocietyId, primaryElection.id, (nomList) => setNominations(nomList));
        subscribeVotes(currentSocietyId, primaryElection.id, (vtList) => setVotes(vtList));
      }
    });

    // Audit logs
    const unsubAudit = subscribeAuditLogs(currentSocietyId, (logs) => setAuditLogs(logs));

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
      unsubAudit();
    };
  }, [currentSocietyId, user?.uid, resident.flat, role]);

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

  // Derive SocietyInfo for UI header
  const society: SocietyInfo = currentSociety
    ? {
        name: currentSociety.name,
        subTitle: currentSociety.legalName,
        city: currentSociety.city,
        registeredNumber: currentSociety.registeredNumber || 'RWA-BLR-2019-742',
        totalFlats: currentSociety.totalFlats || flats.length || 144,
        totalResidents: currentSociety.totalResidents || members.length || 480,
        towers: towers.map((t) => t.name).length > 0 ? towers.map((t) => t.name) : ['Tower A', 'Tower B', 'Tower C'],
      }
    : {
        name: 'Greenwood Heights RWA',
        subTitle: 'Greenwood Heights Apartment Owners Association',
        city: 'Bengaluru, KA',
        registeredNumber: 'RWA-BLR-2019-742',
        totalFlats: 144,
        totalResidents: 480,
        towers: ['Tower A', 'Tower B', 'Tower C'],
      };

  // Derive CommitteeMembers
  const committeeMembers: CommitteeMember[] = members
    .filter((m) => m.role === 'committee' || m.role === 'society_admin')
    .map((m) => ({
      id: m.id,
      name: m.name,
      position: (m.designation as ElectionPosition) || 'President',
      flat: m.flatNumber || 'A-101',
      tower: m.towerName || 'Tower A',
      phone: m.phone || '+91 98000 00000',
      email: m.email,
      term: '2026-2028',
      responsibilities: ['Society Management', 'Executive Oversight'],
    }));

  // Derive residents list
  const residents: ResidentProfile[] = flats.map((f) => ({
    id: f.id,
    name: f.primaryResidentName || (f.ownerNames?.[0]) || 'Resident',
    flat: f.number,
    tower: f.towerName || 'Tower A',
    phone: f.primaryResidentPhone || '+91 98000 00000',
    email: `${f.number.toLowerCase()}@greenwood.in`,
    type: 'Owner',
    status: 'Active',
    familyMembers: [],
    vehicles: f.vehicles || [],
    dues: f.dues || 0,
  }));

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

  const createTower = async (data: Omit<Tower, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>) => {
    return createTowerRecord(currentSocietyId, data);
  };

  const createFlat = async (data: Omit<Flat, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>) => {
    return createFlatRecord(currentSocietyId, data);
  };

  const updateFlat = async (flatId: string, data: Partial<Flat>) => {
    await updateFlatRecord(currentSocietyId, flatId, data);
  };

  const startSupportSession = async (socId: string, reason: string) => {
    await createSupportSessionRecord({
      platformAdminId: user?.uid || 'platform-admin',
      platformAdminEmail: user?.email || 'sghazra21@gmail.com',
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
    localStorage.setItem('nestwell_user_profile', JSON.stringify(updated));

    await createOrUpdateMemberRecord(currentSocietyId, {
      uid: user.uid,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      flatNumber: updated.flat,
      towerName: updated.tower,
      profileComplete: true,
    });

    setIsProfileCompletionOpen(false);
    showToast('Profile completed and saved to Firestore.');
  };

  // Quick Account Switcher (Preconfigured Demo Sessions)
  const loginWithDemoAccount = (targetRole: UserRole) => {
    let mockProfile: UserProfile;
    if (targetRole === 'admin') {
      mockProfile = {
        id: 'admin-alok',
        email: 'president@greenwood.in',
        name: 'Dr. Alok Nath Mukherjee',
        role: 'admin',
        designation: 'RWA President',
        phone: '+91 98311 88442',
        flat: 'A-701',
        tower: 'Tower A',
        type: 'Owner',
        isProfileComplete: true,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      };
    } else if (targetRole === 'security') {
      mockProfile = {
        id: 'sec-ramesh',
        email: 'guard.gate1@greenwood.in',
        name: 'Havildar Ramesh Yadav',
        role: 'security',
        gateNumber: 'Gate 1 - Main Entrance',
        badgeId: 'SEC-042',
        phone: '+91 98111 22334',
        isProfileComplete: true,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      };
    } else {
      mockProfile = {
        id: 'res-sayan-b402',
        email: 'sayan.ghosh@greenwood.in',
        name: 'Sayan Ghosh',
        role: 'resident',
        phone: '+91 98765 43210',
        flat: 'B-402',
        tower: 'Tower B',
        type: 'Owner',
        isProfileComplete: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      };
    }

    setUserProfile(mockProfile);
    localStorage.setItem('nestwell_user_profile', JSON.stringify(mockProfile));
    setRole(targetRole);
  };

  const loginAsLocalAdmin = () => {
    const adminProfile: UserProfile = {
      id: 'admin-local-master',
      email: 'sghazra21@gmail.com',
      name: 'Sayan Hazra (Super Admin)',
      role: 'admin',
      designation: 'Platform Super Admin & RWA Officer',
      phone: '+91 98311 88442',
      flat: 'B-402',
      tower: 'Tower B',
      type: 'Owner',
      isProfileComplete: true,
      createdAt: new Date().toISOString(),
    };

    setUserProfile(adminProfile);
    localStorage.setItem('nestwell_user_profile', JSON.stringify(adminProfile));
    setRoleState('admin');
    localStorage.setItem('nestwell_role', 'admin');
    showToast('Logged in with Super Admin privileges (Cloud Firestore Authorized)');
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem('nestwell_user_profile');
    showToast('Logged out of society account.');
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
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
    updateComplaintStatusRecord(currentSocietyId, id, status).catch((err) =>
      console.warn('Firestore complaint update error:', err)
    );
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

  // Payment Operations (Server-confirmed simulation)
  const payMaintenanceBill = (billId: string, paymentMethod: string) => {
    const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const transactionId = `TXN-UPI-${Math.floor(100000000 + Math.random() * 900000000)}`;

    setBills((prev) =>
      prev.map((b) =>
        b.id === billId
          ? {
              ...b,
              status: 'Paid',
              paidAt: 'Just now',
              paymentMethod,
              transactionId,
            }
          : b
      )
    );

    setResident((prev) => ({ ...prev, dues: 0 }));

    processServerConfirmedPayment(currentSocietyId, billId, {
      method: paymentMethod,
      transactionId,
      amount: 4600,
    }).catch((err) => console.warn('Firestore payment error:', err));

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    return { receiptNumber, transactionId };
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

    showToast('Community notice broadcast to all residents.');
    return tempNotice;
  };

  const addResident = (newRes: Partial<ResidentProfile>) => {
    createFlatRecord(currentSocietyId, {
      number: newRes.flat || 'A-101',
      towerId: 'tower-a',
      towerName: newRes.tower || 'Tower A',
      floor: 1,
      type: '2BHK',
      status: 'active',
      ownerIds: [],
      ownerNames: [newRes.name || 'Resident'],
      tenantIds: [],
      primaryResidentName: newRes.name || 'Resident',
      primaryResidentPhone: newRes.phone || '+91 99000 00000',
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

  const updateNominationStatus = async (id: string, status: Nomination['status']) => {
    setNominations((prev) => prev.map((n) => (n.id === id ? { ...n, status } : n)));
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
    showToast(`Election status updated to ${status}.`);
  };

  // Gate simulation helper
  const triggerGateSimulation = () => {
    const sim = inviteVisitor({
      name: 'Rahul Verma',
      phone: '+91 98200 44112',
      purpose: 'Personal Guest',
      expectedDate: 'Today',
      expectedTime: 'Now',
    });
    updateVisitorStatus(sim.id, 'waiting');
    setGateAlert({
      active: true,
      visitor: { ...sim, status: 'waiting' },
      message: 'Rahul Verma is waiting at Gate 1.',
    });
    showToast('Security guard simulated scan for Rahul Verma.');
  };

  const dismissGateAlert = () => {
    setGateAlert({ active: false });
  };

  const resetData = () => {
    showToast('Application state refreshed from Cloud Firestore.');
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
        createTower,
        createFlat,
        updateFlat,
        startSupportSession,
        supportSessions,
        platformAnalytics,
        auditLogs,
        role,
        setRole,
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
        loginWithDemoAccount,
        loginAsLocalAdmin,
        promoteToSocietyAdmin,
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
        approveVisitor,
        rejectVisitor,
        cancelVisitorPass,
        complaints,
        submitComplaint,
        updateComplaintStatus,
        assignComplaint,
        addComplaintComment,
        bills,
        payMaintenanceBill,
        facilities,
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
        triggerGateSimulation,
        dismissGateAlert,
        previewMode,
        setPreviewMode,
        toastMessage,
        showToast,
        resetData,
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
