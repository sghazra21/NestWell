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
} from '../types';
import {
  INITIAL_SOCIETY,
  CURRENT_RESIDENT,
  INITIAL_RESIDENTS,
  INITIAL_VISITORS,
  INITIAL_COMPLAINTS,
  INITIAL_BILLS,
  INITIAL_FACILITIES,
  INITIAL_NOTICES,
  INITIAL_ACTIVITIES,
  INITIAL_ELECTIONS,
  INITIAL_NOMINATIONS,
  INITIAL_VOTES,
  INITIAL_COMMITTEE_MEMBERS,
} from '../mock/initialData';
import {
  auth,
  onAuthStateChanged,
  firebaseSignOut,
  FirebaseUser,
} from '../lib/firebase';
import {
  syncUserProfile,
  updateUserProfile,
  sanitizeFirestoreData,
  seedFirestoreInitialData,
  subscribeVisitors,
  createFirestoreVisitor,
  updateFirestoreVisitorStatus,
  subscribeComplaints,
  createFirestoreComplaint,
  updateFirestoreComplaint,
  subscribeBills,
  updateFirestoreBillPayment,
  subscribeElections,
  createFirestoreElection,
  updateFirestoreElection,
  subscribeNominations,
  submitFirestoreNomination,
  updateFirestoreNominationStatus,
  subscribeVotes,
  castFirestoreVote,
  subscribeNotices,
  createFirestoreNotice,
  subscribeUsers,
  updateUserRoleInFirestore,
} from '../lib/firestoreService';

interface AppContextType {
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
  // Auth state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('nestwell_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileCompletionOpen, setIsProfileCompletionOpen] = useState(false);
  const [isElectionModalOpen, setIsElectionModalOpen] = useState(false);
  const [isPaymentsResearchOpen, setIsPaymentsResearchOpen] = useState(false);

  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('nestwell_role') as UserRole) || 'resident';
  });

  const [previewMode, setPreviewMode] = useState<'auto' | 'mobile_frame'>('auto');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [society] = useState<SocietyInfo>(INITIAL_SOCIETY);
  const [resident, setResident] = useState<ResidentProfile>(() => {
    const saved = localStorage.getItem('nestwell_resident');
    return saved ? JSON.parse(saved) : CURRENT_RESIDENT;
  });

  const [residents, setResidents] = useState<ResidentProfile[]>(() => {
    const saved = localStorage.getItem('nestwell_residents');
    return saved ? JSON.parse(saved) : INITIAL_RESIDENTS;
  });

  const [visitors, setVisitors] = useState<Visitor[]>(() => {
    const saved = localStorage.getItem('nestwell_visitors');
    return saved ? JSON.parse(saved) : INITIAL_VISITORS;
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem('nestwell_complaints');
    return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
  });

  const [bills, setBills] = useState<MaintenanceBill[]>(() => {
    const saved = localStorage.getItem('nestwell_bills');
    return saved ? JSON.parse(saved) : INITIAL_BILLS;
  });

  const [facilities, setFacilities] = useState<Facility[]>(() => {
    const saved = localStorage.getItem('nestwell_facilities');
    return saved ? JSON.parse(saved) : INITIAL_FACILITIES;
  });

  const [notices, setNotices] = useState<Notice[]>(() => {
    const saved = localStorage.getItem('nestwell_notices');
    return saved ? JSON.parse(saved) : INITIAL_NOTICES;
  });

  const [activities, setActivities] = useState<ActivityEvent[]>(() => {
    const saved = localStorage.getItem('nestwell_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  // Elections & Governance state
  const [elections, setElections] = useState<Election[]>(INITIAL_ELECTIONS);
  const [nominations, setNominations] = useState<Nomination[]>(INITIAL_NOMINATIONS);
  const [votes, setVotes] = useState<Vote[]>(INITIAL_VOTES);
  const [committeeMembers] = useState<CommitteeMember[]>(INITIAL_COMMITTEE_MEMBERS);

  // Initial gate alert state
  const [gateAlert, setGateAlert] = useState<{
    active: boolean;
    visitor?: Visitor;
    message?: string;
  }>(() => {
    const rahul = INITIAL_VISITORS.find((v) => v.name.toLowerCase().includes('rahul') && v.status === 'waiting');
    return {
      active: true,
      visitor: rahul,
      message: 'Rahul is waiting at Gate 1.',
    };
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const setRole = (newRole: UserRole) => {
    // Prevent non-admin users from self-promoting to admin
    if (newRole === 'admin' && userProfile?.role !== 'admin' && userProfile?.id !== 'admin-local-master') {
      showToast('Administrative privileges required. Contact a Society Admin.');
      return;
    }
    setRoleState(newRole);
    localStorage.setItem('nestwell_role', newRole);
    showToast(`Switched interface to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)} view`);
  };

  // Connect Firebase Auth & Firestore live sync on mount
  useEffect(() => {
    // 1. Seed Firestore if fresh
    seedFirestoreInitialData();

    // 2. Listen to Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          // Regular users always register as resident; admins elevate privileges in Society Management
          const profile = await syncUserProfile(fbUser, 'resident');
          setUserProfile(profile);
          localStorage.setItem('nestwell_user_profile', JSON.stringify(profile));
          if (profile.role) {
            setRoleState(profile.role);
            localStorage.setItem('nestwell_role', profile.role);
          }
          if (profile.flat) {
            setResident((prev) => ({
              ...prev,
              name: profile.name || prev.name,
              flat: profile.flat || prev.flat,
              tower: profile.tower || prev.tower,
              phone: profile.phone || prev.phone,
              email: profile.email || prev.email,
            }));
          }
          // If profile is incomplete, trigger mandatory profile completion modal!
          if (!profile.isProfileComplete) {
            setIsProfileCompletionOpen(true);
          }
        } catch (e) {
          console.warn('Could not sync user profile:', e);
        }
      }
    });

    // 3. Setup real-time Firestore listeners
    const unsubUsers = subscribeUsers((uList) => {
      if (uList.length > 0) setRegisteredUsers(uList);
    });

    const unsubVisitors = subscribeVisitors((vList) => {
      if (vList.length > 0) setVisitors(vList);
    });

    const unsubComplaints = subscribeComplaints((cList) => {
      if (cList.length > 0) setComplaints(cList);
    });

    const unsubBills = subscribeBills((bList) => {
      if (bList.length > 0) setBills(bList);
    });

    const unsubElections = subscribeElections((eList) => {
      if (eList.length > 0) setElections(eList);
    });

    const unsubNominations = subscribeNominations((nList) => {
      if (nList.length > 0) setNominations(nList);
    });

    const unsubVotes = subscribeVotes('elec-2026', (vList) => {
      if (vList.length > 0) setVotes(vList);
    });

    const unsubNotices = subscribeNotices((notifList) => {
      if (notifList.length > 0) setNotices(notifList);
    });

    return () => {
      unsubscribeAuth();
      unsubUsers();
      unsubVisitors();
      unsubComplaints();
      unsubBills();
      unsubElections();
      unsubNominations();
      unsubVotes();
      unsubNotices();
    };
  }, []);

  // Local Admin Sign-In (Permanent Society Super Admin with Full Capabilities)
  const loginAsLocalAdmin = () => {
    const adminProfile: UserProfile = {
      id: 'admin-alok-super',
      email: 'admin@greenwood.in',
      name: 'Dr. Alok Nath Mukherjee',
      role: 'admin',
      designation: 'RWA President & Society Admin',
      phone: '+91 98311 88442',
      flat: 'A-701',
      tower: 'Tower A',
      type: 'Owner',
      isProfileComplete: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    };

    setUserProfile(adminProfile);
    localStorage.setItem('nestwell_user_profile', JSON.stringify(adminProfile));
    setRoleState('admin');
    localStorage.setItem('nestwell_role', 'admin');
    showToast('Logged in as Local Super Admin (Dr. Alok Nath Mukherjee, Full Rights)');
  };

  // Promote any member or resident to Society Admin (or change role)
  const promoteToSocietyAdmin = async (
    targetIdentifier: string,
    newRole: UserRole = 'admin',
    designation: string = 'Society Admin & Executive Officer'
  ) => {
    // 1. Update residents array in state and localStorage
    setResidents((prev) =>
      prev.map((r) => {
        if (
          r.id === targetIdentifier ||
          r.flat === targetIdentifier ||
          r.email.toLowerCase() === targetIdentifier.toLowerCase()
        ) {
          return {
            ...r,
            societyRole: newRole,
            designation,
          };
        }
        return r;
      })
    );

    // 2. Update in Firestore if registered user
    try {
      const match = registeredUsers.find(
        (u) =>
          u.id === targetIdentifier ||
          u.email.toLowerCase() === targetIdentifier.toLowerCase() ||
          u.flat === targetIdentifier
      );
      if (match?.id) {
        await updateUserRoleInFirestore(match.id, newRole, designation);
      }
    } catch (err) {
      console.warn('Could not sync user role to Firestore:', err);
    }

    // 3. If currently logged in user is being promoted, elevate their active session
    if (
      userProfile &&
      (userProfile.id === targetIdentifier ||
        userProfile.email.toLowerCase() === targetIdentifier.toLowerCase() ||
        userProfile.flat === targetIdentifier)
    ) {
      const updatedProfile = {
        ...userProfile,
        role: newRole,
        designation,
      };
      setUserProfile(updatedProfile);
      setRoleState(newRole);
      localStorage.setItem('nestwell_user_profile', JSON.stringify(updatedProfile));
      localStorage.setItem('nestwell_role', newRole);
    }

    showToast(
      `Role updated to ${newRole.toUpperCase()} (${designation}). Society admin rights activated!`
    );
  };

  // Quick Demo Account Switcher
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
    if (mockProfile.flat) {
      setResident((prev) => ({
        ...prev,
        name: mockProfile.name,
        flat: mockProfile.flat || prev.flat,
        tower: mockProfile.tower || prev.tower,
        phone: mockProfile.phone || prev.phone,
        email: mockProfile.email,
        avatar: mockProfile.avatar,
      }));
    }
  };

  const completeUserProfileHandler = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;

    // Deeply sanitize base and updates to eliminate any possible undefined properties
    const cleanUpdates = sanitizeFirestoreData(updates);
    const cleanBase = sanitizeFirestoreData(userProfile);

    const updated: UserProfile = sanitizeFirestoreData({
      ...cleanBase,
      ...cleanUpdates,
      isProfileComplete: true,
    });

    // Strip gateNumber and badgeId for non-security roles
    if (updated.role !== 'security') {
      delete updated.gateNumber;
      delete updated.badgeId;
    }

    setUserProfile(updated);
    localStorage.setItem('nestwell_user_profile', JSON.stringify(updated));
    if (updated.role) {
      setRoleState(updated.role);
      localStorage.setItem('nestwell_role', updated.role);
    }
    if (updated.flat) {
      setResident((prev) => ({
        ...prev,
        name: updated.name || prev.name,
        flat: updated.flat || prev.flat,
        tower: updated.tower || prev.tower,
        phone: updated.phone || prev.phone,
      }));
    }
    // Update in Firestore safely
    if (user?.uid) {
      await updateUserProfile(user.uid, updated);
    }
    setIsProfileCompletionOpen(false);
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

  // Persist whenever state changes
  useEffect(() => {
    localStorage.setItem('nestwell_resident', JSON.stringify(resident));
  }, [resident]);

  useEffect(() => {
    localStorage.setItem('nestwell_residents', JSON.stringify(residents));
  }, [residents]);

  useEffect(() => {
    localStorage.setItem('nestwell_visitors', JSON.stringify(visitors));
  }, [visitors]);

  useEffect(() => {
    localStorage.setItem('nestwell_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('nestwell_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('nestwell_facilities', JSON.stringify(facilities));
  }, [facilities]);

  useEffect(() => {
    localStorage.setItem('nestwell_notices', JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    localStorage.setItem('nestwell_activities', JSON.stringify(activities));
  }, [activities]);

  // Visitor actions
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
    const newVisitor: Visitor = {
      id: `vis-${Date.now()}`,
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
      createdAt: 'Just now',
    };

    setVisitors((prev) => [newVisitor, ...prev]);

    // Save to Firestore asynchronously
    createFirestoreVisitor(newVisitor).catch((err) =>
      console.warn('Firestore visitor save notice:', err)
    );

    // Record Activity
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: 'Just now',
        title: `Pre-invited ${newVisitor.name} (${newVisitor.type})`,
        flat: resident.flat,
        type: 'visitor',
        icon: 'UserCheck',
      },
      ...prev,
    ]);

    showToast(`Pass created for ${newVisitor.name}. QR code ready.`);
    return newVisitor;
  };

  const updateVisitorStatus = (id: string, status: Visitor['status']) => {
    setVisitors((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const updated = {
            ...v,
            status,
            entryTime: status === 'inside' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : v.entryTime,
            exitTime: status === 'exited' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : v.exitTime,
          };
          updateFirestoreVisitorStatus(id, updated).catch((err) => console.warn(err));
          return updated;
        }
        return v;
      })
    );
  };

  const approveVisitor = (id: string) => {
    const visitor = visitors.find((v) => v.id === id);
    if (!visitor) return;

    updateVisitorStatus(id, 'inside');
    setGateAlert({ active: false });

    // Confetti celebration
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });

    // Record Activity
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: 'Just now',
        title: `Gate Entry Approved for ${visitor.name}`,
        flat: visitor.flat,
        type: 'visitor',
        icon: 'UserCheck',
      },
      ...prev,
    ]);

    showToast(`Approved! Barrier gate opened for ${visitor.name}.`);
  };

  const rejectVisitor = (id: string) => {
    const visitor = visitors.find((v) => v.id === id);
    updateVisitorStatus(id, 'rejected' as any);
    setGateAlert({ active: false });

    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: 'Just now',
        title: `Entry Denied for ${visitor?.name || 'Visitor'}`,
        flat: visitor?.flat || resident.flat,
        type: 'visitor',
        icon: 'UserX',
      },
      ...prev,
    ]);

    showToast(`Entry denied for ${visitor?.name || 'Visitor'}. Guard notified.`);
  };

  const cancelVisitorPass = (id: string) => {
    setVisitors((prev) => prev.filter((v) => v.id !== id));
    showToast('Visitor pass cancelled.');
  };

  // Complaint actions
  const submitComplaint = (data: {
    category: ComplaintCategory;
    title: string;
    description: string;
    priority?: ComplaintPriority;
    photoUrl?: string;
  }) => {
    const ticket = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newComplaint: Complaint = {
      id: `cmp-${Date.now()}`,
      ticketNumber: ticket,
      title: data.title,
      category: data.category,
      description: data.description,
      flat: resident.flat,
      tower: resident.tower,
      residentName: resident.name,
      residentPhone: resident.phone,
      status: 'reported',
      priority: data.priority || 'Normal',
      reportedAt: 'Just now',
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

    setComplaints((prev) => [newComplaint, ...prev]);
    createFirestoreComplaint(newComplaint).catch((err) => console.warn(err));

    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: 'Just now',
        title: `Reported: ${data.title} (${data.category})`,
        flat: resident.flat,
        type: 'complaint',
        icon: 'Wrench',
      },
      ...prev,
    ]);

    showToast(`Ticket #${ticket} raised successfully.`);
    return newComplaint;
  };

  const updateComplaintStatus = (id: string, status: ComplaintStatus) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = {
            ...c,
            status,
            timeline: [
              ...c.timeline,
              {
                step: status,
                title: `Status changed to ${status}`,
                time: 'Just now',
                done: true,
              },
            ],
          };
          updateFirestoreComplaint(id, updated).catch((err) => console.warn(err));
          return updated;
        }
        return c;
      })
    );
    showToast(`Complaint status updated to ${status}.`);
  };

  const assignComplaint = (id: string, name: string, roleTitle: string, phone: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = {
            ...c,
            status: 'assigned' as ComplaintStatus,
            assignedTo: { name, role: roleTitle, phone },
            timeline: [
              ...c.timeline,
              {
                step: 'assigned' as ComplaintStatus,
                title: `Assigned to ${name} (${roleTitle})`,
                time: 'Just now',
                note: `Contact: ${phone}`,
                done: true,
              },
            ],
          };
          updateFirestoreComplaint(id, updated).catch((err) => console.warn(err));
          return updated;
        }
        return c;
      })
    );
    showToast(`Assigned ticket to technician ${name}.`);
  };

  const addComplaintComment = (id: string, text: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = {
            ...c,
            comments: [
              ...c.comments,
              {
                author: resident.name,
                role: role === 'admin' ? 'Admin' : 'Resident',
                time: 'Just now',
                text,
              },
            ],
          };
          updateFirestoreComplaint(id, updated).catch((err) => console.warn(err));
          return updated;
        }
        return c;
      })
    );
    showToast('Comment posted.');
  };

  // Maintenance bill payment
  const payMaintenanceBill = (billId: string, paymentMethod: string) => {
    const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const transactionId = `TXN-UPI-${Math.floor(100000000 + Math.random() * 900000000)}`;

    setBills((prev) =>
      prev.map((b) => {
        if (b.id === billId) {
          return {
            ...b,
            status: 'Paid',
            paidAt: 'Just now',
            paymentMethod,
            transactionId,
          };
        }
        return b;
      })
    );

    // Update in Firestore
    updateFirestoreBillPayment(billId, paymentMethod, receiptNumber, transactionId).catch((err) =>
      console.warn(err)
    );

    // Update resident profile dues
    setResident((prev) => ({
      ...prev,
      dues: 0,
    }));

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: 'Just now',
        title: `Payment ₹4,600 received via ${paymentMethod}`,
        flat: resident.flat,
        type: 'payment',
        icon: 'CreditCard',
      },
      ...prev,
    ]);

    return { receiptNumber, transactionId };
  };

  // Facility booking
  const bookFacilitySlot = (facilityId: string, slotTime: string, date: string) => {
    setFacilities((prev) =>
      prev.map((f) => {
        if (f.id === facilityId) {
          return {
            ...f,
            slots: f.slots.map((s) => {
              if (s.time === slotTime) {
                return { ...s, status: 'Booked', bookedBy: `${resident.name} (${resident.flat})` };
              }
              return s;
            }),
          };
        }
        return f;
      })
    );

    const fac = facilities.find((f) => f.id === facilityId);
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: 'Just now',
        title: `Facility booked: ${fac?.name || 'Amenity'} (${slotTime})`,
        flat: resident.flat,
        type: 'facility',
        icon: 'Calendar',
      },
      ...prev,
    ]);

    showToast(`Booking confirmed for ${fac?.name || 'Facility'} at ${slotTime}.`);
    return true;
  };

  // Notice creation
  const createNotice = (data: {
    title: string;
    message: string;
    audience: Notice['audience'];
    targetBlock?: string;
    priority?: Notice['priority'];
    attachmentName?: string;
  }) => {
    const newNotice: Notice = {
      id: `not-${Date.now()}`,
      title: data.title,
      category: 'general',
      message: data.message,
      audience: data.audience,
      targetBlock: data.targetBlock,
      date: 'Today',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: data.priority || 'normal',
      attachmentName: data.attachmentName,
      publishedBy: 'Society Managing Committee',
      createdAt: 'Just now',
      read: false,
    };

    setNotices((prev) => [newNotice, ...prev]);
    createFirestoreNotice(newNotice).catch((err) => console.warn(err));

    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: 'Just now',
        title: `Notice published: ${data.title}`,
        flat: 'Society Broadcast',
        type: 'notice',
        icon: 'Megaphone',
      },
      ...prev,
    ]);

    showToast('Community notice published and broadcast to residents.');
    return newNotice;
  };

  const addResident = (newRes: Partial<ResidentProfile>) => {
    const created: ResidentProfile = {
      id: `res-${Date.now()}`,
      name: newRes.name || 'New Resident',
      flat: newRes.flat || 'A-101',
      tower: newRes.tower || 'Tower A',
      phone: newRes.phone || '+91 99999 00000',
      email: newRes.email || 'resident@greenwood.in',
      type: newRes.type || 'Owner',
      status: 'Active',
      moveInDate: 'This month',
      familyMembers: newRes.familyMembers || [],
      vehicles: newRes.vehicles || [],
      dues: 0,
    };

    setResidents((prev) => [created, ...prev]);
    showToast(`Resident ${created.name} added to society directory.`);
  };

  // Election actions
  const castVote = async (data: {
    electionId: string;
    position: ElectionPosition;
    candidateId: string;
    voterId: string;
    voterFlat: string;
  }) => {
    const newVote: Vote = {
      id: `vote-${Date.now()}`,
      electionId: data.electionId,
      position: data.position,
      candidateId: data.candidateId,
      voterId: data.voterId,
      voterFlat: data.voterFlat,
      castAt: new Date().toISOString(),
    };

    // Update local state
    setVotes((prev) => [...prev, newVote]);
    setNominations((prev) =>
      prev.map((n) => (n.id === data.candidateId ? { ...n, voteCount: (n.voteCount || 0) + 1 } : n))
    );
    setElections((prev) =>
      prev.map((e) =>
        e.id === data.electionId ? { ...e, totalVotesCast: (e.totalVotesCast || 0) + 1 } : e
      )
    );

    // Persist in Firestore
    await castFirestoreVote(newVote);
  };

  const submitNomination = async (
    data: Omit<Nomination, 'id' | 'status' | 'voteCount' | 'nominatedAt'>
  ) => {
    const newNom: Nomination = {
      ...data,
      id: `nom-${Date.now()}`,
      status: 'Pending Review',
      voteCount: 0,
      nominatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setNominations((prev) => [newNom, ...prev]);
    await submitFirestoreNomination(newNom);
  };

  const updateNominationStatus = async (id: string, status: Nomination['status']) => {
    setNominations((prev) => prev.map((n) => (n.id === id ? { ...n, status } : n)));
    await updateFirestoreNominationStatus(id, status);
    showToast(`Nomination status updated to ${status}.`);
  };

  const createElection = async (
    data: Omit<Election, 'id' | 'totalVotesCast' | 'createdAt'>
  ) => {
    const newElection: Election = {
      ...data,
      id: `elec-${Date.now()}`,
      totalVotesCast: 0,
      createdAt: new Date().toISOString(),
    };

    setElections((prev) => [newElection, ...prev]);
    await createFirestoreElection(newElection);
  };

  const updateElectionStatus = async (id: string, status: Election['status']) => {
    setElections((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    await updateFirestoreElection(id, { status });
    showToast(`Election status updated to ${status}.`);
  };

  const triggerGateSimulation = () => {
    const rahul = visitors.find((v) => v.name.toLowerCase().includes('rahul'));
    if (rahul) {
      updateVisitorStatus(rahul.id, 'waiting');
      setGateAlert({
        active: true,
        visitor: { ...rahul, status: 'waiting' },
        message: 'Rahul is waiting at Gate 1.',
      });
    } else {
      const sim = inviteVisitor({
        name: 'Rahul',
        phone: '+91 98200 44112',
        purpose: 'Personal Guest',
        expectedDate: 'Today',
        expectedTime: 'Now',
      });
      updateVisitorStatus(sim.id, 'waiting');
      setGateAlert({
        active: true,
        visitor: { ...sim, status: 'waiting' },
        message: 'Rahul is waiting at Gate 1.',
      });
    }
    showToast('Simulation: Security guard at Gate 1 scanned Rahul.');
  };

  const dismissGateAlert = () => {
    setGateAlert({ active: false });
  };

  const resetData = () => {
    localStorage.clear();
    setResident(CURRENT_RESIDENT);
    setResidents(INITIAL_RESIDENTS);
    setVisitors(INITIAL_VISITORS);
    setComplaints(INITIAL_COMPLAINTS);
    setBills(INITIAL_BILLS);
    setFacilities(INITIAL_FACILITIES);
    setNotices(INITIAL_NOTICES);
    setActivities(INITIAL_ACTIVITIES);
    setElections(INITIAL_ELECTIONS);
    setNominations(INITIAL_NOMINATIONS);
    setVotes(INITIAL_VOTES);
    setGateAlert({
      active: true,
      visitor: INITIAL_VISITORS[0],
      message: 'Rahul is waiting at Gate 1.',
    });
    showToast('Society demo data reset to default state.');
  };

  return (
    <AppContext.Provider
      value={{
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
        completeUserProfile: completeUserProfileHandler,
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
