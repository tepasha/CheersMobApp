import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Sparkles } from 'lucide-react';
import { DeviceMode, AuthUser } from '../../types';

interface MobileFrameProps {
  children: React.ReactNode;
  deviceMode: DeviceMode;
  onDeviceChange: (mode: DeviceMode) => void;
  onOpenArchitecture: () => void;
  currentUser?: AuthUser;
  onOpenAuth?: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  deviceMode,
  onDeviceChange,
  onOpenArchitecture,
  currentUser,
  onOpenAuth,
}) => {
  const [currentTime, setCurrentTime] = useState('20:45');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (deviceMode === 'fluid') {
    return (
      <div className="w-full min-h-screen bg-neutral-950 flex flex-col items-center">
        {/* Top bar with quick controls */}
        <header className="w-full max-w-md bg-neutral-900/90 border-b border-neutral-800 px-4 py-2 flex items-center justify-between text-xs z-40 sticky top-0 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-neutral-200">React Native + Expo (Web Preview)</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenAuth && currentUser && (
              <button
                id="top-google-auth-btn-fluid"
                type="button"
                onClick={onOpenAuth}
                className="text-[11px] px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold transition flex items-center gap-1.5 border border-neutral-700/60"
                title="Авторизація через Google"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                <span>{currentUser.isLoggedIn ? currentUser.name : 'Google Вхід'}</span>
              </button>
            )}
            <button
              id="switch-to-frame-btn"
              type="button"
              onClick={() => onDeviceChange('iphone')}
              className="text-[11px] px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition"
            >
              📱 Рамка телефону
            </button>
            <button
              id="open-arch-btn-fluid"
              type="button"
              onClick={onOpenArchitecture}
              className="text-[11px] px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-medium transition flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Код & Архітектура
            </button>
          </div>
        </header>
        <div className="w-full max-w-md flex-1 flex flex-col bg-neutral-950 relative shadow-2xl">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-start p-2 sm:p-6 overflow-x-hidden">
      {/* Top Banner with Device & Architecture Controls */}
      <div className="w-full max-w-xl flex flex-wrap items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-sm shadow-md shadow-amber-500/20">
            🍻
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-100 tracking-tight leading-none">
              Будьмо! <span className="text-amber-400 font-normal text-xs">React Native & Expo</span>
            </h1>
            <p className="text-[11px] text-neutral-400">Пошук собутильника • MongoDB & Firebase Auth</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Device toggle */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              id="device-mode-iphone"
              onClick={() => onDeviceChange('iphone')}
              className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
                deviceMode === 'iphone'
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              iOS
            </button>
            <button
              type="button"
              id="device-mode-android"
              onClick={() => onDeviceChange('android')}
              className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
                deviceMode === 'android'
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Android
            </button>
            <button
              type="button"
              id="device-mode-fluid"
              onClick={() => onDeviceChange('fluid')}
              className="px-2.5 py-1 rounded-md text-neutral-400 hover:text-neutral-200 font-medium text-[11px]"
            >
              На весь екран
            </button>
          </div>

          {onOpenAuth && currentUser && (
            <button
              id="top-google-auth-btn-frame"
              type="button"
              onClick={onOpenAuth}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-semibold transition flex items-center gap-1.5 border border-neutral-700/80 shadow-sm"
              title="Авторизація через Google"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
              </svg>
              <span>{currentUser.isLoggedIn ? `${currentUser.name}` : 'Увійти з Google'}</span>
            </button>
          )}

          <button
            type="button"
            id="open-architecture-btn"
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Expo & Backend Код</span>
          </button>
        </div>
      </div>

      {/* Realistic Mobile Enclosure */}
      <div
        id="mobile-device-container"
        className={`relative w-full max-w-[390px] h-[820px] max-h-[92vh] flex flex-col bg-neutral-950 transition-all duration-300 ${
          deviceMode === 'iphone'
            ? 'rounded-[50px] border-[10px] border-neutral-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)] ring-1 ring-neutral-900'
            : 'rounded-[36px] border-[8px] border-neutral-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-neutral-900'
        } overflow-hidden`}
      >
        {/* Phone Speaker & Dynamic Island / Camera Hole */}
        <div className="absolute top-0 left-0 right-0 h-10 z-40 flex items-center justify-between px-7 pt-1 pointer-events-none select-none">
          <span className="text-xs font-semibold tracking-tight text-neutral-200">{currentTime}</span>

          {deviceMode === 'iphone' ? (
            <div className="w-24 h-5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-neutral-900 ring-1 ring-neutral-800" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
            </div>
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-neutral-900 border border-neutral-700/80" />
          )}

          <div className="flex items-center gap-1.5 text-neutral-300">
            <span className="text-[10px] font-bold">5G</span>
            <Wifi className="w-3 h-3" />
            <BatteryMedium className="w-3.5 h-3.5 text-neutral-200" />
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 flex flex-col pt-9 overflow-hidden bg-neutral-950 relative">
          {children}
        </div>

        {/* Home Indicator Bar */}
        {deviceMode === 'iphone' && (
          <div className="absolute bottom-1 left-0 right-0 h-4 flex items-center justify-center pointer-events-none z-40">
            <div className="w-32 h-1 bg-neutral-500/60 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
