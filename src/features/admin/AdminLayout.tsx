import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../../components/common/Avatar';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { AdminPeople } from './AdminPeople';
import { AdminVisitors } from './AdminVisitors';
import { AdminComplaints } from './AdminComplaints';
import { AdminFinance } from './AdminFinance';
import { AdminFacilities } from './AdminFacilities';
import { AdminNotices } from './AdminNotices';
import { AdminReports } from './AdminReports';
import { AdminSettings } from './AdminSettings';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Wrench,
  CreditCard,
  Building2,
  Bell,
  FileSpreadsheet,
  Settings,
  Building,
  Search,
  LogOut,
  ChevronDown,
  ExternalLink,
  Vote,
  Plus,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const {
    role,
    userProfile,
    currentMembership,
    complaints,
    visitors,
    bills,
    elections,
    nominations,
    committeeMembers,
    currentSociety,
    setIsElectionModalOpen,
    setIsPaymentsResearchOpen,
  } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const openTicketsCount = complaints.filter((c) => c.status !== 'resolved').length;
  const overdueBillsCount = bills.filter((b) => b.status === 'Overdue').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'people', label: 'People', icon: <Users className="w-5 h-5" /> },
    { id: 'visitors', label: 'Visitors', icon: <ShieldCheck className="w-5 h-5" /> },
    {
      id: 'elections',
      label: 'Elections & Board',
      icon: <Vote className="w-5 h-5" />,
      badge: 'Live',
    },
    {
      id: 'complaints',
      label: 'Complaints',
      icon: <Wrench className="w-5 h-5" />,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: <CreditCard className="w-5 h-5" />,
      badge: overdueBillsCount > 0 ? `${overdueBillsCount}` : undefined,
    },
    { id: 'facilities', label: 'Facilities', icon: <Building2 className="w-5 h-5" /> },
    { id: 'notices', label: 'Notices', icon: <Bell className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans text-slate-900 antialiased">
      {/* 1. Top Header Bar (Sleek Theme header) */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 sticky top-10 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xs">
            <div className="w-4 h-4 border-2 border-white rounded-xs" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            {currentSociety?.name || 'Society'} <span className="text-indigo-600">Admin</span>
          </span>
        </div>

        {/* Center Search Input */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search flats, residents, complaints..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/30 transition-all"
            />
          </div>
        </div>

        {/* Right User Info & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-900">
              {userProfile?.name || currentMembership?.name || 'Society Admin'}
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap">
              {currentSociety?.name || 'Admin Portal'}
              {currentMembership?.designation ? ` • ${currentMembership.designation}` : ''}
            </div>
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shadow-xs">
            {(userProfile?.name || currentMembership?.name || 'A')
              .split(' ')
              .map((w) => w.charAt(0))
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 2. Left Sleek White Sidebar */}
        <aside className="w-60 bg-white border-r border-slate-100 p-4 flex flex-col gap-1 shrink-0">
          <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Menu
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'complaints') setSelectedComplaintId(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-xs transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Today's Entry Card from Design Theme */}
          <div className="mt-4 p-4 bg-indigo-600 rounded-2xl text-white shadow-sm">
            <div className="text-xs opacity-80 mb-1">Today's Entry</div>
            <div className="text-xl font-bold">
              {visitors.filter((v) => v.status === 'inside').length} Visitors
            </div>
            <button
              onClick={() => setActiveTab('visitors')}
              className="mt-3 w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg text-center text-xs font-semibold transition-colors"
            >
              View Logs
            </button>
          </div>
        </aside>

        {/* 3. Main Content View Area */}
        <main className="flex-1 p-6 md:p-8 bg-[#F9FAFB] overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <AdminDashboardOverview
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenComplaintDrawer={(ticketId) => {
                  setSelectedComplaintId(ticketId);
                  setActiveTab('complaints');
                }}
              />
            )}

            {activeTab === 'elections' && (
              <div className="space-y-6">
                {/* Header with quick launch action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <Vote className="w-5 h-5 text-indigo-600" />
                      <span>Society Committee & Digital Elections Portal</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Administer democratic voting cycles, schedule election instances, review nominations, and manage executive committee records.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPaymentsResearchOpen(true)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>India Payments Stack</span>
                    </button>
                    <button
                      onClick={() => setIsElectionModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Manage / Schedule Election</span>
                    </button>
                  </div>
                </div>

                {/* Top Metrics Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Cycle</span>
                    <div className="text-xl font-extrabold text-indigo-600 mt-1">2026–2028 RWA</div>
                    <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">● Voting in Progress</span>
                  </div>
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Ballots Cast</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">
                      {elections[0]?.totalVotesCast || 142} / 250 Flats
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">56.8% Voter Turnout</span>
                  </div>
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Executive Positions</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">4 Open Roles</div>
                    <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">President, Secretary, etc.</span>
                  </div>
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Nominees</span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{nominations.length} Approved</div>
                    <span className="text-[11px] text-indigo-600 font-bold block mt-0.5">All KYC Verified</span>
                  </div>
                </div>

                {/* Current Executive Committee Members Grid */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Current RWA Managing Committee</h3>
                      <p className="text-xs text-slate-500">Elected office-bearers currently presiding over the society</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      Term: 2024–2026
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {committeeMembers.map((m) => (
                      <div key={m.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center gap-3">
                        <Avatar
                          name={m.name}
                          src={m.avatar}
                          className="w-11 h-11 rounded-full border-2 border-indigo-200 text-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{m.name}</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 inline-block mt-0.5">
                            {m.position}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">Flat {m.flat} &bull; {m.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nominees & Ballots Quick Review */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Active Candidates & Secret Ballot Tally</h3>
                      <p className="text-xs text-slate-500">Live vote count stored cryptographically in Firestore</p>
                    </div>
                    <button
                      onClick={() => setIsElectionModalOpen(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Open Full Ballot Modal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {nominations.map((nom) => (
                      <div key={nom.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {nom.position}
                          </span>
                          <span className="text-xs font-extrabold text-indigo-600 font-mono">
                            {nom.voteCount || 0} Votes
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900">{nom.candidateName}</h4>
                        <p className="text-[11px] text-slate-500">Flat {nom.flat} &bull; {nom.profession}</p>
                        <p className="text-[10px] text-slate-600 italic mt-2 bg-slate-50 p-2 rounded-lg line-clamp-2">
                          &ldquo;{nom.manifesto}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'people' && <AdminPeople />}
            {activeTab === 'visitors' && <AdminVisitors />}
            {activeTab === 'complaints' && (
              <AdminComplaints
                selectedTicketId={selectedComplaintId}
                onClearSelectedTicket={() => setSelectedComplaintId(null)}
              />
            )}
            {activeTab === 'finance' && <AdminFinance />}
            {activeTab === 'facilities' && <AdminFacilities />}
            {activeTab === 'notices' && <AdminNotices />}
            {activeTab === 'reports' && <AdminReports />}
            {activeTab === 'settings' && <AdminSettings />}
          </div>
        </main>
      </div>
    </div>
  );
};
