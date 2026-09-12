import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
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
  LogOut,
  ParkingCircle,
  Lock,
} from 'lucide-react';

export const ResidentMore: React.FC = () => {
  const { resident, setRole } = useApp();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const menuSections = [
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
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24">
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
                onClick={() => setActiveModal(item.id)}
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

      {/* Switch to Admin Role helper inside More */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
        <div>
          <h5 className="text-xs font-bold text-teal-900">Are you an RWA Committee Member?</h5>
          <p className="text-[11px] text-teal-700">Access the full society administration dashboard.</p>
        </div>
        <button
          onClick={() => setRole('admin')}
          className="px-3.5 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs shadow-sm hover:bg-teal-800 transition-colors"
        >
          Open Admin Web
        </button>
      </div>

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
                alert('Add member form opened. Verification SMS will be sent to the contact.');
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
              { name: 'Security Main Gate (Gate 1)', phone: '080-2345-0001', note: 'Intercom 101' },
              { name: 'Security Service Gate (Gate 2)', phone: '080-2345-0002', note: 'Intercom 102' },
              { name: 'Society Manager (Col. Nair)', phone: '+91 97456 78901', note: 'Office Tower B' },
              { name: 'On-Duty Electrician (Ramu)', phone: '+91 98221 44556', note: '24/7 Service' },
              { name: 'On-Duty Plumber (Rajesh)', phone: '+91 98451 22334', note: '24/7 Service' },
              { name: 'Local Police Station (Koramangala)', phone: '112 / 080-2294-2200', note: 'Law & Order' },
              { name: 'Ambulance / Manipal Hospital', phone: '108 / 080-2502-4444', note: 'Emergency Care' },
            ].map((c, i) => (
              <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{c.name}</h5>
                  <p className="text-[11px] text-slate-500">{c.note}</p>
                </div>
                <a
                  href={`tel:${c.phone}`}
                  className="px-3 py-1.5 rounded-lg bg-teal-700 text-white font-bold text-xs flex items-center gap-1 hover:bg-teal-800"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Call</span>
                </a>
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
          subtitle="Greenwood Heights RWA"
          maxWidth="sm"
        >
          <div className="p-4 text-center space-y-3">
            <p className="text-sm text-slate-600">
              Verified records for <strong>Flat {resident.flat}</strong> are actively maintained by the Society Secretariat.
            </p>
            <div className="p-3 bg-teal-50 rounded-xl text-xs text-teal-800 font-semibold">
              All records updated as of September 2024.
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
