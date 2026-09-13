import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { downloadCSV } from '../../lib/csv';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Home,
  CalendarCheck,
  Megaphone,
  Vote,
  ChevronDown,
} from 'lucide-react';

type DateFilter = 'all' | 'this_month' | 'last_3_months' | 'this_year';

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: 'All Time',
  this_month: 'This Month',
  last_3_months: 'Last 3 Months',
  this_year: 'This Year',
};

function filterByDate<T>(items: T[], dateField: keyof T, filter: DateFilter): T[] {
  if (filter === 'all') return items;
  const now = new Date();
  let start: Date;
  if (filter === 'this_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filter === 'last_3_months') {
    start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  } else {
    start = new Date(now.getFullYear(), 0, 1);
  }
  const startStr = start.toISOString().slice(0, 10);
  return items.filter((item) => {
    const val = item[dateField];
    if (typeof val === 'string' && val.length >= 10) {
      return val.slice(0, 10) >= startStr;
    }
    return true;
  });
}

export const AdminReports: React.FC = () => {
  const {
    residents,
    visitors,
    complaints,
    bills,
    payments,
    flats,
    facilityBookings,
    notices,
    elections,
    votes,
    showToast,
  } = useApp();

  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredData = useMemo(() => ({
    residents: filterByDate(residents, 'moveInDate', dateFilter),
    visitors: filterByDate(visitors, 'expectedDate', dateFilter),
    complaints: filterByDate(complaints, 'reportedAt', dateFilter),
    bills: filterByDate(bills, 'dueDate', dateFilter),
    payments: filterByDate(payments, 'submittedAt', dateFilter),
    facilityBookings: filterByDate(facilityBookings, 'date', dateFilter),
    notices: filterByDate(notices, 'date', dateFilter),
    elections: filterByDate(elections, 'createdAt', dateFilter),
  }), [residents, visitors, complaints, bills, payments, facilityBookings, notices, elections, dateFilter]);

  const handleExport = (
    data: Record<string, any>[],
    filename: string,
    label: string,
  ) => {
    if (data.length === 0) {
      showToast(`No ${label.toLowerCase()} data to export`);
      return;
    }
    downloadCSV(data, filename);
    showToast(`${label} report downloaded (${data.length} rows)`);
  };

  const reports = [
    {
      title: 'Residents Directory',
      desc: 'Flat-wise roster of all residents with contact, ownership type, and dues.',
      icon: <Users className="w-5 h-5 text-teal-600" />,
      count: filteredData.residents.length,
      onClick: () =>
        handleExport(
          filteredData.residents.map((r) => ({
            Name: r.name,
            Flat: r.flat,
            Tower: r.tower,
            Phone: r.phone,
            Email: r.email,
            Type: r.type,
            Status: r.status,
            Dues: r.dues,
          })),
          'residents.csv',
          'Residents',
        ),
    },
    {
      title: 'Visitors Log',
      desc: 'All visitor entries with entry/exit times, purpose, and pass numbers.',
      icon: <UserCheck className="w-5 h-5 text-blue-600" />,
      count: filteredData.visitors.length,
      onClick: () =>
        handleExport(
          filteredData.visitors.map((v) => ({
            Name: v.name,
            Phone: v.phone,
            Flat: v.flat,
            Tower: v.tower,
            Resident: v.residentName,
            Purpose: v.purpose,
            Type: v.type,
            Status: v.status,
            'Expected Date': v.expectedDate,
            'Expected Time': v.expectedTime,
            'Entry Time': v.entryTime ?? '',
            'Exit Time': v.exitTime ?? '',
            'Pass Number': v.passNumber,
          })),
          'visitors.csv',
          'Visitors',
        ),
    },
    {
      title: 'Complaints Register',
      desc: 'Ticket-wise complaint log with category, priority, and resolution status.',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      count: filteredData.complaints.length,
      onClick: () =>
        handleExport(
          filteredData.complaints.map((c) => ({
            'Ticket #': c.ticketNumber,
            Title: c.title,
            Category: c.category,
            Flat: c.flat,
            Tower: c.tower,
            Resident: c.residentName,
            Priority: c.priority,
            Status: c.status,
            'Reported At': c.reportedAt,
            'Assigned To': c.assignedTo?.name ?? '',
          })),
          'complaints.csv',
          'Complaints',
        ),
    },
    {
      title: 'All Bills',
      desc: 'Complete maintenance billing ledger with line items and payment status.',
      icon: <Receipt className="w-5 h-5 text-emerald-600" />,
      count: filteredData.bills.length,
      onClick: () =>
        handleExport(
          filteredData.bills.map((b) => ({
            'Bill #': b.billNumber,
            Flat: b.flat,
            Tower: b.tower,
            Resident: b.residentName,
            Month: b.month,
            Year: b.year,
            'Maintenance Fee': b.maintenanceFee,
            'Parking Fee': b.parkingFee,
            'Late Fee': b.lateFee,
            'Total Amount': b.totalAmount,
            Status: b.status,
            'Due Date': b.dueDate,
            'Paid At': b.paidAt ?? '',
          })),
          'bills.csv',
          'Bills',
        ),
    },
    {
      title: 'Payments Received',
      desc: 'All paid bills with payment method, UTR, verification status, and audit trail.',
      icon: <CreditCard className="w-5 h-5 text-violet-600" />,
      count: filteredData.payments.length,
      onClick: () =>
        handleExport(
          filteredData.payments.map((p) => ({
            'Payment ID': p.id,
            'Bill #': p.paymentReference,
            Flat: p.flatNumber,
            Resident: p.submittedBy,
            Amount: p.amount,
            Currency: p.currency,
            'Payment Method': p.paymentMethod,
            UTR: p.utr ?? '',
            Status: p.status,
            'Submitted At': p.submittedAt,
            'Submitted By': p.submittedBy,
            'Verified At': p.verifiedAt ?? '',
            'Verified By': p.verifiedBy ?? '',
            'Rejection Reason': p.rejectionReason ?? '',
            Notes: p.notes ?? '',
          })),
          'payments.csv',
          'Payments',
        ),
    },
    {
      title: 'Flats',
      desc: 'All flats with tower, status, owner/tenant details, and outstanding dues.',
      icon: <Home className="w-5 h-5 text-cyan-600" />,
      count: flats.length,
      onClick: () =>
        handleExport(
          flats.map((f) => ({
            'Flat #': f.number,
            Tower: f.towerName ?? f.towerId,
            Status: f.status,
            'Owner Names': (f.ownerNames ?? []).join(', '),
            'Tenant Names': (f.tenantNames ?? []).join(', '),
            'Primary Resident': f.primaryResidentName ?? '',
            Phone: f.primaryResidentPhone ?? '',
            Dues: f.dues ?? 0,
            Type: f.type,
            Floor: f.floor,
          })),
          'flats.csv',
          'Flats',
        ),
    },
    {
      title: 'Facility Bookings',
      desc: 'All facility bookings with flat, date, time slot, and confirmation status.',
      icon: <CalendarCheck className="w-5 h-5 text-pink-600" />,
      count: facilityBookings.length,
      onClick: () =>
        handleExport(
          facilityBookings.map((b) => ({
            'Facility': b.facilityName,
            'Booked By': b.residentName,
            Flat: b.flat,
            Date: b.date,
            'Time Slot': b.timeSlot,
            'Total Cost': b.totalCost,
            Status: b.status,
            'Booked At': b.bookedAt,
          })),
          'facility-bookings.csv',
          'Facility Bookings',
        ),
    },
    {
      title: 'Notices',
      desc: 'All published notices with priority, audience, date, and author.',
      icon: <Megaphone className="w-5 h-5 text-orange-600" />,
      count: filteredData.notices.length,
      onClick: () =>
        handleExport(
          filteredData.notices.map((n) => ({
            Title: n.title,
            Priority: n.priority,
            Category: n.category,
            Audience: n.audience,
            'Target Block': n.targetBlock ?? '',
            Date: n.date,
            Time: n.time ?? '',
            Author: n.publishedBy,
          })),
          'notices.csv',
          'Notices',
        ),
    },
    {
      title: 'Elections',
      desc: 'Election details with status, vote counts, positions, and date ranges.',
      icon: <Vote className="w-5 h-5 text-indigo-600" />,
      count: filteredData.elections.length,
      onClick: () =>
        handleExport(
          filteredData.elections.map((e) => ({
            'Election': e.title,
            Term: e.term,
            Status: e.status,
            'Total Votes': e.totalVotesCast,
            Positions: e.positions.join(', '),
            'Nomination Start': e.nominationStart,
            'Nomination End': e.nominationEnd,
            'Voting Start': e.votingStart,
            'Voting End': e.votingEnd,
            'Eligible Voters': e.eligibleVotersCount,
            'Results Declared': e.resultsDeclared ? 'Yes' : 'No',
          })),
          'elections.csv',
          'Elections',
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Society Audit & Compliance Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export live Firestore data to CSV for AGM meetings, tax filings, and committee audits
          </p>
        </div>
        <div className="relative shrink-0">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors cursor-pointer"
          >
            {(Object.entries(DATE_FILTER_LABELS) as [DateFilter, string][]).map(
              ([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ),
            )}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {reports.every((r) => r.count === 0) && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <FileSpreadsheet className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No data to export</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Once residents, visitors, complaints, or bills are added to the society, you can export them as CSV reports here.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep, idx) => (
          <div
            key={idx}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FBF9F5] border border-slate-200 flex items-center justify-center shrink-0">
                {rep.icon}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">{rep.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rep.desc}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">
                CSV &bull; {rep.count} {rep.count === 1 ? 'row' : 'rows'}
              </span>
              <button
                onClick={rep.onClick}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
