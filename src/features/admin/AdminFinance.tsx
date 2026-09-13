import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MaintenanceBill, BillLineItem } from '../../types';
import { Modal } from '../../components/common/Modal';
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
  Plus,
  Trash2,
  Banknote,
  Receipt,
} from 'lucide-react';

export const AdminFinance: React.FC = () => {
  const { bills, flats, members, createBill, markBillPaidManually, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Overdue' | 'Due'>('all');
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<MaintenanceBill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');

  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [billMonth, setBillMonth] = useState(() => {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'long' });
  });
  const [billYear, setBillYear] = useState(new Date().getFullYear());
  const [billDueDate, setBillDueDate] = useState(() => {
    const d = new Date();
    d.setDate(15);
    return d.toISOString().split('T')[0];
  });
  const [lineItems, setLineItems] = useState<BillLineItem[]>([
    { description: 'Monthly Maintenance', amount: 4000, type: 'maintenance' },
  ]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = subtotal;

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', amount: 0, type: 'other' }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof BillLineItem, value: string | number) => {
    const updated = lineItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setLineItems(updated);
  };

  const handleCreateBill = async () => {
    if (!selectedFlatId) {
      showToast('Please select a flat');
      return;
    }
    if (lineItems.length === 0 || lineItems.every((i) => i.amount === 0)) {
      showToast('Add at least one line item with a non-zero amount');
      return;
    }
    const flat = flats.find((f) => f.id === selectedFlatId);
    if (!flat) {
      showToast('Selected flat not found');
      return;
    }
    const member = members.find(
      (m) => m.flatId === selectedFlatId || m.flatNumber === flat.number
    );
    const residentName = member?.name || flat.primaryResidentName || 'Resident';

    await createBill(
      selectedFlatId,
      flat.number,
      flat.towerName,
      residentName,
      billMonth,
      billYear,
      totalAmount,
      billDueDate,
      lineItems
    );
    setIsCreateBillOpen(false);
    setSelectedFlatId('');
    setLineItems([{ description: 'Monthly Maintenance', amount: 4000, type: 'maintenance' }]);
  };

  const totalBilled = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalCollected = bills
    .filter((b) => b.status === 'Paid')
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const totalOverdue = bills
    .filter((b) => b.status === 'Overdue')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const currentBillingPeriod = bills.length > 0 ? (bills[0].billingPeriod || `${bills[0].month} ${bills[0].year}`) : 'No bills yet';

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

  const handleOpenRecordPayment = (bill: MaintenanceBill) => {
    setSelectedBill(bill);
    setPaymentMethod('Cash');
    setPaymentReference('');
    setIsRecordPaymentOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedBill) return;
    const methodLabel = paymentReference.trim()
      ? `${paymentMethod} (${paymentReference.trim()})`
      : paymentMethod;
    await markBillPaidManually(selectedBill.id, methodLabel);
    setIsRecordPaymentOpen(false);
    setSelectedBill(null);
    setPaymentReference('');
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
            Maintenance billing overview — {currentBillingPeriod}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCreateBillOpen(!isCreateBillOpen)}
            className="h-10 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Bill</span>
          </button>

          <button
            onClick={handleSendBulkReminders}
            className="h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Bulk Reminders</span>
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

      {/* Create Bill Form */}
      {isCreateBillOpen && (
        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">Create New Maintenance Bill</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Select Flat</label>
              <select
                value={selectedFlatId}
                onChange={(e) => setSelectedFlatId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
              >
                <option value="">Choose a flat...</option>
                {flats.filter((f) => f.status === 'active').map((f) => {
                  const member = members.find(
                    (m) => m.flatId === f.id || m.flatNumber === f.number
                  );
                  return (
                    <option key={f.id} value={f.id}>
                      Flat {f.number} — {f.towerName || f.towerId} {member ? `(${member.name})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Billing Month</label>
              <select
                value={billMonth}
                onChange={(e) => setBillMonth(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
              >
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Year</label>
              <select
                value={billYear}
                onChange={(e) => setBillYear(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
              >
                {[new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Due Date</label>
              <input
                type="date"
                value={billDueDate}
                onChange={(e) => setBillDueDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Line Items</label>
              <button
                onClick={handleAddLineItem}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={item.type}
                    onChange={(e) => handleLineItemChange(index, 'type', e.target.value)}
                    className="h-9 w-32 px-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700"
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="parking">Parking</option>
                    <option value="water">Water</option>
                    <option value="electricity">Electricity</option>
                    <option value="late_fee">Late Fee</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-800"
                  />
                  <input
                    type="number"
                    value={item.amount || ''}
                    onChange={(e) => handleLineItemChange(index, 'amount', Number(e.target.value))}
                    placeholder="₹0"
                    className="h-9 w-28 px-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800"
                  />
                  {lineItems.length > 1 && (
                    <button
                      onClick={() => handleRemoveLineItem(index)}
                      className="h-9 w-9 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-end items-center gap-4 text-xs">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-extrabold text-slate-900">₹{subtotal.toLocaleString()}</span>
              <span className="text-slate-400 mx-1">|</span>
              <span className="text-slate-500">Total:</span>
              <span className="font-extrabold text-indigo-700 text-sm">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsCreateBillOpen(false)}
              className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBill}
              className="h-9 px-5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-sm transition-colors"
            >
              Create & Issue Bill
            </button>
          </div>
        </div>
      )}

      {/* 3 Large KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Billed ({currentBillingPeriod})
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            ₹{totalBilled.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {bills.length} Invoice{bills.length !== 1 ? 's' : ''} Issued
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

        <div className="flex flex-wrap gap-1.5">
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
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <CreditCard className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No bills yet</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      {searchQuery || statusFilter !== 'all'
                        ? 'No invoices match your current filters. Try adjusting your search or filter criteria.'
                        : 'Create and issue maintenance bills to residents using the button above.'}
                    </p>
                  </td>
                </tr>
              ) : filteredBills.map((b) => (
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

                  <td className="px-5 py-4 text-xs text-slate-600 font-medium">{b.billingPeriod || `${b.month} ${b.year}`}</td>

                  <td className="px-5 py-4 font-extrabold text-slate-900">
                    ₹{b.totalAmount.toLocaleString()}
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
                        onClick={() => handleOpenRecordPayment(b)}
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        title="Record Payment"
        subtitle={selectedBill ? `Flat ${selectedBill.flat} • ${selectedBill.billingPeriod || `${selectedBill.month} ${selectedBill.year}`}` : ''}
        maxWidth="sm"
      >
        {selectedBill && (
          <div className="space-y-4">
            {/* Bill Details */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Resident</span>
                <span className="font-bold text-slate-900">{selectedBill.residentName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Bill Number</span>
                <span className="font-mono font-bold text-slate-900">{selectedBill.billNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Amount Due</span>
                <span className="font-extrabold text-indigo-700 text-sm">₹{selectedBill.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Due Date</span>
                <span className="font-semibold text-slate-900">{selectedBill.dueDate}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Cash', 'Cheque', 'UPI', 'Bank Transfer'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      paymentMethod === method
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Reference Number (Optional)
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Cheque number, UTR, transaction ID"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsRecordPaymentOpen(false)}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="h-10 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
