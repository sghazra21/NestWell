import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MaintenanceBill } from '../../types';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Send,
  ArrowDownToLine,
  Phone,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminFinance: React.FC = () => {
  const { bills, markBillPaidManually, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Overdue' | 'Due'>('all');

  const totalBilled = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalCollected = bills
    .filter((b) => b.status === 'Paid')
    .reduce((sum, b) => sum + b.amount, 0);
  const totalOverdue = bills
    .filter((b) => b.status === 'Overdue')
    .reduce((sum, b) => sum + b.amount, 0);

  const filteredBills = bills.filter((b) => {
    const matchSearch =
      b.flat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.billNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSendBulkReminders = () => {
    showToast('Bulk reminders feature coming soon');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Society Maintenance & Accounts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintenance billing overview for the current cycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendBulkReminders}
            className="h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Bulk WhatsApp Reminders</span>
          </button>

          <button
            onClick={() => showToast('Export feature coming soon')}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Ledger</span>
          </button>
        </div>
      </div>

      {/* 3 Large KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Billed ({bills.length > 0 ? bills[0].month : 'No bills'})
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            ₹{totalBilled.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            140 Units (Standard ₹4,000 + Parking ₹500)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Collected
          </span>
          <div className="text-3xl font-extrabold text-emerald-700 mt-1">
            ₹{totalCollected.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-600 font-bold mt-1 block">
            {Math.round((totalCollected / (totalBilled || 1)) * 100)}% Collection Rate
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Overdue / Pending
          </span>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">
            ₹{totalOverdue.toLocaleString()}
          </div>
          <span className="text-xs text-amber-700 font-medium mt-1 block">
            Late fee applied post grace period
          </span>
        </div>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by flat, resident name, invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>

        <div className="flex gap-1.5">
          {(['all', 'Paid', 'Overdue', 'Due'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All Invoices' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Billing Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FBF9F5] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Bill No & Flat</th>
                <th className="px-5 py-3.5">Resident</th>
                <th className="px-5 py-3.5">Month</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Payment Mode</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded text-xs border border-teal-200/60">
                      Flat {b.flat}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 block mt-1">
                      {b.billNumber}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-bold text-slate-900">{b.residentName}</td>

                  <td className="px-5 py-4 text-xs text-slate-600 font-medium">{b.month}</td>

                  <td className="px-5 py-4 font-extrabold text-slate-900">
                    ₹{b.amount.toLocaleString()}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        b.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'Overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-500">
                    {b.paymentMethod || (
                      <span className="text-slate-400 italic">Unpaid</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    {b.status !== 'Paid' ? (
                      <button
                        onClick={() => markBillPaidManually(b.id, 'Cheque / Bank Transfer')}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors"
                      >
                        Record Payment
                      </button>
                    ) : (
                      <button
                        onClick={() => showToast('Receipt view coming soon')}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
