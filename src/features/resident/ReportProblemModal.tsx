import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { ComplaintCategory, ComplaintPriority, Complaint } from '../../types';
import { uploadComplaintPhoto } from '../../lib/firestoreService';
import {
  Wrench,
  Zap,
  ArrowUpDown,
  Sparkles,
  Droplets,
  Shield,
  HelpCircle,
  Camera,
  CheckCircle2,
  Phone,
  Clock,
  Check,
  Loader2,
  X,
} from 'lucide-react';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: ComplaintCategory;
}

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'Plumbing',
}) => {
  const { submitComplaint, resident, currentSocietyId } = useApp();

  const [category, setCategory] = useState<ComplaintCategory>(initialCategory);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('Normal');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<Complaint | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: { id: ComplaintCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'Plumbing', label: 'Plumbing', icon: <Droplets className="w-5 h-5 text-indigo-600" /> },
    { id: 'Electrical', label: 'Electrical', icon: <Zap className="w-5 h-5 text-amber-500" /> },
    { id: 'Lift', label: 'Lift', icon: <ArrowUpDown className="w-5 h-5 text-indigo-600" /> },
    { id: 'Cleaning', label: 'Cleaning', icon: <Sparkles className="w-5 h-5 text-emerald-600" /> },
    { id: 'Water', label: 'Water', icon: <Droplets className="w-5 h-5 text-cyan-600" /> },
    { id: 'Security', label: 'Security', icon: <Shield className="w-5 h-5 text-slate-700" /> },
    { id: 'Other', label: 'Other', icon: <HelpCircle className="w-5 h-5 text-slate-500" /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !description.trim()) return;

    let photoUrl: string | undefined;
    if (photoFile && currentSocietyId) {
      setUploading(true);
      try {
        const tempId = `comp-${Date.now()}`;
        photoUrl = await uploadComplaintPhoto(currentSocietyId, tempId, photoFile);
      } catch (err) {
        console.warn('Photo upload failed:', err);
      } finally {
        setUploading(false);
      }
    }

    const ticket = submitComplaint({
      category,
      title: title.trim() || `${category} issue in ${resident.flat}`,
      description: description.trim() || 'Urgent repair requested by resident.',
      priority,
      photoUrl,
    });

    setSubmittedTicket(ticket);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setCategory('Plumbing');
    setPriority('Normal');
    setPhotoFile(null);
    setPhotoPreview(null);
    setSubmittedTicket(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={submittedTicket ? 'Complaint Created' : 'Report a Problem'}
      subtitle={submittedTicket ? `Ticket #${submittedTicket.ticketNumber}` : 'Society maintenance staff will be notified'}
      maxWidth="sm"
    >
      {!submittedTicket ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Category *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    category === cat.id
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="mb-1">{cat.icon}</span>
                  <span className="truncate w-full text-center">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <label htmlFor="complaint-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Issue Summary *
            </label>
            <input
              id="complaint-title"
              type="text"
              required
              placeholder="e.g. Water leakage in master bathroom"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="complaint-description" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description of Problem
            </label>
            <textarea
              id="complaint-description"
              rows={3}
              placeholder="Describe the issue, location inside the flat, or preferred inspection time..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-sm resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Attach Photo (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="complaint-photo-input"
            />
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-xl border border-slate-200"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-slate-500 mt-1">{photoFile?.name}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-12 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-semibold transition-colors border-slate-300 hover:border-slate-400 text-slate-600 bg-slate-50"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Tap to take or upload photo</span>
              </button>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Normal', 'High', 'Urgent'] as ComplaintPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`h-11 rounded-xl text-xs font-bold border transition-all ${
                    priority === p
                      ? p === 'Urgent'
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              id="submit-complaint-btn"
              type="submit"
              disabled={uploading}
              className="w-full h-13 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Photo...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>Submit Problem Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Live Tracking Timeline */
        <div className="space-y-5">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">
                  {submittedTicket.category} • Flat {submittedTicket.flat}
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{submittedTicket.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{submittedTicket.description}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                In Progress
              </span>
            </div>

            {/* Assigned Staff Notice */}
            {submittedTicket.assignedTo && (
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
                  {submittedTicket.assignedTo.name?.charAt(0) || '?'}
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Assigned to:</span>
                  <span className="text-sm font-bold text-slate-800">{submittedTicket.assignedTo.name} ({submittedTicket.assignedTo.role})</span>
                </div>
              </div>
              {submittedTicket.assignedTo.phone && (
              <a
                href={`tel:${submittedTicket.assignedTo.phone}`}
                className="h-9 px-3 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center gap-1 text-xs font-bold transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
              )}
            </div>
            )}
          </div>

          {/* Visual Step Timeline */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Resolution Progress
            </h5>
            <div className="relative pl-6 space-y-5 border-l-2 border-indigo-600 ml-2">
              {/* Step 1: Reported */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs text-slate-400 font-mono">Just now</span>
                <h6 className="text-sm font-bold text-slate-900">Reported</h6>
                <p className="text-xs text-slate-500">Logged via resident mobile app</p>
              </div>

              {/* Step 2: Assigned */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                </span>
                <h6 className="text-sm font-bold text-slate-700">Assigned</h6>
                <p className="text-xs text-slate-400">Awaiting assignment</p>
              </div>

              {/* Step 3: Work Started */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                </span>
                <h6 className="text-sm font-bold text-slate-700">Work Started</h6>
                <p className="text-xs text-slate-400">Pending assignment</p>
              </div>

              {/* Step 4: Resolved */}
              <div className="relative opacity-60">
                <span className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                </span>
                <h6 className="text-sm font-bold text-slate-700">Resolved</h6>
                <p className="text-xs text-slate-400">Final inspection & resident sign-off</p>
              </div>
            </div>
          </div>

          <button
            id="done-complaint-btn"
            type="button"
            onClick={handleReset}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
};
