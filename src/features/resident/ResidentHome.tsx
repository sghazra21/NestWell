import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserPlus,
  Wrench,
  CreditCard,
  Building2,
  Bell,
  ShieldAlert,
  Droplets,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ResidentHomeProps {
  onOpenInviteVisitor: () => void;
  onOpenReportProblem: () => void;
  onOpenPayDues: () => void;
  onOpenBookFacility: () => void;
  onOpenGateApproval: () => void;
  onOpenNoticeDetails: () => void;
  onNavigateToTab: (tab: 'home' | 'activity' | 'notices' | 'more') => void;
}

export const ResidentHome: React.FC<ResidentHomeProps> = ({
  onOpenInviteVisitor,
  onOpenReportProblem,
  onOpenPayDues,
  onOpenBookFacility,
  onOpenGateApproval,
  onOpenNoticeDetails,
  onNavigateToTab,
}) => {
  const { resident, gateAlert, complaints, visitors, notices, elections, setIsElectionModalOpen, currentSociety, userProfile } = useApp();

  const waitingVisitorCount = visitors.filter((v) => v.flat === resident.flat && v.status === 'waiting').length;
  const openComplaintsCount = complaints.filter((c) => c.flat === resident.flat && c.status !== 'resolved').length;
  const inProgressComplaintsCount = complaints.filter((c) => c.flat === resident.flat && c.status === 'started').length;
  const latestNotice = notices[0];
  const activeElection = elections[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto pb-24">
      {/* 1. Sleek Top Indigo Header */}
      <section className="bg-indigo-700 p-6 sm:p-8 text-white rounded-3xl mb-4 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs text-indigo-200 font-medium">Good evening,</div>
            <div className="text-2xl font-bold tracking-tight">{resident.name.split(' ')[0] || userProfile?.name?.split(' ')[0] || 'Resident'} 👋</div>
            <div className="text-xs text-indigo-200/90 mt-0.5">{currentSociety?.name || ''}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs">
              {resident.flat}
            </span>
            <button
              onClick={() => onNavigateToTab('notices')}
              className="relative w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              aria-label="Notices and alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-400 ring-2 ring-indigo-700" />
            </button>
          </div>
        </div>

        {/* Maintenance Due Card nestled directly inside header */}
        <div
          onClick={onOpenPayDues}
          className="bg-white text-slate-900 p-4 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all border border-slate-100"
        >
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
              Maintenance Due
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {resident.dues > 0 ? `₹${resident.dues.toLocaleString()}` : '₹0'}
            </div>
            <span
              className={`text-[11px] font-semibold block mt-0.5 ${
                resident.dues > 0 ? 'text-orange-600' : 'text-emerald-600'
              }`}
            >
              {resident.dues > 0 ? 'Due • Itemized Breakdown' : 'All Cleared ✓'}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenPayDues();
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            Pay Now
          </button>
        </div>
      </section>

      {/* 2. Needs Your Attention / Live Gate Alert */}
      {gateAlert.active && gateAlert.visitor && (
        <section className="bg-orange-50 border border-orange-100 rounded-2xl p-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
            <div className="text-xs font-bold text-orange-800 uppercase tracking-wider">
              Live Alert • Security Gate 1
            </div>
          </div>
          <div className="text-sm font-bold mt-1.5 text-orange-950">
            {gateAlert.visitor.name} is waiting at the gate.
          </div>
          <p className="text-xs text-orange-800/80 mt-0.5">
            {gateAlert.visitor.entryTime || gateAlert.visitor.expectedTime || 'Recently'} • {gateAlert.visitor.type}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              id="approve-alert-btn"
              onClick={onOpenGateApproval}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              Approve Entry
            </button>
            <button
              id="view-visitor-alert-btn"
              onClick={onOpenGateApproval}
              className="flex-1 bg-white hover:bg-orange-100/50 text-orange-700 border border-orange-200 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              Review / Reject
            </button>
          </div>
        </section>
      )}

      {/* 3. Society Elections & Governance Highlight */}
      {activeElection && (
      <section className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-md relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-700 text-indigo-200 text-[10px] font-bold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Society Committee & Elections</span>
            </span>
            <h3 className="text-base font-bold tracking-tight text-white pt-1">
              {activeElection.title || activeElection.term || 'Society Election'}
            </h3>
            <p className="text-xs text-indigo-200/90 leading-relaxed max-w-xs">
              Digital voting is open. Review verified nominees and cast your confidential secret ballot.
            </p>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-indigo-700/80 flex items-center justify-between">
          <span className="text-[11px] text-indigo-300 font-medium">
            {activeElection.totalVotesCast} Votes Cast &bull; {activeElection.positions?.length || 0} Positions
          </span>
          <button
            onClick={() => setIsElectionModalOpen(true)}
            className="px-3.5 py-1.5 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-50 transition-all flex items-center gap-1"
          >
            <span>Cast Ballot</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
      )}

      {/* 4. Secondary Metric Cards (Visitors & Complaints) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Visitors */}
        <div
          onClick={() => {
            if (gateAlert.active) {
              onOpenGateApproval();
            } else {
              onNavigateToTab('activity');
            }
          }}
          className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-600 cursor-pointer transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Visitors
          </span>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {waitingVisitorCount > 0 ? `${waitingVisitorCount} waiting` : 'Clear'}
            </div>
            <span className="text-xs font-semibold text-indigo-600 block mt-0.5">
              {waitingVisitorCount > 0 ? 'At Gate' : 'All Clear'}
            </span>
          </div>
          <span className="text-[11px] text-indigo-600 font-bold flex items-center gap-0.5">
            {waitingVisitorCount > 0 ? 'Review Entry →' : 'Passes →'}
          </span>
        </div>

        {/* Open Complaints */}
        <div
          onClick={() => onNavigateToTab('activity')}
          className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-600 cursor-pointer transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Open Complaints
          </span>
          <div className="my-2">
            <div className="text-2xl font-bold text-orange-600 tracking-tight">
              {openComplaintsCount}
            </div>
            <span className="text-xs font-semibold text-slate-500 block mt-0.5">
              {inProgressComplaintsCount > 0 ? `${inProgressComplaintsCount} In Progress` : 'None in progress'}
            </span>
          </div>
          <span className="text-[11px] text-indigo-600 font-bold flex items-center gap-0.5">
            Track Status →
          </span>
        </div>
      </section>

      {/* 4. Quick Actions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Quick Actions
          </h2>
          <span className="text-xs text-slate-400">One-tap actions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Invite Visitor */}
          <button
            id="quick-action-invite-btn"
            onClick={onOpenInviteVisitor}
            className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-600 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-600">
                Invite Visitor
              </div>
              <div className="text-[11px] text-slate-400">Create digital pass</div>
            </div>
          </button>

          {/* Report Problem */}
          <button
            id="quick-action-report-btn"
            onClick={onOpenReportProblem}
            className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-600 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-800 group-hover:text-orange-600">
                Report Issue
              </div>
              <div className="text-[11px] text-slate-400">Plumbing, lift, power</div>
            </div>
          </button>

          {/* Pay Dues */}
          <button
            id="quick-action-pay-btn"
            onClick={onOpenPayDues}
            className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-600 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-600">
                Maintenance
              </div>
              <div className="text-[11px] text-slate-400">Pay & receipts</div>
            </div>
          </button>

          {/* Book Facility (only when the society enables facility booking) */}
          {currentSociety?.features?.facilityBooking !== false && (
            <button
              id="quick-action-book-btn"
              onClick={onOpenBookFacility}
              className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-600 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="mt-3">
                <div className="text-sm font-bold text-slate-800 group-hover:text-purple-600">
                  Book Facility
                </div>
                <div className="text-[11px] text-slate-400">Clubhouse, gym, court</div>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* 5. Latest Notice */}
      {latestNotice ? (
        <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              <span>Latest Notice • {latestNotice.date}</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {latestNotice.time || 'Tomorrow'}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-800 leading-snug">
            {latestNotice.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {latestNotice.message}
          </p>

          <div className="mt-3.5 pt-2.5 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Target: {latestNotice.targetBlock || 'All Towers'}</span>
            <button
              id="view-notice-btn"
              onClick={onOpenNoticeDetails}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View Notice</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      ) : notices.length === 0 ? (
        <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-center">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No notices yet</h3>
          <p className="text-xs text-slate-400 mt-1">Official circulars from your society will appear here.</p>
        </section>
      ) : null}
    </div>
  );
};
