export type DrinkType = 
  | 'beer' 
  | 'craft' 
  | 'wine' 
  | 'cocktail' 
  | 'whiskey' 
  | 'cider' 
  | 'shots' 
  | 'non_alcoholic';

export type PaymentEtiquette = 
  | 'split_50_50' 
  | 'each_for_themselves' 
  | 'i_treat' 
  | 'rounds';

export type MoodType = 
  | 'chill_talk' 
  | 'coding_it' 
  | 'board_games' 
  | 'bar_crawl' 
  | 'sports_football' 
  | 'deep_philosophy' 
  | 'live_music';

export interface BuddyProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  tagline: string;
  bio: string;
  locationName: string;
  distanceKm: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  preferredDrinks: DrinkType[];
  paymentRule: PaymentEtiquette;
  currentMood: MoodType;
  favoriteBars: string[];
  talkTopics: string[];
  online: boolean;
  activeCheckIn?: {
    barName: string;
    note: string;
    sinceTime: string;
  };
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  type?: 'text' | 'cheers' | 'location_proposal';
  proposalData?: {
    barName: string;
    address: string;
    time: string;
    status: 'pending' | 'accepted' | 'declined';
  };
}

export interface ChatThread {
  id: string;
  buddy: BuddyProfile;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export interface HangoutAlert {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  barName: string;
  locationArea: string;
  drinkPreference: string;
  description: string;
  createdAt: string;
  slotsAvailable: number;
  participantsCount: number;
}

export interface FilterSettings {
  maxDistance: number;
  drinks: DrinkType[];
  moods: MoodType[];
  paymentRules: PaymentEtiquette[];
  interests: string[];
  searchQuery?: string;
}

export type ActiveTab = 'discover' | 'radar' | 'hangouts' | 'chats' | 'profile';

export type DeviceMode = 'iphone' | 'android' | 'fluid';

export type AppLanguage = 'uk' | 'en' | 'pl' | 'de';

export interface LanguageMeta {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
  regionHint: string;
}

export interface GeoBlockInfo {
  isBlocked: boolean;
  reason: string;
  detectedCountry?: string;
  detectedTimezone?: string;
  isSimulated?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'email' | 'guest';
  googleId?: string;
  isLoggedIn: boolean;
  accessToken?: string;
  joinedAt?: string;
  emailVerified?: boolean;
}
