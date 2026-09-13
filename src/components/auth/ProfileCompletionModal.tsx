import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FamilyMember, Vehicle, VehicleType } from '../../types';
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
  const { userProfile, completeUserProfile, showToast, towers, flats, members } = useApp();

  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [tower, setTower] = useState(userProfile?.tower || '');
  const [flat, setFlat] = useState(userProfile?.flat || '');
  const [occupancyType, setOccupancyType] = useState<'Owner' | 'Tenant'>(userProfile?.type || 'Owner');
  const [emergencyContact, setEmergencyContact] = useState(userProfile?.emergencyContact || '');
  const [emergencyPhone, setEmergencyPhone] = useState(userProfile?.emergencyPhone || '');
  const [family, setFamily] = useState<FamilyMember[]>(userProfile?.familyMembers || []);
  const [vehicles, setVehicles] = useState<Vehicle[]>(userProfile?.vehicles || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen || !userProfile) return null;

  const RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Father-in-Law', 'Mother-in-Law', 'Domestic Help', 'Tenant', 'Other'];
  const VEHICLE_TYPES: VehicleType[] = ['Car', 'Two-Wheeler', 'EV', 'Bicycle'];
  const regRequired = (t: VehicleType) => t === 'Car' || t === 'Two-Wheeler';

  // Vehicle owner must be the user, a listed family member, or a society member.
  const knownNames = new Set(
    [name.trim().toLowerCase(), ...family.map((f) => f.name.trim().toLowerCase()), ...members.map((m) => m.name.trim().toLowerCase())].filter(Boolean)
  );

  const towerFlats = tower
    ? flats.filter((f) => f.towerName === tower || f.towerId === tower)
    : [];

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
      setFormError('Please select your flat from the list.');
      return;
    }
    for (const v of vehicles) {
      if (regRequired(v.type) && !v.number.trim()) {
        setFormError(`Registration number is required for ${v.type}.`);
        return;
      }
      if (!v.ownerName.trim()) {
        setFormError('Each vehicle needs an owner name.');
        return;
      }
      if (!knownNames.has(v.ownerName.trim().toLowerCase())) {
        setFormError(`Vehicle owner "${v.ownerName}" must be you, a listed family member, or a society resident.`);
        return;
      }
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
        familyMembers: family.filter((f) => f.name.trim()).map((f) => ({ name: f.name.trim(), relation: f.relation })),
        vehicles: vehicles.map((v) => ({
          number: v.number.trim().toUpperCase(),
          type: v.type,
          ownerName: v.ownerName.trim(),
          slot: (v.slot || '').trim(),
        })),
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
                  onChange={(e) => {
                    setTower(e.target.value);
                    setFlat('');
                  }}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                >
                  <option value="">Select tower…</option>
                  {towers.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Flat No. *
                </label>
                <select
                  value={flat}
                  onChange={(e) => setFlat(e.target.value)}
                  disabled={!tower || towerFlats.length === 0}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/30 disabled:opacity-60"
                >
                  <option value="">
                    {!tower ? 'Select tower first…' : towerFlats.length === 0 ? 'No flats in this tower…' : 'Select flat…'}
                  </option>
                  {towerFlats.map((f) => (
                    <option key={f.id} value={f.number}>{f.number}</option>
                  ))}
                </select>
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
              <span>
                {towerFlats.length > 0
                  ? `${towerFlats.length} flat(s) in ${tower}`
                  : tower
                    ? `No flats configured in ${tower} yet — ask your Society Admin.`
                    : flats.length > 0
                      ? `${flats.length} flat(s) in society — pick a tower first.`
                      : 'No flats configured in this society yet.'}
              </span>
            </div>
          </div>

          {/* Family Members */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Family Members
              </span>
              <button
                type="button"
                onClick={() => setFamily((prev) => [...prev, { name: '', relation: 'Spouse' }])}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                + Add member
              </button>
            </div>
            {family.length === 0 ? (
              <p className="text-[11px] text-slate-400">No family members added. Optional.</p>
            ) : (
              family.map((f, i) => (
                <div key={i} className="grid grid-cols-5 gap-2">
                  <input
                    value={f.name}
                    onChange={(e) => setFamily((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    placeholder="Full name"
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs col-span-3 outline-none focus:ring-2 focus:ring-indigo-600/30"
                  />
                  <select
                    value={f.relation}
                    onChange={(e) => setFamily((prev) => prev.map((x, j) => (j === i ? { ...x, relation: e.target.value } : x)))}
                    className="h-10 px-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold col-span-1"
                  >
                    {RELATIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setFamily((prev) => prev.filter((_, j) => j !== i))}
                    className="h-10 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Vehicles */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Vehicles & Parking
              </span>
              <button
                type="button"
                onClick={() => setVehicles((prev) => [...prev, { number: '', type: 'Car' as VehicleType, ownerName: name, slot: '' }])}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                + Add vehicle
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Registration number required for cars & two-wheelers. EV & bicycle need no number.
              Owner must be you, a listed family member, or a society resident.
            </p>
            {vehicles.length === 0 ? (
              <p className="text-[11px] text-slate-400">No vehicles added. Optional.</p>
            ) : (
              vehicles.map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <select
                    value={v.type}
                    onChange={(e) => setVehicles((prev) => prev.map((x, j) => (j === i ? { ...x, type: e.target.value as VehicleType } : x)))}
                    className="h-10 px-1 rounded-xl border border-slate-200 bg-white text-xs font-semibold col-span-3"
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    value={v.number}
                    onChange={(e) => setVehicles((prev) => prev.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)))}
                    placeholder={regRequired(v.type) ? 'Reg no. *' : 'Reg no. (optional)'}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs col-span-3 outline-none focus:ring-2 focus:ring-indigo-600/30"
                  />
                  <input
                    value={v.ownerName}
                    onChange={(e) => setVehicles((prev) => prev.map((x, j) => (j === i ? { ...x, ownerName: e.target.value } : x)))}
                    placeholder="Owner name *"
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs col-span-4 outline-none focus:ring-2 focus:ring-indigo-600/30"
                  />
                  <button
                    type="button"
                    onClick={() => setVehicles((prev) => prev.filter((_, j) => j !== i))}
                    className="h-10 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 text-sm font-bold col-span-2"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
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
