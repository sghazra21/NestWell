import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { Facility } from '../../types';
import {
  Building2,
  Dumbbell,
  Trophy,
  Users,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';

interface BookFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookFacilityModal: React.FC<BookFacilityModalProps> = ({ isOpen, onClose }) => {
  const { facilities, bookFacilitySlot, resident } = useApp();

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedDay, setSelectedDay] = useState<'Saturday' | 'Sunday' | 'Next Monday'>('Saturday');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState<{
    facilityName: string;
    day: string;
    slot: string;
    bookingCode: string;
  } | null>(null);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Building2':
        return <Building2 className="w-6 h-6 text-indigo-600" />;
      case 'Dumbbell':
        return <Dumbbell className="w-6 h-6 text-blue-600" />;
      case 'Trophy':
        return <Trophy className="w-6 h-6 text-amber-600" />;
      default:
        return <Users className="w-6 h-6 text-indigo-600" />;
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedFacility || !selectedSlot) return;

    bookFacilitySlot(selectedFacility.id, selectedSlot, selectedDay);
    setBookingConfirmed({
      facilityName: selectedFacility.name,
      day: selectedDay,
      slot: selectedSlot,
      bookingCode: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
    });
  };

  const handleReset = () => {
    setSelectedFacility(null);
    setSelectedSlot(null);
    setBookingConfirmed(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={bookingConfirmed ? 'Booking Confirmed' : selectedFacility ? selectedFacility.name : 'Book Society Facility'}
      subtitle={
        bookingConfirmed
          ? 'Pass code sent to your phone'
          : selectedFacility
          ? 'Select preferred day and slot'
          : 'Community spaces for residents and families'
      }
      maxWidth="sm"
    >
      {!selectedFacility ? (
        /* 1. Facility Cards list */
        <div className="space-y-3">
          {facilities.map((fac) => (
            <div
              key={fac.id}
              onClick={() => setSelectedFacility(fac)}
              className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-600 bg-white hover:bg-indigo-50/20 cursor-pointer transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                  {getIcon(fac.icon)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{fac.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>Capacity: {fac.capacity} people</span>
                    <span>•</span>
                    <span className="font-semibold text-indigo-600">
                      {fac.pricePerHour === 0 ? 'Free for residents' : `₹${fac.pricePerHour}/hr`}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
          ))}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Facility rules: Sound restrictions apply post 10:00 PM as per RWA guidelines.</span>
          </div>
        </div>
      ) : !bookingConfirmed ? (
        /* 2. Slot Selection & Simple Calendar */
        <div className="space-y-5">
          {/* Day selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Day
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Saturday', 'Sunday', 'Next Monday'] as const).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day);
                    setSelectedSlot(null);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    selectedDay === day
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Slots List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Available Slots for {selectedDay}
              </label>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 1-hour slots
              </span>
            </div>

            <div className="space-y-2">
              {selectedFacility.slots.map((slot) => {
                const isBooked = slot.status === 'Booked';
                const isSelected = selectedSlot === slot.time;

                return (
                  <div
                    key={slot.time}
                    onClick={() => {
                      if (!isBooked) setSelectedSlot(slot.time);
                    }}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      isBooked
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600 cursor-pointer shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock
                        className={`w-4 h-4 ${
                          isSelected ? 'text-indigo-600' : isBooked ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      />
                      <span
                        className={`text-sm font-bold ${
                          isSelected ? 'text-indigo-900' : isBooked ? 'text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {slot.time}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isBooked
                          ? 'bg-slate-200 text-slate-600'
                          : isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing & Booking CTA */}
          <div className="pt-2">
            <button
              id="confirm-booking-btn"
              disabled={!selectedSlot}
              onClick={handleConfirmBooking}
              className="w-full h-13 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <CalendarIcon className="w-5 h-5" />
              <span>
                {selectedSlot
                  ? `Confirm Booking (${selectedSlot})`
                  : 'Select an Available Slot Above'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFacility(null)}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 mt-3"
            >
              ← Choose another facility
            </button>
          </div>
        </div>
      ) : (
        /* 3. Booking Confirmed Summary */
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <h4 className="text-2xl font-bold text-slate-900">Booking Confirmed</h4>
            <p className="text-sm font-semibold text-indigo-700 mt-1">
              {bookingConfirmed.facilityName}
            </p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Reserved For</span>
              <span className="font-bold text-slate-900">Flat {resident.flat} ({resident.name})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Day & Time</span>
              <span className="font-bold text-slate-900">{bookingConfirmed.day}, {bookingConfirmed.slot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pass Code</span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {bookingConfirmed.bookingCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Facility Access</span>
              <span className="font-bold text-emerald-600">Digital Key Enabled</span>
            </div>
          </div>

          <button
            id="done-facility-btn"
            type="button"
            onClick={handleReset}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors mt-2 shadow-sm"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
};
