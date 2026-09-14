import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Facility } from '../../types';
import { Building2, Plus, Pencil, Archive, Clock, X, ChevronDown } from 'lucide-react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SLOT_DURATION_OPTIONS: { label: string; value: 30 | 60 | 90 | 120 }[] = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];

function generateTimeSlots(openTime: string, closeTime: string, durationMin: number): string[] {
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  const startMin = oh * 60 + om;
  const endMin = ch * 60 + cm;
  const slots: string[] = [];
  for (let t = startMin; t + durationMin <= endMin; t += durationMin) {
    const fromH = Math.floor(t / 60);
    const fromM = t % 60;
    const toT = t + durationMin;
    const toH = Math.floor(toT / 60);
    const toM = toT % 60;
    const fmt = (h: number, m: number) =>
      `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    slots.push(`${fmt(fromH, fromM)}-${fmt(toH, toM)}`);
  }
  return slots;
}

interface FacilityModalProps {
  facility: Facility | null;
  onClose: () => void;
  onSave: (data: Omit<Facility, 'id' | 'societyId'> | Partial<Facility>) => void;
}

const FacilityModal: React.FC<FacilityModalProps> = ({ facility, onClose, onSave }) => {
  const [name, setName] = useState(facility?.name || '');
  const [description, setDescription] = useState(facility?.description || '');
  const [capacity, setCapacity] = useState(facility?.capacity ?? 10);
  const [pricePerHour, setPricePerHour] = useState(facility?.pricePerHour ?? 0);
  const [availableDays, setAvailableDays] = useState<string[]>(facility?.availableDays || [...ALL_DAYS]);
  const [operatingHoursOpen, setOperatingHoursOpen] = useState(facility?.operatingHoursOpen || '06:00');
  const [operatingHoursClose, setOperatingHoursClose] = useState(facility?.operatingHoursClose || '22:00');
  const [slotDuration, setSlotDuration] = useState<30 | 60 | 90 | 120>(facility?.slotDuration ?? 60);
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState(facility?.maxBookingsPerDay ?? 50);
  const [approvalRequired, setApprovalRequired] = useState(facility?.approvalRequired ?? false);
  const [status, setStatus] = useState<Facility['status']>(facility?.status || 'active');

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const previewSlots = useMemo(
    () => generateTimeSlots(operatingHoursOpen, operatingHoursClose, slotDuration),
    [operatingHoursOpen, operatingHoursClose, slotDuration]
  );

  const handleSave = () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      description: description.trim(),
      capacity,
      pricePerHour,
      availableDays,
      timings: `${operatingHoursOpen} - ${operatingHoursClose}`,
      icon: facility?.icon || '🏟️',
      slotDuration,
      maxBookingsPerDay,
      approvalRequired,
      status,
      operatingHoursOpen,
      operatingHoursClose,
      slots: previewSlots.map((t) => ({ time: t, status: 'Available' as const })),
    };
    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {facility ? 'Edit Facility' : 'Add Facility'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="e.g. Clubhouse"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
              placeholder="Brief description of the facility"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Price per hour (₹)</label>
              <input
                type="number"
                min={0}
                value={pricePerHour}
                onChange={(e) => setPricePerHour(parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Operating Days</label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    availableDays.includes(day)
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Open Time</label>
              <input
                type="time"
                value={operatingHoursOpen}
                onChange={(e) => setOperatingHoursOpen(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Close Time</label>
              <input
                type="time"
                value={operatingHoursClose}
                onChange={(e) => setOperatingHoursClose(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Slot Duration</label>
            <div className="relative">
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value) as 30 | 60 | 90 | 120)}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {SLOT_DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Max Bookings per Day</label>
            <input
              type="number"
              min={1}
              value={maxBookingsPerDay}
              onChange={(e) => setMaxBookingsPerDay(parseInt(e.target.value) || 1)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Approval Required</span>
            <button
              type="button"
              onClick={() => setApprovalRequired(!approvalRequired)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                approvalRequired ? 'bg-teal-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  approvalRequired ? 'left-5.5 translate-x-0' : 'left-0.5'
                }`}
                style={{ left: approvalRequired ? '22px' : '2px' }}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Facility['status'])}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="archived">Closed</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {previewSlots.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Preview — {previewSlots.length} slots generated
              </label>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {previewSlots.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="h-10 px-6 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 disabled:opacity-40"
          >
            {facility ? 'Save Changes' : 'Add Facility'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminFacilities: React.FC = () => {
  const { facilities, currentSociety, showToast, createFacility, updateFacility, archiveFacility } = useApp();

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<Facility | null>(null);

  const activeFacility = selectedFacility || facilities[0];

  if (currentSociety?.features?.facilityBooking === false) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
        <Building2 className="w-14 h-14 text-slate-200 mx-auto mb-4" />
        <h2 className="text-lg font-extrabold text-slate-900">Facility booking is not enabled</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This society was provisioned without the facility module. A Society Admin can enable it from Society Settings.
        </p>
      </div>
    );
  }

  const activeFacilities = facilities.filter((f) => f.status !== 'archived');

  if (activeFacilities.length === 0 && facilities.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
        <Building2 className="w-14 h-14 text-slate-200 mx-auto mb-4" />
        <h2 className="text-lg font-extrabold text-slate-900">No facilities configured yet</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          Add amenities (clubhouse, courts, halls) to enable bookings.
        </p>
        <button
          onClick={() => { setEditingFacility(null); setModalOpen(true); }}
          className="h-10 px-5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add First Facility
        </button>
      </div>
    );
  }

  const handleSaveNew = async (data: Omit<Facility, 'id' | 'societyId'>) => {
    await createFacility(data);
  };

  const handleSaveEdit = async (data: Partial<Facility>) => {
    if (editingFacility) {
      await updateFacility(editingFacility.id, data);
    }
  };

  const handleArchive = async () => {
    if (archiveConfirm) {
      await archiveFacility(archiveConfirm.id);
      if (activeFacility?.id === archiveConfirm.id) {
        setSelectedFacility(null);
      }
      setArchiveConfirm(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Society Amenities & Facility Bookings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage facilities, configure schedules, and handle bookings
          </p>
        </div>

        <button
          onClick={() => { setEditingFacility(null); setModalOpen(true); }}
          className="h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Facility
        </button>
      </div>

      {/* Facilities Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeFacilities.map((fac) => {
          const isSelected = activeFacility?.id === fac.id;
          return (
            <div
              key={fac.id}
              onClick={() => setSelectedFacility(fac)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-teal-50/50 border-teal-700 ring-2 ring-teal-700 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-base text-slate-900">{fac.name}</div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  fac.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
                  fac.status === 'archived' ? 'bg-red-100 text-red-800' :
                  'bg-teal-100 text-teal-800'
                }`}>
                  {fac.status === 'maintenance' ? 'Maintenance' :
                   fac.status === 'archived' ? 'Closed' :
                   fac.pricePerHour === 0 ? 'Free' : `₹${fac.pricePerHour}/hr`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{fac.description}</p>
              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span>Capacity: {fac.capacity}</span>
                <span className="font-bold text-teal-700">
                  {(fac.slots || []).filter((s) => s.status === 'Available').length} slots free
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFacility(fac);
                    setModalOpen(true);
                  }}
                  className="flex-1 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setArchiveConfirm(fac);
                  }}
                  className="flex-1 h-8 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Archive className="w-3 h-3" /> Archive
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slots Schedule for Selected Facility */}
      {activeFacility && activeFacility.status !== 'archived' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-slate-900">
              {activeFacility.name} — Schedule & Slots
            </h3>
            <p className="text-xs text-slate-500">
              {activeFacility.timings || `${activeFacility.operatingHoursOpen || '06:00'} - ${activeFacility.operatingHoursClose || '22:00'}`}
              {activeFacility.slotDuration ? ` · ${activeFacility.slotDuration}min slots` : ' · 1hr slots'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(activeFacility.slots || []).length === 0 ? (
              <p className="text-xs text-slate-400 col-span-full text-center py-4">
                No slots defined for {activeFacility.name} yet.
              </p>
            ) : (
              (activeFacility.slots || []).map((slot) => {
                const isBooked = slot.status === 'Booked';
                return (
                  <div
                    key={slot.time}
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      isBooked ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{slot.time}</span>
                      </div>
                      {slot.bookedBy ? (
                        <div className="text-xs text-slate-600 mt-1">
                          Booked by: <span className="font-semibold text-slate-900">Flat {slot.bookedBy}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-700 font-semibold mt-1">
                          Available for booking
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isBooked
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {slot.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Archive Confirmation */}
      {archiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setArchiveConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900">Archive Facility?</h3>
            <p className="text-sm text-slate-600">
              <span className="font-semibold">{archiveConfirm.name}</span> will be hidden from residents and bookings will no longer be possible. You can re-activate it later.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setArchiveConfirm(null)}
                className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className="h-10 px-4 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Facility Modal */}
      {modalOpen && (
        <FacilityModal
          facility={editingFacility}
          onClose={() => { setModalOpen(false); setEditingFacility(null); }}
          onSave={editingFacility ? handleSaveEdit : handleSaveNew}
        />
      )}
    </div>
  );
};
