import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Building,
  HelpCircle,
  X,
  FileSpreadsheet,
  Zap,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface IndianPaymentsResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IndianPaymentsResearchModal: React.FC<IndianPaymentsResearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { resident, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [testAmount, setTestAmount] = useState('4600');
  const [testFlat, setTestFlat] = useState(resident.flat || 'B-402');

  if (!isOpen) return null;

  const upiVpa = 'greenwoodrwa@sbi';
  const payeeName = 'Greenwood Heights RWA';
  const transactionNote = `Maintenance_${testFlat}_Sep2026`;
  const upiIntentUri = `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(
    payeeName
  )}&am=${testAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  const handleCopyIntent = () => {
    navigator.clipboard.writeText(upiIntentUri);
    setCopied(true);
    showToast('UPI Deep Link URI copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xs">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
              India Payment Architecture & Research
            </span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight">
            Indian Society Payment Stack (UPI & Gateways)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive blueprint for UPI deep-linking, QR codes, automated flat reconciliation, and RWA regulatory compliance.
          </p>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-xs leading-relaxed">
          {/* Section 1: UPI Integration Standard */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>1. Unified Payments Interface (UPI) Deep-Linking & Dynamic QR</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold text-[10px]">
                NPCI Spec 2.0
              </span>
            </div>
            <p className="text-emerald-900">
              For frictionless payments in India, the application constructs standard NPCI URI schemes. When tapped on mobile devices, this automatically launches installed UPI apps (Google Pay, PhonePe, Paytm, Cred, BHIM) with payee credentials and exact amount pre-locked.
            </p>

            {/* Live Interactive URI generator */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-slate-600 uppercase">
                  Live Dynamic URI Generator for Flat {testFlat}
                </span>
                <button
                  type="button"
                  onClick={handleCopyIntent}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Intent Link'}</span>
                </button>
              </div>

              <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg break-all select-all">
                {upiIntentUri}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>VPA: <strong>{upiVpa}</strong></span>
                  <span>&bull;</span>
                  <span>Amount: <strong>₹{testAmount}</strong></span>
                </div>
                <a
                  href={upiIntentUri}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors"
                >
                  <span>Launch UPI Intent</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Section 2: Gateways Comparison */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>2. Recommended Indian Payment Gateways for Housing Societies</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Razorpay */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-indigo-600">Razorpay</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                      Market Leader
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mb-2">
                    <strong>Smart Collect (Virtual Accounts)</strong> assigns unique virtual account numbers to each flat. When a resident does NEFT/IMPS, it automatically credits their specific flat ledger.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
                  TDR: 0% on UPI, 1.8% Cards &bull; Instant Webhooks
                </div>
              </div>

              {/* Cashfree */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-emerald-600">Cashfree</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                      AutoCollect Pro
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mb-2">
                    Offers <strong>Van-ID UPI mapping</strong> (e.g. <code>GWRWA{testFlat.replace('-', '')}@yesbank</code>). Any UPI payment straight to this ID auto-marks the bill as paid in Firestore.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
                  Zero reconciliation errors &bull; Faster bank settlement
                </div>
              </div>

              {/* Bharat BillPay */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-purple-600">BBPS Channel</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                      RBI Backed
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mb-2">
                    Allows residents to see their Greenwood Heights society maintenance bill directly inside banking apps (HDFC, ICICI, SBI) alongside their electricity and water bills.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
                  Highest elderly trust &bull; Recurring autopay option
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Indian Regulatory & GST Rules */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>3. Indian RWA Tax & Banking Regulatory Compliance</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
              <li>
                <strong>GST Exemption Threshold:</strong> Under CBIC Notification No. 12/2017-CT(R), resident contributions up to <strong>₹7,500 per month per member</strong> for maintenance are exempt from GST, provided society annual turnover does not exceed ₹20 Lakhs.
              </li>
              <li>
                <strong>SAC Code 999598:</strong> When maintenance exceeds ₹7,500/month, 18% GST applies on the entire sum. The platform automatically breaks down CGST (9%) + SGST (9%) on tax invoices.
              </li>
              <li>
                <strong>Designated RWA Escrow:</strong> All funds are routed directly into the society&apos;s scheduled bank current account (State Bank of India &bull; A/C 389201948291), ensuring no intermediary holds resident funds.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulated & Real UPI Payment flow is fully functional in Resident Portal</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
