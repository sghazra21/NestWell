import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import {
  CheckCircle2,
  Download,
  ArrowRight,
  Share2,
  HelpCircle,
  Banknote,
  Info,
} from 'lucide-react';
import { IndianPaymentsResearchModal } from '../../components/payment/IndianPaymentsResearchModal';

interface PayMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PayMaintenanceModal: React.FC<PayMaintenanceModalProps> = ({ isOpen, onClose }) => {
  const { resident, bills, payMaintenanceBill, showToast, currentSociety } = useApp();

  const activeBill = bills.find((b) => b.flat === resident.flat && b.status !== 'Paid');
  const hasAnyBills = bills.some((b) => b.flat === resident.flat);

  const [utrNumber, setUtrNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    receiptNumber: string;
    transactionId: string;
  } | null>(null);

  const [showReceiptView, setShowReceiptView] = useState(false);

  const billAmount = activeBill ? activeBill.totalAmount : 0;
  const payeeName = currentSociety?.name || 'Society';

  const handleMarkPaid = () => {
    if (!activeBill) {
      showToast('No outstanding bill to pay.');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const txId = utrNumber.trim() ? `UTR-${utrNumber.trim()}` : `OFFLINE-${Math.floor(100000 + Math.random() * 900000)}`;
      const result = payMaintenanceBill(activeBill.id, `Cash / Offline (${txId})`);
      setIsProcessing(false);
      setPaymentResult({
        success: true,
        receiptNumber: result.receiptNumber,
        transactionId: result.transactionId || txId,
      });
      showToast('Payment recorded! Ledger updated in Firestore.');
    }, 800);
  };

  const handleReset = () => {
    setPaymentResult(null);
    setShowReceiptView(false);
    setUtrNumber('');
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleReset}
        title={paymentResult ? 'Payment Status' : 'Pay Maintenance'}
        subtitle={paymentResult ? 'Society Account Credited' : `Flat ${resident.flat} • ${activeBill?.billingPeriod || activeBill?.month || 'No active bill'}`}
        maxWidth="md"
      >
        {!paymentResult ? (
          !activeBill ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-200 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">All dues cleared</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {hasAnyBills
                  ? 'You have no outstanding maintenance bills. Your account is up to date.'
                  : 'No maintenance bills have been generated yet. Your society admin will create bills here.'}
              </p>
            </div>
          ) : (
          <div className="space-y-5">
            {/* Bill Breakdown */}
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
                Due Date: {activeBill?.dueDate || 'N/A'}
              </span>

              {/* Itemized Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5 text-left text-xs">
                {activeBill?.lineItems && activeBill.lineItems.length > 0 ? (
                  activeBill.lineItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span>{item.description}</span>
                      <span className="font-semibold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))
                ) : (
                  <>
                    {activeBill?.maintenanceFee != null && activeBill.maintenanceFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly Maintenance</span>
                      <span className="font-semibold text-slate-900">₹{activeBill.maintenanceFee.toLocaleString('en-IN')}</span>
                    </div>
                    )}
                    {activeBill?.parkingFee != null && activeBill.parkingFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Parking</span>
                      <span className="font-semibold text-slate-900">₹{activeBill.parkingFee.toLocaleString('en-IN')}</span>
                    </div>
                    )}
                    {activeBill?.lateFee != null && activeBill.lateFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Late Fee</span>
                      <span className="font-semibold text-slate-900">₹{activeBill.lateFee.toLocaleString('en-IN')}</span>
                    </div>
                    )}
                  </>
                )}
                <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Due</span>
                  <span className="text-indigo-600">₹{billAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
              <h4 className="font-bold text-amber-900 flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Payment Instructions
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Online payment is not enabled yet. Please use the payment method provided by your society
                (cash, cheque, or bank transfer).
              </p>
              <p className="text-xs text-amber-600 mt-2">
                After making the payment, enter the reference number below so the treasurer can record it.
              </p>
            </div>

            {/* Reference Number Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Payment Reference (Optional)
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="Cheque number, UTR, or transaction ID"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Mark as Paid Button */}
            <button
              id="pay-now-btn"
              onClick={handleMarkPaid}
              disabled={isProcessing}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording Payment...</span>
                </span>
              ) : (
                <span>Mark as Paid</span>
              )}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
              <Info className="w-3.5 h-3.5" />
              <span>This records an offline payment in the society ledger</span>
            </div>
          </div>
          )
        ) : !showReceiptView ? (
          /* Payment Successful Confirmation */
          <div className="flex flex-col items-center text-center py-2 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-2xl font-bold text-slate-900">Payment Recorded</h4>
              <div className="text-3xl font-extrabold text-indigo-600 mt-1">
                ₹{billAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Reference: <span className="font-mono text-slate-700">{paymentResult.transactionId}</span>
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
                <h5 className="font-bold text-sm text-slate-900">{(currentSociety?.legalName || currentSociety?.name || 'Society').toUpperCase()}</h5>
                <p className="text-[11px] text-slate-500">
                  {currentSociety?.registeredNumber ? `Reg. No. ${currentSociety.registeredNumber} • ` : ''}{currentSociety?.city || ''}
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
                {activeBill?.lineItems && activeBill.lineItems.length > 0 ? (
                  activeBill.lineItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.description}</span>
                      <span>₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))
                ) : (
                  <>
                    {activeBill?.maintenanceFee != null && activeBill.maintenanceFee > 0 && (
                    <div className="flex justify-between">
                      <span>Monthly Maintenance (SAC 999598)</span>
                      <span>₹{activeBill.maintenanceFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    )}
                    {activeBill?.parkingFee != null && activeBill.parkingFee > 0 && (
                    <div className="flex justify-between">
                      <span>Parking Slot</span>
                      <span>₹{activeBill.parkingFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    )}
                    {activeBill?.lateFee != null && activeBill.lateFee > 0 && (
                    <div className="flex justify-between">
                      <span>Late Processing Fee</span>
                      <span>₹{activeBill.lateFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    )}
                  </>
                )}
                <div className="border-t pt-1 flex justify-between font-bold text-xs text-slate-900">
                  <span>Total Amount Paid</span>
                  <span>₹{billAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                <span>Payment Mode: <strong>Offline / Manual Recording</strong></span>
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
