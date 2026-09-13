import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FlatType } from '../../types';
import {
  Building2,
  LayoutGrid,
  Sparkles,
  ClipboardCheck,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const STEPS = ['Towers', 'Flats', 'Facilities', 'Review & Activate'] as const;

export const SocietyOnboarding: React.FC = () => {
  const {
    currentSociety,
    towers,
    flats,
    facilities,
    createTower,
    createFlat,
    createFacility,
    updateSocietyStatus,
    showToast,
  } = useApp();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tower form
  const [towerName, setTowerName] = useState('');
  const [towerCode, setTowerCode] = useState('');
  const [towerFloors, setTowerFloors] = useState('10');

  // Flat bulk form
  const [flatTowerId, setFlatTowerId] = useState('');
  const [flatPrefix, setFlatPrefix] = useState('');
  const [flatFloors, setFlatFloors] = useState('');
  const [flatUnitsPerFloor, setFlatUnitsPerFloor] = useState('4');
  const [flatType, setFlatType] = useState<FlatType>('2BHK');

  // Facility form
  const [facName, setFacName] = useState('');
  const [facCapacity, setFacCapacity] = useState('20');
  const [facPrice, setFacPrice] = useState('0');

  const facilityEnabled = currentSociety?.features?.facilityBooking !== false;

  const visibleSteps = facilityEnabled ? STEPS : (['Towers', 'Flats', 'Review & Activate'] as const);

  const handleAddTower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!towerName.trim() || !towerCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createTower({
        name: towerName.trim(),
        code: towerCode.trim().toUpperCase(),
        floors: Math.max(1, parseInt(towerFloors, 10) || 1),
        totalFlats: 0,
        status: 'active',
      });
      setTowerName('');
      setTowerCode('');
      showToast('Tower added.');
    } catch (err: any) {
      setError(err.message || 'Failed to add tower.');
    } finally {
      setBusy(false);
    }
  };

  const handleBulkFlats = async (e: React.FormEvent) => {
    e.preventDefault();
    const tower = towers.find((t) => t.id === flatTowerId);
    if (!tower) {
      setError('Select a tower first.');
      return;
    }
    const floors = flatFloors
      .split(',')
      .map((f) => parseInt(f.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
    const perFloor = Math.max(1, parseInt(flatUnitsPerFloor, 10) || 1);
    if (floors.length === 0) {
      setError('Enter at least one floor number (e.g. 1,2,3).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let created = 0;
      for (const floor of floors) {
        for (let u = 1; u <= perFloor; u++) {
          const unit = String(u).padStart(2, '0');
          const number = `${flatPrefix || tower.code}-${floor}${unit}`;
          await createFlat({
            number,
            towerId: tower.id,
            towerName: tower.name,
            floor,
            type: flatType,
            status: 'vacant',
            ownerIds: [],
            tenantIds: [],
          });
          created += 1;
        }
      }
      showToast(`${created} flats created in ${tower.name}.`);
      setFlatFloors('');
    } catch (err: any) {
      setError(err.message || 'Failed to create flats.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createFacility({
        name: facName.trim(),
        description: '',
        capacity: Math.max(1, parseInt(facCapacity, 10) || 1),
        pricePerHour: Math.max(0, parseInt(facPrice, 10) || 0),
        timings: '06:00 AM - 10:00 PM',
        icon: 'Building2',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        slots: [],
      } as any);
      setFacName('');
      showToast('Facility added.');
    } catch (err: any) {
      setError(err.message || 'Failed to add facility.');
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = async () => {
    if (!currentSociety) return;
    if (towers.length === 0) {
      setError('Add at least one tower before activating.');
      return;
    }
    if (flats.length === 0) {
      setError('Add at least one flat before activating.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateSocietyStatus(currentSociety.id, 'active');
      showToast(`${currentSociety.name} is now active.`);
    } catch (err: any) {
      setError(err.message || 'Failed to activate society.');
    } finally {
      setBusy(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, visibleSteps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  if (!currentSociety) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100 p-8">
        <p className="text-sm text-slate-500">Select a society to begin onboarding.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-100 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Society onboarding
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome to {currentSociety.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Let's set up your society. Complete each step with real data.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {visibleSteps.map((label, i) => (
            <React.Fragment key={label}>
              <button
                onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  i === step
                    ? 'bg-indigo-600 text-white'
                    : i < step
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                {i === 0 ? <Building2 className="w-3.5 h-3.5" /> : null}
                {i === 1 ? <LayoutGrid className="w-3.5 h-3.5" /> : null}
                {i === 2 && facilityEnabled ? <Sparkles className="w-3.5 h-3.5" /> : null}
                {(i === 2 && !facilityEnabled) || i === 3 ? <ClipboardCheck className="w-3.5 h-3.5" /> : null}
                <span>{label}</span>
              </button>
              {i < visibleSteps.length - 1 && <div className="flex-1 h-px bg-slate-300" />}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP: Towers */}
        {visibleSteps[step] === 'Towers' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Step 1 — Towers</h2>
            {towers.length > 0 ? (
              <ul className="divide-y divide-slate-100 text-sm">
                {towers.map((t) => (
                  <li key={t.id} className="py-2 flex justify-between">
                    <span className="font-semibold text-slate-800">{t.name} <span className="text-slate-400 font-mono text-xs">({t.code})</span></span>
                    <span className="text-xs text-slate-500">{t.floors} floors</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No towers yet. Add your first tower below.</p>
            )}
            <form onSubmit={handleAddTower} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input value={towerName} onChange={(e) => setTowerName(e.target.value)} placeholder="Tower A" className="h-10 px-3 rounded-xl border border-slate-200 text-sm" />
              <input value={towerCode} onChange={(e) => setTowerCode(e.target.value)} placeholder="Code (A)" className="h-10 px-3 rounded-xl border border-slate-200 text-sm" />
              <input value={towerFloors} onChange={(e) => setTowerFloors(e.target.value)} placeholder="Floors" inputMode="numeric" className="h-10 px-3 rounded-xl border border-slate-200 text-sm" />
              <button disabled={busy} className="h-10 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>
            <div className="flex justify-end">
              <button onClick={next} disabled={towers.length === 0} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP: Flats */}
        {visibleSteps[step] === 'Flats' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Step 2 — Flats</h2>
            <p className="text-xs text-slate-500">
              {flats.length} flat(s) configured. Flats start as <strong>vacant</strong> until members are assigned.
            </p>
            <form onSubmit={handleBulkFlats} className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select value={flatTowerId} onChange={(e) => setFlatTowerId(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white">
                  <option value="">Select tower…</option>
                  {towers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <select value={flatType} onChange={(e) => setFlatType(e.target.value as FlatType)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white">
                  {(['1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Studio'] as FlatType[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input value={flatPrefix} onChange={(e) => setFlatPrefix(e.target.value)} placeholder="Prefix (default: tower code)" className="h-10 px-3 rounded-xl border border-slate-200 text-sm" />
                <input value={flatFloors} onChange={(e) => setFlatFloors(e.target.value)} placeholder="Floors: 1,2,3" className="h-10 px-3 rounded-xl border border-slate-200 text-sm" />
                <input value={flatUnitsPerFloor} onChange={(e) => setFlatUnitsPerFloor(e.target.value)} placeholder="Units/floor" inputMode="numeric" className="h-10 px-3 rounded-xl border border-slate-200 text-sm" />
              </div>
              <button disabled={busy} className="w-full h-10 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Create flats
              </button>
            </form>
            <div className="flex justify-between">
              <button onClick={back} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button onClick={next} disabled={flats.length === 0} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP: Facilities */}
        {visibleSteps[step] === 'Facilities' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Step 3 — Facilities</h2>
            {facilities.length > 0 ? (
              <ul className="divide-y divide-slate-100 text-sm">
                {facilities.map((f) => (
                  <li key={f.id} className="py-2 flex justify-between">
                    <span className="font-semibold text-slate-800">{f.name}</span>
                    <span className="text-xs text-slate-500">₹{f.pricePerHour}/hr • {f.capacity} capacity</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No facilities yet. Add amenities residents can book (or skip — you can add them later).</p>
            )}
            <form onSubmit={handleAddFacility} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input value={facName} onChange={(e) => setFacName(e.target.value)} placeholder="Clubhouse" className="h-10 px-3 rounded-xl border border-slate-200 text-sm sm:col-span-2" />
              <input value={facCapacity} onChange={(e) => setFacCapacity(e.target.value)} placeholder="Capacity" inputMode="numeric" className="h-10 px-3 rounded-xl border border-slate-200 text-sm" />
              <input value={facPrice} onChange={(e) => setFacPrice(e.target.value)} placeholder="₹/hour" inputMode="numeric" className="h-10 px-3 rounded-xl border border-slate-200 text-sm" />
              <button disabled={busy} className="h-10 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50 sm:col-span-4 flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add facility
              </button>
            </form>
            <div className="flex justify-between">
              <button onClick={back} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button onClick={next} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP: Review & Activate */}
        {visibleSteps[step] === 'Review & Activate' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Step {visibleSteps.length} — Review & Activate</h2>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${towers.length > 0 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>{towers.length} tower(s) configured</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${flats.length > 0 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>{flats.length} flat(s) configured</span>
              </li>
              {facilityEnabled && (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{facilities.length} facilitie(s) configured (optional)</span>
                </li>
              )}
            </ul>
            <p className="text-xs text-slate-500">
              Activating makes the society operational. Next: invite members (residents, security,
              committee) from the admin dashboard.
            </p>
            <div className="flex justify-between">
              <button onClick={back} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={handleActivate}
                disabled={busy || towers.length === 0 || flats.length === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40 transition-colors"
              >
                {busy ? 'Activating…' : 'Activate Society'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
