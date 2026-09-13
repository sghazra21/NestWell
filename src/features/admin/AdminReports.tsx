import React from 'react';
import { useApp } from '../../context/AppContext';
import { downloadCSV } from '../../lib/csv';
import { Users, UserCheck, AlertTriangle, Receipt, CreditCard } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const { residents, visitors, complaints, bills, showToast } = useApp();

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
      count: residents.length,
      onClick: () =>
        handleExport(
          residents.map(r => ({
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
      count: visitors.length,
      onClick: () =>
        handleExport(
          visitors.map(v => ({
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
      count: complaints.length,
      onClick: () =>
        handleExport(
          complaints.map(c => ({
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
      count: bills.length,
      onClick: () =>
        handleExport(
          bills.map(b => ({
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
      desc: 'Filtered list of all paid bills with payment method and transaction IDs.',
      icon: <CreditCard className="w-5 h-5 text-violet-600" />,
      count: bills.filter(b => b.status === 'Paid').length,
      onClick: () =>
        handleExport(
          bills
            .filter(b => b.status === 'Paid')
            .map(b => ({
              'Bill #': b.billNumber,
              Flat: b.flat,
              Tower: b.tower,
              Resident: b.residentName,
              'Total Amount': b.totalAmount,
              'Paid At': b.paidAt ?? '',
              'Payment Method': b.paymentMethod ?? '',
              'Transaction ID': b.transactionId ?? '',
            })),
          'payments.csv',
          'Payments',
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Society Audit & Compliance Reports
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Export live Firestore data to CSV for AGM meetings, tax filings, and committee audits
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep, idx) => (
          <div
            key={idx}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
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
                CSV • {rep.count} rows
              </span>
              <button
                onClick={rep.onClick}
                className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center gap-1.5 transition-colors"
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
