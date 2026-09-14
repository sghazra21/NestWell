import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ResidentHome } from './ResidentHome';
import { ResidentActivity } from './ResidentActivity';
import { ResidentNotices } from './ResidentNotices';
import { ResidentMore } from './ResidentMore';
import { ResidentReceipts } from './ResidentReceipts';
import { InviteVisitorModal } from './InviteVisitorModal';
import { ReportProblemModal } from './ReportProblemModal';
import { PayMaintenanceModal } from './PayMaintenanceModal';
import { BookFacilityModal } from './BookFacilityModal';
import { GateApprovalModal } from './GateApprovalModal';
import { NotificationBell } from '../../components/common/NotificationBell';
import { NestWellLogo } from '../../components/branding/NestWellLogo';
import { Home, Activity, Bell, MoreHorizontal, ShieldAlert, Shield, FileText } from 'lucide-react';

export const ResidentApp: React.FC = () => {
  const { gateAlert, canAccessAdminView, setViewMode } = useApp();
  const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'notices' | 'receipts' | 'more'>('home');

  // Modal states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isGateApprovalOpen, setIsGateApprovalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 flex flex-col antialiased">
      {/* Top Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <NestWellLogo variant="icon" className="w-7 h-7 rounded-xl" />
          <span className="font-bold text-sm tracking-tight text-slate-900">NestWell</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </header>

      {/* Admin return banner: Shown to admins viewing resident portal */}
      {canAccessAdminView && (
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Resident Portal View</span>
            <span className="hidden sm:inline text-slate-400">• Admin Mode Preview</span>
          </div>
          <button
            id="resident-return-to-admin-btn"
            onClick={() => setViewMode('admin')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Console</span>
          </button>
        </div>
      )}

      {/* Active Screen View */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <ResidentHome
            onOpenInviteVisitor={() => setIsInviteOpen(true)}
            onOpenReportProblem={() => setIsReportOpen(true)}
            onOpenPayDues={() => setIsPayOpen(true)}
            onOpenBookFacility={() => setIsBookOpen(true)}
            onOpenGateApproval={() => setIsGateApprovalOpen(true)}
            onOpenNoticeDetails={() => setActiveTab('notices')}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'activity' && <ResidentActivity />}
        {activeTab === 'notices' && <ResidentNotices />}
        {activeTab === 'receipts' && <ResidentReceipts />}
        {activeTab === 'more' && <ResidentMore />}
      </main>

      {/* Floating Alert Trigger if visitor is waiting at gate and user is on another tab */}
      {gateAlert.active && activeTab !== 'home' && (
        <button
          onClick={() => setIsGateApprovalOpen(true)}
          className="fixed bottom-24 right-4 z-40 h-12 px-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-bounce"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Visitor at Gate</span>
        </button>
      )}

      {/* Sticky Mobile Bottom Navigation */}
      <nav
        aria-label="Resident mobile bottom navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_20px_rgba(15,23,42,0.03)] pb-safe"
      >
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-1">
          {/* Home */}
          <button
            id="tab-home"
            onClick={() => setActiveTab('home')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'home' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'home' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* Activity */}
          <button
            id="tab-activity"
            onClick={() => setActiveTab('activity')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'activity' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'activity' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">Activity</span>
          </button>

          {/* Notices */}
          <button
            id="tab-notices"
            onClick={() => setActiveTab('notices')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'notices' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'notices' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">Notices</span>
          </button>

          {/* Receipts */}
          <button
            id="tab-receipts"
            onClick={() => setActiveTab('receipts')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'receipts' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'receipts' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">Receipts</span>
          </button>

          {/* More */}
          <button
            id="tab-more"
            onClick={() => setActiveTab('more')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'more' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'more' ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">More</span>
          </button>
        </div>
      </nav>

      {/* Reusable Modals */}
      <InviteVisitorModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <ReportProblemModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      <PayMaintenanceModal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} />
      <BookFacilityModal isOpen={isBookOpen} onClose={() => setIsBookOpen(false)} />
      <GateApprovalModal isOpen={isGateApprovalOpen} onClose={() => setIsGateApprovalOpen(false)} />
    </div>
  );
};
