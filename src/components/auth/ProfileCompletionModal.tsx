import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Home,
  ShieldCheck,
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
  const [tower, setTower] = useState(userProfile?.tower || 'Tower B');
  const [flat, setFlat] = useState(userProfile?.flat || '');
  const [occupancyType, setOccupancyType] = useState<'Owner' | 'Tenant'>(userProfile?.type || 'Owner');
  const [emergencyContact, setEmergencyContact] = useState(userProfile?.emergencyContact || '');
  const [emergencyPhone, setEmergencyPhone] = useState(userProfile?.emergencyPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen || !userProfile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter your full legal name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please provide a mobile number for gate entry notifications.');
      return;
    }
    if (!flat.trim()) {
      setFormError('Please provide your flat number (e.g. B-402, A-201).');
      return;
    }

    setIsSubmitting(true);
    try {
      // Profile payload strictly for resident verification.
      // Roles are solely assigned and elevated by Society Admins.
      const profilePayload: Record<string, any> = {
        name: name.trim(),
        phone: phone.trim(),
        role: userProfile.role || 'resident',
        tower,
        flat: flat.trim().toUpperCase(),
        type: occupancyType,
        isProfileComplete: true,
      };

      if (emergencyContact.trim()) {
        profilePayload.emergencyContact = emergencyContact.trim();
      }
      if (emergencyPhone.trim()) {
        profilePayload.emergencyPhone = emergencyPhone.trim();
      }

      await completeUserProfile(profilePayload);

      showToast('Profile and flat verified successfully!');
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2 border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Apartment Flat Verification</span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight">
            Complete Your Society Profile
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Society bylaws require all residents to link their verified apartment unit and mobile contact for gate approvals and society billing.
          </p>
        </div>

        {/* Data Pulled From Google/Firebase Banner */}
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

          {/* Full Name & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Legal Name *
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
                Mobile (+91) *
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

          {/* Resident Flat Details */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Apartment Flat Assignment *
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Verified Resident Access
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Tower / Wing
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

            {/* Quick helper note */}
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Flats in society: A-101 to A-904, B-101 to B-904, C-101 to C-904</span>
            </div>
          </div>

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
                  <span>Save Flat & Activate Society Access</span>
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
