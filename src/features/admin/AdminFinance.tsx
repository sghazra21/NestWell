import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useDebounce } from '../../hooks/useDebounce';
import { MaintenanceBill, BillLineItem, PaymentRecord, ExpenseRecord, ExpenseCategory } from '../../types';
import { Modal } from '../../components/common/Modal';
import { PaymentReceipt } from '../../components/finance/PaymentReceipt';
import { downloadCSV } from '../../lib/csv';
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
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Calendar,
  Filter,
  Undo2,
} from 'lucide-react';

type FinanceTab = 'overview' | 'bills' | 'verifications' | 'expenses';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Maintenance', 'Electricity', 'Water', 'Security', 'Cleaning',
  'Repairs', 'Gardening', 'Lift', 'Generator', 'Plumbing',
  'Salaries', 'Office', 'Events', 'Legal', 'Other',
];

const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  Maintenance: 'bg-blue-100 text-blue-800',
  Electricity: 'bg-yellow-100 text-yellow-800',
  Water: 'bg-cyan-100 text-cyan-800',
  Security: 'bg-red-100 text-red-800',
  Cleaning: 'bg-green-100 text-green-800',
  Repairs: 'bg-orange-100 text-orange-800',
  Gardening: 'bg-emerald-100 text-emerald-800',
  Lift: 'bg-purple-100 text-purple-800',
  Generator: 'bg-amber-100 text-amber-800',
  Plumbing: 'bg-sky-100 text-sky-800',
  Salaries: 'bg-indigo-100 text-indigo-800',
  Office: 'bg-slate-100 text-slate-800',
  Events: 'bg-pink-100 text-pink-800',
  Legal: 'bg-violet-100 text-violet-800',
  Other: 'bg-gray-100 text-gray-800',
};

export const AdminFinance: React.FC = () => {
  const {
    bills, flats, members, payments, createBill, markBillPaidManually,
    verifyPayment, rejectPayment, showToast, towers,
    expenses, treasuryTransactions, cashInHand,
    createExpense, cancelExpense, totalExpensesThisMonth,
    generateBulkBills, currentSociety,
  } = useApp();

  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Overdue' | 'Due'>('all');
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<MaintenanceBill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [rejectModalPayment, setRejectModalPayment] = useState<PaymentRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Bill form state
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

  // Bulk bill generation state
  const [isBulkBillOpen, setIsBulkBillOpen] = useState(false);
  const [bulkBillMonth, setBulkBillMonth] = useState(() => {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'long' });
  });
  const [bulkBillYear, setBulkBillYear] = useState(new Date().getFullYear());
  const [bulkBillDueDate, setBulkBillDueDate] = useState(() => {
    const d = new Date();
    d.setDate(15);
    return d.toISOString().split('T')[0];
  });
  const [bulkLineItems, setBulkLineItems] = useState<BillLineItem[]>([
    { description: 'Monthly Maintenance', amount: 4000, type: 'maintenance' },
  ]);
  const [bulkTowerFilter, setBulkTowerFilter] = useState<string>('all');
  const [bulkOccupantFilter, setBulkOccupantFilter] = useState<'all' | 'owner' | 'tenant'>('all');
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  // Expense form state
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Maintenance');
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<'Cash' | 'Cheque' | 'BankTransfer' | 'UPI'>('Cash');
  const [expenseReference, setExpenseReference] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [expenseDateFrom, setExpenseDateFrom] = useState('');
  const [expenseDateTo, setExpenseDateTo] = useState('');
  const [cancelExpenseModal, setCancelExpenseModal] = useState<ExpenseRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Receipt modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<PaymentRecord | null>(null);
  const [receiptBill, setReceiptBill] = useState<MaintenanceBill | null>(null);

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = subtotal;

  // Bills computed values
  const totalBilled = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalCollected = bills.filter((b) => b.status === 'Paid').reduce((sum, b) => sum + b.totalAmount, 0);
  const totalOverdue = bills.filter((b) => b.status === 'Overdue').reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingAmount = bills.filter((b) => b.status === 'Pending').reduce((sum, b) => sum + b.totalAmount, 0);
  const outstanding = totalOverdue + pendingAmount;

  const currentBillingPeriod = bills.length > 0 ? (bills[0].billingPeriod || `${bills[0].month} ${bills[0].year}`) : 'No bills yet';

  // Current month stats
  const now = new Date();
  const currentMonthBilled = bills
    .filter((b) => {
      const d = new Date(b.createdAt || b.dueDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const currentMonthCollected = bills
    .filter((b) => b.status === 'Paid' && b.paidAt)
    .filter((b) => {
      const d = new Date(b.paidAt!);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const currentMonthNet = currentMonthCollected - totalExpensesThisMonth;

  const filteredBills = bills.filter((b) => {
    const matchSearch =
      b.flat.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      b.residentName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      b.billNumber.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchCategory = expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter;
      const matchDateFrom = !expenseDateFrom || e.date >= expenseDateFrom;
      const matchDateTo = !expenseDateTo || e.date <= expenseDateTo;
      return matchCategory && matchDateFrom && matchDateTo;
    });
  }, [expenses, expenseCategoryFilter, expenseDateFrom, expenseDateTo]);

  const recentExpenses = [...expenses]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  // Line item handlers
  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', amount: 0, type: 'other' }]);
  };
  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };
  const handleLineItemChange = (index: number, field: keyof BillLineItem, value: string | number) => {
    const updated = lineItems.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    setLineItems(updated);
  };

  // Bill handlers
  const handleCreateBill = async () => {
    if (!selectedFlatId) { showToast('Please select a flat'); return; }
    if (lineItems.length === 0 || lineItems.every((i) => i.amount === 0)) {
      showToast('Add at least one line item with a non-zero amount'); return;
    }
    const flat = flats.find((f) => f.id === selectedFlatId);
    if (!flat) { showToast('Selected flat not found'); return; }
    const member = members.find((m) => m.flatId === selectedFlatId || m.flatNumber === flat.number);
    const residentName = member?.name || flat.primaryResidentName || 'Resident';

    await createBill(selectedFlatId, flat.number, flat.towerName, residentName, billMonth, billYear, totalAmount, billDueDate, lineItems);
    setIsCreateBillOpen(false);
    setSelectedFlatId('');
    setLineItems([{ description: 'Monthly Maintenance', amount: 4000, type: 'maintenance' }]);
  };

  const handleSendBulkReminders = () => showToast('Bulk reminders require a configured email/WhatsApp integration');

  // Bulk bill line item handlers
  const handleBulkAddLineItem = () => {
    setBulkLineItems([...bulkLineItems, { description: '', amount: 0, type: 'other' }]);
  };
  const handleBulkRemoveLineItem = (index: number) => {
    setBulkLineItems(bulkLineItems.filter((_, i) => i !== index));
  };
  const handleBulkLineItemChange = (index: number, field: keyof BillLineItem, value: string | number) => {
    setBulkLineItems(bulkLineItems.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const bulkSubtotal = bulkLineItems.reduce((sum, item) => sum + item.amount, 0);

  // Preview: how many flats will be billed
  const bulkPreviewFlats = useMemo(() => {
    let targetFlats = flats.filter((f) => f.status === 'active');
    if (bulkTowerFilter !== 'all') {
      targetFlats = targetFlats.filter((f) => f.towerName === bulkTowerFilter || f.towerId === bulkTowerFilter);
    }
    if (bulkOccupantFilter === 'owner') {
      targetFlats = targetFlats.filter((f) => f.ownerIds && f.ownerIds.length > 0);
    } else if (bulkOccupantFilter === 'tenant') {
      targetFlats = targetFlats.filter((f) => f.tenantIds && f.tenantIds.length > 0);
    }
    return targetFlats;
  }, [flats, bulkTowerFilter, bulkOccupantFilter]);

  const bulkBillingPeriod = `${bulkBillMonth} ${bulkBillYear}`;
  const bulkPreviewCount = bulkPreviewFlats.filter(
    (f) => !bills.some((b) => b.billingPeriod === bulkBillingPeriod && b.flat === f.number)
  ).length;
  const bulkDuplicateCount = bulkPreviewFlats.length - bulkPreviewCount;

  const handleBulkGenerate = async () => {
    if (bulkLineItems.length === 0 || bulkLineItems.every((i) => i.amount === 0)) {
      showToast('Add at least one line item with a non-zero amount');
      return;
    }
    if (bulkPreviewCount === 0) {
      showToast('No new flats to bill — all already have bills for this period.');
      return;
    }
    setIsBulkGenerating(true);
    try {
      const scope: { towers?: string[]; occupantFilter?: 'all' | 'owner' | 'tenant' } = {};
      if (bulkTowerFilter !== 'all') scope.towers = [bulkTowerFilter];
      scope.occupantFilter = bulkOccupantFilter;
      await generateBulkBills(bulkBillingPeriod, bulkBillMonth, bulkBillYear, bulkBillDueDate, bulkLineItems, scope);
      setIsBulkBillOpen(false);
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const handleOpenRecordPayment = (bill: MaintenanceBill) => {
    setSelectedBill(bill); setPaymentMethod('Cash'); setPaymentReference(''); setIsRecordPaymentOpen(true);
  };
  const handleRecordPayment = async () => {
    if (!selectedBill) return;
    const methodLabel = paymentReference.trim() ? `${paymentMethod} (${paymentReference.trim()})` : paymentMethod;
    await markBillPaidManually(selectedBill.id, methodLabel);
    setIsRecordPaymentOpen(false); setSelectedBill(null); setPaymentReference('');
  };

  const handleVerifyPayment = async (paymentId: string) => { await verifyPayment(paymentId); };
  const handleOpenRejectModal = (payment: PaymentRecord) => { setRejectModalPayment(payment); setRejectReason(''); };
  const handleRejectPayment = async () => {
    if (!rejectModalPayment || !rejectReason.trim()) { showToast('Please enter a reason for rejection'); return; }
    await rejectPayment(rejectModalPayment.id, rejectReason.trim());
    setRejectModalPayment(null); setRejectReason('');
  };

  const pendingVerifications = payments.filter((p) => p.status === 'PENDING_VERIFICATION');

  // Expense handlers
  const handleRecordExpense = async () => {
    if (!expenseAmount || Number(expenseAmount) <= 0) { showToast('Enter a valid amount'); return; }
    if (!expenseVendor.trim()) { showToast('Enter vendor name'); return; }
    await createExpense({
      amount: Number(expenseAmount),
      date: expenseDate,
      category: expenseCategory,
      vendor: expenseVendor.trim(),
      description: expenseDescription.trim(),
      paymentMethod: expensePaymentMethod,
      referenceNumber: expenseReference.trim(),
      notes: expenseNotes.trim(),
    });
    setIsRecordExpenseOpen(false);
    setExpenseAmount(''); setExpenseVendor(''); setExpenseDescription('');
    setExpenseReference(''); setExpenseNotes('');
  };

  const handleCancelExpense = async () => {
    if (!cancelExpenseModal || !cancelReason.trim()) { showToast('Enter a cancellation reason'); return; }
    await cancelExpense(cancelExpenseModal.id, cancelReason.trim());
    setCancelExpenseModal(null); setCancelReason('');
  };

  // CSV exports
  const handleExportBillsCSV = () => {
    const data = filteredBills.map((b) => ({
      'Bill #': b.billNumber,
      'Flat': b.flat,
      'Resident': b.residentName,
      'Period': b.billingPeriod || `${b.month} ${b.year}`,
      'Amount': b.totalAmount,
      'Status': b.status,
      'Due Date': b.dueDate,
      'Paid At': b.paidAt || '',
      'Payment Method': b.paymentMethod || '',
    }));
    downloadCSV(data, `bills_export_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${data.length} bills.`);
  };

  const handleExportPaymentsCSV = () => {
    const data = payments.map((p) => ({
      'Resident': p.submittedBy,
      'Flat': p.flatNumber,
      'Amount': p.amount,
      'UTR': p.utr || '',
      'Status': p.status,
      'Submitted': new Date(p.submittedAt).toLocaleString(),
      'Verified At': p.verifiedAt ? new Date(p.verifiedAt).toLocaleString() : '',
      'Verified By': p.verifiedBy || '',
    }));
    downloadCSV(data, `payments_export_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${data.length} payments.`);
  };

  const handleExportExpensesCSV = () => {
    const data = filteredExpenses.map((e) => ({
      'Date': e.date,
      'Category': e.category,
      'Vendor': e.vendor,
      'Description': e.description,
      'Amount': e.amount,
      'Method': e.paymentMethod,
      'Reference': e.referenceNumber || '',
      'Status': e.status,
      'Created By': e.createdBy,
    }));
    downloadCSV(data, `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${data.length} expenses.`);
  };

  const handleExportTreasuryCSV = () => {
    const data = treasuryTransactions.map((tx) => ({
      'Date': new Date(tx.createdAt).toLocaleString(),
      'Type': tx.type,
      'Category': tx.category,
      'Description': tx.description,
      'Amount': tx.amount,
      'Source': tx.sourceType,
      'Reference': tx.sourceId || tx.expenseId || '',
      'Created By': tx.createdBy,
    }));
    downloadCSV(data, `treasury_export_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${data.length} treasury transactions.`);
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
          {activeTab === 'bills' && (
            <>
              <button
                onClick={() => setIsBulkBillOpen(true)}
                className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Generate Monthly Bills</span>
              </button>
              <button
                onClick={() => setIsCreateBillOpen(!isCreateBillOpen)}
                className="h-10 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Bill</span>
              </button>
            </>
          )}
          {activeTab === 'expenses' && (
            <button
              onClick={() => setIsRecordExpenseOpen(true)}
              className="h-10 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: 'overview' as const, label: 'Finance Overview' },
          { key: 'bills' as const, label: 'Bills & Invoices' },
          { key: 'verifications' as const, label: 'Payment Verification' },
          { key: 'expenses' as const, label: 'Expenses' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.key === 'verifications' && pendingVerifications.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold">
                {pendingVerifications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========== FINANCE OVERVIEW TAB ========== */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Billed</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-3">₹{totalBilled.toLocaleString()}</div>
              <span className="text-xs text-slate-500 mt-1 block">{bills.length} invoices all time</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Collected</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-700 mt-3">₹{totalCollected.toLocaleString()}</div>
              <span className="text-xs text-emerald-600 font-bold mt-1 block">
                {Math.round((totalCollected / (totalBilled || 1)) * 100)}% collection rate
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding</span>
              </div>
              <div className="text-3xl font-extrabold text-amber-600 mt-3">₹{outstanding.toLocaleString()}</div>
              <span className="text-xs text-amber-700 font-medium mt-1 block">
                {bills.filter((b) => b.status !== 'Paid').length} unpaid bills
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-xl">
                  <Wallet className="w-5 h-5 text-teal-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cash In Hand</span>
              </div>
              <div className={`text-3xl font-extrabold mt-3 ${cashInHand >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                ₹{cashInHand.toLocaleString()}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">From treasury ledger</span>
            </div>
          </div>

          {/* Monthly Summary + Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Monthly Summary — {now.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Billed This Month</span>
                  <span className="font-extrabold text-slate-900">₹{currentMonthBilled.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Collected This Month</span>
                  <span className="font-extrabold text-emerald-700">₹{currentMonthCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Expenses This Month</span>
                  <span className="font-extrabold text-red-600">₹{totalExpensesThisMonth.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between text-xs">
                  <span className="text-slate-700 font-bold">Net This Month</span>
                  <span className={`font-extrabold ${currentMonthNet >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    ₹{currentMonthNet.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('bills')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-3 transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">View Bills & Invoices</span>
                </button>
                <button
                  onClick={() => setActiveTab('verifications')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-3 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">Payment Verification</span>
                  {pendingVerifications.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold">
                      {pendingVerifications.length} pending
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-3 transition-colors"
                >
                  <Receipt className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold text-slate-800">Manage Expenses</span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={handleExportTreasuryCSV}
                  className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Treasury CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-red-600" />
                Recent Expenses (Last 10)
              </h3>
              <span className="text-xs text-slate-500">{expenses.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FBF9F5] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Vendor</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center">
                        <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">No expenses recorded yet.</p>
                      </td>
                    </tr>
                  ) : recentExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-xs text-slate-600 font-medium">{e.date}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${EXPENSE_CATEGORY_COLORS[e.category] || 'bg-gray-100 text-gray-800'}`}>
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900 text-xs">{e.vendor}</td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-[200px] truncate">{e.description}</td>
                      <td className="px-5 py-4 font-extrabold text-slate-900 text-xs">₹{e.amount.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          e.status === 'RECORDED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {e.status === 'RECORDED' ? 'Active' : 'Cancelled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== BILLS TAB ========== */}
      {activeTab === 'bills' && (
        <>
          {/* Create Bill Form */}
          {isCreateBillOpen && (
            <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Create New Maintenance Bill</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Select Flat</label>
                  <select value={selectedFlatId} onChange={(e) => setSelectedFlatId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                    <option value="">Choose a flat...</option>
                    {flats.filter((f) => f.status === 'active').map((f) => {
                      const member = members.find((m) => m.flatId === f.id || m.flatNumber === f.number);
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
                  <select value={billMonth} onChange={(e) => setBillMonth(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Year</label>
                  <select value={billYear} onChange={(e) => setBillYear(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                    {[new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Due Date</label>
                  <input type="date" value={billDueDate} onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Line Items</label>
                  <button onClick={handleAddLineItem}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select value={item.type} onChange={(e) => handleLineItemChange(index, 'type', e.target.value)}
                        className="h-10 w-32 px-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700">
                        <option value="maintenance">Maintenance</option>
                        <option value="parking">Parking</option>
                        <option value="water">Water</option>
                        <option value="electricity">Electricity</option>
                        <option value="late_fee">Late Fee</option>
                        <option value="other">Other</option>
                      </select>
                      <input type="text" value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-800" />
                      <input type="number" value={item.amount || ''}
                        onChange={(e) => handleLineItemChange(index, 'amount', Number(e.target.value))}
                        placeholder="₹0"
                        className="h-10 w-28 px-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800" />
                      {lineItems.length > 1 && (
                        <button onClick={() => handleRemoveLineItem(index)}
                          className="h-10 w-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
                <button onClick={() => setIsCreateBillOpen(false)}
                  className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreateBill}
                  className="h-10 px-5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-sm transition-colors">
                  Create & Issue Bill
                </button>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Billed ({currentBillingPeriod})</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">₹{totalBilled.toLocaleString()}</div>
              <span className="text-xs text-slate-500 mt-1 block">{bills.length} Invoice{bills.length !== 1 ? 's' : ''} Issued</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Collected</span>
              <div className="text-3xl font-extrabold text-emerald-700 mt-1">₹{totalCollected.toLocaleString()}</div>
              <span className="text-xs text-emerald-600 font-bold mt-1 block">
                {Math.round((totalCollected / (totalBilled || 1)) * 100)}% Collection Rate
              </span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overdue / Pending</span>
              <div className="text-3xl font-extrabold text-amber-600 mt-1">₹{totalOverdue.toLocaleString()}</div>
              <span className="text-xs text-amber-700 font-medium mt-1 block">Late fee applied post grace period</span>
            </div>
          </div>

          {/* Search + Filter + Export */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search by flat, resident name, invoice #..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'Paid', 'Overdue', 'Due'] as const).map((status) => (
                <button key={status} onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {status === 'all' ? 'All Invoices' : status}
                </button>
              ))}
            </div>
            <button onClick={handleExportBillsCSV}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Bills CSV</span>
            </button>
          </div>

          {/* Bills Table */}
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
                            ? 'No invoices match your current filters.'
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
                        <span className="text-[11px] font-mono text-slate-400 block mt-1">{b.billNumber}</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">{b.residentName}</td>
                      <td className="px-5 py-4 text-xs text-slate-600 font-medium">{b.billingPeriod || `${b.month} ${b.year}`}</td>
                      <td className="px-5 py-4 font-extrabold text-slate-900">₹{b.totalAmount.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          b.status === 'Paid' ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'Overdue' ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {b.paymentMethod || <span className="text-slate-400 italic">Unpaid</span>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {b.status !== 'Paid' ? (
                          <button onClick={() => handleOpenRecordPayment(b)}
                            className="text-xs font-bold text-teal-700 hover:text-teal-900 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors">
                            Record Payment
                          </button>
                        ) : (
                          <button onClick={() => {
                            const paymentForBill = payments.find(p => p.billId === b.id && p.status === 'VERIFIED');
                            if (paymentForBill) {
                              setReceiptPayment(paymentForBill);
                              setReceiptBill(b);
                              setShowReceiptModal(true);
                            } else {
                              showToast('No verified payment found for this bill');
                            }
                          }}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
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
        </>
      )}

      {/* ========== PAYMENT VERIFICATION TAB ========== */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={handleExportPaymentsCSV}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Payments CSV</span>
            </button>
          </div>

          {/* Pending Verifications */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 bg-amber-50/50">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Pending Verification ({pendingVerifications.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">UPI payments submitted by residents awaiting admin review</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FBF9F5] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Resident</th>
                    <th className="px-5 py-3.5">Flat</th>
                    <th className="px-5 py-3.5">Bill #</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">UTR / TID</th>
                    <th className="px-5 py-3.5">Submitted</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingVerifications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <CheckCircle2 className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">All clear</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">No pending payment verifications.</p>
                      </td>
                    </tr>
                  ) : pendingVerifications.map((p) => (
                    <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900">{p.submittedBy}</td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded text-xs border border-teal-200/60">
                          Flat {p.flatNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-slate-600">{p.paymentReference}</td>
                      <td className="px-5 py-4 font-extrabold text-slate-900">₹{p.amount.toLocaleString()}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-700">{p.utr || 'N/A'}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{new Date(p.submittedAt).toLocaleString()}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleVerifyPayment(p.id)}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verify
                          </button>
                          <button onClick={() => handleOpenRejectModal(p)}
                            className="text-xs font-bold text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900">Payment History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#FBF9F5] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Resident</th>
                      <th className="px-5 py-3.5">Flat</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">UTR</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Submitted</th>
                      <th className="px-5 py-3.5">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900">{p.submittedBy}</td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-600">{p.flatNumber}</td>
                        <td className="px-5 py-4 font-extrabold text-slate-900">₹{p.amount.toLocaleString()}</td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-700">{p.utr || 'N/A'}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            p.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'REJECTED' ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status === 'PENDING_VERIFICATION' ? 'Pending' : p.status === 'VERIFIED' ? 'Verified' : 'Rejected'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">{new Date(p.submittedAt).toLocaleString()}</td>
                        <td className="px-5 py-4 text-xs text-slate-500">{p.verifiedAt ? new Date(p.verifiedAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== EXPENSES TAB ========== */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters + Export */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select value={expenseCategoryFilter} onChange={(e) => setExpenseCategoryFilter(e.target.value as any)}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase">From</label>
              <input type="date" value={expenseDateFrom} onChange={(e) => setExpenseDateFrom(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase">To</label>
              <input type="date" value={expenseDateTo} onChange={(e) => setExpenseDateTo(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800" />
            </div>
            <div className="ml-auto">
              <button onClick={handleExportExpensesCSV}
                className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Expenses CSV</span>
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Expenses (All)</span>
              <div className="text-2xl font-extrabold text-red-600 mt-1">
                ₹{expenses.filter((e) => e.status === 'RECORDED').reduce((s, e) => s + e.amount, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">This Month</span>
              <div className="text-2xl font-extrabold text-red-600 mt-1">₹{totalExpensesThisMonth.toLocaleString()}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filtered</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                ₹{filteredExpenses.filter((e) => e.status === 'RECORDED').reduce((s, e) => s + e.amount, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FBF9F5] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Vendor</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Method</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center">
                        <Receipt className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">No expenses found</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                          {expenseCategoryFilter !== 'all' || expenseDateFrom || expenseDateTo
                            ? 'No expenses match your filters. Try adjusting them.'
                            : 'Record your first expense using the button above.'}
                        </p>
                      </td>
                    </tr>
                  ) : filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-xs text-slate-600 font-medium">{e.date}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${EXPENSE_CATEGORY_COLORS[e.category] || 'bg-gray-100 text-gray-800'}`}>
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900 text-xs">{e.vendor}</td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-[200px] truncate">{e.description}</td>
                      <td className="px-5 py-4 font-extrabold text-slate-900 text-xs">₹{e.amount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{e.paymentMethod}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          e.status === 'RECORDED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {e.status === 'RECORDED' ? 'Active' : 'Cancelled'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {e.status === 'RECORDED' && (
                          <button onClick={() => { setCancelExpenseModal(e); setCancelReason(''); }}
                            className="text-xs font-bold text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1 ml-auto">
                            <Undo2 className="w-3 h-3" /> Cancel
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
      )}

      {/* ========== MODALS ========== */}

      {/* Record Payment Modal */}
      <Modal isOpen={isRecordPaymentOpen} onClose={() => setIsRecordPaymentOpen(false)}
        title="Record Payment"
        subtitle={selectedBill ? `Flat ${selectedBill.flat} • ${selectedBill.billingPeriod || `${selectedBill.month} ${selectedBill.year}`}` : ''}
        maxWidth="sm">
        {selectedBill && (
          <div className="space-y-4">
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
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {['Cash', 'Cheque', 'UPI', 'Bank Transfer'].map((method) => (
                  <button key={method} onClick={() => setPaymentMethod(method)}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      paymentMethod === method
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}>
                    {method}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Reference Number (Optional)</label>
              <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Cheque number, UTR, transaction ID"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsRecordPaymentOpen(false)}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleRecordPayment}
                className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Payment Modal */}
      <Modal isOpen={!!rejectModalPayment} onClose={() => setRejectModalPayment(null)}
        title="Reject Payment"
        subtitle={rejectModalPayment ? `${rejectModalPayment.submittedBy} — ₹${rejectModalPayment.amount.toLocaleString()}` : ''}
        maxWidth="sm">
        {rejectModalPayment && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Flat</span>
                <span className="font-bold text-slate-900">{rejectModalPayment.flatNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UTR</span>
                <span className="font-mono font-bold text-slate-900">{rejectModalPayment.utr}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Rejection Reason</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. UTR not found, amount mismatch, duplicate payment..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setRejectModalPayment(null)}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleRejectPayment} disabled={!rejectReason.trim()}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Payment</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Expense Modal */}
      <Modal isOpen={isRecordExpenseOpen} onClose={() => setIsRecordExpenseOpen(false)}
        title="Record Expense" maxWidth="md">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Amount (₹)</label>
              <input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0" min="0"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Date</label>
              <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Category</label>
              <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Vendor</label>
              <input type="text" value={expenseVendor} onChange={(e) => setExpenseVendor(e.target.value)}
                placeholder="Vendor name"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Description</label>
            <input type="text" value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)}
              placeholder="What was this expense for?"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Payment Method</label>
              <select value={expensePaymentMethod} onChange={(e) => setExpensePaymentMethod(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="BankTransfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Reference Number</label>
              <input type="text" value={expenseReference} onChange={(e) => setExpenseReference(e.target.value)}
                placeholder="Cheque #, UTR, etc."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Notes</label>
            <textarea value={expenseNotes} onChange={(e) => setExpenseNotes(e.target.value)}
              placeholder="Additional notes (optional)" rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setIsRecordExpenseOpen(false)}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleRecordExpense}
              className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Expense Modal */}
      <Modal isOpen={!!cancelExpenseModal} onClose={() => setCancelExpenseModal(null)}
        title="Cancel Expense"
        subtitle={cancelExpenseModal ? `₹${cancelExpenseModal.amount.toLocaleString()} — ${cancelExpenseModal.vendor}` : ''}
        maxWidth="sm">
        {cancelExpenseModal && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800">
              This will mark the expense as cancelled. This action cannot be undone.
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Cancellation Reason</label>
              <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why is this expense being cancelled?"
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setCancelExpenseModal(null)}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                Keep Expense
              </button>
              <button onClick={handleCancelExpense} disabled={!cancelReason.trim()}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Expense</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Monthly Bills Modal */}
      <Modal isOpen={isBulkBillOpen} onClose={() => setIsBulkBillOpen(false)}
        title="Generate Monthly Bills"
        subtitle={`Bulk create bills for ${bulkBillingPeriod}`}
        maxWidth="md">
        <div className="space-y-5">
          {/* Billing Period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Month</label>
              <select value={bulkBillMonth} onChange={(e) => setBulkBillMonth(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Year</label>
              <select value={bulkBillYear} onChange={(e) => setBulkBillYear(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                {[new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Due Date</label>
              <input type="date" value={bulkBillDueDate} onChange={(e) => setBulkBillDueDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800" />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Standard Charges</label>
              <button onClick={handleBulkAddLineItem}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {bulkLineItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select value={item.type} onChange={(e) => handleBulkLineItemChange(index, 'type', e.target.value)}
                    className="h-10 w-32 px-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700">
                    <option value="maintenance">Maintenance</option>
                    <option value="parking">Parking</option>
                    <option value="water">Water</option>
                    <option value="electricity">Electricity</option>
                    <option value="other">Other</option>
                  </select>
                  <input type="text" value={item.description}
                    onChange={(e) => handleBulkLineItemChange(index, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-800" />
                  <input type="number" value={item.amount || ''}
                    onChange={(e) => handleBulkLineItemChange(index, 'amount', Number(e.target.value))}
                    placeholder="₹0"
                    className="h-10 w-28 px-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800" />
                  {bulkLineItems.length > 1 && (
                    <button onClick={() => handleBulkRemoveLineItem(index)}
                      className="h-10 w-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-end text-xs">
              <span className="text-slate-500">Per-flat total:</span>
              <span className="font-extrabold text-indigo-700 ml-2">₹{bulkSubtotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tower</label>
              <select value={bulkTowerFilter} onChange={(e) => setBulkTowerFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                <option value="all">All Towers</option>
                {towers.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Occupant Type</label>
              <select value={bulkOccupantFilter} onChange={(e) => setBulkOccupantFilter(e.target.value as 'all' | 'owner' | 'tenant')}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                <option value="all">All Flats</option>
                <option value="owner">Owner-occupied Only</option>
                <option value="tenant">Tenant-occupied Only</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Flats matching scope</span>
              <span className="font-bold text-slate-900">{bulkPreviewFlats.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">New bills to create</span>
              <span className="font-extrabold text-emerald-700">{bulkPreviewCount}</span>
            </div>
            {bulkDuplicateCount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Skipped (duplicate period)</span>
                <span className="font-bold text-amber-600">{bulkDuplicateCount}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between text-xs">
              <span className="text-slate-700 font-bold">Total to generate</span>
              <span className="font-extrabold text-indigo-700 text-sm">
                ₹{(bulkPreviewCount * bulkSubtotal).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setIsBulkBillOpen(false)}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleBulkGenerate} disabled={isBulkGenerating || bulkPreviewCount === 0}
              className="h-10 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
              <Download className="w-3.5 h-3.5" />
              <span>{isBulkGenerating ? 'Generating...' : `Generate ${bulkPreviewCount} Bill${bulkPreviewCount !== 1 ? 's' : ''}`}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      {showReceiptModal && receiptPayment && receiptBill && (
        <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)}
          title="Payment Receipt" maxWidth="md">
          <PaymentReceipt
            data={{
              societyName: currentSociety?.legalName || currentSociety?.name || '',
              societyLogoUrl: currentSociety?.logoUrl,
              registeredNumber: currentSociety?.registeredNumber,
              city: currentSociety?.city,
              residentName: receiptBill.residentName,
              flatNumber: receiptBill.flat,
              towerName: receiptBill.tower,
              billNumber: receiptBill.billNumber,
              billingPeriod: receiptBill.billingPeriod || `${receiptBill.month} ${receiptBill.year}`,
              amount: receiptPayment.amount,
              paymentMethod: receiptPayment.paymentMethod,
              reference: receiptPayment.paymentReference,
              utr: receiptPayment.utr,
              status: receiptPayment.status,
              receiptDate: new Date(receiptPayment.verifiedAt || receiptPayment.submittedAt).toLocaleDateString(),
              verifiedBy: receiptPayment.verifiedBy,
            }}
          />
        </Modal>
      )}
    </div>
  );
};
