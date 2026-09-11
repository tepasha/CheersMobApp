import React, { useState } from 'react';
import { 
  User, 
  Beer, 
  MapPin, 
  ShieldCheck, 
  LogOut, 
  Edit3, 
  Save, 
  Flame, 
  Check,
  ExternalLink,
  Globe,
  Ban,
  ShieldAlert
} from 'lucide-react';
import { DrinkType, PaymentEtiquette, AuthUser, AppLanguage } from '../../types';
import { DRINK_METADATA, PAYMENT_METADATA } from '../../data/mockData';
import { sounds } from '../../services/soundService';
import { SUPPORTED_LANGUAGES, t } from '../../services/i18nService';

interface ProfileViewProps {
  currentUser: AuthUser;
  onOpenAuth: () => void;
  onLogout: () => void;
  onGoogleSignIn: () => void;
  currentLanguage: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  langSourceHint: string;
  onTriggerRuBlockTest: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onGoogleSignIn,
  currentLanguage,
  onLanguageChange,
  langSourceHint,
  onTriggerRuBlockTest,
}) => {
  const [tagline, setTagline] = useState('React Native розробник, шукаю компанію на крафтове пиво або вино 🍺🍷');
  const [preferredDrinks, setPreferredDrinks] = useState<DrinkType[]>(['craft', 'wine', 'cider']);
  const [paymentRule, setPaymentRule] = useState<PaymentEtiquette>('split_50_50');
  const [favoriteBars, setFavoriteBars] = useState('Squat 17b, Varvar Bar, Win Bar');
  const [isSaved, setIsSaved] = useState(false);

  const toggleDrink = (drink: DrinkType) => {
    setPreferredDrinks((prev) =>
      prev.includes(drink) ? prev.filter((d) => d !== drink) : [...prev, drink]
    );
  };

  const handleSave = () => {
    sounds.playClink();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const isGoogle = currentUser.provider === 'google' && currentUser.isLoggedIn;

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto no-scrollbar select-none">
      {/* Top Header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 leading-none">
            {t('profile_title', currentLanguage)}
          </h2>
          <p className="text-[10px] text-neutral-400">Налаштування акаунту, мови та вподобань</p>
        </div>

        <button
          type="button"
          id="save-profile-btn"
          onClick={handleSave}
          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition shadow"
        >
          {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaved ? t('profile_saved', currentLanguage) : t('save_changes', currentLanguage)}</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* User Card */}
        <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-4 shadow-xl flex items-center gap-3.5 relative overflow-hidden">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-neutral-900" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-white leading-tight truncate">
                {currentUser.name}, 27
              </h3>
              {isGoogle && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30 flex items-center gap-1">
                  Google
                </span>
              )}
            </div>
            <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>Київ, Поділ</span>
            </p>
            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
              {currentUser.email || 'Не вказано (Гість)'}
            </p>
          </div>
        </div>

        {/* Language Selection & Geo Detection Card */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-3.5 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">
                  {t('language_title', currentLanguage)}
                </h4>
                <p className="text-[10px] text-neutral-400">
                  {langSourceHint}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
              {SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.flag}{' '}
              {SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.nativeName}
            </span>
          </div>

          {/* Languages Grid (Explicitly NO Russian) */}
          <div className="grid grid-cols-2 gap-1.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  id={`lang-btn-${lang.code}`}
                  onClick={() => {
                    sounds.playClink();
                    onLanguageChange(lang.code);
                  }}
                  className={`p-2 rounded-xl border text-left flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{lang.flag}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate leading-tight">
                        {lang.nativeName}
                      </div>
                      <div className="text-[9px] text-neutral-400 truncate">
                        {lang.regionHint}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Russia Block & Strict Ban Notice */}
          <div className="bg-rose-950/40 border border-rose-600/30 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-start gap-2">
              <Ban className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-rose-300">
                  Повне гео-блокування території РФ
                </div>
                <p className="text-[10px] text-rose-200/80 leading-relaxed">
                  {t('language_ru_ban_notice', currentLanguage)}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="test-ru-geoblock-btn"
              onClick={onTriggerRuBlockTest}
              className="w-full mt-1 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 border border-rose-500/40 text-rose-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <ShieldAlert className="w-3 h-3 text-rose-300" />
              <span>{t('test_ru_block_btn', currentLanguage)}</span>
            </button>
          </div>
        </div>

        {/* Google Authentication & Firebase Status Card */}
        <div className="bg-gradient-to-tr from-amber-950/40 via-neutral-900 to-neutral-900 rounded-2xl border border-amber-500/25 p-3.5 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
              </div>
              <span className="text-xs font-bold text-neutral-100">
                {isGoogle ? 'Авторизовано через Google' : 'Google Вхід не виконано'}
              </span>
            </div>

            {isGoogle ? (
              <span className="text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                OAuth 2.0 Active
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded-full">
                Гість
              </span>
            )}
          </div>

          {/* Details */}
          {isGoogle ? (
            <div className="bg-neutral-950/80 rounded-xl p-2.5 font-mono text-[10px] text-neutral-400 space-y-0.5 border border-neutral-800/80">
              <div><span className="text-neutral-500">Google ID:</span> {currentUser.googleId || '109847291048291048123'}</div>
              <div><span className="text-neutral-500">Email:</span> {currentUser.email}</div>
              <div><span className="text-neutral-500">Scopes:</span> email, profile, openid</div>
              <div><span className="text-neutral-500">Firebase UID:</span> fb_{currentUser.googleId?.slice(0, 8) || 'usr_google'}</div>
            </div>
          ) : (
            <div className="bg-neutral-950/60 rounded-xl p-2.5 text-xs text-neutral-300 border border-neutral-800">
              <p className="text-[11px] text-neutral-400">
                Авторизуйтесь через Google, щоб зберігати історію чатів, келихів та зʼявлятися на радарній карті закладів Києва.
              </p>
              <button
                type="button"
                id="profile-google-login-btn"
                onClick={onGoogleSignIn}
                className="mt-2 w-full py-2 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs shadow transition flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                <span>Увійти через Google</span>
              </button>
            </div>
          )}

          {/* Quick Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              id="switch-account-btn"
              onClick={onOpenAuth}
              className="flex-1 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition"
            >
              {isGoogle ? 'Змінити Google акаунт' : 'Форма входу'}
            </button>
            {currentUser.isLoggedIn && (
              <button
                type="button"
                id="profile-logout-btn"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold flex items-center gap-1 border border-rose-800/40 transition"
                title="Вийти з акаунту"
              >
                <LogOut className="w-3 h-3" />
                <span>Вийти</span>
              </button>
            )}
          </div>
        </div>

        {/* Tagline / Mood Text */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-3.5 space-y-1.5">
          <label className="block text-xs font-bold text-neutral-300">
            Мій статус / Слоган у картці
          </label>
          <textarea
            id="profile-tagline-textarea"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            rows={2}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        {/* Drink Preferences */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-3.5 space-y-2">
          <label className="block text-xs font-bold text-neutral-300">
            Що я п’ю найчастіше:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(DRINK_METADATA) as DrinkType[]).map((drink) => {
              const meta = DRINK_METADATA[drink];
              const isSelected = preferredDrinks.includes(drink);
              return (
                <button
                  key={drink}
                  type="button"
                  id={`profile-drink-${drink}`}
                  onClick={() => toggleDrink(drink)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Etiquette */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-3.5 space-y-2">
          <label className="block text-xs font-bold text-neutral-300">
            Мій етикет оплати рахунку:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(PAYMENT_METADATA) as PaymentEtiquette[]).map((rule) => {
              const meta = PAYMENT_METADATA[rule];
              const isSelected = paymentRule === rule;
              return (
                <button
                  key={rule}
                  type="button"
                  id={`profile-payment-${rule}`}
                  onClick={() => setPaymentRule(rule)}
                  className={`text-xs p-2 rounded-xl border text-left font-medium transition ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Favorite Bars */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-3.5 space-y-1.5">
          <label className="block text-xs font-bold text-neutral-300">
            Улюблені заклади (через кому)
          </label>
          <input
            type="text"
            id="favorite-bars-input"
            value={favoriteBars}
            onChange={(e) => setFavoriteBars(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>
    </div>
  );
};
