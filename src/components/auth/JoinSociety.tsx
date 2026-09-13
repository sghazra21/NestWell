import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { auth } from '../../lib/firebase';
import { requestSocietyMembership } from '../../lib/firestoreService';
import { ArrowLeft, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

interface JoinSocietyProps {
  onBack: () => void;
  onJoined: () => void;
}

export const JoinSociety: React.FC<JoinSocietyProps> = ({ onBack, onJoined }) => {
  const { societies, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const visible = societies.filter((s) => s.status === 'active' || s.status === 'onboarding');
  const results = query.trim()
    ? visible.filter(
        (s) =>
          s.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          s.city.toLowerCase().includes(query.trim().toLowerCase())
      )
    : visible;

  const handleRequest = async (societyId: string, societyName: string) => {
    if (!auth.currentUser) return;
    setRequesting(societyId);
    setError(null);
    try {
      await requestSocietyMembership(societyId, auth.currentUser);
      setRequested((prev) => new Set(prev).add(societyId));
      showToast(`Membership requested for ${societyName}. The society admin will review it.`);
    } catch (err: any) {
      setError(err.message || 'Failed to send membership request.');
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800/80 bg-slate-950/60 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white">Join a Society</h1>
            <p className="text-[11px] text-slate-400">Search and request membership</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by society name or city…"
            className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-700 bg-slate-900/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {results.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-700 text-center">
            <p className="text-sm text-slate-400">
              {query.trim()
                ? 'No societies match your search.'
                : 'No societies are currently open for membership requests.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((s) => {
              const done = requested.has(s.id);
              return (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-extrabold">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{s.name}</h3>
                    <p className="text-xs text-slate-400">{s.city}</p>
                  </div>
                  {done ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Requested
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRequest(s.id, s.name)}
                      disabled={requesting === s.id}
                      className="px-4 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-50 transition-all"
                    >
                      {requesting === s.id ? 'Sending…' : 'Request to join'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onJoined}
          className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-2"
        >
          Back to society list
        </button>
      </main>
    </div>
  );
};
