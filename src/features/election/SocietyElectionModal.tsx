import React, { useState } from 'react';
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
    castVote,
    submitNomination,
    updateNominationStatus,
    createElection,
    updateElectionStatus,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ballot' | 'nominate' | 'board' | 'admin'>(
    'ballot'
  );

  // Active election selection
  const [selectedElectionId, setSelectedElectionId] = useState<string>(
    elections[0]?.id || 'elec-2026'
  );

  const currentElection =
    elections.find((e) => e.id === selectedElectionId) || elections[0];

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
    term: '',
    description: '',
    nominationStart: '',
    nominationEnd: '',
    votingStart: '',
    votingEnd: '',
  });

  if (!isOpen || !currentElection) return null;

  // Filter nominations for current election and position
  const electionNominations = nominations.filter(
    (n) => n.electionId === currentElection.id
  );
  const positionCandidates = electionNominations.filter(
    (n) => n.position === selectedPosition && n.status === 'Approved'
  );

  // Check if current user/flat has already voted for this position
  const existingVoteForPosition = votes.find(
    (v) =>
      v.electionId === currentElection.id &&
      v.position === selectedPosition &&
      (v.voterFlat === resident.flat || v.voterId === resident.id)
  );

  const handleCastVote = (candidate: Nomination) => {
    if (existingVoteForPosition) {
      showToast('You have already cast your vote for this position.');
      return;
    }

    castVote({
      electionId: currentElection.id,
      position: selectedPosition,
      candidateId: candidate.id,
      voterId: resident.id,
      voterFlat: resident.flat,
    });

    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.7 },
    });

    showToast(`Vote cast successfully for ${candidate.candidateName} as ${selectedPosition}!`);
  };

  const handleNominationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomForm.manifesto.trim() || !nomForm.profession.trim()) {
      showToast('Please provide your profession and manifesto.');
      return;
    }

    submitNomination({
      electionId: currentElection.id,
      position: nomForm.position,
      candidateId: resident.id,
      candidateName: nomForm.candidateName,
      flat: nomForm.flat,
      tower: nomForm.tower,
      phone: resident.phone,
      email: resident.email,
      profession: nomForm.profession,
      yearsInSociety: Number(nomForm.yearsInSociety),
      manifesto: nomForm.manifesto,
    });

    showToast('Your candidate nomination has been submitted for scrutiny!');
    setActiveTab('ballot');
  };

  const handleCreateElection = (e: React.FormEvent) => {
    e.preventDefault();
    createElection({
      title: scheduleForm.title,
      term: scheduleForm.term,
      description: scheduleForm.description,
      positions: [
        'President',
        'General Secretary',
        'Treasurer',
        'Cultural Secretary',
        'Maintenance & Facilities Head',
        'Security Committee Head',
      ],
      nominationStart: scheduleForm.nominationStart,
      nominationEnd: scheduleForm.nominationEnd,
      votingStart: scheduleForm.votingStart,
      votingEnd: scheduleForm.votingEnd,
      status: 'Nomination Open',
      eligibleVotersCount: flats.length || 0,
    });

    showToast('New election scheduled successfully!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wider uppercase text-indigo-400">
              Democracy & Governance Portal
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Society Committee & Elections
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official RWA Management Committee nomination, digital ballot voting, and elected board
              </p>
            </div>

            {/* Turnout badge */}
            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <span className="text-xs font-bold text-emerald-400">{currentElection.status}</span>
              </div>
              <div className="w-px h-7 bg-slate-700" />
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Turnout</span>
                <span className="text-xs font-bold text-white">
                  {Math.round((currentElection.totalVotesCast / (currentElection.eligibleVotersCount || 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('ballot')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'ballot'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <VoteIcon className="w-4 h-4" />
            <span>Digital Ballot & Voting</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nominate')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'nominate'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>File Nomination</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'board'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Elected Committee Board</span>
          </button>

          {(role === 'admin' || role === 'committee') && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'admin'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin & Scheduling</span>
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: BALLOT & VOTING */}
          {activeTab === 'ballot' && (
            <div className="space-y-6">
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
                        (v.voterFlat === resident.flat || v.voterId === resident.id)
                    );
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setSelectedPosition(pos)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
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
                    <span>Ballot Cast</span>
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold text-[11px]">
                    1 Vote Available
                  </span>
                )}
              </div>

              {/* Candidates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positionCandidates.length === 0 ? (
                  <div className="col-span-2 p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">No Approved Candidates Yet</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Be the first to file a nomination for {selectedPosition}!
                    </p>
                    <button
                      onClick={() => {
                        setNomForm((prev) => ({ ...prev, position: selectedPosition }));
                        setActiveTab('nominate');
                      }}
                      className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                    >
                      Nominate for this Position
                    </button>
                  </div>
                ) : (
                  positionCandidates.map((cand) => {
                    const isVoted = existingVoteForPosition?.candidateId === cand.id;
                    const totalVotesForPos = positionCandidates.reduce(
                      (acc, c) => acc + (c.voteCount || 0),
                      0
                    );
                    const voteShare = totalVotesForPos > 0
                      ? Math.round(((cand.voteCount || 0) / totalVotesForPos) * 100)
                      : 0;

                    return (
                      <div
                        key={cand.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isVoted
                            ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                      <div className="flex items-start gap-3">
                        <Avatar
                          name={cand.candidateName}
                          src={cand.avatar}
                          className="w-12 h-12 rounded-xl border border-slate-200 text-sm"
                        />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {cand.candidateName}
                              </h4>
                              {isVoted && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                  Your Choice
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

                        {/* Manifesto block */}
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic border border-slate-100">
                          &ldquo;{cand.manifesto}&rdquo;
                        </div>

                        {/* Votes breakdown */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
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

                          <button
                            type="button"
                            disabled={Boolean(existingVoteForPosition) || currentElection.status !== 'Voting Active'}
                            onClick={() => handleCastVote(cand)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              isVoted
                                ? 'bg-emerald-600 text-white cursor-default'
                                : existingVoteForPosition
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-xs'
                            }`}
                          >
                            {isVoted ? 'Voted' : existingVoteForPosition ? 'Locked' : 'Cast Vote'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NOMINATE */}
          {activeTab === 'nominate' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-900">
                <h4 className="font-bold text-sm mb-1">File Candidacy for RWA Committee</h4>
                <p>
                  Any flat owner residing in {currentSociety?.name || 'the society'} for at least 1 year with zero outstanding maintenance arrears is eligible to nominate for executive posts.
                </p>
              </div>

              <form onSubmit={handleNominationSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Position *
                  </label>
                  <select
                    value={nomForm.position}
                    onChange={(e) => setNomForm({ ...nomForm, position: e.target.value as ElectionPosition })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    {currentElection.positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Candidate Name
                    </label>
                    <input
                      type="text"
                      required
                      value={nomForm.candidateName}
                      onChange={(e) => setNomForm({ ...nomForm, candidateName: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Flat & Tower
                    </label>
                    <input
                      type="text"
                      required
                      value={`${nomForm.flat} (${nomForm.tower})`}
                      disabled
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs bg-slate-100 text-slate-600 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Profession / Background *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Software Architect"
                      value={nomForm.profession}
                      onChange={(e) => setNomForm({ ...nomForm, profession: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Years Living in Society
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={nomForm.yearsInSociety}
                      onChange={(e) => setNomForm({ ...nomForm, yearsInSociety: Number(e.target.value) })}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900"
                    />
                  </div>
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
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Submit Nomination for RWA Committee</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: CURRENT COMMITTEE BOARD */}
          {activeTab === 'board' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Incumbent Society Management Committee (2024 - 2026)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Elected RWA officers managing day-to-day operations, vendor approvals, and society accounts
                  </p>
                </div>
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

          {/* TAB 4: ADMIN SCHEDULING */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold">Election Control & Instance Manager</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Schedule biennial cycles, approve candidate filings, and declare verified results
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateElectionStatus(currentElection.id, 'Voting Active')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Set Voting Active
                  </button>
                  <button
                    onClick={() => updateElectionStatus(currentElection.id, 'Completed')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    Declare Results
                  </button>
                </div>
              </div>

              {/* Pending Candidate Nominations Scrutiny */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                  Candidate Nominations Scrutiny & Approvals
                </h4>
                <div className="space-y-2">
                  {nominations.map((nom) => (
                    <div
                      key={nom.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {nom.candidateName} &mdash; {nom.position}
                        </div>
                        <div className="text-slate-500 text-[11px]">
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
                            onClick={() => updateNominationStatus(nom.id, 'Approved')}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] hover:bg-emerald-100"
                          >
                            Approve
                          </button>
                        )}
                        {nom.status !== 'Rejected' && (
                          <button
                            onClick={() => updateNominationStatus(nom.id, 'Rejected')}
                            className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg font-bold text-[11px] hover:bg-red-100"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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
                      value={scheduleForm.title}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                      className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Term (e.g. 2026-2028)</label>
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
                      value={flats.length || 0}
                      className="w-full h-10 px-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Nomination Window</label>
                    <input
                      type="date"
                      value={scheduleForm.nominationStart}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, nominationStart: e.target.value })}
                      className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Voting Window</label>
                    <input
                      type="date"
                      value={scheduleForm.votingStart}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, votingStart: e.target.value })}
                      className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200"
                    />
                  </div>

                  <div className="col-span-2 pt-2">
                    <button
                      type="submit"
                      className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                    >
                      Schedule Election & Notify Residents
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
