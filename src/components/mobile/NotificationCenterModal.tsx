import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Volume2,
  VolumeX,
  Smartphone,
  Trash2,
  Wine,
  MessageSquare,
  Clock,
  Sparkles,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { PushNotificationItem, PushNotificationSettings } from '../../types';
import { pushNotificationService } from '../../services/pushNotificationService';
import { sounds } from '../../services/soundService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToHangout?: (hangoutId?: string, venueName?: string) => void;
  onNavigateToChat?: (chatId?: string, buddyId?: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateToHangout,
  onNavigateToChat,
}) => {
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);
  const [settings, setSettings] = useState<PushNotificationSettings>(() =>
    pushNotificationService.getSettings()
  );
  const [webPushStatus, setWebPushStatus] = useState<NotificationPermission | 'unsupported'>(() =>
    pushNotificationService.getWebPushPermission()
  );
  const [scheduledTimer, setScheduledTimer] = useState<string | null>(null);

  useEffect(() => {
    const unsub = pushNotificationService.subscribe((list) => {
      setNotifications(list);
      setSettings(pushNotificationService.getSettings());
      setWebPushStatus(pushNotificationService.getWebPushPermission());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    sounds.playTap();
    const next = !settings.soundEnabled;
    pushNotificationService.updateSettings({ soundEnabled: next });
    setSettings((s) => ({ ...s, soundEnabled: next }));
  };

  const handleToggleBanner = () => {
    sounds.playTap();
    const next = !settings.bannerEnabled;
    pushNotificationService.updateSettings({ bannerEnabled: next });
    setSettings((s) => ({ ...s, bannerEnabled: next }));
  };

  const handleRequestWebPush = async () => {
    sounds.playTap();
    const res = await pushNotificationService.requestWebPushPermission();
    setWebPushStatus(res);
  };

  // 1. SPECIFIC TRIGGER 1: «Хтось присів за ваш столик у Squat 17b»
  const handleTriggerSquatTable = (delayMs: number = 0) => {
    sounds.playTap();
    if (delayMs > 0) {
      setScheduledTimer('Squat 17b (через 4 сек)');
      setTimeout(() => {
        pushNotificationService.triggerTableSeatNotification({
          venueName: 'Squat 17b',
          guestName: 'Богдан',
          customNote: 'Замовив сидр та підсів до вашого столика!',
        });
        setScheduledTimer(null);
      }, delayMs);
    } else {
      pushNotificationService.triggerTableSeatNotification({
        venueName: 'Squat 17b',
        guestName: 'Богдан',
      });
    }
  };

  // 2. SPECIFIC TRIGGER 2: «Нове повідомлення від супутника»
  const handleTriggerChatMessage = (delayMs: number = 0) => {
    sounds.playTap();
    if (delayMs > 0) {
      setScheduledTimer('Повідомлення (через 4 сек)');
      setTimeout(() => {
        pushNotificationService.triggerChatMessageNotification({
          buddyName: 'Оксана',
          messageText: 'Я вже замовила сидр біля барної стійки! Ти де? 🍻',
        });
        setScheduledTimer(null);
      }, delayMs);
    } else {
      pushNotificationService.triggerChatMessageNotification({
        buddyName: 'Оксана',
        messageText: 'Я вже замовила сидр біля барної стійки! Ти де? 🍻',
      });
    }
  };

  const handleItemClick = (item: PushNotificationItem) => {
    sounds.playTap();
    pushNotificationService.markAsRead(item.id);
    onClose();

    if (item.type === 'table_seat' || item.type === 'hangout_alert') {
      onNavigateToHangout?.(item.hangoutId, item.venueName);
    } else if (item.type === 'chat_message' || item.type === 'cheers_toast') {
      onNavigateToChat?.(item.chatId, item.buddyId);
    }
  };

  const handleMarkAllRead = () => {
    sounds.playTap();
    pushNotificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    sounds.playTap();
    pushNotificationService.clearNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white leading-tight">Центр Push-сповіщень</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-bold text-[10px]">
                    {unreadCount} нових
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                Миттєві сповіщення про столики в барах та повідомлення супутників
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-push-center-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs no-scrollbar">
          {/* Quick Triggers Simulator Card */}
          <div className="bg-neutral-950 p-3.5 rounded-2xl border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Швидкі симулятори Push-сповіщень:</span>
              </span>
              {scheduledTimer && (
                <span className="text-[10px] text-emerald-400 animate-pulse font-mono">
                  Запуск: {scheduledTimer}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Button 1: Table Seat at Squat 17b */}
              <button
                type="button"
                id="trigger-squat-push-btn"
                onClick={() => handleTriggerSquatTable(0)}
                className="p-2.5 bg-neutral-900 hover:bg-neutral-850 active:scale-98 border border-neutral-800 hover:border-amber-500/50 rounded-xl text-left transition group flex items-start gap-2.5 shadow-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Wine className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-neutral-200 group-hover:text-amber-300 text-[11px] leading-snug">
                    «Хтось присів за ваш столик у Squat 17b»
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Миттєве сповіщення про гостя за столиком
                  </div>
                </div>
              </button>

              {/* Button 2: Chat Message from companion */}
              <button
                type="button"
                id="trigger-chat-push-btn"
                onClick={() => handleTriggerChatMessage(0)}
                className="p-2.5 bg-neutral-900 hover:bg-neutral-850 active:scale-98 border border-neutral-800 hover:border-cyan-500/50 rounded-xl text-left transition group flex items-start gap-2.5 shadow-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-neutral-200 group-hover:text-cyan-300 text-[11px] leading-snug">
                    «Нове повідомлення від супутника»
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Оксана: «Я вже замовила сидр...»
                  </div>
                </div>
              </button>
            </div>

            {/* Delayed test trigger (to simulate background arrival) */}
            <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Перевірка фонового сповіщення:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTriggerSquatTable(4000)}
                  className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-[10px] flex items-center gap-1 border border-neutral-800"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Squat 17b (+4 сек)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerChatMessage(4000)}
                  className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-[10px] flex items-center gap-1 border border-neutral-800"
                >
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>Чат (+4 сек)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Browser Web Push API Permission Status */}
          <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-neutral-850 flex items-center justify-center text-neutral-300">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <div className="font-bold text-neutral-200 text-[11px]">
                  Системний Web Notifications API
                </div>
                <div className="text-[10px] text-neutral-400">
                  {webPushStatus === 'granted'
                    ? '✅ Дозволено браузером (реальні Push на робочий стіл/телефон)'
                    : webPushStatus === 'denied'
                    ? '❌ Заблоковано у налаштуваннях браузера'
                    : 'Дозволити надсилати сповіщення у браузер'}
                </div>
              </div>
            </div>

            {webPushStatus !== 'granted' && webPushStatus !== 'unsupported' && (
              <button
                type="button"
                id="request-browser-notif-btn"
                onClick={handleRequestWebPush}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] rounded-lg transition shrink-0"
              >
                Увімкнути
              </button>
            )}
          </div>

          {/* Settings toggles */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                settings.soundEnabled
                  ? 'bg-neutral-900 border-amber-500/40 text-neutral-200'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span>Звук (Дзинь)</span>
              </span>
              <span className="text-[10px] font-bold">
                {settings.soundEnabled ? 'УВІМК' : 'ВИМК'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleBanner}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                settings.bannerEnabled
                  ? 'bg-neutral-900 border-amber-500/40 text-neutral-200'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Спливаючий банер</span>
              </span>
              <span className="text-[10px] font-bold">
                {settings.bannerEnabled ? 'УВІМК' : 'ВИМК'}
              </span>
            </button>
          </div>

          {/* Notifications History List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Останні сповіщення ({notifications.length})
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-neutral-400 hover:text-amber-400 transition"
                  >
                    Прочитати всі
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[10px] text-neutral-500 hover:text-rose-400 transition flex items-center gap-0.5"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Очистити</span>
                  </button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950 rounded-2xl border border-neutral-850">
                <Bell className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                <p className="text-neutral-400 text-xs">Немає збережених сповіщень</p>
                <p className="text-[10px] text-neutral-600 mt-1">
                  Натисніть одну з кнопок симулятора вище, щоб надіслати тестове сповіщення.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 relative group ${
                      item.isRead
                        ? 'bg-neutral-950 border-neutral-850 hover:border-neutral-700 text-neutral-300'
                        : 'bg-neutral-900 border-amber-500/40 hover:border-amber-400 text-white shadow-sm'
                    }`}
                  >
                    {/* Icon or Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.buddyName || 'Користувач'}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-neutral-700"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400">
                          {item.type === 'table_seat' ? (
                            <Wine className="w-4 h-4" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 flex items-center justify-center text-[10px]">
                        {item.type === 'table_seat' ? '🍻' : '💬'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-[11px] truncate text-neutral-200">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                          {item.timestamp}
                        </span>
                      </div>

                      <p
                        className={`text-[11px] leading-snug ${
                          item.isRead ? 'text-neutral-400' : 'text-amber-300 font-medium'
                        }`}
                      >
                        {item.body}
                      </p>

                      {item.subtitle && (
                        <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-1">
                          {item.subtitle}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-medium group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
                          {item.actionText || 'Перейти'} →
                        </span>
                        {!item.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Підтримка Firebase Cloud Messaging (FCM) & Expo Notifications</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-lg transition"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
