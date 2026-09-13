import React from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar } from './Avatar';
import {
  Shield,
  Home,
  LayoutDashboard,
  Smartphone,
  Monitor,
  Vote,
  CreditCard,
  User,
  LogOut,
  Sparkles,
  Building2,
  Layers,
} from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const {
    role,
    user,
    userProfile,
    isPlatformAdmin,
    activeView,
    setActiveView,
    societies,
    currentSocietyId,
    setCurrentSocietyId,
    currentSociety,
    setIsAuthModalOpen,
    setIsProfileCompletionOpen,
    setIsElectionModalOpen,
    setIsPaymentsResearchOpen,
    logout,
    previewMode,
    setPreviewMode,
  } = useApp();

  const roleLabel =
    role === 'admin'
      ? 'Society Admin'
      : role === 'security'
        ? 'Security'
        : role === 'committee'
          ? 'Committee'
          : 'Resident';

  return (
    <aside
      aria-label="Application navigation bar"
      className="sticky top-0 z-50 bg-[#091426] text-white border-b border-slate-800 shadow-md text-xs select-none"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Role Pill Switcher & Society Tenant Context */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Society Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-700/60 text-slate-200">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={currentSocietyId}
              onChange={(e) => setCurrentSocietyId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
            >
              {societies.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <span className="font-bold text-indigo-400 uppercase tracking-wider text-[11px] hidden sm:inline">
            Your Role:
          </span>
          <div className="flex items-center bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
            {role === 'admin' ? (
              <LayoutDashboard className="w-4 h-4 text-purple-400" />
            ) : role === 'security' ? (
              <Shield className="w-4 h-4 text-amber-400" />
            ) : (
              <Home className="w-4 h-4 text-indigo-400" />
            )}
            <span className="ml-1.5 font-semibold text-slate-200">{roleLabel}</span>
          </div>

          {/* Platform Super Admin Console button */}
          {isPlatformAdmin && (
            <button
              id="platform-console-btn"
              onClick={() => setActiveView(activeView === 'platform_admin' ? 'app' : 'platform_admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all border ${
                activeView === 'platform_admin'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border-indigo-700/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Platform Console</span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            </button>
          )}
        </div>

        {/* Global Features & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Society Elections & Committee Button */}
          <button
            id="elections-portal-btn"
            onClick={() => setIsElectionModalOpen(true)}
            title="Open Society Committee Election & Digital Ballot Portal"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-semibold transition-colors shadow-xs"
          >
            <Vote className="w-3.5 h-3.5 text-indigo-400" />
            <span>Committee & Elections</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Indian Payments Research Blueprint Button */}
          <button
            id="india-payments-btn"
            onClick={() => setIsPaymentsResearchOpen(true)}
            title="Explore Indian Society Payment Stack (UPI, QR, Gateways & GST)"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold transition-colors shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>India Payments (UPI)</span>
          </button>

          {/* Firebase Authentication & User Profile Button */}
          {userProfile ? (
            <div className="flex items-center gap-1.5 bg-slate-800/90 pl-2 pr-1 py-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setIsProfileCompletionOpen(true)}
                title="Edit verified society profile"
                className="flex items-center gap-1.5 hover:text-indigo-300 text-left transition-colors"
              >
                {userProfile.avatar || user?.photoURL ? (
                  <Avatar
                    name={userProfile.name}
                    src={userProfile.avatar || user?.photoURL || undefined}
                    className="w-5 h-5 rounded-full border border-slate-600 text-[8px]"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <div className="flex flex-col">
                  <span className="font-bold max-w-[120px] truncate text-slate-200 text-[11px] leading-tight">
                    {userProfile.name || userProfile.email}
                  </span>
                  <span className="text-[9px] text-indigo-300 font-semibold leading-none">
                    {userProfile.role === 'admin' ? '★ Society Admin' : userProfile.role === 'security' ? 'Guard' : 'Resident'}
                  </span>
                </div>
              </button>
              <button
                onClick={logout}
                title="Log out of Society Account"
                className="p-1 hover:text-red-400 text-slate-400 transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="auth-login-btn"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xs active:scale-95"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Device Mockup Toggle for Resident & Security when on desktop */}
          {(role === 'resident' || role === 'security') && (
            <div className="hidden md:flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-700/60">
              <button
                id="view-mobile-frame-btn"
                onClick={() => setPreviewMode('mobile_frame')}
                title="View inside realistic 390px smartphone shell"
                className={`p-1.5 rounded-md transition-colors ${
                  previewMode === 'mobile_frame' ? 'bg-slate-700 text-indigo-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                id="view-fluid-btn"
                onClick={() => setPreviewMode('auto')}
                title="View full browser layout"
                className={`p-1.5 rounded-md transition-colors ${
                  previewMode === 'auto' ? 'bg-slate-700 text-indigo-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
