import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Check, CheckCheck, X } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  visitor_arrived: 'Visitor Arrived',
  visitor_approved: 'Visitor Approved',
  complaint_update: 'Complaint Update',
  notice_published: 'Notice Published',
  booking_confirmed: 'Booking Confirmed',
  bill_generated: 'Bill Generated',
  payment_verified: 'Payment Verified',
  payment_rejected: 'Payment Rejected',
  election_opened: 'Election Opened',
};

const TYPE_COLORS: Record<string, string> = {
  visitor_arrived: 'bg-blue-100 text-blue-700',
  visitor_approved: 'bg-emerald-100 text-emerald-700',
  complaint_update: 'bg-amber-100 text-amber-700',
  notice_published: 'bg-indigo-100 text-indigo-700',
  booking_confirmed: 'bg-purple-100 text-purple-700',
  bill_generated: 'bg-rose-100 text-rose-700',
  payment_verified: 'bg-emerald-100 text-emerald-700',
  payment_rejected: 'bg-red-100 text-red-700',
  election_opened: 'bg-cyan-100 text-cyan-700',
};

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    markAllNotificationsRead();
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                  title="Mark all as read"
                  aria-label="Mark all notifications as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-500">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  You'll be notified about visitor updates, payments, and more.
                </p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) {
                      markNotificationRead(notif.id);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    !notif.read ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            TYPE_COLORS[notif.type] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {TYPE_LABELS[notif.type] || notif.type}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{notif.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notif.read && (
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
