import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  UserRole,
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
} from '../mock/initialData';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  society: SocietyInfo;
  resident: ResidentProfile;
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
  // Gate simulation states
  gateAlert: {
    active: boolean;
    visitor?: Visitor;
    message?: string;
  };
  triggerGateSimulation: () => void;
  dismissGateAlert: () => void;
  // Device Frame toggle for desktop users testing mobile UI
  previewMode: 'auto' | 'mobile_frame';
  setPreviewMode: (mode: 'auto' | 'mobile_frame') => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  resetData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  // Initial gate alert state: Rahul waiting at the gate
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
    setRoleState(newRole);
    localStorage.setItem('nestwell_role', newRole);
    showToast(`Switched interface to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)} mode`);
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

  // Actions
  const inviteVisitor = (data: {
    name: string;
    phone: string;
    purpose: string;
    expectedDate: string;
    expectedTime: string;
    type?: Visitor['type'];
    company?: string;
  }) => {
    const passCode = `PASS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVisitor: Visitor = {
      id: `vis-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      flat: resident.flat,
      tower: resident.tower,
      residentName: resident.name,
      purpose: data.purpose || 'Personal Guest',
      type: data.type || 'Guest',
      company: data.company,
      expectedDate: data.expectedDate || 'Today',
      expectedTime: data.expectedTime || '12:00 PM',
      passNumber: passCode,
      qrCode: `GW-${resident.flat}-${passCode}`,
      status: 'expected',
      gateNumber: 'Gate 1',
      createdAt: 'Just now',
    };

    setVisitors((prev) => [newVisitor, ...prev]);
    showToast(`Visitor pass generated for ${data.name} (Code: ${passCode})`);
    return newVisitor;
  };

  const updateVisitorStatus = (id: string, status: Visitor['status']) => {
    setVisitors((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            ...v,
            status,
            entryTime: status === 'inside' ? timeStr : v.entryTime,
            exitTime: status === 'exited' ? timeStr : v.exitTime,
          };
        }
        return v;
      })
    );
  };

  const approveVisitor = (id: string) => {
    const visitor = visitors.find((v) => v.id === id);
    const visitorName = visitor ? visitor.name : 'Visitor';

    updateVisitorStatus(id, 'inside');
    setGateAlert({ active: false });

    // Add activity
    const newAct: ActivityEvent = {
      id: `act-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: `${visitorName} approved at Gate 1`,
      flat: resident.flat,
      type: 'visitor',
      icon: 'UserCheck',
    };
    setActivities((prev) => [newAct, ...prev]);

    showToast(`${visitorName} has entered the society.`);
  };

  const rejectVisitor = (id: string) => {
    const visitor = visitors.find((v) => v.id === id);
    const visitorName = visitor ? visitor.name : 'Visitor';

    updateVisitorStatus(id, 'exited');
    setGateAlert({ active: false });
    showToast(`Entry declined for ${visitorName}. Security informed.`);
  };

  const cancelVisitorPass = (id: string) => {
    setVisitors((prev) => prev.filter((v) => v.id !== id));
    showToast('Visitor pass cancelled.');
  };

  const submitComplaint = (data: {
    category: ComplaintCategory;
    title: string;
    description: string;
    priority?: ComplaintPriority;
    photoUrl?: string;
  }) => {
    const ticketId = `TKT-${Math.floor(100 + Math.random() * 900)}`;
    const newComplaint: Complaint = {
      id: `comp-${Date.now()}`,
      ticketNumber: ticketId,
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
          title: 'Complaint Reported',
          time: 'Just now',
          note: 'Logged by resident via app',
          done: true,
        },
        {
          step: 'assigned',
          title: 'Work Order Assignment',
          time: 'In review',
          note: 'Allocating facility supervisor',
          done: false,
        },
        {
          step: 'started',
          title: 'Technician on Site',
          time: 'Pending',
          done: false,
        },
        {
          step: 'resolved',
          title: 'Resolution Sign-off',
          time: 'Pending',
          done: false,
        },
      ],
      comments: [],
    };

    setComplaints((prev) => [newComplaint, ...prev]);

    // Activity
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: 'Just now',
        title: `Complaint reported: ${data.title}`,
        flat: resident.flat,
        type: 'complaint',
        icon: 'Wrench',
      },
      ...prev,
    ]);

    showToast(`Complaint #${ticketId} created successfully.`);
    return newComplaint;
  };

  const updateComplaintStatus = (id: string, status: ComplaintStatus) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updatedTimeline = c.timeline.map((step) => {
            if (step.step === status) {
              return { ...step, done: true, time: 'Just now' };
            }
            return step;
          });
          return {
            ...c,
            status,
            timeline: updatedTimeline,
          };
        }
        return c;
      })
    );
    showToast(`Complaint status updated to: ${status}`);
  };

  const assignComplaint = (id: string, name: string, roleTitle: string, phone: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updatedTimeline = c.timeline.map((step) => {
            if (step.step === 'assigned') {
              return { ...step, done: true, time: 'Just now', note: `Assigned to ${name}` };
            }
            return step;
          });
          return {
            ...c,
            status: 'assigned' as ComplaintStatus,
            assignedTo: { name, role: roleTitle, phone },
            timeline: updatedTimeline,
          };
        }
        return c;
      })
    );
    showToast(`Technician ${name} assigned to ticket.`);
  };

  const addComplaintComment = (id: string, text: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            comments: [
              ...c.comments,
              {
                author: role === 'admin' ? 'Admin Office' : resident.name,
                role: role === 'admin' ? 'Admin' : 'Resident',
                time: 'Just now',
                text,
              },
            ],
          };
        }
        return c;
      })
    );
    showToast('Note added to complaint record.');
  };

  const payMaintenanceBill = (billId: string, paymentMethod: string) => {
    const receiptNum = `NW-REC-${Math.floor(10000 + Math.random() * 90000)}`;
    const txId = `UPI-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    setBills((prev) =>
      prev.map((b) => {
        if (b.id === billId || b.flat === resident.flat) {
          return {
            ...b,
            status: 'Paid' as const,
            paidAt: 'Just now',
            paymentMethod,
            transactionId: txId,
          };
        }
        return b;
      })
    );

    // Update current resident dues
    setResident((prev) => ({
      ...prev,
      dues: 0,
    }));

    // Add activity
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: 'Just now',
        title: `Payment received ₹4,600`,
        flat: resident.flat,
        type: 'payment',
        icon: 'CreditCard',
      },
      ...prev,
    ]);

    // Delightful celebration
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0F766E', '#22C55E', '#1E293B', '#D97706'],
      });
    } catch {
      // safe fallback
    }

    showToast('Maintenance fee settled! Official receipt issued.');
    return { receiptNumber: receiptNum, transactionId: txId };
  };

  const bookFacilitySlot = (facilityId: string, slotTime: string, _date: string) => {
    setFacilities((prev) =>
      prev.map((f) => {
        if (f.id === facilityId) {
          const updatedSlots = f.slots.map((s) => {
            if (s.time === slotTime) {
              return {
                ...s,
                status: 'Booked' as const,
                bookedBy: `Flat ${resident.flat} (${resident.name})`,
              };
            }
            return s;
          });
          return { ...f, slots: updatedSlots };
        }
        return f;
      })
    );

    // Activity
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

    // Activity
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

    showToast('Community notice published successfully.');
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
    showToast(`Resident ${created.name} added to directory.`);
  };

  const triggerGateSimulation = () => {
    // Check if there is a waiting visitor or generate one
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
    showToast('Simulation: Security has scanned Rahul at Gate 1.');
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
    setGateAlert({
      active: true,
      visitor: INITIAL_VISITORS[0],
      message: 'Rahul is waiting at Gate 1.',
    });
    showToast('Demo data reset to default state.');
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        society,
        resident,
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
