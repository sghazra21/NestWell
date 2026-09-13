import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { QrCodeView } from '../../components/common/QrCodeView';
import { Visitor, VisitorType } from '../../types';
import { User, Phone, Calendar, Clock, Share2, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface InviteVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteVisitorModal: React.FC<InviteVisitorModalProps> = ({ isOpen, onClose }) => {
  const { inviteVisitor, cancelVisitorPass, resident, currentSociety, showToast } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('Personal Guest');
  const [expectedDate, setExpectedDate] = useState('Today');
  const [expectedTime, setExpectedTime] = useState('04:30 PM');
  const [type, setType] = useState<VisitorType>('Guest');
  const [company, setCompany] = useState('');

  const [generatedPass, setGeneratedPass] = useState<Visitor | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const pass = inviteVisitor({
      name: name.trim(),
      phone: phone.trim() || '+91 98000 12345',
      purpose: purpose.trim(),
      expectedDate,
      expectedTime,
      type,
      company: company.trim() || undefined,
    });

    setGeneratedPass(pass);
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setPurpose('Personal Guest');
    setExpectedDate('Today');
    setExpectedTime('04:30 PM');
    setType('Guest');
    setCompany('');
    setGeneratedPass(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={generatedPass ? 'Visitor Entry Pass' : 'Invite Visitor'}
      subtitle={generatedPass ? 'Show QR at Security Gate' : 'Pre-approve entry for your guest or delivery'}
      maxWidth="sm"
    >
      {!generatedPass ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Visitor Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Visitor Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Guest', 'Delivery', 'Service', 'Cab'] as VisitorType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => {
                    setType(t);
                    if (t === 'Delivery') setPurpose('Food/Parcel Delivery');
                    if (t === 'Service') setPurpose('Home Maintenance');
                    if (t === 'Cab') setPurpose('Cab Pick / Drop');
                    if (t === 'Guest') setPurpose('Personal Guest');
                  }}
                  className={`h-11 rounded-xl text-xs font-bold transition-all border ${
                    type === t
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Visitor Name */}
          <div>
            <label htmlFor="visitor-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Visitor Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="visitor-name"
                type="text"
                required
                placeholder="e.g. Ramesh / Sunita Mehta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-sm"
              />
            </div>
          </div>

          {/* Visitor Phone */}
          <div>
            <label htmlFor="visitor-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="visitor-phone"
                type="tel"
                placeholder="+91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-sm"
              />
            </div>
          </div>

          {/* Purpose & Company */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="visitor-purpose" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Purpose
              </label>
              <input
                id="visitor-purpose"
                type="text"
                placeholder="e.g. Dinner / Parcel"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-sm"
              />
            </div>
            <div>
              <label htmlFor="visitor-company" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company / Tag
              </label>
              <input
                id="visitor-company"
                type="text"
                placeholder="e.g. Swiggy, Amazon"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-sm"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="visitor-date" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expected Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  id="visitor-date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-sm"
                >
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="This Weekend">This Weekend</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="visitor-time" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expected Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  id="visitor-time"
                  value={expectedTime}
                  onChange={(e) => setExpectedTime(e.target.value)}
                  className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-sm"
                >
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                  <option value="08:00 PM">08:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              id="generate-pass-btn"
              type="submit"
              className="w-full h-13 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <ShieldCheck className="w-5 h-5 text-indigo-200" />
              <span>Generate Visitor Pass</span>
            </button>
          </div>
        </form>
      ) : (
        /* Generated Visitor Pass Presentation */
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>Pass Created & Gate Synced</span>
          </div>

          {/* Pass Card */}
          <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">{currentSociety?.name || 'Society'} Gate Pass</span>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{generatedPass.name}</h4>
              <p className="text-sm font-medium text-slate-600">
                Visiting Flat <strong className="text-slate-900">{generatedPass.flat}</strong> ({resident.name})
              </p>
            </div>

            {/* Simulated QR code */}
            <div className="flex justify-center">
              <QrCodeView value={generatedPass.qrCode} label={generatedPass.passNumber} size={150} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-left bg-white p-3 rounded-xl border border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block">Expected Arrival</span>
                <span className="font-bold text-slate-800">{generatedPass.expectedDate}, {generatedPass.expectedTime}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Gate Verification</span>
                <span className="font-bold text-indigo-600">Pre-Approved</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 w-full mt-5">
            <button
              id="cancel-pass-btn"
              type="button"
              onClick={() => {
                cancelVisitorPass(generatedPass.id);
                handleReset();
              }}
              className="h-12 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Cancel Pass</span>
            </button>

            <button
              id="share-pass-btn"
              type="button"
              onClick={() => {
                showToast('Share feature coming soon');
              }}
              className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Pass</span>
            </button>
          </div>

          <button
            id="done-pass-btn"
            type="button"
            onClick={handleReset}
            className="w-full mt-3 text-sm font-bold text-slate-500 hover:text-slate-800 py-2"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
};
