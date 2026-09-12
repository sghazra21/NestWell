import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Facility } from '../../types';
import { Building2, Users, Calendar, Clock, Plus, CheckCircle2, Ban } from 'lucide-react';

export const AdminFacilities: React.FC = () => {
  const { facilities, bookFacilitySlot } = useApp();

  const [selectedFacility, setSelectedFacility] = useState<Facility>(facilities[0]);
  const [selectedDay, setSelectedDay] = useState<'Saturday' | 'Sunday' | 'Next Monday'>('Saturday');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Society Amenities & Facility Bookings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Clubhouse, Gym, Badminton Court, and Community Hall reservations
          </p>
        </div>

        <button
          onClick={() => alert('Maintenance block modal opened. You can lock slots for repairs or cleaning.')}
          className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-2"
        >
          <Ban className="w-4 h-4 text-slate-500" />
          <span>Block Slot for Maintenance</span>
        </button>
      </div>

      {/* Facilities Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {facilities.map((fac) => {
          const isSelected = selectedFacility.id === fac.id;
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
                <span className="text-xs font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  {fac.pricePerHour === 0 ? 'Free' : `₹${fac.pricePerHour}/hr`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{fac.description}</p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span>Capacity: {fac.capacity}</span>
                <span className="font-bold text-teal-700">
                  {fac.slots.filter((s) => s.status === 'Available').length} slots free
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slots Schedule for Selected Facility */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {selectedFacility.name} — Schedule & Slots
            </h3>
            <p className="text-xs text-slate-500">Hourly slots management</p>
          </div>

          <div className="flex gap-2">
            {(['Saturday', 'Sunday', 'Next Monday'] as const).map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedDay === day
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {selectedFacility.slots.map((slot) => {
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
          })}
        </div>
      </div>
    </div>
  );
};
