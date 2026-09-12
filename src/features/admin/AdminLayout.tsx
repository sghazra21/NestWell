import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  Smartphone,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { role, setRole, complaints, visitors, bills } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const openTicketsCount = complaints.filter((c) => c.status !== 'resolved').length;
  const overdueBillsCount = bills.filter((b) => b.status === 'Overdue').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'people', label: 'People', icon: <Users className="w-5 h-5" /> },
    { id: 'visitors', label: 'Visitors', icon: <ShieldCheck className="w-5 h-5" /> },
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
            Greenwood Heights <span className="text-indigo-600">Admin</span>
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
          <button
            onClick={() => setRole('resident')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            <span>Switch to Mobile</span>
          </button>

          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-900">Col. Ramesh Nair</div>
            <div className="text-xs text-slate-500 whitespace-nowrap">Admin Portal • Superuser</div>
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shadow-xs">
            RN
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
              {visitors.filter((v) => v.status === 'inside').length + 36} Visitors
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
