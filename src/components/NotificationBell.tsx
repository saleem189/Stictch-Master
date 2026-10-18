import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUser } from '../contexts/UserContext';
import { Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { normalizeNotification } from '../lib/notifications';
import { useTranslation } from 'react-i18next';

export default function NotificationBell() {
  const { t } = useTranslation();
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    return onSnapshot(
      q,
      (snap) => {
        setError(null);
        setNotifications(snap.docs.map(d => normalizeNotification(d.id, d.data())));
      },
      () => {
        setError('Notifications are unavailable right now.');
      }
    );
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error(e);
      toast.error(t('Could not update notification.'));
    }
  };

  const clearAll = async () => {
    try {
      const batch = writeBatch(db);
      notifications
        .filter(notification => !notification.read)
        .forEach(notification => {
          batch.update(doc(db, 'notifications', notification.id), { read: true });
        });

      await batch.commit();
      toast.success(t('Notifications cleared.'));
    } catch (e) {
      console.error(e);
      toast.error(t('Could not clear notifications.'));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-green-500" size={16} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={16} />;
      case 'error': return <X className="text-red-500" size={16} />;
      default: return <Info className="text-indigo-500" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={unreadCount ? t('Notifications, {{count}} unread', { count: unreadCount }) : t('Notifications')}
        aria-expanded={isOpen}
        className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 relative transition-all hover:bg-slate-100 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-atelier-brass"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute end-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-atelier-oxblood px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              role="region"
              aria-label={t('Notifications')}
              className="fixed inset-x-3 top-16 z-50 mt-2 max-h-[calc(100dvh-5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-auto sm:w-80 sm:max-h-none"
            >
              <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                <span className="font-display text-xl">{t('Notifications')}</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {error ? (
                  <div className="p-8 text-center text-red-500">
                    <AlertCircle size={22} className="mx-auto mb-3" />
                    <p className="text-sm font-bold">{t(error)}</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-sm">{t('No notifications yet.')}</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <button type="button"
                      key={notif.id} 
                      className={`flex w-full gap-3 border-b border-slate-100 p-4 text-start transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-atelier-brass ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="mt-1">{getIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.read ? 'font-bold' : 'font-medium'} text-slate-900`}>{notif.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {!notif.read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1" />}
                    </button>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                   <button type="button" onClick={clearAll} className="min-h-10 px-3 text-[10px] font-bold text-atelier-oxblood uppercase tracking-widest hover:underline">{t('Mark all as read')}</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
