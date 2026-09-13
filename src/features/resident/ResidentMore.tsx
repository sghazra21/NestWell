import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { openWhatsApp } from '../../lib/whatsapp';
import {
  Home,
  Users,
  Car,
  FileText,
  Settings,
  Bell,
  HelpCircle,
  PhoneCall,
  ChevronRight,
  Shield,
  Vote,
  CreditCard,
  UserCheck,
  Building,
  MessageCircle,
} from 'lucide-react';

export const ResidentMore: React.FC = () => {
  const {
    resident,
    currentSociety,
    canAccessAdminView,
    setViewMode,
    setIsElectionModalOpen,
    setIsPaymentsResearchOpen,
    setIsProfileCompletionOpen,
    showToast,
  } = useApp();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const menuSections = [
    ...(canAccessAdminView
      ? [
          {
            title: 'Elevated Society Privileges',
            items: [
              {
                id: 'admin_console',
                label: 'Society Admin Console',
                sub: 'Access Flats, Billing, Staff, Visitors & Reports',
                icon: <Shield className="w-5 h-5 text-indigo-600" />,
                action: () => setViewMode('admin'),
              },
            ],
          },
        ]
      : []),
    {
      title: 'Governance & Payments',
      items: [
        {
          id: 'election',
          label: 'Society Committee & Elections',
          sub: 'Digital Ballot, Nominee Manifestos & RWA Board',
          icon: <Vote className="w-5 h-5 text-indigo-600" />,
          action: () => setIsElectionModalOpen(true),
        },
        {
          id: 'payments',
          label: 'India Payments Blueprint & UPI',
          sub: 'NPCI Spec, Van-ID Bank Reconciliation, RWA GST',
          icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
          action: () => setIsPaymentsResearchOpen(true),
        },
        {
          id: 'profile',
          label: 'Verified Society Profile',
          sub: 'Owner/Tenant Verification & Move-In Records',
          icon: <UserCheck className="w-5 h-5 text-blue-600" />,
          action: () => setIsProfileCompletionOpen(true),
        },
      ],
    },
    {
      title: 'My Residence',
      items: [
        { id: 'flat', label: 'My Flat Details', sub: `Flat ${resident.flat} • ${resident.tower}`, icon: <Home className="w-5 h-5 text-teal-700" /> },
        { id: 'family', label: 'Family Members', sub: `${resident.familyMembers.length} registered`, icon: <Users className="w-5 h-5 text-blue-600" /> },
        { id: 'vehicles', label: 'Vehicles & Parking', sub: `${resident.vehicles.length} vehicle tags`, icon: <Car className="w-5 h-5 text-indigo-600" /> },
        { id: 'documents', label: 'Society Documents', sub: 'Bylaws, No Objection Certificates', icon: <FileText className="w-5 h-5 text-amber-600" /> },
      ],
    },
    {
      title: 'Preferences & Safety',
      items: [
        { id: 'notifications', label: 'Notification Preferences', sub: 'WhatsApp & Gate Alerts', icon: <Bell className="w-5 h-5 text-purple-600" /> },
        { id: 'emergency', label: 'Emergency Contacts', sub: 'Security Gate, Police, Ambulance', icon: <PhoneCall className="w-5 h-5 text-red-600" /> },
        { id: 'settings', label: 'Account & Security', sub: 'Password, Biometric Lock', icon: <Settings className="w-5 h-5 text-slate-600" /> },
        { id: 'help', label: 'Help & Concierge', sub: 'RWA Office Timings & FAQs', icon: <HelpCircle className="w-5 h-5 text-teal-600" /> },
      ],
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto pb-24">
      {/* Resident Profile Snapshot */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
          {resident.name.split(' ').map((n) => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900 truncate">{resident.name}</h3>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">
              {resident.type}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Flat {resident.flat} • {resident.phone}</p>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
            <Shield className="w-3.5 h-3.5" />
            <span>KYC & Police Verification Verified</span>
          </div>
        </div>
      </div>

      {/* Grouped Menu Cards */}
      {menuSections.map((sec) => (
        <div key={sec.title} className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            {sec.title}
          </h4>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-xs">
            {sec.items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if ('action' in item && item.action) {
                    item.action();
                  } else {
                    setActiveModal(item.id);
                  }
                }}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FBF9F5] flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{item.label}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      ))}
      {/* Modals for items */}
      {/* 1. Family Members Modal */}
      {activeModal === 'family' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="Family Members"
          subtitle={`Registered residents of Flat ${resident.flat}`}
          maxWidth="sm"
        >
          <div className="space-y-3">
            {resident.familyMembers.map((m, idx) => (
              <div key={idx} className="p-3.5 bg-[#FBF9F5] border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-bold text-slate-900">{m.name}</h5>
                  <p className="text-xs text-slate-500">{m.relation} {m.phone ? `• ${m.phone}` : ''}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-white text-teal-800 border border-teal-200 text-xs font-bold">
                  Access Key Active
                </span>
              </div>
            ))}
            <button
              onClick={() => {
                showToast('Family management coming soon');
                setActiveModal(null);
              }}
              className="w-full h-12 rounded-xl border border-teal-700 text-teal-700 font-bold text-sm hover:bg-teal-50"
            >
              + Add Family Member
            </button>
          </div>
        </Modal>
      )}

      {/* 2. Vehicles Modal */}
      {activeModal === 'vehicles' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="Vehicles & Parking"
          subtitle={`Allocated slots for Flat ${resident.flat}`}
          maxWidth="sm"
        >
          <div className="space-y-3">
            {resident.vehicles.map((v, idx) => (
              <div key={idx} className="p-3.5 bg-[#FBF9F5] border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Car className="w-5 h-5 text-teal-700" />
                  <div>
                    <h5 className="text-sm font-mono font-bold text-slate-900">{v.number}</h5>
                    <p className="text-xs text-slate-500">{v.type} • Assigned Slot: {v.slot}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  FASTag / RFID Linked
                </span>
              </div>
            ))}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              Automatic gate boom opens via RFID sticker on windshield.
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Emergency Contacts */}
      {activeModal === 'emergency' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="Emergency Contacts"
          subtitle="24×7 Society Helpline & Emergency"
          maxWidth="sm"
        >
          <div className="space-y-2.5">
            {[
              { name: 'Security Gate', phone: '+911234567890', message: `Emergency help needed at ${currentSociety?.name || 'Society'}, Flat ${resident.flat}` },
              { name: 'Police', phone: '100', message: `Police emergency at ${currentSociety?.name || 'Society'}, Flat ${resident.flat}` },
              { name: 'Ambulance', phone: '108', message: `Medical emergency at ${currentSociety?.name || 'Society'}, Flat ${resident.flat}` },
            ].map((contact) => (
              <div key={contact.name} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-bold text-slate-900">{contact.name}</h5>
                  <p className="text-xs text-slate-500">{contact.phone}</p>
                </div>
                <button
                  onClick={() => openWhatsApp(contact.phone, contact.message)}
                  className="h-9 px-3 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center gap-1 text-xs font-bold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Fallback generic modal for others */}
      {activeModal && activeModal !== 'family' && activeModal !== 'vehicles' && activeModal !== 'emergency' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title={activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}
          subtitle={currentSociety?.name || 'Society'}
          maxWidth="sm"
        >
          <div className="p-4 text-center space-y-3">
            <p className="text-sm text-slate-600">
              Verified records for <strong>Flat {resident.flat}</strong> are actively maintained by the Society Secretariat.
            </p>
            <div className="p-3 bg-teal-50 rounded-xl text-xs text-teal-800 font-semibold">
              All records updated as of September 2026.
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full h-11 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              OK
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
