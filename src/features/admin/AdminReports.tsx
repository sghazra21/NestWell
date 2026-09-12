import React from 'react';
import { Download, FileText, FileSpreadsheet, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const reports = [
    {
      title: 'September 2024 Maintenance Ledger',
      desc: 'Itemized flat-by-flat payment logs, UPI transaction references, and outstanding late fee lists.',
      format: 'Excel / CSV',
      size: '142 KB',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
    },
    {
      title: 'Security Gate Movement Log (Last 30 Days)',
      desc: 'Complete timestamped log of all visitor entries, deliveries, exits, and pre-approved QR passes.',
      format: 'PDF',
      size: '2.1 MB',
      icon: <FileText className="w-5 h-5 text-blue-600" />,
    },
    {
      title: 'Annual Society Financial Audit Report (FY 2023-24)',
      desc: 'Signed by Certified Chartered Accountant (RWA Auditor). Income & expense statement.',
      format: 'PDF',
      size: '4.8 MB',
      icon: <FileText className="w-5 h-5 text-teal-700" />,
    },
    {
      title: 'Complaint SLA & Vendor Performance Audit',
      desc: 'Resolution timings across plumbing, lift, electrical, and housekeeping vendors.',
      format: 'PDF',
      size: '620 KB',
      icon: <FileText className="w-5 h-5 text-amber-600" />,
    },
    {
      title: 'Occupancy & Tenant Police Verification Roster',
      desc: 'Current roster of 132 occupied flats with verified KYC documents and vehicle RFID tag IDs.',
      format: 'Excel / CSV',
      size: '210 KB',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Society Audit & Compliance Reports
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Download certified reports for AGM meetings, tax filings, and committee audits
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
                {rep.format} • {rep.size}
              </span>
              <button
                onClick={() => alert(`Downloading "${rep.title}"...`)}
                className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
