import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Visitor } from '../../types';
import {
  ShieldCheck,
  Search,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Download,
} from 'lucide-react';

export const AdminVisitors: React.FC = () => {
  const { visitors, updateVisitorStatus } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'inside' | 'expected' | 'exited'>('all');

  const filteredVisitors = visitors.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.flat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.passNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const insideCount = visitors.filter((v) => v.status === 'inside').length;
  const expectedCount = visitors.filter((v) => v.status === 'expected' || v.status === 'waiting').length;
  const exitedCount = visitors.filter((v) => v.status === 'exited').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Security & Visitor Gate Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gate 1 (Main Entrance) & Gate 2 (Service) live movement registry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exporting visitor entry logs (CSV format)...')}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Currently Inside</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{insideCount} Visitors</div>
          <span className="text-[11px] text-slate-400">Authorized in premises</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Expected & Waiting</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{expectedCount} Pre-approved</div>
          <span className="text-[11px] text-slate-400">Passes generated</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Exited Today</span>
          <div className="text-2xl font-extrabold text-slate-700 mt-1">{exitedCount} Logged</div>
          <span className="text-[11px] text-slate-400">Completed movements</span>
        </div>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by visitor name, flat, pass code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>

        <div className="flex gap-1.5">
          {(['all', 'inside', 'expected', 'exited'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Visitors Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FBF9F5] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Visitor</th>
                <th className="px-5 py-3.5">Type & Purpose</th>
                <th className="px-5 py-3.5">Target Flat</th>
                <th className="px-5 py-3.5">Scheduled / Entry</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Gate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVisitors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{v.name}</div>
                    <div className="text-xs font-mono text-slate-400">
                      #{v.passNumber} • {v.phone}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                      {v.type}
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      {v.company ? `${v.company} • ` : ''}
                      {v.purpose}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200/60 text-xs">
                      Flat {v.flat}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-600">
                    <div>{v.expectedDate}, {v.expectedTime}</div>
                    {v.entryTime && (
                      <span className="text-emerald-700 font-semibold block text-[11px]">
                        In: {v.entryTime}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        v.status === 'inside'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'waiting'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : v.status === 'exited'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    {v.status === 'expected' || v.status === 'waiting' ? (
                      <button
                        onClick={() => updateVisitorStatus(v.id, 'inside')}
                        className="h-8 px-3 rounded-lg bg-teal-700 text-white hover:bg-teal-800 text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Check In</span>
                      </button>
                    ) : v.status === 'inside' ? (
                      <button
                        onClick={() => updateVisitorStatus(v.id, 'exited')}
                        className="h-8 px-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Check Out</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
