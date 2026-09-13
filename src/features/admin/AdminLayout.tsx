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
  Search,
  LogOut,
  ExternalLink,
  Vote,
  Plus,
  Home,
  Menu,
  X,
  Eye,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const {
    role,
    viewMode,
    setViewMode,
    canAccessAdminView,
    isPlatformAdmin,
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
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    ...(currentSociety?.features?.facilityBooking !== false
      ? [{ id: 'facilities', label: 'Facilities', icon: <Building2 className="w-5 h-5" /> }]
      : []),
    { id: 'notices', label: 'Notices', icon: <Bell className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'complaints') setSelectedComplaintId(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans text-slate-900 antialiased">
      {/* 1. Top Header Bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Hamburger button for mobile & tablet */}
          <button
            id="admin-mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xs text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 line-clamp-1">
                {currentSociety?.name || 'Society'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider border border-indigo-100 hidden sm:inline-block">
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Center Search Input (Medium & Large screens) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search flats, residents, complaints..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/30 transition-all"
            />
          </div>
        </div>

        {/* Right User Info & Elevated Privileges Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Switch to Resident View Button */}
          <button
            id="admin-switch-to-resident-header-btn"
            onClick={() => setViewMode('resident')}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold transition-all shadow-2xs group"
            title="Admins can view and use the Resident portal"
          >
            <Home className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Resident View</span>
            <span className="sm:hidden text-[11px]">Resident</span>
          </button>

          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {userProfile?.name || currentMembership?.name || 'Society Admin'}
            </div>
            <div className="text-[11px] text-slate-500 whitespace-nowrap">
              {currentMembership?.designation || 'Committee / Admin'}
            </div>
          </div>

          <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-xs">
            {(userProfile?.name || currentMembership?.name || 'A')
              .split(' ')
              .map((w) => w.charAt(0))
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation (Slide-over on Mobile/Tablet) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 border-r border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {currentSociety?.name || 'Society Admin'}
                  </h3>
                  <span className="text-[11px] font-semibold text-indigo-600">Admin Console</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resident View Banner inside Mobile Drawer */}
            <div className="p-3.5 m-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                <Home className="w-4 h-4 text-indigo-600" />
                <span>Admins are residents too</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Switch to see what residents see: payment cards, notices, ballots & passes.
              </p>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setViewMode('resident');
                }}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Switch to Resident View</span>
              </button>
            </div>

            {/* Navigation items in Mobile Drawer */}
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-xs transition-colors ${
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
                          isActive ? 'bg-indigo-600 text-white' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Today's visitors & Sign out */}
            <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
              <div className="px-2 py-1.5 flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">Active Inside:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {visitors.filter((v) => v.status === 'inside').length} Visitors
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* 2. Left Desktop/Laptop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 p-4 flex-col gap-1 shrink-0 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Management Console
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors ${
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
                        isActive ? 'bg-indigo-600 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Resident View Card for Elevated Admins */}
          <div className="mt-3 p-3.5 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-2xl border border-indigo-100/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <Home className="w-4 h-4 text-indigo-600" />
              <span>Resident View</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Admins can preview the resident interface, review dues, vote on ballots, and report problems.
            </p>
            <button
              id="admin-switch-to-resident-sidebar-btn"
              onClick={() => setViewMode('resident')}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View as Resident</span>
            </button>
          </div>

          {/* Today's Entry Card */}
          <div className="mt-2 p-3.5 bg-slate-900 rounded-2xl text-white shadow-xs">
            <div className="text-[11px] text-slate-400 font-medium">Inside Society Today</div>
            <div className="text-lg font-extrabold text-white mt-0.5">
              {visitors.filter((v) => v.status === 'inside').length} Visitors
            </div>
            <button
              onClick={() => setActiveTab('visitors')}
              className="mt-2 w-full bg-white/15 hover:bg-white/25 py-1.5 rounded-lg text-center text-xs font-semibold text-slate-100 transition-colors"
            >
              View Visitors Log
            </button>
          </div>
        </aside>

        {/* 3. Main Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#F9FAFB] overflow-y-auto pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto w-full">
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
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Launch New Election</span>
                    </button>
                  </div>
                </div>

                {/* Live Election Overview Banner */}
                {elections.length > 0 ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-md space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                          {elections[0].status.toUpperCase()}
                        </span>
                        <span className="text-xs text-indigo-200">Term: {elections[0].term}</span>
                      </div>
                      <span className="text-xs text-indigo-200 font-mono">
                        Voting Deadline: {elections[0].endDate}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black tracking-tight">{elections[0].title}</h3>
                      <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                        Democratic resident ballot hosted on the NestWell tamper-evident ledger.
                        All verified adult flat owners and registered tenants are entitled to cast single weighted ballots.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-indigo-700/50 text-xs">
                      <div>
                        <span className="text-indigo-300 text-[11px] block">Open Seats</span>
                        <span className="text-base font-bold">{elections[0].positions?.length || 4} Positions</span>
                      </div>
                      <div>
                        <span className="text-indigo-300 text-[11px] block">Total Nominations</span>
                        <span className="text-base font-bold">{nominations.length} Candidates</span>
                      </div>
                      <div>
                        <span className="text-indigo-300 text-[11px] block">Eligible Voters</span>
                        <span className="text-base font-bold">{currentSociety?.totalFlats || 120} Flats</span>
                      </div>
                      <div>
                        <span className="text-indigo-300 text-[11px] block">Security Guarded</span>
                        <span className="text-base font-bold text-emerald-300">100% Tamper Proof</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                    <Vote className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-900">No Active Elections Configured</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Schedule a digital ballot for Society President, Secretary, or Treasurer to initiate democratic governance.
                    </p>
                    <button
                      onClick={() => setIsElectionModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> Schedule New Election
                    </button>
                  </div>
                )}

                {/* Candidate Nominations Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                      Approved Candidate Nominations ({nominations.length})
                    </h3>
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
                      <div key={nom.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-2xs">
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

      {/* 4. Mobile Bottom Navigation Bar (Visible only on mobile / small screens) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 flex items-center justify-around h-16 px-2 shadow-lg">
        <button
          onClick={() => handleTabSelect('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${
            activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">Home</span>
        </button>

        <button
          onClick={() => handleTabSelect('people')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${
            activeTab === 'people' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">People</span>
        </button>

        <button
          onClick={() => handleTabSelect('complaints')}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 ${
            activeTab === 'complaints' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-5 h-5" />
          {openTicketsCount > 0 && (
            <span className="absolute top-0.5 right-4 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
              {openTicketsCount}
            </span>
          )}
          <span className="text-[10px] font-bold mt-1">Issues</span>
        </button>

        <button
          onClick={() => handleTabSelect('finance')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${
            activeTab === 'finance' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">Finance</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-indigo-600"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">All Views</span>
        </button>
      </div>
    </div>
  );
};
