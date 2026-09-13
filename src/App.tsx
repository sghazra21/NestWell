import React, { useState, Suspense, ErrorInfo, ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';

import { ResidentApp } from './features/resident/ResidentApp';
import { SecurityApp } from './features/security/SecurityApp';
import { AdminLayout } from './features/admin/AdminLayout';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileCompletionModal } from './components/auth/ProfileCompletionModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { SocietyPicker } from './components/auth/SocietyPicker';
import { JoinSociety } from './components/auth/JoinSociety';
import { SocietyOnboarding } from './features/admin/SocietyOnboarding';
import { Wifi, Battery, Signal, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const SocietyElectionModal = React.lazy(() =>
  import('./features/election/SocietyElectionModal').then((m) => ({ default: m.SocietyElectionModal }))
);
const IndianPaymentsResearchModal = React.lazy(() =>
  import('./components/payment/IndianPaymentsResearchModal').then((m) => ({ default: m.IndianPaymentsResearchModal }))
);
const PlatformAdminDashboard = React.lazy(() =>
  import('./features/platform/PlatformAdminDashboard').then((m) => ({ default: m.PlatformAdminDashboard }))
);

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>
            <h1 className="text-lg font-extrabold text-slate-900">Something went wrong</h1>
            <p className="text-sm text-slate-500">
              An unexpected error occurred. Please try reloading the page or return to the home screen.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                Reload
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                className="w-full h-11 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const {
    role,
    viewMode,
    setViewMode,
    canAccessAdminView,
    userProfile,
    currentSocietyId,
    currentSociety,
    isPlatformAdmin,
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

  // Tenant gate: authenticated users without a selected society pick or join one.
  // Platform admins may enter the console directly.
  if (!currentSocietyId && activeView !== 'platform_admin') {
    return <PickerGate />;
  }

  // Suspended societies are blocked from normal operation.
  if (currentSociety?.status === 'suspended' && activeView !== 'platform_admin') {
    return <SuspendedGate />;
  }

  const isMobileFrame = previewMode === 'mobile_frame';

  // Society onboarding: pending/onboarding societies show the setup wizard
  // to society admins (or platform admins in support) instead of the dashboard.
  const needsOnboarding =
    currentSociety != null &&
    (currentSociety.status === 'pending_admin' || currentSociety.status === 'onboarding') &&
    (role === 'admin' || isPlatformAdmin);

  // Elevated privilege view toggle: Admins/Committee can switch between Admin Console and Resident Portal
  const showAdminConsole = canAccessAdminView && viewMode === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 selection:bg-indigo-200">
      <Suspense fallback={null}>
      {activeView === 'platform_admin' ? (
        <PlatformAdminDashboard />
      ) : needsOnboarding ? (
        <SocietyOnboarding />
      ) : showAdminConsole ? (
        <div className="flex-1 bg-slate-100 min-h-screen flex flex-col">
          <AdminLayout />
        </div>
      ) : (
        <main className="flex-1 flex items-start justify-center p-0 overflow-x-hidden bg-[#F9FAFB]">
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
                {role === 'security' ? <SecurityApp /> : <ResidentApp />}
              </div>

              {/* Home Indicator Bar */}
              <div className="h-4 flex items-center justify-center bg-[#F9FAFB] rounded-b-[32px] shrink-0">
                <div className="w-32 h-1 bg-slate-300 rounded-full" />
              </div>
            </div>
          ) : (
            /* Fluid Viewport (Adapts to Mobile, Tablet, and Laptop/Desktop) */
            <div className="w-full min-h-screen bg-[#F9FAFB] flex flex-col items-center">
              <div className="w-full min-h-screen flex flex-col">
                {role === 'security' ? <SecurityApp /> : <ResidentApp />}
              </div>
            </div>
          )}
        </main>
      )}

      </Suspense>

      {/* Global Modals Mounted at Root */}
      <Suspense fallback={null}>
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
      </Suspense>

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

const PickerGate: React.FC = () => {
  const [joining, setJoining] = useState(false);
  if (joining) {
    return <JoinSociety onBack={() => setJoining(false)} onJoined={() => setJoining(false)} />;
  }
  return <SocietyPicker onJoin={() => setJoining(true)} />;
};

const SuspendedGate: React.FC = () => {
  const { currentSociety, isPlatformAdmin, setActiveView, setCurrentSocietyId, logout } = useApp();
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto">
          <span className="text-2xl">⛔</span>
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">
          {currentSociety?.name || 'This society'} is suspended
        </h1>
        <p className="text-sm text-slate-500">
          This society is currently suspended. Please contact NestWell support.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          {isPlatformAdmin && (
            <button
              onClick={() => setActiveView('platform_admin')}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
            >
              Open Platform Console
            </button>
          )}
          <button
            onClick={() => setCurrentSocietyId('')}
            className="w-full h-11 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
          >
            Back to my societies
          </button>
          <button
            onClick={logout}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 py-1"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
