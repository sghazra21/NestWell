import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  CreditCard,
  Wrench,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Send,
} from 'lucide-react';

interface AdminDashboardOverviewProps {
  onNavigate: (tab: string) => void;
  onOpenComplaintDrawer: (complaintId: string) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  onNavigate,
  onOpenComplaintDrawer,
}) => {
  const { complaints, visitors, bills, residents, flats, currentSociety } = useApp();

  const totalDuesPending = bills
    .filter((b) => b.status !== 'Paid')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const openComplaints = complaints.filter((c) => c.status !== 'resolved');
  const urgentComplaints = openComplaints.filter((c) => c.priority === 'Urgent');
  const visitorsInside = visitors.filter((v) => v.status === 'inside').length;
  const overdueFlatsCount = bills.filter((b) => b.status === 'Overdue').length;
  const occupiedFlats = flats.filter((f) => f.status === 'active').length;
  const attentionComplaints = [...urgentComplaints, ...openComplaints.filter((c) => c.priority !== 'Urgent')].slice(0, 3);
  const attentionBills = bills.filter((b) => b.status === 'Overdue').slice(0, 2);

  return (
    <div className="space-y-8">
      {/* 1. Header greeting from Sleek Interface design */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Good morning, Admin 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Here is what is happening at {currentSociety?.name || 'your society'} today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('notices')}
            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Broadcast Notice</span>
          </button>
        </div>
      </div>

      {/* 2. 3-4 Clean KPI metric blocks (Sleek Theme pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Residents */}
        <div
          onClick={() => onNavigate('people')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-600 cursor-pointer transition-all"
        >
          <div className="text-sm font-medium text-slate-500 mb-2">Total Residents</div>
          <div className="text-3xl font-bold text-slate-900">{residents.length}</div>
          <div className="mt-2 text-xs text-slate-400 font-medium flex items-center gap-1">
            <span>{occupiedFlats} / {flats.length} flats occupied</span>
          </div>
        </div>

        {/* Open Complaints */}
        <div
          onClick={() => onNavigate('complaints')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-600 cursor-pointer transition-all"
        >
          <div className="text-sm font-medium text-slate-500 mb-2">Open Complaints</div>
          <div className="text-3xl font-bold text-orange-600">{openComplaints.length}</div>
          <div className="mt-2 text-xs text-slate-400 font-medium">
            {urgentComplaints.length} urgent
            {openComplaints.length > 0 ? ` • ${openComplaints.filter((c) => !c.assignedTo).length} unassigned` : ''}
          </div>
        </div>

        {/* Pending Payments */}
        <div
          onClick={() => onNavigate('finance')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-600 cursor-pointer transition-all"
        >
          <div className="text-sm font-medium text-slate-500 mb-2">Pending Payments</div>
          <div className="text-3xl font-bold text-slate-900">₹{(totalDuesPending / 100000).toFixed(2)}L</div>
          <div className="mt-2 text-xs text-rose-500 font-medium">
            {overdueFlatsCount} flats overdue
          </div>
        </div>

        {/* Gate Activity */}
        <div
          onClick={() => onNavigate('visitors')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-600 cursor-pointer transition-all"
        >
          <div className="text-sm font-medium text-slate-500 mb-2">Gate Activity</div>
          <div className="text-3xl font-bold text-indigo-700">{visitorsInside} Visitors</div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">
            {currentSociety?.gates
              ? currentSociety.gates.filter(g => g.active).map(g => g.name).join(' & ') || 'No gates configured'
              : 'Gates configured'}
          </div>
        </div>
      </div>

      {/* 3. "Needs Your Attention" card from Sleek Interface design */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-base text-slate-900">Needs Your Attention</h2>
          <button
            onClick={() => onNavigate('complaints')}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {attentionComplaints.length === 0 && attentionBills.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm font-semibold text-slate-700">All clear — nothing needs attention</p>
              <p className="text-xs text-slate-400 mt-1">Urgent complaints and overdue bills will appear here.</p>
            </div>
          ) : (
            <>
              {attentionComplaints.map((comp) => (
                <div key={comp.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                    🔧
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{comp.title}</div>
                    <div className="text-sm text-slate-500">
                      {comp.residentName} ({comp.flat}) • {comp.priority} Priority
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenComplaintDrawer(comp.id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0"
                  >
                    Assign Staff
                  </button>
                </div>
              ))}
              {attentionBills.map((bill) => (
                <div key={bill.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                    💳
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800">
                      Overdue bill {bill.billNumber}
                    </div>
                    <div className="text-sm text-slate-500">
                      {bill.residentName} ({bill.flat}) • ₹{bill.totalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('finance')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0"
                  >
                    Review
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* 4. Two Columns: Active Maintenance Tickets & Live Gate Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Complaints */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Maintenance Tickets</h3>
              <p className="text-xs text-slate-500">Tickets awaiting resolution or technician assignment</p>
            </div>
            <button
              onClick={() => onNavigate('complaints')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all ({complaints.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No complaints yet. New tickets from residents will appear here.
              </p>
            ) : (
              complaints.slice(0, 3).map((comp) => (
              <div
                key={comp.id}
                onClick={() => onOpenComplaintDrawer(comp.id)}
                className="p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 cursor-pointer transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-700">Flat {comp.flat}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-600">{comp.category}</span>
                    <span className="text-xs text-slate-400 font-mono">#{comp.ticketNumber}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {comp.title}
                  </h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reported {comp.reportedAt}</span>
                    {comp.assignedTo && (
                      <span className="text-slate-700 font-semibold">• {comp.assignedTo.name}</span>
                    )}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${
                    comp.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : comp.priority === 'Urgent'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {comp.status}
                </span>
              </div>
            ))
            )}
          </div>
        </div>

        {/* Right: Security Gate Activity Stream */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Security Gate Log Stream</h3>
              <p className="text-xs text-slate-500">Real-time visitor passes and arrivals</p>
            </div>
            <button
              onClick={() => onNavigate('visitors')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Full log book →
            </button>
          </div>

          <div className="space-y-3">
            {visitors.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No visitor activity yet. Gate check-ins will stream here live.
              </p>
            ) : (
              visitors.slice(0, 4).map((vis) => (
              <div
                key={vis.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center">
                    {vis.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800">{vis.name}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {vis.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Visiting Flat <strong className="text-slate-800">{vis.flat}</strong> ({vis.purpose})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      vis.status === 'inside'
                        ? 'bg-emerald-100 text-emerald-800'
                        : vis.status === 'waiting'
                        ? 'bg-orange-100 text-orange-800 animate-pulse'
                        : vis.status === 'exited'
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {vis.status}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                    #{vis.passNumber}
                  </span>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
