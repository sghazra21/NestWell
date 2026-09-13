import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building, Shield, Landmark, Users, Save, Check } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { currentSociety, updateSocietySettings, showToast } = useApp();
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    legalName: currentSociety?.legalName || currentSociety?.name || '',
    registeredNumber: currentSociety?.registeredNumber || '',
    address: currentSociety?.address || '',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSocietySettings({
        legalName: form.legalName,
        registeredNumber: form.registeredNumber,
        address: form.address,
        bankName: form.bankName,
        bankAccount: form.bankAccount,
        bankIfsc: form.bankIfsc,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch {
      showToast('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Society Configuration & Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Society registration profile, banking, security gates, and committee roster
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Society Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b pb-3">
            <Building className="w-5 h-5 text-teal-700" />
            <span>Society Identity & Registration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Society Name
              </label>
              <input
                type="text"
                value={form.legalName}
                onChange={(e) => handleChange('legalName', e.target.value)}
                placeholder="Enter society name"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Registration Number
              </label>
              <input
                type="text"
                value={form.registeredNumber}
                onChange={(e) => handleChange('registeredNumber', e.target.value)}
                placeholder="e.g. RWA-BLR-2018-842"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Society Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter full society address"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Bank Account for Maintenance Collections */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b pb-3">
            <Landmark className="w-5 h-5 text-emerald-700" />
            <span>RWA Bank Account (Maintenance Collections)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="e.g. State Bank of India"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Current A/c Number
              </label>
              <input
                type="text"
                value={form.bankAccount}
                onChange={(e) => handleChange('bankAccount', e.target.value)}
                placeholder="Enter account number"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={form.bankIfsc}
                onChange={(e) => handleChange('bankIfsc', e.target.value)}
                placeholder="e.g. SBIN0004122"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Security Gates & Guard Terminals */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b pb-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Security Gates & Hardware</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-[#FBF9F5] rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900">Gate 1: Main Entrance</div>
                <div className="text-xs text-slate-500">RFID Boom Barrier + Tablet Scanner</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                Online
              </span>
            </div>

            <div className="p-3.5 bg-[#FBF9F5] rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900">Gate 2: Service / Delivery</div>
                <div className="text-xs text-slate-500">Manual Visitor Log + FastTag Scanner</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="h-12 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Society Settings'}</span>
          </button>

          {savedNotice && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Settings saved successfully!</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
