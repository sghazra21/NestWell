import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { NoticePriority, Notice } from '../../types';
import { uploadNoticeAttachment } from '../../lib/firestoreService';
import { openWhatsApp } from '../../lib/whatsapp';
import { Modal } from '../../components/common/Modal';
import { Bell, Plus, Calendar, AlertCircle, FileText, Send, Sparkles, Loader2, X, Upload, MessageCircle } from 'lucide-react';

export const AdminNotices: React.FC = () => {
  const { notices, createNotice, userProfile, currentSociety, towers, currentSocietyId, showToast } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'maintenance' | 'event' | 'security' | 'general'>('maintenance');
  const [priority, setPriority] = useState<NoticePriority>('normal');
  const [audience, setAudience] = useState<string>('All Residents');
  const [time, setTime] = useState('10:00 AM – 02:00 PM');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    let attachmentName: string | undefined;
    if (attachmentFile && currentSocietyId) {
      setUploading(true);
      try {
        const tempId = `notice-${Date.now()}`;
        await uploadNoticeAttachment(currentSocietyId, tempId, attachmentFile);
        attachmentName = attachmentFile.name;
      } catch (err) {
        console.warn('Attachment upload failed:', err);
      } finally {
        setUploading(false);
      }
    }

    createNotice({
      title,
      message,
      priority,
      audience: audience as Notice['audience'],
      targetBlock: audience.endsWith(' Only') ? audience.replace(/ Only$/, '') : undefined,
      attachmentName,
    });

    setIsCreateModalOpen(false);
    setTitle('');
    setMessage('');
    setAttachmentFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('Only image files are allowed');
        return;
      }
      setAttachmentFile(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Notice</span>
        </button>
      </div>

      {/* Notices Cards */}
      <div className="space-y-3">
        {notices.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <Bell className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No notices yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Publish your first notice to broadcast circulars, events, or urgent updates to the community.
            </p>
          </div>
        ) : notices.map((n) => (
          <div
            key={n.id}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
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

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const noticeText = `📢 ${n.title}\n\n${n.message}\n\n— ${n.publishedBy}, ${currentSociety?.name || 'Society'}`;
                  openWhatsApp('', noticeText);
                }}
                className="h-9 px-3 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center gap-1.5 text-xs font-bold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Share on WhatsApp</span>
              </button>
            </div>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Attachment (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="notice-attachment-input"
            />
            {attachmentFile ? (
              <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-xl border border-teal-200">
                <FileText className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-teal-700 flex-1 truncate">{attachmentFile.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-11 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-semibold transition-colors border-slate-300 hover:border-slate-400 text-slate-600 bg-slate-50"
              >
                <Upload className="w-4 h-4 text-teal-600" />
                <span>Tap to upload attachment</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full h-13 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading Attachment...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publish Notice to All Residents</span>
              </>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};
