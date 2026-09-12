import React from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Home, LayoutDashboard, Smartphone, Monitor, BellRing, RotateCcw } from 'lucide-react';
import { UserRole } from '../../types';

export const RoleSwitcher: React.FC = () => {
  const {
    role,
    setRole,
    previewMode,
    setPreviewMode,
    triggerGateSimulation,
    resetData,
  } = useApp();

  const roles: { id: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'resident',
      label: 'Resident App',
      icon: <Home className="w-4 h-4" />,
      desc: 'Mobile App (Sayan Ghosh, B-402)',
    },
    {
      id: 'security',
      label: 'Security Guard',
      icon: <Shield className="w-4 h-4" />,
      desc: 'Gate 1 Fast Tablet / Phone Console',
    },
    {
      id: 'admin',
      label: 'Society Admin',
      icon: <LayoutDashboard className="w-4 h-4" />,
      desc: '1440px Web Dashboard & Bulk Operations',
    },
  ];

  return (
    <aside
      aria-label="Prototype demo control bar"
      className="sticky top-0 z-50 bg-[#091426] text-white border-b border-slate-800 shadow-md text-xs select-none"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Role Pill Switcher */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-indigo-400 uppercase tracking-wider text-[11px] hidden sm:inline">
            Active Role:
          </span>
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/60 shadow-inner">
            {roles.map((r) => {
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  id={`role-btn-${r.id}`}
                  onClick={() => setRole(r.id)}
                  title={r.desc}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Simulation Trigger & Viewport Controls */}
        <div className="flex items-center gap-2">
          {/* Gate scan simulation button */}
          <button
            id="simulate-gate-btn"
            onClick={triggerGateSimulation}
            title="Simulate security scanning a visitor pass at Gate 1"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 font-semibold transition-colors shadow-sm"
          >
            <BellRing className="w-3.5 h-3.5 animate-bounce text-orange-400" />
            <span>Simulate Gate Scan</span>
          </button>

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

          {/* Reset Demo State */}
          <button
            id="reset-demo-btn"
            onClick={resetData}
            title="Reset prototype state to initial defaults"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
