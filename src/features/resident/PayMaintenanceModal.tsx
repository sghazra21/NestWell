import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { CreditCard, CheckCircle2, Download, ShieldCheck, ArrowRight, Share2 } from 'lucide-react';

interface PayMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PayMaintenanceModal: React.FC<PayMaintenanceModalProps> = ({ isOpen, onClose }) => {
  const { resident, bills, payMaintenanceBill } = useApp();

  const activeBill = bills.find((b) => b.flat === resident.flat && b.status !== 'Paid') || bills[0];

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('sayan@oksbi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    receiptNumber: string;
    transactionId: string;
  } | null>(null);

  const [showReceiptView, setShowReceiptView] = useState(false);

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = payMaintenanceBill(
        activeBill.id,
        paymentMethod === 'upi' ? `UPI (${upiId})` : paymentMethod === 'card' ? 'Visa Debit Card' : 'Netbanking'
      );
      setIsProcessing(false);
      setPaymentResult({
        success: true,
        receiptNumber: result.receiptNumber,
        transactionId: result.transactionId,
      });
    }, 1200);
  };

  const handleReset = () => {
    setPaymentResult(null);
    setShowReceiptView(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={paymentResult ? 'Payment Status' : 'Pay Maintenance'}
      subtitle={paymentResult ? 'Society Account Credited' : `Flat ${resident.flat} • September 2024`}
      maxWidth="sm"
    >
      {!paymentResult ? (
        <div className="space-y-5">
          {/* Main Due Highlight */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Total Amount Payable
            </span>
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              ₹4,600
            </div>
            <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
              Due Date: 10th Sep 2024
            </span>

            {/* Clear Transparent Itemized Breakdown */}
            <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-2 text-left text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Monthly Maintenance</span>
                <span className="font-semibold text-slate-900">₹4,000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Covered Parking (2 slots)</span>
                <span className="font-semibold text-slate-900">₹500</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Late Fee (Grace period passed)</span>
                <span className="font-semibold text-slate-900">₹100</span>
              </div>
              <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-base text-slate-900">
                <span>Total Due</span>
                <span className="text-indigo-600">₹4,600</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Choose Payment Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-600 cursor-pointer bg-white transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-600"
                />
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-900">Instant UPI (GPay / PhonePe / Paytm)</div>
                  <div className="text-xs text-slate-500">Zero surcharge • Instant receipt</div>
                </div>
              </label>

              {paymentMethod === 'upi' && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <label htmlFor="upi-vpa" className="block text-xs font-semibold text-indigo-900 mb-1">
                    UPI VPA ID:
                  </label>
                  <input
                    id="upi-vpa"
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full h-11 px-3 rounded-lg border border-indigo-200 bg-white text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              )}

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-600 cursor-pointer bg-white transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-600"
                />
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-900">Credit / Debit Card</div>
                  <div className="text-xs text-slate-500">Visa, Mastercard, RuPay</div>
                </div>
                <CreditCard className="w-5 h-5 text-slate-400" />
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-600 cursor-pointer bg-white transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'netbanking'}
                  onChange={() => setPaymentMethod('netbanking')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-600"
                />
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-900">Net Banking / NEFT</div>
                  <div className="text-xs text-slate-500">All major Indian banks supported</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Funds go directly to RWA State Bank Current A/c</span>
          </div>

          {/* Pay Button */}
          <button
            id="pay-now-btn"
            onClick={handlePayNow}
            disabled={isProcessing}
            className="w-full h-13 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Payment...</span>
              </span>
            ) : (
              <span>Pay Now • ₹4,600</span>
            )}
          </button>
        </div>
      ) : !showReceiptView ? (
        /* Payment Successful Confirmation */
        <div className="flex flex-col items-center text-center py-2 space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <h4 className="text-2xl font-bold text-slate-900">Payment Successful</h4>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">₹4,600</div>
            <p className="text-xs text-slate-500 mt-1">
              Transaction ID: <span className="font-mono text-slate-700">{paymentResult.transactionId}</span>
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
              <span className="font-bold text-emerald-600">Dues Cleared: ₹0</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <button
              id="view-receipt-btn"
              onClick={() => setShowReceiptView(true)}
              className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>View Receipt</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="done-payment-btn"
              onClick={handleReset}
              className="h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-center transition-colors"
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
              <p className="text-[11px] text-slate-500">Reg. No. RWA-BLR-2018-842 • Bengaluru, KA</p>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
                Official Maintenance Receipt
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Receipt No:</span>
                <span className="font-mono font-bold text-slate-800">{paymentResult.receiptNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Date & Time:</span>
                <span className="font-medium text-slate-800">05 Sep 2024, 10:45 AM</span>
              </div>
              <div>
                <span className="text-slate-400 block">Received From:</span>
                <span className="font-bold text-slate-800">{resident.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Flat / Unit:</span>
                <span className="font-bold text-slate-800">{resident.flat} (Tower B)</span>
              </div>
            </div>

            <div className="border-t border-b py-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Monthly Maintenance Charge</span>
                <span>₹4,000.00</span>
              </div>
              <div className="flex justify-between">
                <span>Parking Space Charge</span>
                <span>₹500.00</span>
              </div>
              <div className="flex justify-between">
                <span>Late Fee Paid</span>
                <span>₹100.00</span>
              </div>
              <div className="border-t pt-1 flex justify-between font-bold text-xs text-slate-900">
                <span>Total Amount Paid</span>
                <span>₹4,600.00</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              This is an electronically generated receipt verified by Society Treasurer. No physical signature required.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => alert('Receipt PDF downloaded to device.')}
              className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={() => alert('Receipt shared to registered WhatsApp number.')}
              className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Copy</span>
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
