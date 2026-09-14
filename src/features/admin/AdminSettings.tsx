import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building, Shield, Landmark, Users, Phone, CreditCard, Save, Check, Upload, X } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const AdminSettings: React.FC = () => {
  const { currentSociety, updateSocietySettings, showToast } = useApp();
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentSociety?.logoUrl || null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [form, setForm] = useState({
    legalName: currentSociety?.legalName || currentSociety?.name || '',
    registeredNumber: currentSociety?.registeredNumber || '',
    address: currentSociety?.address || '',
    city: currentSociety?.city || '',
    contactEmail: currentSociety?.contact?.email || '',
    contactPhone: currentSociety?.contact?.phone || '',
    gate1Name: currentSociety?.gates?.[0]?.name || 'Main Gate',
    gate1Active: currentSociety?.gates?.[0]?.active ?? true,
    gate2Name: currentSociety?.gates?.[1]?.name || 'Service Gate',
    gate2Active: currentSociety?.gates?.[1]?.active ?? true,
    emergencySecurity: currentSociety?.emergencyContacts?.security || '',
    emergencyManager: currentSociety?.emergencyContacts?.manager || '',
    emergencyElectrician: currentSociety?.emergencyContacts?.electrician || '',
    emergencyPlumber: currentSociety?.emergencyContacts?.plumber || '',
    emergencyPolice: currentSociety?.emergencyContacts?.police || '',
    emergencyAmbulance: currentSociety?.emergencyContacts?.ambulance || '',
    currency: currentSociety?.currency || '₹',
    defaultDueDay: currentSociety?.billing?.defaultDueDay?.toString() || '10',
    upiId: currentSociety?.payment?.upiId || '',
    payeeName: currentSociety?.payment?.payeeName || currentSociety?.name || '',
  });

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo must be under 2MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleUploadLogo = async () => {
    if (!logoFile || !currentSociety) return;
    setIsUploadingLogo(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `societies/${currentSociety.id}/branding/logo`);
      await uploadBytes(storageRef, logoFile);
      const url = await getDownloadURL(storageRef);
      await updateSocietySettings({ logoUrl: url });
      setLogoFile(null);
      showToast('Logo updated successfully');
    } catch {
      showToast('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogoFromSociety = async () => {
    if (!currentSociety) return;
    setIsUploadingLogo(true);
    try {
      await updateSocietySettings({ logoUrl: '' });
      setLogoFile(null);
      setLogoPreview(null);
      showToast('Logo removed');
    } catch {
      showToast('Failed to remove logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSocietySettings({
        legalName: form.legalName,
        registeredNumber: form.registeredNumber,
        address: form.address,
        city: form.city,
        contact: {
          email: form.contactEmail,
          phone: form.contactPhone,
        },
        gates: [
          { id: 'gate-1', name: form.gate1Name, active: form.gate1Active },
          { id: 'gate-2', name: form.gate2Name, active: form.gate2Active },
        ],
        emergencyContacts: {
          security: form.emergencySecurity,
          manager: form.emergencyManager,
          electrician: form.emergencyElectrician,
          plumber: form.emergencyPlumber,
          police: form.emergencyPolice,
          ambulance: form.emergencyAmbulance,
        },
        billing: {
          currency: form.currency,
          defaultDueDay: parseInt(form.defaultDueDay, 10) || 10,
        },
        payment: {
          upiId: form.upiId,
          payeeName: form.payeeName,
        },
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
          Society registration profile, contact, gates, emergency numbers, billing, and payments
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

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                City
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="e.g. Bangalore"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Society Branding */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b pb-3">
            <Upload className="w-5 h-5 text-purple-600" />
            <span>Society Branding</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {logoPreview ? (
                <div className="relative">
                  <img src={logoPreview} alt="Society logo" className="h-20 w-20 rounded-xl object-contain border border-slate-200" />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs text-slate-600 font-semibold">
                Upload your society logo. It will appear on payment receipts and other documents.
              </p>
              <p className="text-[11px] text-slate-400">
                Recommended: Square image, max 2MB, PNG or JPG
              </p>
              <div className="flex items-center gap-2">
                <label className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoFile ? 'Change File' : 'Choose File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                </label>
                {logoFile && (
                  <button
                    type="button"
                    onClick={handleUploadLogo}
                    disabled={isUploadingLogo}
                    className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isUploadingLogo ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      'Upload Logo'
                    )}
                  </button>
                )}
                {currentSociety?.logoUrl && !logoFile && (
                  <button
                    type="button"
                    onClick={handleRemoveLogoFromSociety}
                    disabled={isUploadingLogo}
                    className="h-9 px-4 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b pb-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <span>Contact Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="society@example.com"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Security Gates */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b pb-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Security Gates</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-[#FBF9F5] rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={form.gate1Name}
                  onChange={(e) => handleChange('gate1Name', e.target.value)}
                  className="font-bold text-sm text-slate-900 bg-transparent border-none outline-none w-full"
                />
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.gate1Active}
                    onChange={(e) => handleChange('gate1Active', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs font-bold text-slate-600">Active</span>
                </label>
              </div>
            </div>

            <div className="p-3.5 bg-[#FBF9F5] rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={form.gate2Name}
                  onChange={(e) => handleChange('gate2Name', e.target.value)}
                  className="font-bold text-sm text-slate-900 bg-transparent border-none outline-none w-full"
                />
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.gate2Active}
                    onChange={(e) => handleChange('gate2Active', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs font-bold text-slate-600">Active</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b pb-3">
            <Phone className="w-5 h-5 text-red-600" />
            <span>Emergency Contacts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Security</label>
              <input
                type="tel"
                value={form.emergencySecurity}
                onChange={(e) => handleChange('emergencySecurity', e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Manager</label>
              <input
                type="tel"
                value={form.emergencyManager}
                onChange={(e) => handleChange('emergencyManager', e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Electrician</label>
              <input
                type="tel"
                value={form.emergencyElectrician}
                onChange={(e) => handleChange('emergencyElectrician', e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plumber</label>
              <input
                type="tel"
                value={form.emergencyPlumber}
                onChange={(e) => handleChange('emergencyPlumber', e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Police</label>
              <input
                type="tel"
                value={form.emergencyPolice}
                onChange={(e) => handleChange('emergencyPolice', e.target.value)}
                placeholder="100"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ambulance</label>
              <input
                type="tel"
                value={form.emergencyAmbulance}
                onChange={(e) => handleChange('emergencyAmbulance', e.target.value)}
                placeholder="108"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Billing & Payment */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b pb-3">
            <CreditCard className="w-5 h-5 text-emerald-700" />
            <span>Billing & Payment</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="₹">₹ (INR)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Default Due Day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.defaultDueDay}
                onChange={(e) => handleChange('defaultDueDay', e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">UPI ID</label>
              <input
                type="text"
                value={form.upiId}
                onChange={(e) => handleChange('upiId', e.target.value)}
                placeholder="society@upi"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payee Name</label>
              <input
                type="text"
                value={form.payeeName}
                onChange={(e) => handleChange('payeeName', e.target.value)}
                placeholder="Society Name RWA"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
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
