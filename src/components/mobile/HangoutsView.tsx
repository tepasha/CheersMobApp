import React, { useState } from 'react';
import {
  Wine,
  Users,
  MapPin,
  Clock,
  Plus,
  Check,
  MessageSquare,
  X,
  Beer,
  Sparkles,
  Flame,
  Send,
  CheckCircle2,
  Copy,
  Dices,
  ScrollText,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { BuddyProfile, HangoutAlert } from '../../types';
import { sounds } from '../../services/soundService';
import { ALL_TOASTS, getRandomToast, ToastItem } from '../../data/toastsData';
import { ToastModal } from './ToastModal';
import { ActivityAnalyticsModal } from './ActivityAnalyticsModal';

interface HangoutsViewProps {
  hangouts: HangoutAlert[];
  onJoinHangout: (hangoutId: string) => void;
  onOpenBuddyChat: (buddyName: string) => void;
  buddies: BuddyProfile[];
  onNewHangout: (hangout: HangoutAlert) => void;
  currentUserName?: string;
  currentLocationName?: string;
}

const POPULAR_BAR_PRESETS = [
  { bar: 'Squat 17b', area: 'Поділ' },
  { bar: 'Win Bar', area: 'Поділ' },
  { bar: 'Loggerhead', area: 'Рейтарська' },
  { bar: 'Punkcraft', area: 'Поділ' },
  { bar: 'Varvar Bar', area: 'Поділ' },
  { bar: 'This is Пивбар', area: 'В. Васильківська' },
  { bar: 'Pure & Naive', area: 'Золоті Ворота' },
];

const QUICK_TEMPLATES = [
  '🍻 Зайняв затишний столик, шукаю приємну компанію на крафтовий келих!',
  '💻 Обговорити IT, стартапи та код за келихом сидру чи пива.',
  '🍷 Атмосферний винний вечір, розмови про книги, подорожі та дизайн.',
  '🎲 Є крута настілка, шукаємо +1 або +2 людей приєднатися!',
  '⚽ Дивимось матч на великому екрані! Хто за компанію?',
];

export const HangoutsView: React.FC<HangoutsViewProps> = ({
  hangouts,
  onJoinHangout,
  onOpenBuddyChat,
  buddies,
  onNewHangout,
  currentUserName = 'Павло',
  currentLocationName = 'Київ, Поділ',
}) => {
  const [joinedHangouts, setJoinedHangouts] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showToastsModal, setShowToastsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [currentToast, setCurrentToast] = useState<ToastItem>(() => getRandomToast());
  const [copiedToast, setCopiedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for new Hangout
  const [barName, setBarName] = useState('Squat 17b');
  const [locationArea, setLocationArea] = useState(currentLocationName);
  const [drinkPreference, setDrinkPreference] = useState('Крафтове пиво & Сидр');
  const [description, setDescription] = useState(
    'Сиджу у відкритому дворику, замовляю сидр. Шукаю 1-2 людей приєднатися до столика!'
  );
  const [slotsAvailable, setSlotsAvailable] = useState<number>(2);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleRollNewToast = () => {
    sounds.playClink();
    setCurrentToast(getRandomToast());
  };

  const handleCopyToast = () => {
    sounds.playMessageSent();
    navigator.clipboard.writeText(currentToast.text);
    setCopiedToast(true);
    showToast('Тост скопійовано в буфер обміну! 🍻');
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleJoin = (id: string, name: string) => {
    sounds.playClink();
    if (!joinedHangouts.includes(id)) {
      setJoinedHangouts((prev) => [...prev, id]);
      onJoinHangout(id);
      showToast(`🎉 Ви підсіли до столика ${name}!`);
    }
  };

  const handleCreateHangout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barName.trim() || !description.trim()) return;

    sounds.playClink();
    const newAlert: HangoutAlert = {
      id: `hangout-${Date.now()}`,
      userId: 'me',
      userName: `Ви (${currentUserName})`,
      userAvatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      barName: barName.trim(),
      locationArea: locationArea.trim() || 'Київ, Центр',
      drinkPreference: drinkPreference.trim() || 'Келих за настроєм',
      description: description.trim(),
      createdAt: 'Щойно',
      slotsAvailable: slotsAvailable,
      participantsCount: 1,
    };

    onNewHangout(newAlert);
    setShowCreateModal(false);
    showToast(`📢 Ваш клич у "${barName}" опубліковано!`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto no-scrollbar select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-4 right-4 z-40 bg-amber-500 text-neutral-950 text-xs font-bold px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-neutral-950" />
          <span className="flex-1 truncate">{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-neutral-900 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 leading-none">
            Кличі на вечір 📢
            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              {hangouts.length}
            </span>
          </h2>
          <p className="text-[10px] text-neutral-400">Відкриті столики та компанії на келих</p>
        </div>

        <button
          id="create-hangout-open-btn"
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Кинути клич</span>
        </button>
      </div>

      {/* Hangouts Feed */}
      <div className="p-4 space-y-3 pb-8">
        {/* User Activity Peak Chart Teaser */}
        <button
          type="button"
          id="open-activity-analytics-hangouts-btn"
          onClick={() => setShowActivityModal(true)}
          className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-amber-950/20 border border-amber-500/30 hover:border-amber-500/60 transition flex items-center justify-between group text-left shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Графік активності (Recharts)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Пік 19:00–22:30
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Дізнайтеся, коли найбільше людей шукають компанію в барах
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition shrink-0">
            <span>Графік</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>

        {/* Featured Toast of the Evening Widget */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/40 rounded-2xl border border-amber-500/30 p-3.5 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base animate-pulse">🍻</span>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                Тост вечора
                <span className="text-[10px] text-neutral-400 font-normal bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800">
                  {currentToast.categoryLabel}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                id="open-all-toasts-btn"
                onClick={() => setShowToastsModal(true)}
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold flex items-center gap-1 transition"
                title="Відкрити скриньку всіх тостів"
              >
                <ScrollText className="w-3.5 h-3.5 text-amber-400" />
                <span>Скринька ({ALL_TOASTS.length})</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-neutral-200 font-medium italic leading-relaxed pl-2 border-l-2 border-amber-500/60">
            «{currentToast.text}»
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-xs">
            <button
              type="button"
              id="roll-another-toast-hangouts"
              onClick={handleRollNewToast}
              className="text-[11px] text-neutral-400 hover:text-amber-300 font-medium flex items-center gap-1 transition active:scale-95"
            >
              <Dices className="w-3.5 h-3.5 text-amber-400" />
              <span>🎲 Інший тост</span>
            </button>

            <button
              type="button"
              id="copy-evening-toast-btn"
              onClick={handleCopyToast}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-amber-500/10 text-neutral-300 hover:text-amber-400 border border-neutral-800 flex items-center gap-1 transition"
            >
              {copiedToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Скопійовано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Скопіювати</span>
                </>
              )}
            </button>
          </div>
        </div>

        {hangouts.map((h) => {
          const isJoined = joinedHangouts.includes(h.id);
          const isMyHangout = h.userId === 'me' || h.userName.includes('Ви');

          return (
            <div
              key={h.id}
              className={`bg-neutral-900 rounded-2xl border p-3.5 shadow-md flex flex-col gap-2.5 transition ${
                isMyHangout
                  ? 'border-amber-500/50 bg-neutral-900/95 shadow-amber-500/5'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={h.userAvatar}
                    alt={h.userName}
                    className={`w-10 h-10 rounded-full object-cover border ${
                      isMyHangout ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-amber-400/40'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-white flex items-center gap-1">
                        {h.userName}
                      </h3>
                      {isMyHangout && (
                        <span className="text-[9px] font-bold bg-amber-500 text-neutral-950 px-1.5 py-0.2 rounded-full">
                          Мій клич
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                      <Wine className="w-3 h-3" />
                      {h.barName}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {h.createdAt}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-200 leading-relaxed bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/80">
                "{h.description}"
              </p>

              {/* Drink preference badge */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-md border border-neutral-700/50">
                  Пʼють: <strong className="text-neutral-200">{h.drinkPreference}</strong>
                </span>
              </div>

              {/* Meta Row */}
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-0.5">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <MapPin className="w-3 h-3" />
                  {h.locationArea}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-neutral-400" />
                  <span>
                    Місць: {h.participantsCount + (isJoined ? 1 : 0)} /{' '}
                    {h.slotsAvailable + h.participantsCount}
                  </span>
                </span>
              </div>

              {/* Action Button */}
              <div className="flex gap-2 pt-1">
                {isMyHangout ? (
                  <div className="flex-1 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ваш клич активний для всіх собутильників</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      id={`join-hangout-btn-${h.id}`}
                      onClick={() => handleJoin(h.id, h.userName)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                        isJoined
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                          : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 active:scale-95'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ви приєдналися! Місце заброньовано</span>
                        </>
                      ) : (
                        <>
                          <Wine className="w-3.5 h-3.5" />
                          <span>Підсісти до столика</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id={`chat-hangout-btn-${h.id}`}
                      onClick={() => onOpenBuddyChat(h.userName)}
                      className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center justify-center transition"
                      title="Написати автору кличу"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Bottom Banner to encourage creating new Hangouts */}
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-dashed border-neutral-800 text-center flex flex-col items-center justify-center">
          <p className="text-xs text-neutral-300 font-semibold mb-1">
            Сидите в улюбленому закладі або плануєте вихід?
          </p>
          <p className="text-[11px] text-neutral-400 mb-3">
            Киньте клич, щоб знайти людей за столик поруч із вами.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Створити новий клич</span>
          </button>
        </div>
      </div>

      {/* Modal: Create Hangout ("Кинути клич на вечір") */}
      {showCreateModal && (
        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex flex-col justify-end p-2">
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 max-h-[92%] overflow-y-auto no-scrollbar shadow-2xl space-y-3.5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Кинути клич на вечір 🍻</span>
              </h3>
              <button
                type="button"
                id="close-create-hangout-modal"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHangout} className="space-y-3 text-xs">
              {/* Bar Name */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Назва закладу чи бару
                </label>
                <input
                  type="text"
                  id="hangout-bar-input"
                  value={barName}
                  onChange={(e) => setBarName(e.target.value)}
                  placeholder="напр. Squat 17b, Win Bar, Punkcraft..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-xs"
                  required
                />
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {POPULAR_BAR_PRESETS.slice(0, 4).map((p) => (
                    <button
                      key={p.bar}
                      type="button"
                      onClick={() => {
                        setBarName(p.bar);
                        setLocationArea(`Київ, ${p.area}`);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-amber-300 hover:border-neutral-700 transition"
                    >
                      {p.bar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Area */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Район чи адреса
                </label>
                <input
                  type="text"
                  id="hangout-area-input"
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  placeholder="напр. Київ, Поділ (вул. Хорива)"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-xs"
                  required
                />
              </div>

              {/* Drinks & Format */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Що пʼємо / Формат
                </label>
                <input
                  type="text"
                  id="hangout-drinks-input"
                  value={drinkPreference}
                  onChange={(e) => setDrinkPreference(e.target.value)}
                  placeholder="напр. Крафтовий IPA, Сухе біле вино, Настілки під пиво..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-xs"
                  required
                />
              </div>

              {/* Slots Available Counter */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Скільки вільних місць за столиком?
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      id={`slot-btn-${num}`}
                      onClick={() => setSlotsAvailable(num)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition ${
                        slotsAvailable === num
                          ? 'bg-amber-500 border-amber-400 text-neutral-950 shadow-md'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description / Pitch */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-neutral-300">
                    Опис / Повідомлення для компанії
                  </label>
                  <span className="text-[10px] text-neutral-500">Чому варто підсісти</span>
                </div>
                <textarea
                  id="hangout-desc-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-xs resize-none"
                  placeholder="Де сидите, яка атмосфера, що плануєте обговорити..."
                  required
                />

                {/* Quick Templates */}
                <div className="space-y-1 mt-1.5">
                  <span className="text-[10px] text-neutral-400 font-medium">Швидкі заклики:</span>
                  <div className="grid grid-cols-1 gap-1">
                    {QUICK_TEMPLATES.slice(0, 3).map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDescription(tmpl)}
                        className="text-[10px] text-left p-1.5 rounded-lg bg-neutral-950 border border-neutral-800/80 text-neutral-400 hover:text-amber-300 hover:border-neutral-700 transition truncate"
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  id="cancel-create-hangout-btn"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-semibold text-xs hover:bg-neutral-700 transition"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  id="submit-create-hangout-btn"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Опублікувати клич</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Toasts Vault Modal */}
      <ToastModal
        isOpen={showToastsModal}
        onClose={() => setShowToastsModal(false)}
        onSelectToast={(toastText) => {
          navigator.clipboard.writeText(toastText);
          showToast('Тост обрано та скопійовано у буфер! 🍻');
        }}
        title="Скринька тостів для компанії 🍻"
        allowCustom={true}
      />

      {/* User Activity & Peak Hours Analytics Modal (Recharts) */}
      <ActivityAnalyticsModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
      />
    </div>
  );
};
