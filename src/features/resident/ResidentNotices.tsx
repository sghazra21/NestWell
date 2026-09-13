import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Notice } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Bell, Calendar, ChevronRight, FileText, AlertCircle, Sparkles, Building } from 'lucide-react';

export const ResidentNotices: React.FC = () => {
  const { notices, currentSociety } = useApp();
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const getNoticeIcon = (category: string) => {
    switch (category) {
      case 'maintenance':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'event':
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-teal-600" />;
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Community Notices</h2>
          <p className="text-xs text-slate-500 mt-0.5">Official circulars from {currentSociety?.name || 'your society'}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
          {notices.length} active
        </span>
      </div>

      {/* Notices Feed */}
      <div className="space-y-3">
        {notices.map((notice) => (
          <article
            key={notice.id}
            onClick={() => setSelectedNotice(notice)}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-700 cursor-pointer transition-all space-y-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FBF9F5] border border-slate-200/60 flex items-center justify-center shrink-0">
                  {getNoticeIcon(notice.category)}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                    {notice.audience} {notice.targetBlock ? `• ${notice.targetBlock}` : ''}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{notice.title}</h3>
                </div>
              </div>

              {notice.priority === 'urgent' && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  Urgent
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{notice.message}</p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {notice.date} {notice.time ? `(${notice.time})` : ''}
              </span>
              <span className="text-teal-700 font-semibold flex items-center gap-0.5">
                <span>Read Full</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedNotice(null)}
          title={selectedNotice.title}
          subtitle={`Published by ${selectedNotice.publishedBy}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between text-xs bg-[#FBF9F5] p-3 rounded-xl border border-slate-200/70">
              <div>
                <span className="text-slate-400 block">Applicable Audience</span>
                <span className="font-bold text-slate-800">
                  {selectedNotice.audience} {selectedNotice.targetBlock ? `(${selectedNotice.targetBlock})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Schedule</span>
                <span className="font-bold text-teal-700">
                  {selectedNotice.date} {selectedNotice.time || ''}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {selectedNotice.message}
            </p>

            {selectedNotice.attachmentName && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-700" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">{selectedNotice.attachmentName}</div>
                    <div className="text-[10px] text-slate-400">Official RWA Circular (PDF, 240 KB)</div>
                  </div>
                </div>
                <button
                  onClick={() => alert('Notice attachment downloaded to device.')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Download
                </button>
              </div>
            )}

            <button
              onClick={() => setSelectedNotice(null)}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm"
            >
              Close Notice
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
