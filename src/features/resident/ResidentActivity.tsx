import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QrCodeView } from '../../components/common/QrCodeView';
import { Modal } from '../../components/common/Modal';
import { Visitor } from '../../types';
import { ShieldCheck, Clock, User, QrCode, CheckCircle, Trash2, ArrowUpRight, Wrench } from 'lucide-react';

export const ResidentActivity: React.FC = () => {
  const { visitors, complaints, cancelVisitorPass, resident } = useApp();

  const [filterTab, setFilterTab] = useState<'visitors' | 'complaints'>('visitors');
  const [selectedPass, setSelectedPass] = useState<Visitor | null>(null);

  const residentVisitors = visitors.filter((v) => v.flat === resident.flat);
  const residentComplaints = complaints.filter((c) => c.flat === resident.flat);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto pb-24">
      {/* Screen Header */}
      <div className="pt-1">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Activity & Passes</h2>
        <p className="text-xs text-slate-500 mt-0.5">Track your visitor passes and reported issues</p>
      </div>

      {/* Segment Switcher */}
      <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl">
        <button
          onClick={() => setFilterTab('visitors')}
          className={`py-2 rounded-lg text-xs font-bold transition-all ${
            filterTab === 'visitors'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Visitor Passes ({residentVisitors.length})
        </button>
        <button
          onClick={() => setFilterTab('complaints')}
          className={`py-2 rounded-lg text-xs font-bold transition-all ${
            filterTab === 'complaints'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Complaints ({residentComplaints.length})
        </button>
      </div>

      {/* Visitors List */}
      {filterTab === 'visitors' && (
        <div className="space-y-3">
          {residentVisitors.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No active visitor passes</p>
              <p className="text-xs text-slate-400 mt-1">Use "Invite Visitor" from Home to create one.</p>
            </div>
          ) : (
            residentVisitors.map((vis) => {
              const isWaiting = vis.status === 'waiting';
              const isInside = vis.status === 'inside';

              return (
                <div
                  key={vis.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{vis.name}</h4>
                        {vis.company && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                            {vis.company}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{vis.purpose} • {vis.phone}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isWaiting
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : isInside
                          ? 'bg-emerald-100 text-emerald-800'
                          : vis.status === 'exited'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {vis.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {vis.expectedDate} {vis.expectedTime}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPass(vis)}
                        className="h-8 px-2.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold flex items-center gap-1 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Pass QR</span>
                      </button>

                      {vis.status === 'expected' && (
                        <button
                          onClick={() => cancelVisitorPass(vis.id)}
                          className="h-8 px-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Cancel Pass"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Complaints List */}
      {filterTab === 'complaints' && (
        <div className="space-y-3">
          {residentComplaints.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No complaints</p>
              <p className="text-xs text-slate-400 mt-1">Report a problem from Home to get started.</p>
            </div>
          ) : residentComplaints.map((comp) => (
            <div
              key={comp.id}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                    {comp.category} • #{comp.ticketNumber}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 leading-snug">{comp.title}</h4>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    comp.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {comp.status === 'started' ? 'In Progress' : comp.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{comp.description}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{comp.reportedAt}</span>
                {comp.assignedTo && (
                  <span className="font-semibold text-slate-800">
                    Assigned: {comp.assignedTo.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Pass View Dialog */}
      {selectedPass && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPass(null)}
          title="Digital Gate Pass"
          subtitle={`Pass #${selectedPass.passNumber}`}
          maxWidth="sm"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <h4 className="text-xl font-bold text-slate-900">{selectedPass.name}</h4>
            <p className="text-xs text-slate-500">
              Valid for entry to Flat <strong>{selectedPass.flat}</strong>
            </p>

            <QrCodeView value={selectedPass.qrCode} label={selectedPass.passNumber} size={160} />

            <div className="w-full bg-[#FBF9F5] p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Purpose</span>
                <span className="font-bold text-slate-800">{selectedPass.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Schedule</span>
                <span className="font-bold text-slate-800">{selectedPass.expectedDate}, {selectedPass.expectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status</span>
                <span className="font-bold text-teal-700 capitalize">{selectedPass.status}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPass(null)}
              className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold text-sm"
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
