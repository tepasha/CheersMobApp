import React from 'react';
import { Compass, MessageCircle, Radio, User, Wine } from 'lucide-react';
import { ActiveTab, AppLanguage } from '../../types';
import { t } from '../../services/i18nService';

interface BottomTabBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreadCount: number;
  activeHangoutsCount: number;
  currentLanguage?: AppLanguage;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  unreadCount,
  activeHangoutsCount,
  currentLanguage = 'uk',
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'discover',
      label: t('tab_discover', currentLanguage),
      icon: <Compass className="w-5 h-5" />,
    },
    {
      id: 'radar',
      label: t('tab_radar', currentLanguage),
      icon: <Radio className="w-5 h-5" />,
    },
    {
      id: 'hangouts',
      label: t('tab_hangouts', currentLanguage),
      icon: <Wine className="w-5 h-5" />,
      badge: activeHangoutsCount > 0 ? activeHangoutsCount : undefined,
    },
    {
      id: 'chats',
      label: t('tab_chats', currentLanguage),
      icon: <MessageCircle className="w-5 h-5" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'profile',
      label: t('tab_profile', currentLanguage),
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      id="mobile-bottom-tabs"
      aria-label="Нижня навігація додатку"
      className="bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800/80 px-2 py-2 flex items-center justify-around z-30 select-none safe-bottom"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`tab-btn-${tab.id}`}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center relative py-1 px-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <span className={`transition-transform duration-200 block ${isActive ? 'scale-110' : 'scale-100'}`}>
                {tab.icon}
              </span>
              {tab.badge !== undefined && (
                <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-neutral-950 text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-sm">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
            {isActive && (
              <span className="absolute bottom-0 w-4 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
