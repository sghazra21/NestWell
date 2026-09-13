import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NoticePriority, Notice } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Bell, Plus, Calendar, AlertCircle, FileText, Send, Sparkles } from 'lucide-react';

export const AdminNotices: React.FC = () => {
  const { notices, createNotice, userProfile, currentSociety, towers } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'maintenance' | 'event' | 'security' | 'general'>('maintenance');
  const [priority, setPriority] = useState<NoticePriority>('normal');
  const [audience, setAudience] = useState<string>('All Residents');
  const [time, setTime] = useState('10:00 AM – 02:00 PM');

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    createNotice({
      title,
      message,
      priority,
      audience: audience as Notice['audience'],
      targetBlock: audience.endsWith(' Only') ? audience.replace(/ Only$/, '') : undefined,
      attachmentName: 'Official_Notice.pdf',
    });

    setIsCreateModalOpen(false);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Society Circulars & Broadcasts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant circulars delivered to resident mobile apps and security gate terminals
          </p>
        </div>

        <button
          id="publish-notice-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Notice</span>
        </button>
      </div>

      {/* Notices Cards */}
      <div className="space-y-3">
        {notices.map((n) => (
          <div
            key={n.id}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBF9F5] border border-slate-200 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">{n.title}</h4>
                    {n.priority === 'urgent' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target: <strong>{n.audience}</strong> • Published by {n.publishedBy}
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {n.date} {n.time ? `(${n.time})` : ''}
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">{n.message}</p>

            {n.attachmentName && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-teal-700 font-semibold">
                <FileText className="w-4 h-4" />
                <span>{n.attachmentName}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Notice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Publish Society Notice"
        subtitle={`Broadcast to ${currentSociety?.name || 'society'} community`}
        maxWidth="md"
      >
        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Notice Headline *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lift Servicing in Tower B"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-3 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Audience Filter
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-700"
              >
                <option value="All Residents">All Residents{towers.length > 0 ? ` (${towers.map((t) => t.name).join(' & ')})` : ''}</option>
                {towers.map((t) => (
                  <option key={t.id} value={`${t.name} Only`}>{t.name} Only</option>
                ))}
                <option value="Owners Only">Flat Owners Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-700"
              >
                <option value="normal">Normal Circular</option>
                <option value="urgent">Urgent Warning</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Notice Content *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Provide complete circular details, timings, and instructions for residents..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Scheduled Time Window
            </label>
            <input
              type="text"
              placeholder="e.g. Tomorrow 10:00 AM – 02:00 PM"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full h-13 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl mt-2 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Publish Notice to All Residents</span>
          </button>
        </form>
      </Modal>
    </div>
  );
};
