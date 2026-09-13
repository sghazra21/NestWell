import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { createSocietyInvite } from '../../lib/firestoreService';
import { LocationPicker, PickedLocation } from '../../components/common/LocationPicker';
import { Society, SocietyStatus } from '../../types';
import {
  Building2,
  Plus,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Search,
  Sliders,
  ExternalLink,
  Users,
  Activity,
  CreditCard,
  FileText,
  Lock,
  Eye,
  RefreshCw,
  Mail,
  Copy,
  Send,
} from 'lucide-react';

export const PlatformAdminDashboard: React.FC = () => {
  const {
    societies,
    currentSocietyId,
    setCurrentSocietyId,
    createSociety,
    updateSocietyStatus,
    deleteSociety,
    startSupportSession,
    supportSessions,
    platformAnalytics,
    platformUser,
    user,
    auditLogs,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedSocietyForSupport, setSelectedSocietyForSupport] = useState<Society | null>(null);
  const [supportReason, setSupportReason] = useState('');

  // Delete society state (typed-name confirmation)
  const [societyToDelete, setSocietyToDelete] = useState<Society | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  // Invite Society Admin state (shown right after society creation)
  const [createdSociety, setCreatedSociety] = useState<Society | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  // New Society form state
  const [newName, setNewName] = useState('');
  const [newLegalName, setNewLegalName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLocation, setNewLocation] = useState<PickedLocation | null>(null);
  const [featureVisitors, setFeatureVisitors] = useState(true);
  const [featureFacilities, setFeatureFacilities] = useState(true);
  const [featureBilling, setFeatureBilling] = useState(true);
  const [featureComplaints, setFeatureComplaints] = useState(true);
  const [featureElections, setFeatureElections] = useState(true);
  const [featureNotices, setFeatureNotices] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSocieties = societies.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalResidentsCount = societies.reduce((acc, s) => acc + (s.totalResidents || 0), 0);
  const totalFlatsCount = societies.reduce((acc, s) => acc + (s.totalFlats || 0), 0);
  const activeSocietiesCount = societies.filter((s) => s.status === 'active').length;

  const handleCreateSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCity.trim()) {
      showToast('Society name and city are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await createSociety({
        name: newName.trim(),
        legalName: newLegalName.trim() || `${newName.trim()} Apartment Owners Association`,
        city: newLocation?.city || newCity.trim(),
        address: newLocation?.displayName || newAddress.trim() || `${newName.trim()}, ${newCity.trim()}`,
        latitude: newLocation?.latitude,
        longitude: newLocation?.longitude,
        status: 'pending_admin',
        features: {
          visitorManagement: featureVisitors,
          facilityBooking: featureFacilities,
          maintenanceBilling: featureBilling,
          complaints: featureComplaints,
          elections: featureElections,
          notices: featureNotices,
        },
      });
      showToast(`Society "${created.name}" created. Next: invite a Society Administrator.`);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewLegalName('');
      setNewCity('');
      setNewAddress('');
      setNewLocation(null);
      // Open the invite-admin step immediately
      setCreatedSociety(created);
      setInviteEmail('');
      setInviteCode(null);
      setIsInviteModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast('Error creating society tenant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdSociety || !inviteEmail.trim()) {
      showToast('Administrator email is required.');
      return;
    }
    setIsInviting(true);
    try {
      const invite = await createSocietyInvite(createdSociety.id, {
        email: inviteEmail.trim(),
        intendedRole: 'society_admin',
        createdBy: user?.uid || platformUser?.id || 'platform-admin',
      });
      setInviteCode(invite.id);
      showToast(`Invitation created for ${invite.email}. Share the code with them.`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to create invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Copy failed. Please select the code manually.');
    }
  };

  const handleDeleteSociety = async () => {
    if (!societyToDelete) return;
    if (deleteConfirmName.trim() !== societyToDelete.name) {
      showToast('Type the exact society name to confirm deletion.');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteSociety(societyToDelete.id);
      setSocietyToDelete(null);
      setDeleteConfirmName('');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete society.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartSupport = async () => {
    if (!selectedSocietyForSupport) return;
    if (!supportReason.trim()) {
      showToast('Please provide a reason for the support session.');
      return;
    }

    try {
      await startSupportSession(selectedSocietyForSupport.id, supportReason.trim());
      setCurrentSocietyId(selectedSocietyForSupport.id);
      setIsSupportModalOpen(false);
      setSelectedSocietyForSupport(null);
      setSupportReason('');
      showToast(`Audited support session started for ${selectedSocietyForSupport.name}. Switched active tenant.`);
    } catch (err) {
      console.error(err);
      showToast('Failed to start support session.');
    }
  };

  const getStatusBadge = (status: SocietyStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active</span>;
      case 'onboarding':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1"><Clock className="w-3 h-3" /> Onboarding</span>;
      case 'pending_admin':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Pending Admin</span>;
      case 'suspended':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 flex items-center gap-1"><Lock className="w-3 h-3" /> Suspended</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Platform Super Admin
              </span>
              <span className="text-xs text-slate-400">Authenticated: {user?.email || platformUser?.email || ''}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-white">
              NestWell Multi-Tenant Console
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Authoritative society tenant management, provisioning, isolation metrics, and audited support sessions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-colors"
            >
              <Plus className="w-4 h-4" /> Provision New Society
            </button>
          </div>
        </div>

        {/* High-level platform KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Tenants</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white mt-2">{societies.length}</div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">{activeSocietiesCount} active and operational</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Units (Flats)</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white mt-2">{totalFlatsCount}</div>
            <div className="text-xs text-slate-400 mt-1">Across all registered towers</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Residents</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white mt-2">{totalResidentsCount}</div>
            <div className="text-xs text-blue-400 mt-1">Registered members & family</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Support Sessions</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white mt-2">{supportSessions.filter(s => s.status === 'active').length}</div>
            <div className="text-xs text-amber-400 mt-1">Audited platform impersonations</div>
          </div>
        </div>

        {/* Tenant Registry Section */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Managed Society Tenants</h2>
              <p className="text-slate-400 text-xs mt-0.5">Isolated Firestore tenants with designated roles and feature flags.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tenant or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60">
                <tr>
                  <th className="px-5 py-3.5">Society Name & ID</th>
                  <th className="px-5 py-3.5">City & Registration</th>
                  <th className="px-5 py-3.5">Scale (Flats / Residents)</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Active Tenant</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 font-medium">
                {filteredSocieties.map((soc) => {
                  const isCurrent = soc.id === currentSocietyId;
                  return (
                    <tr key={soc.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{soc.name}</div>
                        <div className="text-slate-500 font-mono text-[11px] mt-0.5">ID: {soc.id}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-200">{soc.city}</div>
                        <div className="text-slate-500 text-[11px]">{soc.registeredNumber || 'RWA Registered'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-200">{soc.totalFlats || 0} Flats</div>
                        <div className="text-slate-500 text-[11px]">{soc.totalResidents || 0} Residents</div>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(soc.status)}
                      </td>
                      <td className="px-5 py-4">
                        {isCurrent ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            Current Context
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setCurrentSocietyId(soc.id);
                              showToast(`Switched active context to ${soc.name}`);
                            }}
                            className="text-xs text-slate-400 hover:text-white font-semibold underline underline-offset-2"
                          >
                            Switch to this
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        {soc.status === 'pending_admin' && (
                          <button
                            onClick={() => {
                              setCreatedSociety(soc);
                              setInviteEmail('');
                              setInviteCode(null);
                              setIsInviteModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" /> Invite Admin
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSocietyForSupport(soc);
                            setIsSupportModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Impersonate / Support
                        </button>
                        {soc.status === 'active' ? (
                          <button
                            onClick={() => updateSocietyStatus(soc.id, 'suspended')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors"
                          >
                            Suspend
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => updateSocietyStatus(soc.id, 'active')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors"
                            >
                              Activate
                            </button>
                            <button
                              onClick={() => {
                                setSocietyToDelete(soc);
                                setDeleteConfirmName('');
                              }}
                              title="Permanently delete this society and all its data"
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Audit Log Section */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Immutable Platform Audit Log</h2>
              <p className="text-slate-400 text-xs mt-0.5">Real-time trail of administrative actions, support sessions, and role grants.</p>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No administrative actions logged yet for this session.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{log.actorName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300">
                        {log.actorRole}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">→ {log.action}</span>
                    </div>
                    <div className="text-slate-400">
                      Target: <span className="text-slate-300 font-semibold">{log.targetType}</span> ({log.targetId})
                      {log.reason && <span className="italic ml-2 text-slate-400">— "{log.reason}"</span>}
                    </div>
                  </div>
                  <div className="text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Provision Society Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">Provision New Society Tenant</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSociety} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Society Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Palm Meadows RWA"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad, TS"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Legal Registered Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Palm Meadows Apartment Owners Welfare Association"
                  value={newLegalName}
                  onChange={(e) => setNewLegalName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Physical Address</label>
                <textarea
                  rows={2}
                  placeholder="Plot 42, Financial District, Nanakramguda..."
                  value={newLocation?.displayName || newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <LocationPicker
                onPick={(loc) => {
                  setNewLocation(loc);
                  if (loc?.city) setNewCity(loc.city);
                  if (loc) setNewAddress(loc.displayName);
                }}
              />

              {/* Feature Flags */}
              <div className="border border-slate-700/60 rounded-xl p-4 bg-slate-900/40 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">Society Module Feature Flags</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={featureVisitors} onChange={(e) => setFeatureVisitors(e.target.checked)} className="rounded text-indigo-600" />
                    <span>Visitor Gate Pass</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={featureFacilities} onChange={(e) => setFeatureFacilities(e.target.checked)} className="rounded text-indigo-600" />
                    <span>Facility Bookings</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={featureBilling} onChange={(e) => setFeatureBilling(e.target.checked)} className="rounded text-indigo-600" />
                    <span>Maintenance Billing</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={featureComplaints} onChange={(e) => setFeatureComplaints(e.target.checked)} className="rounded text-indigo-600" />
                    <span>Complaints Helpdesk</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={featureElections} onChange={(e) => setFeatureElections(e.target.checked)} className="rounded text-indigo-600" />
                    <span>Digital Elections</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={featureNotices} onChange={(e) => setFeatureNotices(e.target.checked)} className="rounded text-indigo-600" />
                    <span>RWA Notices</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Provisioning Tenant...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Society Admin Modal */}
      {isInviteModalOpen && createdSociety && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Invite Society Administrator</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {createdSociety.name} • {createdSociety.city}
                </p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {!inviteCode ? (
              <form onSubmit={handleInviteAdmin} className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  The administrator will sign in (or create an account) with this email,
                  then enter the invitation code to become Society Admin.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Administrator Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="w-full px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isInviting ? 'Creating invitation…' : 'Send Invitation'}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                  <p className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold mb-1">
                    Invitation code
                  </p>
                  <p className="text-2xl font-mono font-black text-white tracking-wider">
                    {inviteCode}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Valid for 7 days • Single use • Expires after acceptance
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="w-full px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy code'}
                </button>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-full text-center text-xs text-slate-400 hover:text-white py-1"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Society Confirm Modal */}
      {societyToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-base font-bold text-red-400">Delete society permanently?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will <strong>irreversibly delete “{societyToDelete.name}”</strong> and
              everything inside it — towers, flats, members, visitors, complaints,
              bills, bookings, notices, elections and audit logs. This cannot be undone.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Type <span className="font-mono font-bold text-white">{societyToDelete.name}</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={societyToDelete.name}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setSocietyToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSociety}
                disabled={isDeleting || deleteConfirmName.trim() !== societyToDelete.name}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-40"
              >
                {isDeleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support / Impersonation Modal */}
      {isSupportModalOpen && selectedSocietyForSupport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" /> Start Support Session
              </h3>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are launching an authenticated inspection session into{' '}
              <strong className="text-white">{selectedSocietyForSupport.name}</strong>.
              This will switch your active tenant context and log an immutable audit record.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Audit Reason (Mandatory) *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Assisting President with monthly maintenance audit issue..."
                value={supportReason}
                onChange={(e) => setSupportReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartSupport}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition-colors"
              >
                Authorize & Switch Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
