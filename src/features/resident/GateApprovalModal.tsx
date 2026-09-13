import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { ShieldCheck, User, Phone, Clock, Check, X, ShieldAlert } from 'lucide-react';

interface GateApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GateApprovalModal: React.FC<GateApprovalModalProps> = ({ isOpen, onClose }) => {
  const { gateAlert, approveVisitor, rejectVisitor } = useApp();
  const visitor = gateAlert.visitor;

  if (!visitor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Visitor at Security Gate"
      subtitle="Security Gate 1 • Verification in Progress"
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center">
        {/* Animated Gate Verification Badge */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 border-2 border-orange-200">
            <ShieldAlert className="w-10 h-10 animate-pulse" />
          </div>
          <span className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
            Waiting
          </span>
        </div>

        <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{visitor.name}</h4>
        <p className="text-sm font-medium text-slate-500 mt-0.5">
          {visitor.company ? `${visitor.company} • ` : ''}
          {visitor.purpose}
        </p>

        {/* Details Card */}
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 my-5 text-left space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              Visiting Flat
            </span>
            <span className="font-bold text-slate-900">{visitor.flat}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400" />
              Contact
            </span>
            <span className="font-mono text-slate-800">{visitor.phone}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Arrived At
            </span>
            <span className="font-medium text-slate-800">{visitor.entryTime || visitor.expectedTime || 'N/A'} ({visitor.gateNumber || 'Gate 1'})</span>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Pass Code</span>
            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              {visitor.passNumber}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Do you authorize security to open the barrier for <strong>{visitor.name}</strong>?
        </p>

        {/* Large Accessible Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            id="reject-gate-btn"
            onClick={() => {
              rejectVisitor(visitor.id);
              onClose();
            }}
            className="h-12 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <X className="w-4 h-4" />
            <span>Reject</span>
          </button>

          <button
            id="approve-gate-btn"
            onClick={() => {
              approveVisitor(visitor.id);
              onClose();
            }}
            className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>Approve Entry</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
