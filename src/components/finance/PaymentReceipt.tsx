import React from 'react';
import { Printer } from 'lucide-react';

export interface PaymentReceiptData {
  societyName: string;
  registeredNumber?: string;
  city?: string;
  residentName: string;
  flatNumber: string;
  towerName: string;
  billNumber: string;
  billingPeriod: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  utr?: string;
  status: string;
  verifiedBy?: string;
  receiptDate: string;
}

interface PaymentReceiptProps {
  data: PaymentReceiptData;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ data }) => {
  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-container,
          #receipt-container * {
            visibility: visible;
          }
          #receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex justify-end mb-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>

      <div
        id="receipt-container"
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-md mx-auto text-xs text-slate-700 space-y-4 font-sans"
      >
        <div className="text-center border-b border-slate-200 pb-4">
          <h5 className="font-extrabold text-base text-slate-900 tracking-tight">
            {data.societyName.toUpperCase()}
          </h5>
          {data.registeredNumber && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              Reg. No. {data.registeredNumber}
              {data.city ? ` • ${data.city}` : ''}
            </p>
          )}
          <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-extrabold uppercase tracking-widest text-[11px]">
            Payment Receipt
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Society</span>
            <span className="font-bold text-slate-900">{data.societyName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date</span>
            <span className="font-semibold text-slate-900">{data.receiptDate}</span>
          </div>
        </div>

        <div className="border-t border-b border-slate-200 py-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Resident</span>
            <span className="font-bold text-slate-900">{data.residentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Flat</span>
            <span className="font-bold text-slate-900">{data.flatNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tower</span>
            <span className="font-bold text-slate-900">{data.towerName}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Bill</span>
            <span className="font-mono font-bold text-slate-900">{data.billNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Period</span>
            <span className="font-semibold text-slate-900">{data.billingPeriod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount</span>
            <span className="font-extrabold text-indigo-700 text-sm">
              ₹{data.amount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Method</span>
            <span className="font-bold text-slate-900">{data.paymentMethod}</span>
          </div>
          {data.reference && (
            <div className="flex justify-between">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono font-bold text-slate-900">{data.reference}</span>
            </div>
          )}
          {data.utr && (
            <div className="flex justify-between">
              <span className="text-slate-500">UTR</span>
              <span className="font-mono font-bold text-slate-900">{data.utr}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Status</span>
            <span
              className={`font-bold ${
                data.status === 'VERIFIED' || data.status === 'Paid'
                  ? 'text-emerald-700'
                  : data.status === 'REJECTED'
                  ? 'text-red-700'
                  : 'text-amber-700'
              }`}
            >
              {data.status}
            </span>
          </div>
          {data.verifiedBy && (
            <div className="flex justify-between">
              <span className="text-slate-500">Verified by</span>
              <span className="font-semibold text-slate-900">{data.verifiedBy}</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-3 text-center space-y-1">
          <p className="text-[10px] text-slate-400">
            Received by: NestWell
          </p>
          <p className="text-[10px] text-slate-400">
            Generated: {new Date().toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 font-medium pt-2">
            This is a system-generated receipt. For queries contact your society admin.
          </p>
        </div>
      </div>
    </>
  );
};
