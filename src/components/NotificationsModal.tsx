import React from 'react';
import { Bell, X, Check, Calendar, CheckSquare, Dumbbell, Sparkles } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md mt-12 rounded-2xl bg-[#0e1424] border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">
              {notifications.filter((n) => !n.read).length} new
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded-lg hover:bg-slate-800"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/50 p-2">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-xl transition-all flex items-start gap-3 ${
                  notif.read ? 'opacity-60 hover:opacity-90' : 'bg-blue-600/5 border border-blue-500/10'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  {notif.type === 'schedule' && <Calendar className="w-4 h-4 text-blue-400" />}
                  {notif.type === 'task' && <CheckSquare className="w-4 h-4 text-emerald-400" />}
                  {notif.type === 'workout' && <Dumbbell className="w-4 h-4 text-purple-400" />}
                  {notif.type === 'ai' && <Sparkles className="w-4 h-4 text-cyan-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-semibold text-white truncate">{notif.title}</h4>
                    <span className="text-[10px] text-slate-500 shrink-0">{notif.time}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                </div>

                <button
                  onClick={() => onDismiss(notif.id)}
                  className="text-slate-500 hover:text-slate-300 p-1 rounded"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-xs text-slate-500">
              No notifications right now. You're all caught up!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
