import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { Visitor, VisitorType } from '../../types';
import { NestWellLogo } from '../../components/branding/NestWellLogo';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Shield,
  Search,
  QrCode,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Phone,
  User,
  Building,
  Camera,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export const SecurityApp: React.FC = () => {
  const {
    visitors,
    securityCheckIn,
    securityCheckOut,
    inviteVisitor,
    approveVisitor,
    currentSociety,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inside' | 'all'>('active');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);

  // Walk-in form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInFlat, setWalkInFlat] = useState('');
  const [walkInType, setWalkInType] = useState<VisitorType>('Delivery');
  const [walkInPurpose, setWalkInPurpose] = useState('Delivery Package');
  const [walkInCompany, setWalkInCompany] = useState('');

  // Scanner state
  const [scannedCode, setScannedCode] = useState('');
  const [scanResult, setScanResult] = useState<Visitor | null>(null);
  const [scannerError, setScannerError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner-region';

  // Filter visitors
  const filteredVisitors = visitors.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.flat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.passNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery);

    if (!matchSearch) return false;
    if (activeTab === 'active') return v.status === 'expected' || v.status === 'waiting';
    if (activeTab === 'inside') return v.status === 'inside';
    return true;
  });

  const handleScanSuccess = useCallback((decodedText: string) => {
    const found = visitors.find((v) => v.passNumber === decodedText || v.qrCode === decodedText);
    if (found) {
      setScanResult(found);
      setScannerError('');
      stopScanner();
    } else {
      setScannerError('Pass not found. Please register as walk-in.');
    }
  }, [visitors, showToast]);

  const startScanner = useCallback(async () => {
    setScannerError('');
    setScanResult(null);
    setIsCameraActive(true);

    await new Promise((r) => setTimeout(r, 100));

    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => handleScanSuccess(decodedText),
        () => {}
      );
    } catch (err) {
      console.error('Scanner start error:', err);
      setScannerError('Camera access denied or not available. Use manual entry below.');
      setIsCameraActive(false);
    }
  }, [handleScanSuccess]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {}
      }
    };
  }, []);

  const handleManualLookup = (code: string) => {
    handleScanSuccess(code);
  };

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInFlat) return;

    inviteVisitor({
      name: walkInName,
      phone: walkInPhone,
      type: walkInType,
      purpose: walkInPurpose,
      expectedDate: 'Today',
      expectedTime: 'Now',
      company: walkInCompany || undefined,
    });

    setIsWalkInOpen(false);
    setWalkInName('');
    setWalkInPhone('');
    setWalkInFlat('');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-20 antialiased">
      {/* High-Contrast Guard Console Header */}
      <header className="bg-slate-900 text-white p-4 sticky top-10 z-30 shadow-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NestWellLogo variant="icon" className="w-10 h-10 rounded-xl bg-white p-1.5 shadow-xs shrink-0" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">{currentSociety?.gates?.[0]?.name || 'Security Gate'}</h1>
              <p className="text-xs text-slate-400">On-Duty Guard &bull; Powered by NestWell</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gate Online</span>
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Large Touch Actions: Scanner & Walk-in */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="open-scanner-btn"
            onClick={() => {
              setScanResult(null);
              setIsScannerOpen(true);
            }}
            className="h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-sm p-3 flex items-center gap-3 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <QrCode className="w-7 h-7 text-indigo-100" />
            </div>
            <div className="text-left">
              <div className="text-base font-extrabold">Scan Pass QR</div>
              <div className="text-xs text-indigo-200">Camera / Barcode</div>
            </div>
          </button>

          <button
            id="open-walkin-btn"
            onClick={() => setIsWalkInOpen(true)}
            className="h-20 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl shadow-sm p-3 flex items-center gap-3 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-7 h-7" />
            </div>
            <div className="text-left">
              <div className="text-base font-extrabold">New Walk-In</div>
              <div className="text-xs text-slate-500">Unregistered Guest</div>
            </div>
          </button>
        </div>

        {/* Quick Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="guard-search"
            type="text"
            placeholder="Search by Flat, Name, or Pass No (e.g. B-402, Rahul)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex gap-2">
          {[
            { id: 'active', label: 'Expected & Waiting' },
            { id: 'inside', label: 'Currently Inside' },
            { id: 'all', label: 'All Gate Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 h-11 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Visitor Cards List */}
        <div className="space-y-3">
          {filteredVisitors.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Shield className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">
                {searchQuery ? 'No matching entries found' : 'No visitors yet'}
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'No visitor passes match your search. Try a different query or register a walk-in.'
                  : 'No visitors have been registered. Use the scanner or register a walk-in visitor above.'}
              </p>
            </div>
          ) : (
            filteredVisitors.map((vis) => {
              const isWaiting = vis.status === 'waiting';
              const isExpected = vis.status === 'expected';
              const isInside = vis.status === 'inside';

              return (
                <div
                  key={vis.id}
                  className={`p-4 rounded-2xl bg-white border shadow-sm transition-all space-y-3 ${
                    isWaiting
                      ? 'border-orange-300 bg-orange-50/40'
                      : isInside
                      ? 'border-emerald-300'
                      : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base">
                        {vis.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{vis.name}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {vis.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {vis.company ? `${vis.company} • ` : ''}
                          {vis.purpose} • <span className="font-mono">{vis.phone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                        Flat {vis.flat}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                        #{vis.passNumber}
                      </span>
                    </div>
                  </div>

                  {/* Actions according to gate state */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        {isInside
                          ? `Entered: ${vis.entryTime || '10:30 AM'}`
                          : vis.status === 'exited'
                          ? `Exited: ${vis.exitTime || '11:15 AM'}`
                          : `Scheduled: ${vis.expectedTime}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Check In Button (For expected or waiting) */}
                      {(isExpected || isWaiting) && (
                        <button
                          onClick={() => securityCheckIn(vis.id)}
                          className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-colors"
                        >
                          <ArrowDownLeft className="w-4 h-4" />
                          <span>Check In (Barrier Open)</span>
                        </button>
                      )}

                      {/* Check Out Button (When inside) */}
                      {isInside && (
                        <button
                          onClick={() => securityCheckOut(vis.id)}
                          className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-colors"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                          <span>Check Out (Exit Gate)</span>
                        </button>
                      )}

                      {vis.status === 'exited' && (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                          Exited ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Camera Barcode/QR Scanner Modal */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => {
          stopScanner();
          setIsScannerOpen(false);
        }}
        title={`${currentSociety?.gates?.[0]?.name || 'Security Gate'} Camera Scanner`}
        subtitle="Point tablet camera at visitor QR pass"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          {!scanResult ? (
            <div>
              {/* Real Camera Viewfinder */}
              <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border-4 border-slate-700" style={{ minHeight: '280px' }}>
                <div id={scannerContainerId} className="w-full" style={{ minHeight: '280px' }} />
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Camera className="w-12 h-12 text-slate-500 mb-2" />
                    <span className="text-xs font-mono text-indigo-300 z-10 bg-slate-900/80 px-3 py-1 rounded">
                      TAP TO START CAMERA
                    </span>
                  </div>
                )}
              </div>

              {!isCameraActive && (
                <button
                  onClick={startScanner}
                  className="mt-3 h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera Scanner</span>
                </button>
              )}

              {isCameraActive && (
                <button
                  onClick={stopScanner}
                  className="mt-3 h-10 px-4 rounded-xl bg-red-100 text-red-700 font-bold text-xs hover:bg-red-200 transition-colors"
                >
                  Stop Camera
                </button>
              )}

              {scannerError && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                  {scannerError}
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">
                  Or manually enter a pass code:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter pass number..."
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && scannedCode.trim()) {
                        handleManualLookup(scannedCode.trim());
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (scannedCode.trim()) handleManualLookup(scannedCode.trim());
                    }}
                    disabled={!scannedCode.trim()}
                    className="h-10 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  >
                    Lookup
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Scanned Pass Result */
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Valid Society Pass Verified
                </span>
                <h4 className="text-xl font-bold text-slate-900 mt-0.5">{scanResult.name}</h4>
                <p className="text-sm font-semibold text-indigo-700">
                  Authorized for Flat {scanResult.flat}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pass Code</span>
                  <span className="font-mono font-bold text-slate-800">{scanResult.passNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Purpose</span>
                  <span className="font-bold text-slate-800">{scanResult.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Visitor Mobile</span>
                  <span className="font-mono text-slate-800">{scanResult.phone}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  securityCheckIn(scanResult.id);
                  setIsScannerOpen(false);
                }}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowDownLeft className="w-5 h-5" />
                <span>Allow Entry (Open Gate Boom)</span>
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* New Walk-in Registration Modal */}
      <Modal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        title="Walk-in Visitor Registration"
        subtitle={`${currentSociety?.gates?.[0]?.name || 'Security Gate'} Entry Log`}
        maxWidth="sm"
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Destination Flat *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. B-402, A-101"
              value={walkInFlat}
              onChange={(e) => setWalkInFlat(e.target.value.toUpperCase())}
              className="w-full h-12 px-4 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Visitor Name *
            </label>
            <input
              type="text"
              required
              placeholder="Full name"
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Mobile Phone
            </label>
            <input
              type="tel"
              placeholder="+91 98000 00000"
              value={walkInPhone}
              onChange={(e) => setWalkInPhone(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Type
              </label>
              <select
                value={walkInType}
                onChange={(e) => setWalkInType(e.target.value as any)}
                className="w-full h-12 px-3 rounded-xl border border-slate-300 text-slate-900"
              >
                <option value="Delivery">Delivery</option>
                <option value="Guest">Guest</option>
                <option value="Service">Service</option>
                <option value="Cab">Cab</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Company / Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy, Uber"
                value={walkInCompany}
                onChange={(e) => setWalkInCompany(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl mt-2 shadow-sm transition-colors"
          >
            Notify Resident & Log Entry
          </button>
        </form>
      </Modal>
    </div>
  );
};
