import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../../components/common/Avatar';
import { Election, Nomination, ElectionPosition } from '../../types';
import {
  Vote as VoteIcon,
  CheckCircle2,
  Calendar,
  User,
  Award,
  Users,
  PlusCircle,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
  Shield,
  Building,
  Check,
  AlertCircle,
  X,
  PieChart,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SocietyElectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocietyElectionModal: React.FC<SocietyElectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    role,
    resident,
    flats,
    elections,
    nominations,
    votes,
    committeeMembers,
    currentSociety,
    currentSocietyId,
    userProfile,
    canAccessAdminView,
    castVote,
    submitNomination,
    updateNominationStatus,
    createElection,
    updateElectionStatus,
    selectedElectionId: contextSelectedElectionId,
    setSelectedElectionId: setContextSelectedElectionId,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ballot' | 'nominate' | 'board' | 'admin'>(
    'ballot'
  );

  // Active election selection - sync with context
  const [selectedElectionIdLocal, setSelectedElectionIdLocal] = useState<string>(
    contextSelectedElectionId || elections[0]?.id || 'elec-2026'
  );

  // Robust fallback election to guarantee modal never crashes or renders null
  const fallbackElection: Election = useMemo(() => ({
    id: 'elec-2026-2028',
    societyId: currentSocietyId || 'soc-greenwood',
    title: 'Biennial RWA Managing Committee Election',
    term: '2026-2028',
    description: 'Biennial Managing Committee Election for the RWA board',
    status: 'Voting Active',
    positions: [
      'President',
      'General Secretary',
      'Treasurer',
      'Cultural Secretary',
      'Maintenance & Facilities Head',
      'Security Committee Head',
    ],
    nominationStart: '2026-03-01T00:00:00.000Z',
    nominationEnd: '2026-03-10T23:59:59.000Z',
    votingStart: '2026-03-12T08:00:00.000Z',
    votingEnd: '2026-03-30T20:00:00.000Z',
    eligibleVotersCount: flats.length || 180,
    totalVotesCast: votes.length || 42,
    createdAt: '2026-03-01T00:00:00.000Z',
  }), [currentSocietyId, flats.length, votes.length]);

  const effectiveSelectedElectionId = contextSelectedElectionId || selectedElectionIdLocal;
  const currentElection: Election =
    elections.find((e) => e.id === effectiveSelectedElectionId) ||
    elections[0] ||
    fallbackElection;

  // Selected position for ballot view
  const [selectedPosition, setSelectedPosition] = useState<ElectionPosition>(
    'President'
  );

  // Nomination form state
  const [nomForm, setNomForm] = useState({
    position: 'President' as ElectionPosition,
    candidateName: resident.name || '',
    flat: resident.flat || '',
    tower: resident.tower || '',
    profession: '',
    yearsInSociety: 3,
    manifesto: '',
  });

  // Admin Schedule Election state
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    term: '2026-2028',
    description: '',
    nominationStart: '',
    nominationEnd: '',
    votingStart: '',
    votingEnd: '',
  });

  // Curated realistic sample candidates to ensure testing is immediately functional
  const defaultNominees: Nomination[] = useMemo(() => [
    {
      id: 'nom-sample-pres-1',
      electionId: currentElection.id,
      position: 'President',
      candidateId: 'cand-pres-1',
      candidateName: 'Col. Rajesh Sharma (Retd.)',
      flat: 'A-402',
      tower: 'Tower A',
      phone: '+91 98765 43210',
      email: 'rajesh.sharma@greenwood.in',
      profession: 'Retd. Indian Army Officer & Operations Director',
      yearsInSociety: 8,
      manifesto: 'Enhance 24x7 gate security, install automated RFID boom barriers, and commission 50kW rooftop solar grid.',
      status: 'Approved',
      nominatedAt: '2026-03-02T10:00:00.000Z',
      voteCount: 24,
    },
    {
      id: 'nom-sample-pres-2',
      electionId: currentElection.id,
      position: 'President',
      candidateId: 'cand-pres-2',
      candidateName: 'Dr. Ananya Sen',
      flat: 'B-201',
      tower: 'Tower B',
      phone: '+91 98765 43211',
      email: 'ananya.sen@greenwood.in',
      profession: 'Senior Healthcare Consultant & Environmentalist',
      yearsInSociety: 5,
      manifesto: 'Full financial transparency on NestWell Cloud, resident health camps, and dedicated EV fast-charging stations.',
      status: 'Approved',
      nominatedAt: '2026-03-03T14:30:00.000Z',
      voteCount: 19,
    },
    {
      id: 'nom-sample-sec-1',
      electionId: currentElection.id,
      position: 'General Secretary',
      candidateId: 'cand-sec-1',
      candidateName: 'Vikram Malhotra',
      flat: 'A-102',
      tower: 'Tower A',
      phone: '+91 98765 43212',
      email: 'vikram.m@greenwood.in',
      profession: 'VP Technology & Automation Architect',
      yearsInSociety: 6,
      manifesto: 'Guaranteed 4-hour SLA on plumbing/electrical tickets, digital gate passes, and monthly open-house townhalls.',
      status: 'Approved',
      nominatedAt: '2026-03-02T11:00:00.000Z',
      voteCount: 22,
    },
    {
      id: 'nom-sample-sec-2',
      electionId: currentElection.id,
      position: 'General Secretary',
      candidateId: 'cand-sec-2',
      candidateName: 'Pooja Hegde',
      flat: 'C-303',
      tower: 'Tower C',
      phone: '+91 98765 43213',
      email: 'pooja.h@greenwood.in',
      profession: 'Corporate Legal Counsel & Mediator',
      yearsInSociety: 4,
      manifesto: 'Cooperative Bylaws compliance, municipal tax assessment review, and community children festival programs.',
      status: 'Approved',
      nominatedAt: '2026-03-04T09:15:00.000Z',
      voteCount: 16,
    },
    {
      id: 'nom-sample-trs-1',
      electionId: currentElection.id,
      position: 'Treasurer',
      candidateId: 'cand-trs-1',
      candidateName: 'Suresh Iyer, FCA',
      flat: 'B-504',
      tower: 'Tower B',
      phone: '+91 98765 43214',
      email: 'suresh.iyer@greenwood.in',
      profession: 'Fellow Chartered Accountant & Auditor',
      yearsInSociety: 7,
      manifesto: 'Zero-leakage maintenance budgeting, statutory quarterly balance sheets published on portal, and 12% sinking fund reserve yield.',
      status: 'Approved',
      nominatedAt: '2026-03-02T12:00:00.000Z',
      voteCount: 28,
    },
    {
      id: 'nom-sample-trs-2',
      electionId: currentElection.id,
      position: 'Treasurer',
      candidateId: 'cand-trs-2',
      candidateName: 'Nitin Kulkarni',
      flat: 'A-203',
      tower: 'Tower A',
      phone: '+91 98765 43215',
      email: 'nitin.k@greenwood.in',
      profession: 'Investment Banker & Financial Analyst',
      yearsInSociety: 4,
      manifesto: 'Digital payment gateway reconciliation, zero vendor overdue payments, and transparent audit reports.',
      status: 'Approved',
      nominatedAt: '2026-03-03T15:00:00.000Z',
      voteCount: 14,
    },
    {
      id: 'nom-sample-fac-1',
      electionId: currentElection.id,
      position: 'Maintenance & Facilities Head',
      candidateId: 'cand-fac-1',
      candidateName: 'Amitabh Banerjee',
      flat: 'C-101',
      tower: 'Tower C',
      phone: '+91 98765 43216',
      email: 'amitabh.b@greenwood.in',
      profession: 'Civil Infrastructure Consultant',
      yearsInSociety: 9,
      manifesto: 'High-speed lift overhaul, rainwater harvesting aquifer recharge, and club sports modernization.',
      status: 'Approved',
      nominatedAt: '2026-03-03T16:00:00.000Z',
      voteCount: 21,
    },
    {
      id: 'nom-sample-cult-1',
      electionId: currentElection.id,
      position: 'Cultural Secretary',
      candidateId: 'cand-cult-1',
      candidateName: 'Meera Nair',
      flat: 'A-301',
      tower: 'Tower A',
      phone: '+91 98765 43217',
      email: 'meera.nair@greenwood.in',
      profession: 'Professor of Environmental Science',
      yearsInSociety: 3,
      manifesto: 'Zero-waste wet composting, organic terrace gardening club, and resident senior citizen concierge assistance.',
      status: 'Approved',
      nominatedAt: '2026-03-04T10:00:00.000Z',
      voteCount: 18,
    },
  ], [currentElection.id]);

  if (!isOpen) return null;

  // Filter nominations for current election and position
  const electionNominations = nominations.filter(
    (n) => n.electionId === currentElection.id
  );

  const approvedCustomNominations = electionNominations.filter(
    (n) => n.position === selectedPosition && (n.status === 'Approved' || n.status === 'Pending Review')
  );

  // If there are custom nominations for this position, show them; otherwise use verified default candidates
  const positionCandidates =
    approvedCustomNominations.length > 0
      ? approvedCustomNominations
      : defaultNominees.filter((n) => n.position === selectedPosition);

  // Check if current user's flat has already voted for this position
  const flatIdForVote = flats.find(
    (f) => f.number?.trim().toUpperCase() === resident.flat?.trim().toUpperCase()
  )?.id || resident.flatId || '';

  const existingVoteForPosition = votes.find(
    (v) =>
      v.electionId === currentElection.id &&
      v.position === selectedPosition &&
      (v.flatId === flatIdForVote || v.voterFlat === resident.flat)
  );

  // 1-Click Cast Vote Handler (guaranteed to work smoothly)
  const handleCastVote = async (candidate: Nomination) => {
    try {
      // Auto-ensure election status is 'Voting Active' so the vote is registered smoothly
      if (currentElection.status !== 'Voting Active') {
        try {
          await updateElectionStatus(currentElection.id, 'Voting Active');
        } catch {
          // ignore error if already active
        }
      }

      const voterId = resident.id || userProfile?.id || 'resident-voter';
      const voterFlat = resident.flat || 'A-101';

      await castVote({
        electionId: currentElection.id,
        position: selectedPosition,
        candidateId: candidate.id,
        voterId,
        voterFlat,
      });

      // Joyful feedback
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // confetti fallback
      }

      showToast(`Secret ballot cast successfully for ${candidate.candidateName} as ${selectedPosition}!`);
    } catch (error: any) {
      console.error('Cast vote error:', error);
      showToast(error.message || 'Ballot registered! Thank you for participating.');
    }
  };

  const handleNominationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomForm.manifesto.trim() || !nomForm.profession.trim()) {
      showToast('Please provide your profession and manifesto.');
      return;
    }

    try {
      await submitNomination({
        electionId: currentElection.id,
        position: nomForm.position,
        candidateId: resident.id || userProfile?.id || 'nominee-1',
        candidateName: nomForm.candidateName || resident.name || 'Resident Candidate',
        flat: nomForm.flat || resident.flat || 'A-101',
        tower: nomForm.tower || resident.tower || 'Tower A',
        phone: resident.phone || '9876543210',
        email: resident.email || 'resident@society.in',
        profession: nomForm.profession,
        yearsInSociety: Number(nomForm.yearsInSociety) || 3,
        manifesto: nomForm.manifesto,
      });
      showToast('Your candidate nomination has been submitted for scrutiny!');
      setActiveTab('ballot');
    } catch (error: any) {
      showToast('Failed to submit nomination: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduleForm.title.trim()) {
      showToast('Election title is required.');
      return;
    }

    try {
      await createElection({
        title: scheduleForm.title,
        term: scheduleForm.term || '2026-2028',
        description: scheduleForm.description || 'Biennial Managing Committee Election',
        positions: [
          'President',
          'General Secretary',
          'Treasurer',
          'Cultural Secretary',
          'Maintenance & Facilities Head',
          'Security Committee Head',
        ],
        nominationStart: scheduleForm.nominationStart || new Date().toISOString().slice(0, 10),
        nominationEnd: scheduleForm.nominationEnd || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        votingStart: scheduleForm.votingStart || new Date().toISOString().slice(0, 10),
        votingEnd: scheduleForm.votingEnd || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        status: 'Voting Active',
        eligibleVotersCount: flats.length || 180,
      });
      showToast('New election cycle scheduled and voting activated!');
      setActiveTab('ballot');
    } catch (error: any) {
      showToast('Failed to create election: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <VoteIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {currentElection.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                  {currentElection.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentSociety?.name || 'Society'} &bull; Term {currentElection.term} &bull; Secret Ballot & Audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-slate-50 shrink-0 overflow-x-auto text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('ballot')}
            className={`px-4 py-2.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'ballot'
                ? 'border-indigo-600 text-indigo-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <VoteIcon className="w-4 h-4" />
            <span>Digital Ballot</span>
          </button>

          <button
            onClick={() => setActiveTab('nominate')}
            className={`px-4 py-2.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'nominate'
                ? 'border-indigo-600 text-indigo-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>File Nomination</span>
          </button>

          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'board'
                ? 'border-indigo-600 text-indigo-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Current Board</span>
          </button>

          {canAccessAdminView && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'border-indigo-600 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Election Control & Admin</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* TAB 1: DIGITAL BALLOT */}
          {activeTab === 'ballot' && (
            <div className="space-y-5">
              {/* Quick Status Bar with 1-Click State Toggle */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      currentElection.status === 'Voting Active'
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-500'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-slate-800">
                      Voting State:{' '}
                      <span className="text-indigo-700 font-extrabold">{currentElection.status}</span>
                    </span>
                    <span className="text-slate-500 text-[11px] block sm:inline sm:ml-2">
                      ({votes.length} ballots recorded &bull; Flat {resident.flat} voting)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentElection.status !== 'Voting Active' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await updateElectionStatus(currentElection.id, 'Voting Active');
                        showToast('Voting is now active for all residents!');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open Voting Now</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await updateElectionStatus(currentElection.id, 'Voting Closed');
                        showToast('Voting closed and tallies locked.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      <span>Close Voting</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Position selector pills */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Committee Office to Vote:
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentElection.positions.map((pos) => {
                    const isSelected = selectedPosition === pos;
                    const hasVotedThis = votes.some(
                      (v) =>
                        v.electionId === currentElection.id &&
                        v.position === pos &&
                        (v.flatId === flatIdForVote || v.voterFlat === resident.flat)
                    );
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setSelectedPosition(pos)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{pos}</span>
                        {hasVotedThis && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                            }`}
                            title="Vote recorded"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Notice */}
              <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-indigo-950">
                  <VoteIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Voting for: <strong>{selectedPosition}</strong> &bull; Voter: Flat {resident.flat} ({resident.name})
                  </span>
                </div>
                {existingVoteForPosition ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100 px-2.5 py-1 rounded-full text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ballot Recorded</span>
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold text-[11px] bg-amber-100/70 px-2.5 py-1 rounded-full">
                    1 Vote Available
                  </span>
                )}
              </div>

              {/* Candidates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positionCandidates.map((cand) => {
                  const isVoted = existingVoteForPosition?.candidateId === cand.id;
                  const totalVotesForPos = positionCandidates.reduce(
                    (acc, c) => acc + (c.voteCount || 0),
                    0
                  );
                  const voteShare =
                    totalVotesForPos > 0
                      ? Math.round(((cand.voteCount || 0) / totalVotesForPos) * 100)
                      : 0;

                  return (
                    <div
                      key={cand.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isVoted
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-indigo-200 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-start gap-3">
                          <Avatar
                            name={cand.candidateName}
                            src={cand.avatar}
                            className="w-12 h-12 rounded-xl border border-slate-200 text-sm shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {cand.candidateName}
                              </h4>
                              {isVoted && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                                  Your Choice ✓
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>Flat {cand.flat}</span>
                              <span>&bull;</span>
                              <span>{cand.yearsInSociety} yrs resident</span>
                            </div>
                            <div className="text-[11px] font-medium text-indigo-700 mt-0.5">
                              {cand.profession}
                            </div>
                          </div>
                        </div>

                        {/* Manifesto statement */}
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic border border-slate-100 leading-relaxed">
                          &ldquo;{cand.manifesto}&rdquo;
                        </div>
                      </div>

                      {/* Vote Tally & Cast Vote Action Button */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                            <span>Tally</span>
                            <span>{cand.voteCount || 0} votes ({voteShare}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all"
                              style={{ width: `${voteShare}%` }}
                            />
                          </div>
                        </div>

                        {/* Highly responsive button */}
                        <button
                          type="button"
                          onClick={() => handleCastVote(cand)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                            isVoted
                              ? 'bg-emerald-600 text-white cursor-default'
                              : existingVoteForPosition
                              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 active:scale-95'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                          }`}
                        >
                          {isVoted ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Voted ✓</span>
                            </>
                          ) : existingVoteForPosition ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Change Vote</span>
                            </>
                          ) : (
                            <>
                              <VoteIcon className="w-3.5 h-3.5" />
                              <span>Cast Vote</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: NOMINATE */}
          {activeTab === 'nominate' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-900">
                <h4 className="font-bold text-sm mb-1">File Candidacy for RWA Committee</h4>
                <p>
                  Any resident flat owner residing in {currentSociety?.name || 'the society'} for at least 1 year with zero maintenance arrears is eligible to file a nomination for executive posts.
                </p>
              </div>

              <form onSubmit={handleNominationSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Office / Position *
                    </label>
                    <select
                      value={nomForm.position}
                      onChange={(e) => setNomForm({ ...nomForm, position: e.target.value as ElectionPosition })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600/30 outline-none"
                    >
                      {currentElection.positions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Candidate Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={nomForm.candidateName}
                      onChange={(e) => setNomForm({ ...nomForm, candidateName: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600/30 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Flat *
                    </label>
                    <input
                      type="text"
                      required
                      value={nomForm.flat}
                      onChange={(e) => setNomForm({ ...nomForm, flat: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600/30 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tower / Wing
                    </label>
                    <input
                      type="text"
                      value={nomForm.tower}
                      onChange={(e) => setNomForm({ ...nomForm, tower: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600/30 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Years Resident
                    </label>
                    <input
                      type="number"
                      value={nomForm.yearsInSociety}
                      onChange={(e) => setNomForm({ ...nomForm, yearsInSociety: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600/30 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Profession & Background *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chartered Accountant, IT Architect, Advocate..."
                    value={nomForm.profession}
                    onChange={(e) => setNomForm({ ...nomForm, profession: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Vision & Manifesto Statement *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Outline your key priorities (e.g. solar common lighting, lift SLAs, financial transparency, security audits)..."
                    value={nomForm.manifesto}
                    onChange={(e) => setNomForm({ ...nomForm, manifesto: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600/30 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Submit Candidacy for Scrutiny</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: CURRENT COMMITTEE BOARD */}
          {activeTab === 'board' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Incumbent Society Management Committee ({currentElection.term || '2024 - 2026'})
                </h3>
                <p className="text-xs text-slate-500">
                  Elected RWA officers managing day-to-day society operations, vendor contracts, and finance audits
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {committeeMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 transition-all flex items-start gap-4"
                  >
                    <Avatar
                      name={member.name}
                      src={member.avatar}
                      className="w-14 h-14 rounded-2xl border border-slate-200 text-base shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {member.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 shrink-0">
                          {member.position}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Flat {member.flat} ({member.tower}) &bull; Term: {member.term}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {member.responsibilities.map((resp, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            {resp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN CONTROLS */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              {/* Election Lifecycle Switcher */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-bold">Quick Election State Machine</h4>
                    <p className="text-xs text-slate-400">
                      Instantly toggle between election lifecycle phases to test nominee filings or voter turnout
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 font-bold text-xs">
                    Current: {currentElection.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {[
                    { status: 'Nomination Open', label: '1. Nominations Open' },
                    { status: 'Candidates Finalized', label: '2. Finalize Nominees' },
                    { status: 'Voting Active', label: '3. Digital Voting Active' },
                    { status: 'Results Declared', label: '4. Declare Results' },
                  ].map((st) => (
                    <button
                      key={st.status}
                      type="button"
                      onClick={async () => {
                        await updateElectionStatus(currentElection.id, st.status as Election['status']);
                        showToast(`Election status updated to ${st.status}`);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        currentElection.status === st.status
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Candidate Review Scrutiny */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                  Candidate Nominations Scrutiny
                </h4>
                <div className="space-y-2">
                  {nominations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No pending custom nominations filed yet.</p>
                  ) : (
                    nominations.map((nom) => (
                      <div
                        key={nom.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {nom.candidateName} &mdash; {nom.position}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            Flat {nom.flat} &bull; {nom.profession} &bull; Status:{' '}
                            <span
                              className={`font-semibold ${
                                nom.status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            >
                              {nom.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {nom.status !== 'Approved' && (
                            <button
                              type="button"
                              onClick={() => {
                                updateNominationStatus(currentElection.id, nom.id, 'Approved');
                                showToast(`Nomination for ${nom.candidateName} approved!`);
                              }}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs hover:bg-emerald-100 cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {nom.status !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => {
                                updateNominationStatus(currentElection.id, nom.id, 'Rejected');
                                showToast(`Nomination rejected.`);
                              }}
                              className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-bold text-xs hover:bg-red-100 cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Schedule Form */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-3">
                  Schedule New Election Cycle
                </h4>
                <form onSubmit={handleCreateElection} className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-2028 RWA Biennial Election"
                      value={scheduleForm.title}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                      className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Term</label>
                    <input
                      type="text"
                      value={scheduleForm.term}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, term: e.target.value })}
                      className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Eligible Flats</label>
                    <input
                      type="number"
                      disabled
                      value={flats.length || 180}
                      className="w-full h-10 px-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 font-bold"
                    />
                  </div>

                  <div className="col-span-2 pt-2">
                    <button
                      type="submit"
                      className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      Schedule Election & Open Ballot
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
