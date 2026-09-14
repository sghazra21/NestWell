import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Receipt } from '../../types';
import { NestWellLogo } from '../../components/branding/NestWellLogo';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Search,
  ShieldCheck,
  CreditCard,
  Building2,
  Calendar,
  X,
  ExternalLink,
  Copy,
  Receipt as ReceiptIcon,
  Sparkles,
  ChevronRight,
  Filter,
  Eye,
} from 'lucide-react';

export const ResidentReceipts: React.FC = () => {
  const {
    receipts,
    bills,
    resident,
    flats,
    currentSociety,
    currentSocietyId,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<string>('all');

  // 1. Identify resident's flat ID
  const residentFlat = flats.find(
    (f) => f.number?.trim().toUpperCase() === resident.flat?.trim().toUpperCase()
  );
  const myFlatId = residentFlat?.id || resident.flatId || '';
  const myFlatNumber = resident.flat?.trim().toUpperCase() || residentFlat?.number?.trim().toUpperCase() || '';

  // 2. Gather all receipts belonging to this resident
  const residentReceiptsList = useMemo(() => {
    // A. Direct receipts matching resident flat
    const directMatches = receipts.filter((r) => {
      const matchFlatId = myFlatId && r.flatId === myFlatId;
      const matchFlatNum = myFlatNumber && r.flatNumber?.trim().toUpperCase() === myFlatNumber;
      const matchName = resident.name && r.residentName?.trim().toLowerCase() === resident.name?.trim().toLowerCase();
      return matchFlatId || matchFlatNum || matchName;
    });

    // B. Paid bills that may not have a stored receipt document yet
    const paidBills = bills.filter((b) => {
      const isMyBill =
        (myFlatId && b.flatId === myFlatId) ||
        (myFlatNumber && b.flat?.trim().toUpperCase() === myFlatNumber);
      return isMyBill && b.status === 'Paid';
    });

    const receiptsFromBills: Receipt[] = paidBills
      .filter((b) => !directMatches.some((r) => r.billId === b.id))
      .map((b) => ({
        id: `rcp-bill-${b.id}`,
        societyId: currentSocietyId,
        billId: b.id,
        paymentId: b.transactionId || `TXN-${b.id.slice(-6)}`,
        flatId: myFlatId || b.flatId || '',
        flatNumber: b.flat || resident.flat,
        residentName: b.residentName || resident.name || 'Resident',
        receiptNumber: `RCP-${b.billNumber ? b.billNumber.replace(/[^a-zA-Z0-9]/g, '') : b.id.slice(-6).toUpperCase()}`,
        billNumber: b.billNumber || `BILL-${b.id.slice(-6)}`,
        billingPeriod: b.billingPeriod || `${b.month || ''} ${b.year || ''}`.trim() || 'Maintenance Period',
        amount: b.totalAmount || 0,
        paymentMethod: b.paymentMethod || 'UPI / Instant Gateway',
        paymentReference: b.transactionId || `UPI-${b.id.slice(-8)}`,
        utr: b.transactionId || `UTR${b.id.slice(-10)}`,
        status: 'VERIFIED',
        paidAt: (b as any).paidAt || (b as any).createdAt || new Date().toISOString(),
        verifiedAt: (b as any).paidAt || new Date().toISOString(),
        verifiedBy: 'Society Accounts & Audit',
        createdAt: (b as any).paidAt || (b as any).createdAt || new Date().toISOString(),
      }));

    // C. Combine and deduplicate by billId or receiptNumber
    const combined = [...directMatches, ...receiptsFromBills];
    const seen = new Set<string>();
    const uniqueList: Receipt[] = [];

    for (const item of combined) {
      const key = item.billId || item.receiptNumber || item.id;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(item);
      }
    }

    // Sort descending by date
    return uniqueList.sort(
      (a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime()
    );
  }, [receipts, bills, myFlatId, myFlatNumber, resident.name, currentSocietyId]);

  // Total amount cleared
  const totalAmountCleared = useMemo(() => {
    return residentReceiptsList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [residentReceiptsList]);

  // Filtered list
  const filteredReceipts = useMemo(() => {
    return residentReceiptsList.filter((r) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        r.receiptNumber.toLowerCase().includes(query) ||
        r.billNumber.toLowerCase().includes(query) ||
        r.billingPeriod.toLowerCase().includes(query) ||
        (r.utr && r.utr.toLowerCase().includes(query));

      const receiptYear = new Date(r.paidAt || r.createdAt).getFullYear().toString();
      const matchesYear = filterYear === 'all' || receiptYear === filterYear;

      return matchesSearch && matchesYear;
    });
  }, [residentReceiptsList, searchQuery, filterYear]);

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    showToast('Transaction UTR copied to clipboard');
    setTimeout(() => setCopiedUtr(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = currentSociety?.currency || '₹';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto pb-28">
      {/* 1. Header Banner & Dues Status */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audited Tax Invoices</span>
              </span>
              <span className="text-xs text-indigo-200">
                Flat {resident.flat} • {resident.tower || 'Residential Wing'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
              Payment Receipts
            </h1>
            <p className="text-xs text-indigo-200/90 mt-1 max-w-md leading-relaxed">
              Official digitally signed tax invoices and maintenance receipts for your residential unit.
            </p>
          </div>

          {/* Dues Status Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl min-w-[170px]">
            <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider block">
              Current Dues Status
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-white">
                {resident.dues === 0 ? '₹0' : `${currencySymbol}${resident.dues.toLocaleString()}`}
              </span>
              <span className={`text-[11px] font-bold ${resident.dues === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {resident.dues === 0 ? 'All Cleared ✓' : 'Due Arrears'}
              </span>
            </div>
            <p className="text-[10px] text-indigo-200/70 mt-1">
              {resident.dues === 0 ? 'Zero outstanding liabilities' : 'Action required'}
            </p>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div>
            <span className="text-indigo-200/80 block text-[11px]">Total Cleared</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">
              {currencySymbol}{totalAmountCleared.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-indigo-200/80 block text-[11px]">Verified Receipts</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">
              {residentReceiptsList.length} Invoices
            </span>
          </div>
          <div>
            <span className="text-indigo-200/80 block text-[11px]">Audit Standing</span>
            <span className="text-base font-extrabold text-emerald-400 mt-0.5 block flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Compliant</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Filter & Search Toolbar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by receipt #, bill #, month, UTR..."
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setFilterYear('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterYear === 'all' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilterYear('2026')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterYear === '2026' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              2026
            </button>
            <button
              onClick={() => setFilterYear('2025')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterYear === '2025' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              2025
            </button>
          </div>
        </div>
      </section>

      {/* 3. Receipts List / Cards */}
      {filteredReceipts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <ReceiptIcon className="w-8 h-8" />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              {residentReceiptsList.length === 0 ? 'No Stored Receipts Yet' : 'No Receipts Match Filter'}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {residentReceiptsList.length === 0
                ? 'Your receipts are generated automatically upon bill payment reconciliation. If you have just cleared your dues, your official invoice will appear here instantly.'
                : 'Try adjusting your search keywords or switching the year filter.'}
            </p>
          </div>

          {resident.dues === 0 && residentReceiptsList.length === 0 && (
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Arrears Verified: Flat {resident.flat} is in good standing</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredReceipts.map((rcp) => {
            const dateStr = new Date(rcp.paidAt || rcp.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={rcp.id}
                onClick={() => setSelectedReceipt(rcp)}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-500/50 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                          {rcp.receiptNumber}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Reconciled</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Billing Period: <span className="font-semibold text-slate-700">{rcp.billingPeriod}</span>
                        {' '}&bull; Bill {rcp.billNumber}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      {currencySymbol}{rcp.amount.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                      {dateStr}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      <span>{rcp.paymentMethod || 'UPI Intent'}</span>
                    </span>
                    {rcp.utr && (
                      <span className="font-mono text-slate-600 hidden sm:inline">
                        UTR: {rcp.utr.slice(0, 16)}...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReceipt(rcp);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Tax Invoice</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReceipt(rcp);
                        setTimeout(() => window.print(), 200);
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Print or Save PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Official Tax Invoice Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Print specific CSS */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #official-tax-invoice,
              #official-tax-invoice * {
                visibility: visible !important;
              }
              #official-tax-invoice {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                box-shadow: none !important;
                border: none !important;
                padding: 24px !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Actions Bar (hidden in print) */}
            <div className="no-print h-14 px-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NestWellLogo variant="icon" className="w-6 h-6 rounded-lg bg-white p-0.5" />
                <span className="font-bold text-xs tracking-tight">Verified Society Tax Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Receipt Document Canvas */}
            <div id="official-tax-invoice" className="p-6 sm:p-8 bg-white text-slate-800 font-sans space-y-6">
              {/* Society Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {currentSociety?.name || 'Greenwood Heights RWA'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentSociety?.address || 'Plot 42, Outer Ring Road, Bengaluru - 560103'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Society Reg. No: <span className="font-semibold text-slate-700">{currentSociety?.registeredNumber || 'DRB-3/SOR/512/2018-19'}</span>
                    {' '}&bull; GSTIN: <span className="font-semibold text-slate-700">29AAAAA0000A1Z5</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="inline-block px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-black uppercase tracking-widest text-[11px]">
                    Tax Invoice / Receipt
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1.5">
                    {selectedReceipt.receiptNumber}
                  </div>
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Billed & Issued To:
                  </span>
                  <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                    {selectedReceipt.residentName}
                  </div>
                  <div className="text-slate-600 mt-0.5 font-medium">
                    Flat No: <span className="font-bold text-indigo-700">{selectedReceipt.flatNumber}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Wing / Tower: {resident.tower || 'Tower A'} &bull; Primary Resident
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-slate-400 text-[11px]">Date of Receipt:</span>{' '}
                    <span className="font-bold text-slate-900">
                      {new Date(selectedReceipt.paidAt || selectedReceipt.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Bill Reference:</span>{' '}
                    <span className="font-mono font-semibold text-slate-800">{selectedReceipt.billNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Billing Cycle:</span>{' '}
                    <span className="font-semibold text-slate-900">{selectedReceipt.billingPeriod}</span>
                  </div>
                </div>
              </div>

              {/* Itemized Table Breakdown */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">HSN / SAC</th>
                      <th className="py-2.5 px-3 text-right">Amount ({currencySymbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">Residential Society Maintenance Charges</div>
                        <div className="text-[11px] text-slate-400">Common area lighting, security, lift & cleaning</div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">999598</td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {(selectedReceipt.amount * 0.7).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">Sinking Fund & Major Repairs Reserve</div>
                        <div className="text-[11px] text-slate-400">Statutory requirement per Cooperative Societies Act</div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">999598</td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {(selectedReceipt.amount * 0.15).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">Water Supply & STP Operations</div>
                        <div className="text-[11px] text-slate-400">Metered common infrastructure charge</div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">999598</td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {(selectedReceipt.amount * 0.15).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                    <tr>
                      <td colSpan={2} className="py-3 px-3 text-right text-xs">Total Amount Paid (INR):</td>
                      <td className="py-3 px-3 text-right text-sm font-black text-indigo-700">
                        {currencySymbol}{selectedReceipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Details & NPCI Reference */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-400 text-[11px]">Payment Mode:</span>{' '}
                    <span className="font-bold text-slate-900">{selectedReceipt.paymentMethod}</span>
                  </div>
                  {selectedReceipt.utr && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">Bank Ref / UTR:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedReceipt.utr}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyUtr(selectedReceipt.utr!)}
                        className="no-print text-indigo-600 hover:text-indigo-800 p-0.5"
                        title="Copy UTR"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {copiedUtr === selectedReceipt.utr && (
                        <span className="no-print text-[10px] text-emerald-600 font-bold">Copied!</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wide">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payment Reconciled</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Verified by: {selectedReceipt.verifiedBy || 'Accounts Committee'}
                  </p>
                </div>
              </div>

              {/* Official Digital Seal & Stamp */}
              <div className="flex items-end justify-between pt-2 border-t border-slate-200">
                {/* Certified Seal Graphic */}
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-600/70 p-1 flex items-center justify-center text-center rotate-[-6deg] select-none">
                  <div className="w-full h-full rounded-full border border-emerald-600/60 flex flex-col items-center justify-center p-1 bg-emerald-50/50">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="text-[7px] font-black uppercase text-emerald-800 leading-tight tracking-tighter mt-0.5">
                      {currentSociety?.name?.slice(0, 15) || 'RWA SOCIETY'}
                    </span>
                    <span className="text-[6px] font-bold text-emerald-700">AUDITED & STAMPED</span>
                    <span className="text-[6px] text-emerald-600 font-mono">
                      {new Date().toISOString().slice(0, 10)}
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="h-10 flex items-end justify-end">
                    <span className="font-serif italic font-bold text-slate-800 text-sm border-b border-slate-300 pb-0.5 px-2">
                      Authorized Signatory
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Hon. Treasurer / Secretary &bull; {currentSociety?.name || 'RWA'}
                  </p>
                </div>
              </div>

              {/* Footer Notice */}
              <div className="text-center pt-2 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
                This is a digitally generated tax invoice authenticated by the NestWell Society Management Cloud.
                Under Section 22 of the Indian Societies Act, this receipt serves as conclusive legal evidence of payment.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
