import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { auth } from '../../lib/firebase';
import { acceptSocietyInvite } from '../../lib/firestoreService';
import {
  Building2,
  Plus,
  ArrowRight,
  Ticket,
  LayoutDashboard,
  AlertCircle,
} from 'lucide-react';

interface SocietyPickerProps {
  onJoin: () => void;
}

export const SocietyPicker: React.FC<SocietyPickerProps> = ({ onJoin }) => {
  const {
    societies,
    platformUser,
    isPlatformAdmin,
    setCurrentSocietyId,
    setActiveView,
    showToast,
    logout,
  } = useApp();

  const [inviteCode, setInviteCode] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberSocietyIds = platformUser?.societyIds || [];
  const mySocieties = societies.filter(
    (s) => memberSocietyIds.includes(s.id) && s.status !== 'archived'
  );

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !auth.currentUser) return;
    setAccepting(true);
    setError(null);
    try {
      const { societyId } = await acceptSocietyInvite(inviteCode, auth.currentUser);
      setInviteCode('');
      setCurrentSocietyId(societyId);
      showToast('Invitation accepted. Welcome to your society!');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800/80 bg-slate-950/60 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white">NestWell</h1>
              <p className="text-[11px] text-slate-400">Select a society to continue</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Platform console entry */}
        {isPlatformAdmin && (
          <button
            onClick={() => setActiveView('platform_admin')}
            className="w-full p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 hover:border-indigo-400 text-left transition-all flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white">Platform Console</h3>
              <p className="text-xs text-slate-400">Manage societies, invitations and analytics</p>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-300" />
          </button>
        )}

        {/* Member societies */}
        {mySocieties.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Your societies
            </h2>
            {mySocieties.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveView('app');
                  setCurrentSocietyId(s.id);
                }}
                className="w-full p-5 rounded-2xl bg-slate-900/80 border border-slate-700 hover:border-indigo-500 text-left transition-all flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-extrabold">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">{s.name}</h3>
                  <p className="text-xs text-slate-400">
                    {s.city}
                    {s.status !== 'active' ? ` • ${s.status}` : ''}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-700 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6 text-slate-500" />
            </div>
            <h2 className="font-bold text-white">You are not a member of any society yet</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Join with an invitation code from your society administrator, or search for
              your society below and request membership.
            </p>
          </div>
        )}

        {/* Invitation code */}
        <form
          onSubmit={handleAcceptInvite}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Have an invitation code?</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="NW-XXXXXXXXXX"
              className="flex-1 h-11 px-3 rounded-xl border border-slate-700 bg-slate-950/70 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={accepting || !inviteCode.trim()}
              className="px-4 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50 transition-all"
            >
              {accepting ? 'Joining…' : 'Join'}
            </button>
          </div>
        </form>

        {/* Join by search */}
        <button
          onClick={onJoin}
          className="w-full p-4 rounded-2xl border border-dashed border-slate-600 hover:border-indigo-500 text-slate-300 hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Search societies & request membership</span>
        </button>
      </main>
    </div>
  );
};
