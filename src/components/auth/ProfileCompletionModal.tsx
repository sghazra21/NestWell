import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Building,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Home,
  Shield,
  Briefcase,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { userProfile, completeUserProfile, showToast } = useApp();

  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [role, setRole] = useState<UserRole>(userProfile?.role || 'resident');
  const [tower, setTower] = useState(userProfile?.tower || 'Tower B');
  const [flat, setFlat] = useState(userProfile?.flat || '');
  const [occupancyType, setOccupancyType] = useState<'Owner' | 'Tenant'>('Owner');
  const [gateNumber, setGateNumber] = useState('Gate 1 - Main Gate');
  const [badgeId, setBadgeId] = useState('');
  const [designation, setDesignation] = useState('RWA Executive Member');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen || !userProfile) return null;

  const hasPulledGoogleName = Boolean(userProfile.name && userProfile.name !== 'Resident User');
  const hasPulledGoogleEmail = Boolean(userProfile.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter your full legal name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please provide a mobile number for gate notifications.');
      return;
    }

    if (role === 'resident' && !flat.trim()) {
      setFormError('Please select or specify your flat number (e.g. B-402).');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        role,
        tower: role === 'resident' ? tower : undefined,
        flat: role === 'resident' ? flat.trim().toUpperCase() : undefined,
        type: role === 'resident' ? occupancyType : undefined,
        gateNumber: role === 'security' ? gateNumber : undefined,
        badgeId: role === 'security' ? badgeId.trim() || 'SEC-042' : undefined,
        designation: role === 'admin' || role === 'committee' ? designation : undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
        isProfileComplete: true,
      });

      showToast('Profile verified and saved successfully!');
      onClose();
    } catch (err: any) {
      console.error('Failed to complete profile:', err);
      setFormError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header banner */}
        <div className="bg-slate-900 text-white p-6 pb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-2 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Mandatory Verification Step</span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight">
            Complete Your Society Profile
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Greenwood Heights bylaws require all residents and staff to link their verified flat and contact credentials.
          </p>
        </div>

        {/* Data Pulled From Google Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-2 text-xs">
          <span className="font-bold text-slate-600 block uppercase text-[10px] tracking-wider">
            Verified Authentication Data Pulled
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block">Email Address</span>
                <span className="font-semibold text-slate-800 truncate block">{userProfile.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block">Account Status</span>
                <span className="font-semibold text-emerald-700 block">Firebase Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Role selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Select Your Society Role *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'resident', label: 'Resident', desc: 'Flat Owner/Tenant', icon: Home },
                { id: 'admin', label: 'Admin / Committee', desc: 'RWA Management', icon: Briefcase },
                { id: 'security', label: 'Security Guard', desc: 'Gate Staff', icon: Shield },
              ].map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as UserRole)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {r.label}
                    </div>
                    <div className="text-[10px] text-slate-500">{r.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sayan Ghosh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600/30 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone (+91) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600/30 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Resident Details if resident */}
          {role === 'resident' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Apartment Flat Assignment
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Tower
                  </label>
                  <select
                    value={tower}
                    onChange={(e) => setTower(e.target.value)}
                    className="w-full h-10 px-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                  >
                    <option value="Tower A">Tower A</option>
                    <option value="Tower B">Tower B</option>
                    <option value="Tower C">Tower C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Flat No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-402"
                    value={flat}
                    onChange={(e) => setFlat(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Occupancy
                  </label>
                  <select
                    value={occupancyType}
                    onChange={(e) => setOccupancyType(e.target.value as any)}
                    className="w-full h-10 px-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Tenant">Tenant</option>
                  </select>
                </div>
              </div>

              {/* Quick helper badge */}
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Popular flats in demo: A-203, B-402, C-502, B-701</span>
              </div>
            </div>
          )}

          {/* Security Guard Details */}
          {role === 'security' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Security Post Assignment
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Assigned Gate
                  </label>
                  <select
                    value={gateNumber}
                    onChange={(e) => setGateNumber(e.target.value)}
                    className="w-full h-10 px-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                  >
                    <option value="Gate 1 - Main Entrance">Gate 1 - Main Entrance</option>
                    <option value="Gate 2 - North Gate">Gate 2 - North Gate</option>
                    <option value="Gate 3 - Service Gate">Gate 3 - Service Gate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Guard Badge ID
                  </label>
                  <input
                    type="text"
                    placeholder="SEC-042"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Admin / Committee details */}
          {(role === 'admin' || role === 'committee') && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                RWA Committee Portfolio
              </span>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Designation / Position
                </label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                >
                  <option value="RWA President">RWA President</option>
                  <option value="General Secretary">General Secretary</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Cultural Secretary">Cultural Secretary</option>
                  <option value="Managing Committee Member">Managing Committee Member</option>
                </select>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Pooja Ghosh"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Emergency Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43211"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600/30 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save & Activate Society Access</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
