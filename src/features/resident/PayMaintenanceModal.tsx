import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiPaymentUri, buildBillPaymentReference } from '../../lib/upi';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  Download,
  Printer,
  RotateCcw,
  Smartphone,
  Info,
  FileText,
} from 'lucide-react';
import { PaymentReceipt, PaymentReceiptData } from '../../components/finance/PaymentReceipt';

interface PayMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentState = 'NO_BILL' | 'UNPAID' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export const PayMaintenanceModal: React.FC<PayMaintenanceModalProps> = ({ isOpen, onClose }) => {
  const {
    resident,
    bills,
    payments,
    currentSociety,
    currentSocietyId,
    submitPaymentClaim,
    showToast,
  } = useApp();

  const activeBill = bills.find((b) => {
    if (resident.flatId && b.flatId) return b.flatId === resident.flatId && b.status !== 'Paid';
    return b.flat?.trim().toUpperCase() === resident.flat?.trim().toUpperCase() && b.status !== 'Paid';
  });
  const hasAnyBills = bills.some((b) => {
    if (resident.flatId && b.flatId) return b.flatId === resident.flatId;
    return b.flat?.trim().toUpperCase() === resident.flat?.trim().toUpperCase();
  });

  // Find the most recent payment claim for the active bill
  const myPaymentClaim = activeBill
    ? payments.find(
        (p) =>
          p.billId === activeBill.id &&
          p.residentId === (resident.id || '') &&
          p.status !== 'REJECTED'
      )
    : undefined;

  // Determine state
  let state: PaymentState = 'NO_BILL';
  if (activeBill && myPaymentClaim?.status === 'PENDING_VERIFICATION') {
    state = 'PENDING_VERIFICATION';
  } else if (activeBill && myPaymentClaim?.status === 'VERIFIED') {
    state = 'VERIFIED';
  } else if (activeBill && myPaymentClaim?.status === 'REJECTED') {
    state = 'REJECTED';
  } else if (activeBill) {
    state = 'UNPAID';
  }

  // Find the rejected claim (for retry)
  const rejectedClaim = activeBill
    ? payments.find(
        (p) =>
          p.billId === activeBill.id &&
          p.residentId === (resident.id || '') &&
          p.status === 'REJECTED'
      )
    : undefined;

  const [utrInput, setUtrInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReceiptView, setShowReceiptView] = useState(false);

  const billAmount = activeBill ? activeBill.totalAmount : 0;
  const societyCode = (currentSociety?.name || 'SOC').substring(0, 3).toUpperCase();
  const upiVpa = currentSociety?.payment?.upiId || '';
  const payeeName = currentSociety?.payment?.payeeName || currentSociety?.name || 'Society';
  const paymentReference = activeBill
    ? buildBillPaymentReference(activeBill.billNumber, societyCode)
    : '';

  const upiUri = upiVpa && billAmount > 0
    ? buildUpiPaymentUri({
        vpa: upiVpa,
        payeeName,
        amount: billAmount,
        reference: paymentReference,
        note: `Maintenance ${activeBill?.billingPeriod || activeBill?.month || ''} - Flat ${resident.flat}`,
      })
    : '';

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(upiVpa);
    setCopied(true);
    showToast('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async () => {
    if (!activeBill || !utrInput.trim()) {
      showToast('Please enter a valid UPI Transaction ID (UTR)');
      return;
    }
    setIsSubmitting(true);
    try {
      await submitPaymentClaim(activeBill.id, billAmount, utrInput.trim(), noteInput.trim());
      setUtrInput('');
      setNoteInput('');
    } catch {
      showToast('Failed to submit payment claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setShowReceiptView(false);
    setUtrInput('');
    setNoteInput('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={
        state === 'VERIFIED' && showReceiptView
          ? 'Payment Receipt'
          : state === 'VERIFIED'
          ? 'Payment Confirmed'
          : state === 'PENDING_VERIFICATION'
          ? 'Payment Pending Verification'
          : state === 'REJECTED'
          ? 'Payment Rejected'
          : 'Pay Maintenance'
      }
      subtitle={
        state === 'VERIFIED'
          ? undefined
          : `Flat ${resident.flat} • ${activeBill?.billingPeriod || activeBill?.month || ''}`
      }
      maxWidth={state === 'VERIFIED' && showReceiptView ? 'md' : 'md'}
    >
      {/* STATE: NO_BILL */}
      {state === 'NO_BILL' && (
        <div className="text-center py-8 space-y-3">
          <CheckCircle2 className="w-14 h-14 text-emerald-200 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">All dues cleared</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {hasAnyBills
              ? 'You have no outstanding maintenance bills. Your account is up to date.'
              : 'No maintenance bills have been generated yet. Your society admin will create bills here.'}
          </p>
        </div>
      )}

      {/* STATE: UNPAID — QR + UPI Intent + UTR Input */}
      {state === 'UNPAID' && activeBill && (
        <div className="space-y-5">
          {/* Bill Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Amount Due
            </span>
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              ₹{billAmount.toLocaleString('en-IN')}
            </div>
            <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
              Due: {activeBill.dueDate}
            </span>

            {/* Line items */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5 text-left text-xs">
              {activeBill.lineItems && activeBill.lineItems.length > 0 ? (
                activeBill.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>{item.description}</span>
                    <span className="font-semibold text-slate-900">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  {activeBill.maintenanceFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly Maintenance</span>
                      <span className="font-semibold text-slate-900">
                        ₹{activeBill.maintenanceFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {activeBill.parkingFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Parking</span>
                      <span className="font-semibold text-slate-900">
                        ₹{activeBill.parkingFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {activeBill.lateFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Late Fee</span>
                      <span className="font-semibold text-slate-900">
                        ₹{activeBill.lateFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Due</span>
                <span className="text-indigo-600">
                  ₹{billAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* UPI QR Code Section */}
          {upiVpa ? (
            <div className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-900">
                <Smartphone className="w-4 h-4" />
                <span>Pay via UPI</span>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                  <QRCodeSVG
                    value={upiUri}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#1e293b"
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* UPI Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">UPI ID</span>
                  <span className="font-mono font-bold text-slate-900">{upiVpa}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payee</span>
                  <span className="font-bold text-slate-900">{payeeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Reference</span>
                  <span className="font-mono text-slate-700">{paymentReference}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={upiUri}
                  className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Pay Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={handleCopyVpa}
                  className="h-11 rounded-xl border border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy UPI ID'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
              <p className="font-bold">UPI not configured</p>
              <p className="mt-1">Society admin has not set up UPI ID yet. Please pay at the society office.</p>
            </div>
          )}

          {/* UTR / TID Submission */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Already Paid? Enter Transaction ID
            </h4>
            <p className="text-xs text-slate-500">
              After completing the UPI payment, enter your 12-digit UTR or Transaction ID below.
            </p>
            <input
              type="text"
              value={utrInput}
              onChange={(e) => setUtrInput(e.target.value)}
              placeholder="UTR / Transaction ID (e.g. 123456789012)"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Optional note for admin"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSubmitPayment}
              disabled={isSubmitting || !utrInput.trim()}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </span>
              ) : (
                <span>Submit Payment</span>
              )}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
              <Info className="w-3 h-3" />
              <span>Your payment will remain pending until verified by society admin</span>
            </div>
          </div>
        </div>
      )}

      {/* STATE: PENDING_VERIFICATION */}
      {state === 'PENDING_VERIFICATION' && myPaymentClaim && (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border-2 border-amber-200 mx-auto">
            <Clock className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900">Payment Submitted</h4>
            <p className="text-sm text-slate-500 mt-1">
              Waiting for society admin to verify your payment
            </p>
          </div>

          <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-extrabold text-slate-900">
                ₹{myPaymentClaim.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UTR / Transaction ID</span>
              <span className="font-mono font-bold text-slate-900">{myPaymentClaim.utr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted</span>
              <span className="font-medium text-slate-900">
                {new Date(myPaymentClaim.submittedAt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-amber-600">Pending Verification</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            You will be notified once the admin verifies your payment.
          </p>
        </div>
      )}

      {/* STATE: VERIFIED — Receipt View */}
      {state === 'VERIFIED' && myPaymentClaim && !showReceiptView && (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200 mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900">Payment Confirmed</h4>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">
              ₹{myPaymentClaim.amount.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verified on {new Date(myPaymentClaim.verifiedAt || '').toLocaleString()}
            </p>
          </div>

          <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Bill Number</span>
              <span className="font-mono font-bold text-slate-900">{activeBill?.billNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Flat</span>
              <span className="font-bold text-slate-900">{resident.flat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UTR</span>
              <span className="font-mono font-bold text-slate-900">{myPaymentClaim.utr}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowReceiptView(true)}
              className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Receipt</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* STATE: VERIFIED — Printable Receipt */}
      {state === 'VERIFIED' && myPaymentClaim && showReceiptView && (
        <div className="space-y-4">
          <PaymentReceipt
            data={{
              societyName: currentSociety?.legalName || currentSociety?.name || 'Society',
              registeredNumber: currentSociety?.registeredNumber,
              city: currentSociety?.city,
              residentName: resident.name,
              flatNumber: resident.flat,
              towerName: resident.tower,
              billNumber: activeBill?.billNumber || '',
              billingPeriod: activeBill?.billingPeriod || activeBill?.month || '',
              amount: myPaymentClaim.amount,
              paymentMethod: myPaymentClaim.paymentMethod,
              utr: myPaymentClaim.utr,
              status: 'Paid',
              verifiedBy: myPaymentClaim.verifiedBy || 'Admin',
              receiptDate: new Date(myPaymentClaim.verifiedAt || myPaymentClaim.submittedAt).toLocaleDateString(),
            }}
          />

          <div className="grid grid-cols-2 gap-3 pt-1 print:hidden">
            <button
              onClick={() => window.print()}
              className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={handleReset}
              className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE: REJECTED */}
      {state === 'REJECTED' && rejectedClaim && (
        <div className="space-y-4 py-2">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center border-2 border-red-200 mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">Payment Rejected</h4>
              <p className="text-sm text-slate-500 mt-1">
                The admin could not verify your payment
              </p>
            </div>
          </div>

          <div className="w-full bg-red-50 p-4 rounded-xl border border-red-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-red-600 font-bold">Reason</span>
              <span className="font-medium text-red-800">{rejectedClaim.rejectionReason}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-bold text-slate-900">
                ₹{rejectedClaim.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UTR</span>
              <span className="font-mono font-bold text-slate-900">{rejectedClaim.utr}</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
            <p className="font-bold">What to do?</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Verify the UTR is correct and payment was completed</li>
              <li>Check the amount matches your bill exactly</li>
              <li>Contact society admin if you believe this is an error</li>
            </ul>
          </div>

          {/* Retry Section */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-slate-500" />
              Submit Again
            </h4>
            <input
              type="text"
              value={utrInput}
              onChange={(e) => setUtrInput(e.target.value)}
              placeholder="Correct UTR / Transaction ID"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Optional note"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSubmitPayment}
              disabled={isSubmitting || !utrInput.trim()}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </span>
              ) : (
                <span>Resubmit Payment</span>
              )}
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
  );
};
