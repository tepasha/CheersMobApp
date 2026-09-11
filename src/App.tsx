import React, { useState, useEffect } from 'react';
import { ActiveTab, BuddyProfile, ChatThread, DeviceMode, HangoutAlert, Message, AuthUser, AppLanguage, GeoBlockInfo } from './types';
import { INITIAL_BUDDIES, INITIAL_CHATS, INITIAL_HANGOUTS } from './data/mockData';
import { MobileFrame } from './components/mobile/MobileFrame';
import { BottomTabBar } from './components/mobile/BottomTabBar';
import { DiscoverView } from './components/mobile/DiscoverView';
import { RadarView } from './components/mobile/RadarView';
import { HangoutsView } from './components/mobile/HangoutsView';
import { ChatListView } from './components/mobile/ChatListView';
import { ChatRoomView } from './components/mobile/ChatRoomView';
import { ProfileView } from './components/mobile/ProfileView';
import { AuthModal } from './components/mobile/AuthModal';
import { ArchitectureHub } from './components/architecture/ArchitectureHub';
import { RussiaBlockScreen } from './components/mobile/RussiaBlockScreen';
import { sounds } from './services/soundService';
import { authService } from './services/authService';
import {
  checkRussianTerritoryRestriction,
  detectLanguageFromGeo,
  saveAppLanguage,
  setSimulateRuBlock,
} from './services/i18nService';
import {
  UserGeoLocation,
  INITIAL_USER_LOCATION,
  calculateDistanceKm,
} from './services/geoService';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('iphone');
  const [userLocation, setUserLocation] = useState<UserGeoLocation>(INITIAL_USER_LOCATION);

  // App Language State (auto-detected by Geo & Browser, Russian strictly excluded)
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(() => {
    const detected = detectLanguageFromGeo(INITIAL_USER_LOCATION);
    return detected.lang;
  });
  const [langSourceHint, setLangSourceHint] = useState<string>(() => {
    const detected = detectLanguageFromGeo(INITIAL_USER_LOCATION);
    return detected.locationHint;
  });

  // Geoblocking State for Russian Federation
  const [geoBlockInfo, setGeoBlockInfo] = useState<GeoBlockInfo>(() =>
    checkRussianTerritoryRestriction(INITIAL_USER_LOCATION)
  );

  const [buddies, setBuddies] = useState<BuddyProfile[]>(() =>
    INITIAL_BUDDIES.map((b) => ({
      ...b,
      distanceKm: calculateDistanceKm(
        INITIAL_USER_LOCATION.lat,
        INITIAL_USER_LOCATION.lng,
        b.coordinates.lat,
        b.coordinates.lng
      ),
    }))
  );
  const [hangouts, setHangouts] = useState<HangoutAlert[]>(INITIAL_HANGOUTS);
  const [chats, setChats] = useState<ChatThread[]>(INITIAL_CHATS);
  const [selectedChat, setSelectedChat] = useState<ChatThread | null>(null);

  // Update user coordinates and synchronize buddy distances across the app
  const handleUpdateLocation = (newLoc: UserGeoLocation) => {
    setUserLocation(newLoc);
    // Re-verify geo restrictions
    const check = checkRussianTerritoryRestriction(newLoc);
    setGeoBlockInfo(check);

    setBuddies((prev) =>
      prev.map((b) => ({
        ...b,
        distanceKm: calculateDistanceKm(
          newLoc.lat,
          newLoc.lng,
          b.coordinates.lat,
          b.coordinates.lng
        ),
      }))
    );
  };

  const handleLanguageChange = (lang: AppLanguage) => {
    setCurrentLanguage(lang);
    saveAppLanguage(lang);
    setLangSourceHint('Обрано вручну користувачем');
  };

  const handleTriggerRuBlockTest = () => {
    setSimulateRuBlock(true);
    setGeoBlockInfo(checkRussianTerritoryRestriction(userLocation));
  };

  const handleDisableRuSimulation = () => {
    setSimulateRuBlock(false);
    setGeoBlockInfo(checkRussianTerritoryRestriction(userLocation));
  };

  // Auth state with Google OAuth provider support
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => authService.getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);

  // Quick Google Sign-In helper
  const handleGoogleQuickSignIn = async () => {
    try {
      const user = await authService.loginWithGoogle();
      setCurrentUser(user);
      sounds.playMatchCheer();
    } catch {
      // Fallback
    }
  };

  const handleLogout = () => {
    sounds.playClink();
    const guestUser = authService.logout();
    setCurrentUser(guestUser);
  };

  // Handle Match
  const handleMatch = (buddy: BuddyProfile) => {
    // Check if chat already exists
    const existingChat = chats.find((c) => c.buddy.id === buddy.id);
    if (!existingChat) {
      const newChat: ChatThread = {
        id: `chat-${buddy.id}`,
        buddy,
        lastMessage: 'У вас новий спільний келих! 🍻 Напишіть тост.',
        lastMessageTime: 'Щойно',
        unreadCount: 1,
        messages: [
          {
            id: `m-${Date.now()}`,
            chatId: `chat-${buddy.id}`,
            senderId: buddy.id,
            senderName: buddy.name,
            text: `Привіт! Радий співпадінню! За який бар сьогодні піднімемо келихи? 🍻`,
            timestamp: 'Щойно',
            isMe: false,
          },
        ],
      };
      setChats((prev) => [newChat, ...prev]);
    }
  };

  // Open Chat with Buddy directly
  const handleOpenChatWithBuddy = (buddy: BuddyProfile) => {
    sounds.playClink();
    let targetChat = chats.find((c) => c.buddy.id === buddy.id);
    if (!targetChat) {
      targetChat = {
        id: `chat-${buddy.id}`,
        buddy,
        lastMessage: 'Початок розмови...',
        lastMessageTime: 'Щойно',
        unreadCount: 0,
        messages: [
          {
            id: `m-init-${Date.now()}`,
            chatId: `chat-${buddy.id}`,
            senderId: buddy.id,
            senderName: buddy.name,
            text: `Привіт! Як настрій щодо зустрічі в барі? 🍻`,
            timestamp: 'Щойно',
            isMe: false,
          },
        ],
      };
      setChats((prev) => [targetChat!, ...prev]);
    }
    setSelectedChat(targetChat);
    setActiveTab('chats');
  };

  // Open chat from Hangouts by user name
  const handleOpenChatByName = (userName: string) => {
    const buddy = buddies.find((b) => b.name === userName) || buddies[0];
    handleOpenChatWithBuddy(buddy);
  };

  // Handle Send Message
  const handleSendMessage = (
    chatId: string,
    messageText: string,
    type: 'text' | 'cheers' | 'location_proposal' = 'text',
    proposalData?: Message['proposalData']
  ) => {
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      chatId,
      senderId: 'me',
      senderName: currentUser.name,
      text: messageText,
      timestamp: timeString,
      isMe: true,
      type,
      proposalData,
    };

    setChats((prevChats) =>
      prevChats.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            lastMessage: type === 'cheers' ? `Тост: ${messageText}` : messageText,
            lastMessageTime: timeString,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    // Also update selectedChat if currently open
    setSelectedChat((prev) => {
      if (prev && prev.id === chatId) {
        return {
          ...prev,
          lastMessage: messageText,
          lastMessageTime: timeString,
          messages: [...prev.messages, newMsg],
        };
      }
      return prev;
    });
  };

  // Handle new Hangout / check-in
  const handleNewHangout = (newHangout: HangoutAlert) => {
    setHangouts((prev) => [newHangout, ...prev]);
  };

  const handleJoinHangout = (hangoutId: string) => {
    setHangouts((prev) =>
      prev.map((h) =>
        h.id === hangoutId ? { ...h, participantsCount: h.participantsCount + 1 } : h
      )
    );
  };

  const unreadTotal = chats.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <MobileFrame
      deviceMode={deviceMode}
      onDeviceChange={setDeviceMode}
      onOpenArchitecture={() => setIsArchitectureOpen(true)}
      currentUser={currentUser}
      onOpenAuth={() => setIsAuthModalOpen(true)}
    >
      {/* Screen Views based on active Tab */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'discover' && (
          <DiscoverView
            buddies={buddies}
            onMatch={handleMatch}
            onOpenChat={handleOpenChatWithBuddy}
          />
        )}

        {activeTab === 'radar' && (
          <RadarView
            buddies={buddies}
            userLocation={userLocation}
            onUpdateLocation={handleUpdateLocation}
            onSelectBuddy={(b) => handleOpenChatWithBuddy(b)}
            onOpenChat={handleOpenChatWithBuddy}
            onNewHangout={handleNewHangout}
          />
        )}

        {activeTab === 'hangouts' && (
          <HangoutsView
            hangouts={hangouts}
            onJoinHangout={handleJoinHangout}
            onOpenBuddyChat={handleOpenChatByName}
            buddies={buddies}
            onNewHangout={handleNewHangout}
            currentUserName={currentUser.name}
            currentLocationName={userLocation.locationName}
          />
        )}

        {activeTab === 'chats' && (
          selectedChat ? (
            <ChatRoomView
              chat={selectedChat}
              onBack={() => setSelectedChat(null)}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <ChatListView
              chats={chats}
              onSelectChat={(c) => setSelectedChat(c)}
              onQuickDiscover={() => setActiveTab('discover')}
            />
          )
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            onGoogleSignIn={handleGoogleQuickSignIn}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            langSourceHint={langSourceHint}
            onTriggerRuBlockTest={handleTriggerRuBlockTest}
          />
        )}
      </div>

      {/* Persistent Bottom Tab Bar (hidden only when inside active chat room for more messaging space) */}
      {!(activeTab === 'chats' && selectedChat) && (
        <BottomTabBar
          activeTab={activeTab}
          onTabChange={(tab) => {
            sounds.playClink();
            setSelectedChat(null);
            setActiveTab(tab);
          }}
          unreadCount={unreadTotal}
          activeHangoutsCount={hangouts.length}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Russia Geoblock Overlay (Strict Sanction & Security Screen) */}
      {geoBlockInfo.isBlocked && (
        <RussiaBlockScreen
          geoBlockInfo={geoBlockInfo}
          onDisableSimulation={handleDisableRuSimulation}
        />
      )}

      {/* Firebase & Google Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
        onLogout={handleLogout}
      />

      {/* React Native & Expo + MongoDB Architecture Hub */}
      <ArchitectureHub
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </MobileFrame>
  );
}
