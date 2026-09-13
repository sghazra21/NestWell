import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleSwitcher } from './components/common/RoleSwitcher';
import { ResidentApp } from './features/resident/ResidentApp';
import { SecurityApp } from './features/security/SecurityApp';
import { AdminLayout } from './features/admin/AdminLayout';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileCompletionModal } from './components/auth/ProfileCompletionModal';
import { SocietyElectionModal } from './features/election/SocietyElectionModal';
import { IndianPaymentsResearchModal } from './components/payment/IndianPaymentsResearchModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { PlatformAdminDashboard } from './features/platform/PlatformAdminDashboard';
import { Wifi, Battery, Signal, CheckCircle, Info } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    role,
    userProfile,
    activeView,
    previewMode,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isProfileCompletionOpen,
    setIsProfileCompletionOpen,
    isElectionModalOpen,
    setIsElectionModalOpen,
    isPaymentsResearchOpen,
    setIsPaymentsResearchOpen,
    toastMessage,
  } = useApp();

  // Production Auth Gate: If no user session exists, display the official Society Login Screen
  if (!userProfile) {
    return (
      <>
        <LoginScreen />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 animate-bounce max-w-md">
            <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-100 flex-1">{toastMessage}</p>
            </div>
          </div>
        )}
      </>
    );
  }

  const isMobileFrame = previewMode === 'mobile_frame';

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 selection:bg-indigo-200">
      <RoleSwitcher />

      {activeView === 'platform_admin' ? (
        <PlatformAdminDashboard />
      ) : role === 'admin' ? (
        <div className="flex-1 bg-slate-100">
          <AdminLayout />
        </div>
      ) : (
        <main className="flex-1 flex items-start justify-center p-0 md:p-6 overflow-x-hidden bg-slate-900 md:bg-indigo-50/50">
          {isMobileFrame ? (
            /* Realistic Smartphone Mockup Device Frame */
            <div className="relative my-4 w-full max-w-[390px] h-[844px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-[6px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-3.5 inset-x-0 z-50 flex justify-center pointer-events-none">
                <div className="w-28 h-5.5 bg-slate-900 rounded-full flex items-center justify-between px-2.5">
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                  <div className="w-2 h-2 rounded-full bg-indigo-950" />
                </div>
              </div>

              {/* Mobile Status Bar */}
              <div className="h-9 px-6 flex items-center justify-between text-slate-700 text-xs font-bold shrink-0 bg-[#F9FAFB] select-none pt-1">
                <span>9:41</span>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Signal className="w-3.5 h-3.5" />
                  <Wifi className="w-3.5 h-3.5" />
                  <Battery className="w-4 h-4" />
                </div>
              </div>

              {/* Screen Inner Viewport */}
              <div className="flex-1 rounded-[32px] overflow-y-auto bg-[#F9FAFB] shadow-inner flex flex-col relative">
                {role === 'resident' && <ResidentApp />}
                {role === 'security' && <SecurityApp />}
              </div>

              {/* Home Indicator Bar */}
              <div className="h-4 flex items-center justify-center bg-[#F9FAFB] rounded-b-[32px] shrink-0">
                <div className="w-32 h-1 bg-slate-300 rounded-full" />
              </div>
            </div>
          ) : (
            /* Fluid Viewport (Responsive mobile view) */
            <div className="w-full min-h-screen bg-[#F9FAFB] flex justify-center">
              <div className="w-full max-w-lg min-h-screen bg-[#F9FAFB] shadow-xl">
                {role === 'resident' && <ResidentApp />}
                {role === 'security' && <SecurityApp />}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Global Modals Mounted at Root */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ProfileCompletionModal
        isOpen={isProfileCompletionOpen}
        onClose={() => setIsProfileCompletionOpen(false)}
      />

      <SocietyElectionModal
        isOpen={isElectionModalOpen}
        onClose={() => setIsElectionModalOpen(false)}
      />

      <IndianPaymentsResearchModal
        isOpen={isPaymentsResearchOpen}
        onClose={() => setIsPaymentsResearchOpen(false)}
      />

      {/* Global Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce max-w-md">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-100 flex-1">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
