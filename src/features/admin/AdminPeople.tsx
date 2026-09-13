import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Resident, UserRole } from '../../types';
import { Drawer } from '../../components/common/Drawer';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  Car,
  Home,
  CheckCircle,
  Shield,
  CreditCard,
  UserCheck,
  ShieldCheck,
  KeyRound,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const AdminPeople: React.FC = () => {
  const {
    residents,
    addResident,
    promoteToSocietyAdmin,
    registeredUsers,
    userProfile,
    currentSociety,
    members,
    towers,
    setMemberStatus,
    inviteMember,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'residents' | 'app_accounts' | 'invites'>('residents');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Owner' | 'Tenant'>('All');
  const [towerFilter, setTowerFilter] = useState<string>('All');

  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New resident form state
  const [newFlat, setNewFlat] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newType, setNewType] = useState<'Owner' | 'Tenant'>('Owner');
  const [newTower, setNewTower] = useState<string>('');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'resident' | 'security' | 'committee' | 'society_admin'>('resident');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const pendingMembers = members.filter((m) => m.status === 'pending');

  const filteredResidents = residents.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.flat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      (r.societyRole && r.societyRole.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType = typeFilter === 'All' || r.type === typeFilter;
    const matchTower = towerFilter === 'All' || r.tower === towerFilter;

    return matchSearch && matchType && matchTower;
  });

  const handleCreateResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlat || !newName || !newPhone) return;

    addResident({
      flat: newFlat.toUpperCase(),
      tower: newTower,
      name: newName,
      phone: newPhone,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      type: newType,
      dues: 0,
      familyMembers: [],
      vehicles: [],
    });

    setIsAddModalOpen(false);
    setNewFlat('');
    setNewName('');
    setNewPhone('');
    setNewEmail('');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      const code = await inviteMember(inviteEmail.trim(), inviteRole);
      setInviteCode(code);
      showToast(`Invitation created for ${inviteEmail.trim()}. Share the code.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleApprove = async (uid: string) => {
    await setMemberStatus(uid, 'active');
  };

  const handleReject = async (uid: string) => {
    await setMemberStatus(uid, 'removed');
  };

  const handlePromote = async (
    targetId: string,
    role: UserRole,
    designation: string
  ) => {
    await promoteToSocietyAdmin(targetId, role, designation);
    if (selectedResident && selectedResident.id === targetId) {
      setSelectedResident((prev) => (prev ? { ...prev, societyRole: role, designation } : null));
    }
  };

  return (
    <div className="space-y-5">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Resident & Member Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered owners, tenants, and staff
            {towers.length > 0 ? ` across ${towers.map((t) => t.name).join(' & ')}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('residents')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'residents'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Society Flats & Residents
            </button>
            <button
              onClick={() => setActiveTab('app_accounts')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'app_accounts'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-600" />
              <span>App Accounts & Admin Rights</span>
              {registeredUsers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 text-[10px]">
                  {registeredUsers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'invites'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>Invites & Requests</span>
              {pendingMembers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 text-[10px]">
                  {pendingMembers.length}
                </span>
              )}
            </button>
          </div>

          <button
            id="add-resident-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Resident</span>
          </button>
        </div>
      </div>

      {activeTab === 'app_accounts' ? (
        /* App Users & Admin Delegation Tab */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white border border-purple-800 shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/30">
                <ShieldCheck className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <span>Society Admin Superpower Delegation</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-400/20 text-purple-200 text-xs font-semibold">Local Super Admin Active</span>
                </h3>
                <p className="text-xs text-purple-200/80 mt-1 max-w-3xl leading-relaxed">
                  As Local Admin, you can promote any resident or registered user (e.g. Google/Email accounts) to <strong>Society Admin</strong> status.
                  Society Admins have unrestricted authority across the entire platform: managing financial dues, creating election ballots, approving visitor policies, and updating bylaws.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Authenticated User Accounts ({registeredUsers.length || 'Synced via Firestore'})
              </h4>
              <span className="text-xs text-slate-500">Live Firebase Auth & Profile Registry</span>
            </div>

            <div className="divide-y divide-slate-100">
              {registeredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-3">
                  <KeyRound className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No external Firebase logins recorded yet in this session.</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    When you or any resident sign in with Google or Email, their profile appears here instantly. In the meantime, you can promote any resident directly from the Society Residents tab!
                  </p>
                  <button
                    onClick={() => setActiveTab('residents')}
                    className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs"
                  >
                    View Society Residents List
                  </button>
                </div>
              ) : (
                registeredUsers.map((usr) => (
                  <div key={usr.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                        {usr.name ? usr.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{usr.name || 'Resident Member'}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              usr.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : usr.role === 'security'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {usr.role === 'admin' ? '★ Society Admin' : usr.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {usr.email} {usr.flat ? `• Flat ${usr.flat}${usr.tower ? ` (${usr.tower})` : ''}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {usr.role !== 'admin' ? (
                        <button
                          onClick={() => handlePromote(usr.id, 'admin', 'Society Admin & Executive Officer')}
                          className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Make Society Admin</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                          <span>Full Admin Rights Active</span>
                        </span>
                      )}

                      {usr.role === 'admin' && (
                        <button
                          onClick={() => handlePromote(usr.id, 'resident', 'Resident')}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                        >
                          Revoke Admin
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'invites' ? (
        /* Invites & Membership Requests Tab */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Invite Member by Email</h4>
            <p className="text-xs text-slate-500">
              The invited person signs in with this email, enters the code, and joins as the selected role.
            </p>
            {!inviteCode ? (
              <form
                onSubmit={handleInvite}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2"
              >
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="h-10 px-3 rounded-xl border border-slate-200 text-sm sm:col-span-2"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="resident">Resident</option>
                  <option value="security">Security</option>
                  <option value="committee">Committee</option>
                  <option value="society_admin">Society Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {isInviting ? 'Creating…' : 'Create Invite'}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold">
                  Share this code with {inviteEmail}
                </p>
                <p className="text-2xl font-mono font-black text-slate-900 tracking-wider">
                  {inviteCode}
                </p>
                <button
                  onClick={() => {
                    setInviteCode(null);
                    setInviteEmail('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Invite another member
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">
                Pending Membership Requests ({pendingMembers.length})
              </h4>
            </div>
            {pendingMembers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No pending requests. New join requests from society search appear here.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingMembers.map((m) => (
                  <div key={m.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(m.uid)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(m.uid)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Filter and search toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by flat, name, role or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="All">All Types (Owner & Tenant)</option>
                <option value="Owner">Owners Only</option>
                <option value="Tenant">Tenants Only</option>
              </select>

              {/* Tower Filter */}
              <select
                value={towerFilter}
                onChange={(e) => setTowerFilter(e.target.value)}
                className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="All">All Towers</option>
                {towers.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FBF9F5] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Flat / Unit</th>
                    <th className="px-5 py-3.5">Resident Name</th>
                    <th className="px-5 py-3.5">Society Privileges</th>
                    <th className="px-5 py-3.5">Contact</th>
                    <th className="px-5 py-3.5">Vehicles</th>
                    <th className="px-5 py-3.5">Dues Status</th>
                    <th className="px-5 py-3.5 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResidents.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedResident(r)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60 font-mono text-xs">
                          {r.flat}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{r.tower}</span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.email}</div>
                      </td>

                      <td className="px-5 py-4">
                        {r.societyRole === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            <span>Society Admin</span>
                          </span>
                        ) : r.societyRole === 'committee' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <Users className="w-3 h-3 text-indigo-600" />
                            <span>Committee</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            Resident ({r.type})
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-700">{r.phone}</td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Car className="w-4 h-4 text-slate-400" />
                          <span>{r.vehicles.length} registered</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {r.dues > 0 ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs border border-amber-200">
                            ₹{r.dues.toLocaleString()} Due
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs border border-emerald-200">
                            Cleared ✓
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {r.societyRole !== 'admin' ? (
                            <button
                              onClick={() => handlePromote(r.id, 'admin', 'Society Admin & Executive Officer')}
                              className="text-xs font-bold text-purple-700 hover:text-white bg-purple-50 hover:bg-purple-700 px-2.5 py-1.5 rounded-lg border border-purple-200 transition-all flex items-center gap-1"
                              title="Grant this resident full society admin powers"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Make Admin</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                              Admin ✓
                            </span>
                          )}

                          <button
                            onClick={() => setSelectedResident(r)}
                            className="text-xs font-bold text-teal-700 hover:text-teal-900 px-2.5 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Resident Detail Drawer */}
      <Drawer
        isOpen={!!selectedResident}
        onClose={() => setSelectedResident(null)}
        title={selectedResident ? `Flat ${selectedResident.flat} Details` : ''}
        subtitle={selectedResident ? `${selectedResident.name} (${selectedResident.type})` : ''}
        width="lg"
      >
        {selectedResident && (
          <div className="space-y-6">
            {/* Quick Profile Summary */}
            <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-teal-700">
                  {selectedResident.tower} • Occupied since {selectedResident.occupancyDate}
                </span>
                <h4 className="text-xl font-bold text-slate-900 mt-0.5">{selectedResident.name}</h4>
                <p className="text-xs text-slate-500">{selectedResident.email} • {selectedResident.phone}</p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Outstanding Dues</span>
                <span className={`text-lg font-extrabold ${selectedResident.dues > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  ₹{selectedResident.dues.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Family Members */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Registered Family Members ({selectedResident.familyMembers.length})
              </h5>
              <div className="space-y-2">
                {selectedResident.familyMembers.map((m, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-slate-500">{m.relation} {m.phone ? `• ${m.phone}` : ''}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold text-[11px]">
                      Verified Member
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Registered Vehicles */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Registered Vehicles & Parking ({selectedResident.vehicles.length})
              </h5>
              <div className="space-y-2">
                {selectedResident.vehicles.map((v, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-teal-700" />
                      <div>
                        <div className="font-mono font-bold text-slate-900">{v.number}</div>
                        <div className="text-slate-500">{v.type} • Assigned Slot: {v.slot}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[11px]">
                      RFID Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Society Administrative Privileges & Superpowers */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Society Role & Administration Rights</span>
                  </h5>
                  <p className="text-xs text-purple-700/80 mt-0.5">
                    Society Admins have full access to finances, gate visitor rules, elections, and system settings.
                  </p>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                    selectedResident.societyRole === 'admin'
                      ? 'bg-purple-700 text-white'
                      : selectedResident.societyRole === 'committee'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {selectedResident.societyRole === 'admin'
                    ? '★ Society Admin'
                    : selectedResident.societyRole === 'committee'
                    ? 'Committee'
                    : 'Resident'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-purple-200/60">
                {selectedResident.societyRole !== 'admin' ? (
                  <button
                    type="button"
                    onClick={() =>
                      handlePromote(
                        selectedResident.id,
                        'admin',
                        'Society Admin & Executive Officer'
                      )
                    }
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Promote to Society Admin</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handlePromote(
                        selectedResident.id,
                        'resident',
                        'Resident'
                      )
                    }
                    className="flex-1 py-2 px-3 rounded-xl border border-purple-300 text-purple-800 hover:bg-purple-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Revert to Regular Resident</span>
                  </button>
                )}

                {selectedResident.societyRole !== 'committee' && selectedResident.societyRole !== 'admin' && (
                  <button
                    type="button"
                    onClick={() =>
                      handlePromote(
                        selectedResident.id,
                        'committee',
                        'Executive Committee Member'
                      )
                    }
                    className="py-2 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Users className="w-4 h-4" />
                    <span>Assign Committee</span>
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  alert(`Maintenance reminder SMS and WhatsApp sent to ${selectedResident.name}.`);
                }}
                className="flex-1 h-11 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Send WhatsApp Due Notice</span>
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add New Resident Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Society Resident"
        subtitle={`Register flat owner or tenant to ${currentSociety?.name || 'society'}`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateResident} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Flat Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. A-301, B-504"
                value={newFlat}
                onChange={(e) => setNewFlat(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-700 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tower
              </label>
              <select
                value={newTower}
                onChange={(e) => setNewTower(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-700"
              >
                <option value="">Select tower…</option>
                {towers.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Primary Resident Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ananya Sharma"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 00000"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="resident@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Occupancy Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Owner', 'Tenant'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className={`h-11 rounded-xl text-xs font-bold border ${
                    newType === t
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-13 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl mt-2"
          >
            Save & Generate Digital Key
          </button>
        </form>
      </Modal>
    </div>
  );
};
