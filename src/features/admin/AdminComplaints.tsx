import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Complaint, ComplaintStatus } from '../../types';
import { Drawer } from '../../components/common/Drawer';
import {
  Wrench,
  Search,
  Filter,
  CheckCircle,
  Clock,
  User,
  Phone,
  AlertTriangle,
  Send,
} from 'lucide-react';

interface AdminComplaintsProps {
  selectedTicketId?: string | null;
  onClearSelectedTicket?: () => void;
}

export const AdminComplaints: React.FC<AdminComplaintsProps> = ({
  selectedTicketId,
  onClearSelectedTicket,
}) => {
  const { complaints, updateComplaintStatus, assignComplaint } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reported' | 'assigned' | 'started' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [inspectComplaint, setInspectComplaint] = useState<Complaint | null>(
    selectedTicketId ? complaints.find((c) => c.id === selectedTicketId) || null : null
  );

  const [resolutionNote, setResolutionNote] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffPhone, setStaffPhone] = useState('');

  const filteredComplaints = complaints.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.flat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchCat = categoryFilter === 'all' || c.category === categoryFilter;

    return matchSearch && matchStatus && matchCat;
  });

  const handleStatusChange = (status: ComplaintStatus) => {
    if (!inspectComplaint) return;
    updateComplaintStatus(inspectComplaint.id, status, resolutionNote);
    setInspectComplaint((prev) => (prev ? { ...prev, status } : null));
    setResolutionNote('');
  };

  const handleAssign = (name: string, roleTitle: string, phone: string) => {
    if (!inspectComplaint || !name.trim()) return;
    assignComplaint(inspectComplaint.id, name.trim(), roleTitle.trim() || 'Technician', phone.trim());
    setInspectComplaint((prev) =>
      prev ? { ...prev, assignedTo: { name: name.trim(), role: roleTitle.trim() || 'Technician', phone: phone.trim() }, status: 'assigned' } : null
    );
    setStaffName('');
    setStaffRole('');
    setStaffPhone('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Society Maintenance & Helpdesk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track resident issues, SLA timers, vendor dispatch, and resolutions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">
            Total Tickets: {complaints.length} (
            <span className="text-amber-600">
              {complaints.filter((c) => c.status !== 'resolved').length} Open
            </span>
            )
          </span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, flat, summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700"
        >
          <option value="all">All Categories</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Lift">Lift & Elevator</option>
          <option value="Electrical">Electrical</option>
          <option value="Cleaning">Cleaning & Waste</option>
          <option value="Water">Water Supply</option>
          <option value="Security">Security</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700"
        >
          <option value="all">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="assigned">Assigned</option>
          <option value="started">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FBF9F5] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Ticket & Flat</th>
                <th className="px-5 py-3.5">Issue Summary</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Assigned Staff</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setInspectComplaint(c)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded text-xs border border-teal-200/60">
                      Flat {c.flat}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 block mt-1">
                      #{c.ticketNumber}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{c.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{c.description}</div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.priority === 'Urgent'
                          ? 'bg-red-100 text-red-800'
                          : c.priority === 'High'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs">
                    {c.assignedTo ? (
                      <div>
                        <div className="font-bold text-slate-800">{c.assignedTo.name}</div>
                        <div className="text-slate-400">{c.assignedTo.role}</div>
                      </div>
                    ) : (
                      <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        Unassigned
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        c.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'started'
                          ? 'bg-teal-100 text-teal-800'
                          : c.status === 'assigned'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectComplaint(c);
                      }}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaint Detail & Resolution Drawer */}
      <Drawer
        isOpen={!!inspectComplaint}
        onClose={() => {
          setInspectComplaint(null);
          if (onClearSelectedTicket) onClearSelectedTicket();
        }}
        title={inspectComplaint ? `Ticket #${inspectComplaint.ticketNumber}` : ''}
        subtitle={inspectComplaint ? `Reported by Flat ${inspectComplaint.flat} on ${inspectComplaint.reportedAt}` : ''}
        width="lg"
      >
        {inspectComplaint && (
          <div className="space-y-6">
            {/* Ticket Header Card */}
            <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-teal-700">
                  {inspectComplaint.category} Issue
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    inspectComplaint.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {inspectComplaint.status}
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-900">{inspectComplaint.title}</h4>
              <p className="text-sm text-slate-600">{inspectComplaint.description}</p>
            </div>

            {/* Assign Staff Section */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Assign Society Technician
              </h5>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Staff name"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Plumber)"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                  />
                </div>
                <button
                  onClick={() => handleAssign(staffName, staffRole, staffPhone)}
                  disabled={!staffName.trim()}
                  className="h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Assign Staff
                </button>
                {inspectComplaint.assignedTo && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{inspectComplaint.assignedTo.name}</div>
                      <div className="text-[11px] text-slate-500">{inspectComplaint.assignedTo.role}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">{inspectComplaint.assignedTo.phone}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Assigned</span>
                  </div>
                )}
              </div>
            </div>

            {/* Resolution Progress Actions */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Update Status
              </h5>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStatusChange('assigned')}
                  className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
                >
                  Mark Assigned
                </button>
                <button
                  onClick={() => handleStatusChange('started')}
                  className="h-11 rounded-xl border border-teal-700 bg-teal-50 text-teal-800 text-xs font-bold"
                >
                  Work Started
                </button>
                <button
                  onClick={() => handleStatusChange('resolved')}
                  className="h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Mark Resolved ✓
                </button>
              </div>
            </div>

            {/* Internal Resolution Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Resolution Notes (Visible to Resident)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Wash basin valve replaced with Jaquar cartridge. Tested leak-free."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
