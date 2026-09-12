import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import {
  CreditCard,
  CheckCircle2,
  Download,
  ShieldCheck,
  ArrowRight,
  Share2,
  QrCode,
  ExternalLink,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { IndianPaymentsResearchModal } from '../../components/payment/IndianPaymentsResearchModal';

interface PayMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PayMaintenanceModal: React.FC<PayMaintenanceModalProps> = ({ isOpen, onClose }) => {
  const { resident, bills, payMaintenanceBill, showToast } = useApp();

  const activeBill = bills.find((b) => b.flat === resident.flat && b.status !== 'Paid') || bills[0];

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiOption, setUpiOption] = useState<'qr' | 'intent' | 'vpa'>('qr');
  const [upiId, setUpiId] = useState('sayan@oksbi');
  const [utrNumber, setUtrNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    receiptNumber: string;
    transactionId: string;
  } | null>(null);

  const [showReceiptView, setShowReceiptView] = useState(false);

  const billAmount = activeBill ? activeBill.totalAmount : 4600;
  const upiVpa = 'greenwoodrwa@sbi';
  const payeeName = 'Greenwood Heights RWA';
  const upiIntentUri = `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(
    payeeName
  )}&am=${billAmount}&cu=INR&tn=${encodeURIComponent(`Maint_${resident.flat}_Sep2026`)}`;

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const txId = utrNumber.trim() ? `UTR-${utrNumber.trim()}` : `UPI-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const result = payMaintenanceBill(
        activeBill?.id || 'bill-1',
        paymentMethod === 'upi'
          ? `UPI (${upiOption.toUpperCase()} • ${txId})`
          : paymentMethod === 'card'
          ? 'RuPay Debit Card'
          : 'HDFC NetBanking'
      );
      setIsProcessing(false);
      setPaymentResult({
        success: true,
        receiptNumber: result.receiptNumber,
        transactionId: result.transactionId || txId,
      });
      showToast('Maintenance dues settled! Ledger updated in Firestore.');
    }, 1200);
  };

  const handleReset = () => {
    setPaymentResult(null);
    setShowReceiptView(false);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleReset}
        title={paymentResult ? 'Payment Status' : 'Pay Maintenance'}
        subtitle={paymentResult ? 'Society Account Credited' : `Flat ${resident.flat} • September 2026`}
        maxWidth="md"
      >
        {!paymentResult ? (
          <div className="space-y-5">
            {/* Top Due Card & Research link */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center relative">
              <button
                type="button"
                onClick={() => setIsResearchModalOpen(true)}
                className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100/80 hover:bg-indigo-200 text-indigo-800 text-[10px] font-bold transition-colors"
              >
                <HelpCircle className="w-3 h-3" />
                <span>India Payments Blueprint</span>
              </button>

              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Total Amount Payable
              </span>
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                ₹{billAmount.toLocaleString('en-IN')}
              </div>
              <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                Due Date: 10th Sep 2026
              </span>

              {/* Itemized Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5 text-left text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Monthly Maintenance</span>
                  <span className="font-semibold text-slate-900">₹4,000</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Covered Parking (2 slots)</span>
                  <span className="font-semibold text-slate-900">₹500</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Late Fee</span>
                  <span className="font-semibold text-slate-900">₹100</span>
                </div>
                <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Due</span>
                  <span className="text-indigo-600">₹{billAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Indian Payment Mode
              </label>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <QrCode className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                  <span>Instant UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                  <span>RuPay / Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                  <span>NetBanking</span>
                </button>
              </div>

              {/* UPI Sub-options */}
              {paymentMethod === 'upi' && (
                <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUpiOption('qr')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        upiOption === 'qr' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border'
                      }`}
                    >
                      Dynamic QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiOption('intent')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        upiOption === 'intent' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border'
                      }`}
                    >
                      UPI Apps / Intent
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiOption('vpa')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        upiOption === 'vpa' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border'
                      }`}
                    >
                      Enter VPA ID
                    </button>
                  </div>

                  {upiOption === 'qr' && (
                    <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-indigo-100 text-center">
                      <div className="w-40 h-40 bg-slate-900 rounded-xl p-2.5 flex items-center justify-center shadow-md">
                        {/* Dynamic SVG QR representation with amount & VPA */}
                        <div className="w-full h-full bg-white p-1.5 rounded-lg flex flex-col items-center justify-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                              upiIntentUri
                            )}`}
                            alt="UPI QR Code"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Fallback display
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 mt-2 block">
                        Scan with Google Pay, PhonePe, Paytm, BHIM, Cred
                      </span>
                      <span className="text-[10px] text-slate-500">
                        VPA: <strong>{upiVpa}</strong> &bull; Exact Amount Locked
                      </span>
                    </div>
                  )}

                  {upiOption === 'intent' && (
                    <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-2 text-center">
                      <p className="text-xs text-slate-600">
                        Tap below to open installed UPI payment apps on your phone:
                      </p>
                      <a
                        href={upiIntentUri}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Launch UPI App Intent (GPay/PhonePe)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {upiOption === 'vpa' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Your UPI ID (VPA)
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900"
                      />
                    </div>
                  )}

                  {/* UTR Optional Verification */}
                  <div className="pt-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Bank Reference / UTR Number (12-Digit - Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 428190382910"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      defaultValue="4532 •••• •••• 8419"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Expiry
                      </label>
                      <input
                        type="text"
                        defaultValue="08/29"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        defaultValue="•••"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Select Your Bank
                  </label>
                  <select className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                    <option>State Bank of India (SBI)</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                    <option>Punjab National Bank</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct settlement into Greenwood Heights RWA State Bank Current A/c</span>
            </div>

            {/* Pay Button */}
            <button
              id="pay-now-btn"
              onClick={handlePayNow}
              disabled={isProcessing}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment via NPCI Gateway...</span>
                </span>
              ) : (
                <span>Pay ₹{billAmount.toLocaleString('en-IN')} & Generate Receipt</span>
              )}
            </button>
          </div>
        ) : !showReceiptView ? (
          /* Payment Successful Confirmation */
          <div className="flex flex-col items-center text-center py-2 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-2xl font-bold text-slate-900">Payment Verified</h4>
              <div className="text-3xl font-extrabold text-indigo-600 mt-1">
                ₹{billAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Transaction / UTR: <span className="font-mono text-slate-700">{paymentResult.transactionId}</span>
              </p>
            </div>

            <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Settled Unit</span>
                <span className="font-bold text-slate-900">Flat {resident.flat} ({resident.name})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Number</span>
                <span className="font-mono font-bold text-slate-900">{paymentResult.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Society Ledger Status</span>
                <span className="font-bold text-emerald-600">Dues Cleared &bull; Synced to Firestore</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full pt-2">
              <button
                id="view-receipt-btn"
                onClick={() => setShowReceiptView(true)}
                className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>View Stamped Receipt</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="done-payment-btn"
                onClick={handleReset}
                className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Official Tax Invoice / Receipt View */
          <div className="space-y-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-3 font-sans shadow-sm">
              <div className="border-b pb-3 text-center">
                <h5 className="font-bold text-sm text-slate-900">GREENWOOD HEIGHTS APARTMENT OWNERS RWA</h5>
                <p className="text-[11px] text-slate-500">
                  Reg. No. RWA-BLR-2018-842 &bull; GSTIN: 29AAAAA0000A1Z5 &bull; Bengaluru, KA
                </p>
                <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
                  Official Maintenance Tax Invoice & Receipt
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Receipt No:</span>
                  <span className="font-mono font-bold text-slate-800">{paymentResult.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date & Time:</span>
                  <span className="font-medium text-slate-800">{new Date().toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Received From:</span>
                  <span className="font-bold text-slate-800">{resident.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Flat / Unit:</span>
                  <span className="font-bold text-slate-800">{resident.flat} ({resident.tower})</span>
                </div>
              </div>

              <div className="border-t border-b py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Monthly Maintenance (SAC 999598)</span>
                  <span>₹4,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Covered Parking Slot</span>
                  <span>₹500.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Late Processing Fee</span>
                  <span>₹100.00</span>
                </div>
                <div className="border-t pt-1 flex justify-between font-bold text-xs text-slate-900">
                  <span>Total Amount Paid</span>
                  <span>₹{billAmount.toLocaleString('en-IN')}.00</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                <span>Payment Mode: <strong>Instant UPI (NPCI Standard)</strong></span>
                <span>Ref: <strong>{paymentResult.transactionId}</strong></span>
              </div>

              <p className="text-[10px] text-slate-400 text-center">
                This is an electronically generated and stamped receipt verified by Society Treasurer. No physical signature required under IT Act 2000.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => showToast('Receipt PDF saved to downloads.')}
                className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={() => showToast('Receipt copy dispatched to registered phone number.')}
                className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp Receipt</span>
              </button>
            </div>

            <button
              onClick={handleReset}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-2"
            >
              Close
            </button>
          </div>
        )}
      </Modal>

      <IndianPaymentsResearchModal
        isOpen={isResearchModalOpen}
        onClose={() => setIsResearchModalOpen(false)}
      />
    </>
  );
};
