import React, { useState } from 'react';
import { 
  Code2, 
  Database, 
  Layers, 
  Flame, 
  Server, 
  Copy, 
  Check, 
  X, 
  Play, 
  ExternalLink,
  ChevronRight,
  Terminal,
  Rocket,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { sounds } from '../../services/soundService';

interface ArchitectureHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureHub: React.FC<ArchitectureHubProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'expo_app' | 'cicd_stores' | 'mongo_schemas' | 'backend_socket' | 'firebase_auth' | 'mongo_runner'>('overview');
  const [cicdSubTab, setCicdSubTab] = useState<'github_action' | 'eas_json' | 'fastlane' | 'app_json' | 'secrets'>('github_action');
  const [isSimulatingCi, setIsSimulatingCi] = useState(false);
  const [ciLogs, setCiLogs] = useState<string[]>([]);
  const [ciStatus, setCiStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [queryDistance, setQueryDistance] = useState(2000);
  const [queryDrink, setQueryDrink] = useState('craft');
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (code: string, fileName: string) => {
    navigator.clipboard.writeText(code);
    sounds.playClink();
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleRunCiSimulation = () => {
    setIsSimulatingCi(true);
    setCiStatus('running');
    setCiLogs([]);
    sounds.playMessageSent();

    const steps = [
      '🚀 [GitHub Actions] Подія: git push origin v1.0.0 (Release Tag виявлено)',
      '📦 [Runner] Ініціалізація віртуальної машини ubuntu-latest (Node.js 20, Java 17, EAS CLI v12)',
      '🔍 [Job: Validate] Запуск npm run lint та tsc --noEmit: помилок не виявлено (0 errors)',
      '🍏 [Job: iOS] Запуск EAS Build для платформи iOS (Profile: production, Bundle: com.budmo.app)...',
      '🔐 [Job: iOS] Підписання сертифікатами Apple Distribution через App Store Connect API Key',
      '☁️ [Job: iOS] Збірка IPA архіву завершена успішно. Авто-відправка в Apple TestFlight & App Store Connect!',
      '🤖 [Job: Android] Запуск EAS Build для платформи Android (Profile: production, AAB Bundle)...',
      '🔑 [Job: Android] Релізний підпис Keystore та верифікація google-service-account.json',
      '📦 [Job: Android] Збірка app-release.aab завершена. Відправка в Google Play Console (Internal Testing track)!',
      '✅ [CI/CD] Успішно! Версія v1.0.0 доступна для тестувальників у TestFlight та Google Play Store 🍻'
    ];

    steps.forEach((log, index) => {
      setTimeout(() => {
        setCiLogs((prev) => [...prev, log]);
        if (index === steps.length - 1) {
          setIsSimulatingCi(false);
          setCiStatus('success');
          sounds.playMatchCheer();
        }
      }, (index + 1) * 600);
    });
  };

  const handleRunMongoQuery = () => {
    setIsExecutingQuery(true);
    sounds.playMessageSent();
    setTimeout(() => {
      setIsExecutingQuery(false);
      const mockResult = [
        {
          _id: "66e2a1b9c45012e8f1",
          name: "Богдан",
          age: 28,
          preferredDrinks: ["craft", "cider"],
          location: {
            type: "Point",
            coordinates: [30.518, 50.463] // [lng, lat]
          },
          distanceMeters: 620,
          currentMood: "chill_talk",
          activeCheckIn: {
            barName: "Squat 17b",
            sinceTime: new Date().toISOString()
          }
        },
        {
          _id: "66e2a1b9c45012e8f4",
          name: "Ярослав",
          age: 25,
          preferredDrinks: ["beer", "craft"],
          location: {
            type: "Point",
            coordinates: [30.516, 50.435]
          },
          distanceMeters: 1840,
          currentMood: "sports_football"
        }
      ];
      setQueryResult(JSON.stringify(mockResult, null, 2));
    }, 400);
  };

  const codeSnippets = {
    expo_app: `// App.tsx - React Native + Expo Entry Point
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';
import { io } from 'socket.io-client';

// Screens
import DiscoverScreen from './src/screens/DiscoverScreen';
import RadarScreen from './src/screens/RadarScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export const socket = io('https://api.sobutylnyk.app', {
  autoConnect: false,
  transports: ['websocket'],
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#262626' },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#a3a3a3',
      }}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Пошук 🍻' }} />
      <Tab.Screen name="Radar" component={RadarScreen} options={{ title: 'Радар 📡' }} />
      <Tab.Screen name="Chats" component={ChatListScreen} options={{ title: 'Чати 💬' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профіль 👤' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Listen to Firebase Authentication
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      if (usr) {
        socket.auth = { token: usr.accessToken, uid: usr.uid };
        socket.connect();
      } else {
        socket.disconnect();
      }
    });

    // 2. Request GPS permissions for MongoDB 2dsphere near search
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        // Sync coords to MongoDB backend via API
      }
    })();

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}`,
    mongo_schemas: `// models/User.js - MongoDB Mongoose Schema
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  avatarUrl: String,
  tagline: String,
  bio: String,
  
  // Geospatial GeoJSON for MongoDB 2dsphere index ($nearSphere)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },

  preferredDrinks: [{
    type: String,
    enum: ['beer', 'craft', 'wine', 'cocktail', 'whiskey', 'cider', 'shots', 'non_alcoholic'],
  }],

  paymentRule: {
    type: String,
    enum: ['split_50_50', 'each_for_themselves', 'i_treat', 'rounds'],
    default: 'split_50_50',
  },

  currentMood: {
    type: String,
    enum: ['chill_talk', 'coding_it', 'board_games', 'bar_crawl', 'sports_football', 'deep_philosophy'],
  },

  favoriteBars: [String],
  talkTopics: [String],

  activeCheckIn: {
    barName: String,
    note: String,
    sinceTime: Date,
  },

  lastOnlineAt: { type: Date, default: Date.now },
}, { timestamps: true });

// CRITICAL for MongoDB geospatial query efficiency:
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ preferredDrinks: 1, currentMood: 1 });

module.exports = mongoose.model('User', UserSchema);`,
    backend_socket: `// server.js - Node.js + Express + Socket.IO + MongoDB Mongoose
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const admin = require('firebase-admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());

// 1. Connect MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sobutylnyk_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 2. Geospatial API Route: Find buddies within radius
app.get('/api/buddies/near', async (req, res) => {
  const { lng, lat, maxDistance = 3000, drink } = req.query;
  try {
    const query = {
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance), // in meters
        },
      },
    };

    if (drink) {
      query.preferredDrinks = drink;
    }

    const User = mongoose.model('User');
    const buddies = await User.find(query).limit(30);
    res.json(buddies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Real-Time Chat & Cheers via Socket.IO
io.on('connection', (socket) => {
  console.log('Buddy connected:', socket.id);

  socket.on('join_chat', ({ chatId }) => {
    socket.join(chatId);
  });

  socket.on('send_message', async (data) => {
    // 1. Save message to MongoDB Chat collection
    // 2. Broadcast to room
    io.to(data.chatId).emit('receive_message', {
      ...data,
      createdAt: new Date(),
    });
  });

  // Special "Дзинь! / Тост 🍻" real-time broadcast event
  socket.on('send_toast_cheers', (data) => {
    io.to(data.chatId).emit('receive_toast_cheers', {
      senderId: data.senderId,
      senderName: data.senderName,
      toastText: data.toastText,
      timestamp: new Date(),
    });
  });
});

server.listen(3000, () => console.log('Sobutylnyk Server on port 3000'));`,
    firebase_auth: `// src/config/firebase.ts - Firebase Auth SDK Configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "sobutylnyk-app.firebaseapp.com",
  projectId: "sobutylnyk-app",
  storageBucket: "sobutylnyk-app.appspot.com",
  messagingSenderId: "747705824020",
  appId: "1:747705824020:web:89a241b7cd9102",
};

// Initialize Firebase with React Native AsyncStorage persistence
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});`,
    github_workflow: `# .github/workflows/build-deploy-stores.yml
name: Build & Release to Apple & Android Stores

on:
  push:
    tags:
      - 'v*'
    branches:
      - main
      - release/*
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to build & release'
        required: true
        default: 'all'
        type: choice
        options: [all, ios, android]
      profile:
        description: 'EAS Build profile'
        required: true
        default: 'production'
        type: choice
        options: [production, preview]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  # iOS Build -> Apple TestFlight & App Store
  build-ios:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: \${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - name: Build and Auto-Submit to TestFlight
        run: |
          eas build --platform ios --profile production --non-interactive --auto-submit

  # Android Build -> Google Play Console
  build-android:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: \${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - name: Decode Google Play Service Account
        run: |
          echo "\${{ secrets.GOOGLE_SERVICE_ACCOUNT_BASE64 }}" | base64 --decode > google-service-account.json
      - name: Build and Auto-Submit AAB to Google Play
        run: |
          eas build --platform android --profile production --non-interactive --auto-submit`,
    eas_config: `{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "ios": { "resourceClass": "m-medium" },
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "tepasha.90@gmail.com",
        "ascAppId": "6478901234",
        "appleTeamId": "AB12CD34EF",
        "sku": "budmo-ios-app"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal",
        "releaseStatus": "completed",
        "changesNotSentForReview": false
      }
    }
  }
}`,
    fastlane_fastfile: `# fastlane/Fastfile - Bare/Custom Native Automation
default_platform(:all)

platform :ios do
  desc "Build iOS IPA and push to Apple TestFlight"
  lane :beta do
    api_key = app_store_connect_api_key(
      key_id: ENV["APP_STORE_CONNECT_KEY_ID"],
      issuer_id: ENV["APP_STORE_CONNECT_ISSUER_ID"],
      key_filepath: "./private_keys/AuthKey_#{ENV['APP_STORE_CONNECT_KEY_ID']}.p8"
    )
    match(type: "appstore", readonly: true, api_key: api_key) if ENV["CI"]
    build_app(workspace: "ios/BudmoApp.xcworkspace", scheme: "BudmoApp")
    upload_to_testflight(api_key: api_key, skip_waiting_for_build_processing: true)
  end

  desc "Release iOS build to Apple App Store"
  lane :release do
    deliver(force: true, submit_for_review: true, automatic_release: true)
  end
end

platform :android do
  desc "Build Android AAB and push to Google Play Internal Track"
  lane :beta do
    gradle(task: "bundle", build_type: "Release", project_dir: "android/")
    upload_to_play_store(
      track: "internal",
      package_name: "com.budmo.app",
      json_key: "./google-service-account.json",
      aab: "android/app/build/outputs/bundle/release/app-release.aab"
    )
  end

  desc "Promote to Google Play Production Track"
  lane :release do
    upload_to_play_store(
      track: "production",
      package_name: "com.budmo.app",
      json_key: "./google-service-account.json",
      rollout: "0.1"
    )
  end
end`,
    app_json: `{
  "expo": {
    "name": "Будьмо! - Пошук собутильника",
    "slug": "budmo-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.budmo.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Доступ до гео-локації для пошуку найближчих собутильників."
      }
    },
    "android": {
      "package": "com.budmo.app",
      "versionCode": 1,
      "permissions": ["ACCESS_FINE_LOCATION", "CAMERA", "INTERNET"]
    }
  }
}`
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex flex-col justify-center items-center p-2 sm:p-6 overflow-hidden">
      <div className="w-full max-w-5xl h-[92vh] bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400 font-bold">
              🛠️
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Архітектура додатку: React Native + Expo + MongoDB + Firebase
              </h2>
              <p className="text-xs text-neutral-400">
                Повний набір вихідних файлів, Mongoose схем, Socket.IO бекенду та гео-запитів
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-arch-hub-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons Bar */}
        <div className="px-6 py-2 border-b border-neutral-800 bg-neutral-900 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Огляд Архітектури</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expo_app')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'expo_app'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>React Native (App.tsx)</span>
          </button>

          <button
            type="button"
            id="tab-btn-cicd-stores"
            onClick={() => setActiveTab('cicd_stores')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'cicd_stores'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>CI/CD (Apple & Android Store)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mongo_schemas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'mongo_schemas'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>MongoDB Схеми (Mongoose)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backend_socket')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'backend_socket'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Node.js + Socket.IO Backend</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('firebase_auth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'firebase_auth'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Firebase Auth SDK</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mongo_runner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'mongo_runner'
                ? 'bg-emerald-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Тестер MongoDB гео-запиту ($nearSphere)</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-6 overflow-y-auto no-scrollbar bg-neutral-950/60">
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Layer 1: Frontend */}
                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Code2 className="w-4 h-4" />
                    <span>Frontend Mobile</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">React Native + Expo SDK 52</h4>
                  <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                    <li>Expo Router / React Navigation</li>
                    <li>React Native Gesture Handler (Свайпи)</li>
                    <li>Expo Location (GPS координати)</li>
                    <li>Socket.io Client (Real-time чат)</li>
                  </ul>
                </div>

                {/* Layer 2: Auth */}
                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <Flame className="w-4 h-4" />
                    <span>Автентифікація</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Firebase Auth</h4>
                  <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                    <li>Google OAuth & Email/Password</li>
                    <li>JWT Tokens для бекенду</li>
                    <li>Безпечні сесії в AsyncStorage</li>
                    <li>Миттєвий вхід без паролю</li>
                  </ul>
                </div>

                {/* Layer 3: Database & Real-Time */}
                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Database className="w-4 h-4" />
                    <span>База даних & Realtime</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">MongoDB + Socket.IO</h4>
                  <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                    <li>2dsphere індекс ($nearSphere гео-пошук)</li>
                    <li>Mongoose моделі User, Chat, Hangout</li>
                    <li>WebSockets для тостів та чатів</li>
                    <li>Кімнати чату за chatId</li>
                  </ul>
                </div>

                {/* Layer 4: CI/CD & Stores */}
                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <Rocket className="w-4 h-4" />
                    <span>CI/CD & Деплой у Стори</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">GitHub Actions + EAS + Fastlane</h4>
                  <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                    <li>Apple TestFlight & App Store</li>
                    <li>Google Play Console (.aab)</li>
                    <li>Автоматичні білди по git tag v*</li>
                    <li>Підписання сертифікатами & Keystore</li>
                  </ul>
                </div>
              </div>

              {/* Data Flow Diagram */}
              <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-3">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Потік даних пошуку, чату та релізу:
                </h4>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300 space-y-2 leading-relaxed">
                  <div>1. <span className="text-amber-400">[Expo App]</span> запитує GPS: <code className="text-emerald-400">Location.getCurrentPositionAsync()</code></div>
                  <div>2. <span className="text-amber-400">[Expo App]</span> авторизується у <span className="text-rose-400">Firebase Auth</span> і отримує <code className="text-cyan-400">idToken</code></div>
                  <div>3. <span className="text-amber-400">[App]</span> шле HTTP GET на <span className="text-emerald-400">/api/buddies/near?lng=30.51&lat=50.46&drink=craft</span></div>
                  <div>4. <span className="text-emerald-400">[MongoDB]</span> виконує <code className="text-amber-300">$nearSphere</code> гео-пошук собутильників за секунду</div>
                  <div>5. Користувач тисне <span className="text-amber-400">"Будьмо! / Дзинь!"</span> → Socket.IO емітить <code className="text-yellow-400">send_toast_cheers</code> у кімнату чату</div>
                  <div>6. <span className="text-cyan-400">[CI/CD Реліз]</span> комміт тегу <code className="text-amber-300">git tag v1.0.0</code> запускає білд IPA та AAB → авто-доставка в TestFlight та Google Play 🚀</div>
                </div>
              </div>
            </div>
          )}

          {/* CI/CD & App Stores Suite */}
          {activeTab === 'cicd_stores' && (
            <div className="space-y-5 max-w-4xl mx-auto">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-5 rounded-2xl border border-neutral-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        CI/CD Пайплайн: Apple App Store & Google Play Store
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Автоматизована збірка, код-сайнінг сертифікатами та деплой по пушу тегу чи гілки main
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-neutral-800 text-neutral-300 text-[11px] font-mono rounded-lg border border-neutral-700 flex items-center gap-1">
                      🍏 iOS: TestFlight
                    </span>
                    <span className="px-2.5 py-1 bg-neutral-800 text-emerald-400 text-[11px] font-mono rounded-lg border border-neutral-700 flex items-center gap-1">
                      🤖 Android: Play AAB
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800/80 text-xs">
                  <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/60">
                    <span className="text-[10px] text-neutral-400 block">Платформа iOS</span>
                    <span className="font-semibold text-white">App Store Connect</span>
                  </div>
                  <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/60">
                    <span className="text-[10px] text-neutral-400 block">Платформа Android</span>
                    <span className="font-semibold text-white">Google Play Console</span>
                  </div>
                  <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/60">
                    <span className="text-[10px] text-neutral-400 block">Cloud Build двигун</span>
                    <span className="font-semibold text-amber-400">Expo EAS + Fastlane</span>
                  </div>
                  <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/60">
                    <span className="text-[10px] text-neutral-400 block">Тригери релізу</span>
                    <span className="font-semibold text-cyan-400">push tags: v* & main</span>
                  </div>
                </div>
              </div>

              {/* Subtabs Selector */}
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setCicdSubTab('github_action')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    cicdSubTab === 'github_action'
                      ? 'bg-neutral-800 text-amber-400 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>GitHub Actions (.github/workflows)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCicdSubTab('eas_json')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    cicdSubTab === 'eas_json'
                      ? 'bg-neutral-800 text-amber-400 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>eas.json (EAS Build & Submit)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCicdSubTab('fastlane')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    cicdSubTab === 'fastlane'
                      ? 'bg-neutral-800 text-amber-400 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Fastlane (Fastfile & Appfile)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCicdSubTab('app_json')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    cicdSubTab === 'app_json'
                      ? 'bg-neutral-800 text-amber-400 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>app.json (Expo Config)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCicdSubTab('secrets')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    cicdSubTab === 'secrets'
                      ? 'bg-neutral-800 text-cyan-400 border border-cyan-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ключі та GitHub Secrets</span>
                </button>
              </div>

              {/* Subtab Contents */}
              {cicdSubTab === 'github_action' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-mono">
                      .github/workflows/build-deploy-stores.yml
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(codeSnippets.github_workflow, 'github_workflow')}
                      className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg flex items-center gap-1.5 transition"
                    >
                      {copiedFile === 'github_workflow' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFile === 'github_workflow' ? 'Скопійовано!' : 'Скопіювати YAML'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed max-h-96">
                    {codeSnippets.github_workflow}
                  </pre>
                </div>
              )}

              {cicdSubTab === 'eas_json' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-mono">eas.json (EAS Build & Submit Profiles)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(codeSnippets.eas_config, 'eas_config')}
                      className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg flex items-center gap-1.5 transition"
                    >
                      {copiedFile === 'eas_config' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFile === 'eas_config' ? 'Скопійовано!' : 'Скопіювати JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed max-h-96">
                    {codeSnippets.eas_config}
                  </pre>
                </div>
              )}

              {cicdSubTab === 'fastlane' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-mono">fastlane/Fastfile (Нативний Fastlane пайплайн)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(codeSnippets.fastlane_fastfile, 'fastlane')}
                      className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg flex items-center gap-1.5 transition"
                    >
                      {copiedFile === 'fastlane' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFile === 'fastlane' ? 'Скопійовано!' : 'Скопіювати Ruby код'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed max-h-96">
                    {codeSnippets.fastlane_fastfile}
                  </pre>
                </div>
              )}

              {cicdSubTab === 'app_json' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-mono">app.json (Expo Application Manifest)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(codeSnippets.app_json, 'app_json')}
                      className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg flex items-center gap-1.5 transition"
                    >
                      {copiedFile === 'app_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFile === 'app_json' ? 'Скопійовано!' : 'Скопіювати JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed max-h-96">
                    {codeSnippets.app_json}
                  </pre>
                </div>
              )}

              {cicdSubTab === 'secrets' && (
                <div className="space-y-4">
                  <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      Необхідні секрети для репозиторію (GitHub Repository Secrets):
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Додайте ці секрети у вашому GitHub репозиторії: <strong>Settings &gt; Secrets and variables &gt; Actions &gt; New repository secret</strong>:
                    </p>

                    <div className="space-y-2.5 text-xs font-mono">
                      <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
                        <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                          <span>EXPO_TOKEN</span>
                          <span className="text-[10px] text-neutral-500 font-sans">Обов'язковий</span>
                        </div>
                        <p className="text-neutral-400 font-sans text-[11px]">
                          Токен доступу до облікового запису Expo. Отримується на <code>expo.dev/settings/access-tokens</code>.
                        </p>
                      </div>

                      <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
                        <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                          <span>APP_STORE_CONNECT_API_KEY_BASE64</span>
                          <span className="text-[10px] text-neutral-500 font-sans">Для Apple Store</span>
                        </div>
                        <p className="text-neutral-400 font-sans text-[11px]">
                          Вміст приватного ключа <code>AuthKey_XXXXXX.p8</code>, закодований у Base64: <code>base64 -i AuthKey_XXX.p8</code>. Дозволяє безпарольний деплой на TestFlight.
                        </p>
                      </div>

                      <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
                        <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                          <span>APP_STORE_CONNECT_KEY_ID & ISSUER_ID</span>
                          <span className="text-[10px] text-neutral-500 font-sans">Для Apple Store</span>
                        </div>
                        <p className="text-neutral-400 font-sans text-[11px]">
                          Key ID (наприклад, <code>2X9R4HXF34</code>) та Issuer ID з App Store Connect &gt; Users and Access &gt; Integrations.
                        </p>
                      </div>

                      <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
                        <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                          <span>GOOGLE_SERVICE_ACCOUNT_BASE64</span>
                          <span className="text-[10px] text-neutral-500 font-sans">Для Google Play</span>
                        </div>
                        <p className="text-neutral-400 font-sans text-[11px]">
                          JSON ключ сервісного акаунту Google Cloud з правами релізу в Google Play Console, закодований у Base64: <code>base64 -i google-service-account.json</code>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive CI/CD Simulation Console */}
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      Живий симулятор GitHub Actions & EAS пайплайну
                    </span>
                  </div>
                  {ciStatus === 'running' && (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Виконується збірка...
                    </span>
                  )}
                  {ciStatus === 'success' && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Реліз v1.0.0 опубліковано!
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-400">
                  Перевірте роботу CI/CD ланцюжка: від push тегу до публікації збірок IPA (Apple TestFlight) та AAB (Google Play).
                </p>

                <button
                  type="button"
                  id="run-cicd-simulation-btn"
                  onClick={handleRunCiSimulation}
                  disabled={isSimulatingCi}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  <Rocket className="w-4 h-4" />
                  <span>{isSimulatingCi ? 'Виконується збірка на серверах...' : 'Запустити тестовий запуск CI/CD пайплайну (v1.0.0)'}</span>
                </button>

                {ciLogs.length > 0 && (
                  <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800 space-y-1.5 font-mono text-xs max-h-60 overflow-y-auto">
                    {ciLogs.map((log, i) => (
                      <div
                        key={i}
                        className={`leading-relaxed ${
                          log.includes('✅')
                            ? 'text-emerald-400 font-bold'
                            : log.includes('🍏')
                            ? 'text-amber-200'
                            : log.includes('🤖')
                            ? 'text-emerald-300'
                            : 'text-neutral-300'
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expo App.tsx Code */}
          {activeTab === 'expo_app' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400 font-mono">App.tsx (React Native Entry)</span>
                <button
                  type="button"
                  onClick={() => handleCopy(codeSnippets.expo_app, 'expo_app')}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg flex items-center gap-1.5 transition"
                >
                  {copiedFile === 'expo_app' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFile === 'expo_app' ? 'Скопійовано!' : 'Скопіювати код'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed">
                {codeSnippets.expo_app}
              </pre>
            </div>
          )}

          {/* MongoDB Schemas */}
          {activeTab === 'mongo_schemas' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400 font-mono">models/User.js (Mongoose 2dsphere Schema)</span>
                <button
                  type="button"
                  onClick={() => handleCopy(codeSnippets.mongo_schemas, 'mongo_schemas')}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg flex items-center gap-1.5 transition"
                >
                  {copiedFile === 'mongo_schemas' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFile === 'mongo_schemas' ? 'Скопійовано!' : 'Скопіювати схему'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed">
                {codeSnippets.mongo_schemas}
              </pre>
            </div>
          )}

          {/* Node.js Socket.IO Backend */}
          {activeTab === 'backend_socket' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400 font-mono">server.js (Express + Socket.IO + MongoDB)</span>
                <button
                  type="button"
                  onClick={() => handleCopy(codeSnippets.backend_socket, 'backend_socket')}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg flex items-center gap-1.5 transition"
                >
                  {copiedFile === 'backend_socket' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFile === 'backend_socket' ? 'Скопійовано!' : 'Скопіювати сервер'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed">
                {codeSnippets.backend_socket}
              </pre>
            </div>
          )}

          {/* Firebase Auth SDK */}
          {activeTab === 'firebase_auth' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400 font-mono">src/config/firebase.ts (React Native Firebase Setup)</span>
                <button
                  type="button"
                  onClick={() => handleCopy(codeSnippets.firebase_auth, 'firebase_auth')}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg flex items-center gap-1.5 transition"
                >
                  {copiedFile === 'firebase_auth' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFile === 'firebase_auth' ? 'Скопійовано!' : 'Скопіювати конфіг'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed">
                {codeSnippets.firebase_auth}
              </pre>
            </div>
          )}

          {/* MongoDB Geospatial Live Runner */}
          {activeTab === 'mongo_runner' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Живий симулятор MongoDB гео-пошуку ($nearSphere):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-mono text-[11px]">
                      $maxDistance (метри): {queryDistance} м
                    </label>
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="500"
                      value={queryDistance}
                      onChange={(e) => setQueryDistance(parseInt(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-mono text-[11px]">
                      Фільтр за напоєм:
                    </label>
                    <select
                      value={queryDrink}
                      onChange={(e) => setQueryDrink(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-white font-mono text-xs"
                    >
                      <option value="craft">Крафтове пиво (craft)</option>
                      <option value="wine">Сухе вино (wine)</option>
                      <option value="cocktail">Коктейлі (cocktail)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  id="run-mongo-query-btn"
                  onClick={handleRunMongoQuery}
                  disabled={isExecutingQuery}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-98"
                >
                  <Play className="w-4 h-4 fill-neutral-950" />
                  <span>{isExecutingQuery ? 'Виконання запиту в MongoDB Atlas...' : 'Виконати db.users.find({ location: { $nearSphere: ... } })'}</span>
                </button>
              </div>

              {queryResult && (
                <div className="bg-neutral-900 p-4 rounded-2xl border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400">
                      Результат MongoDB курсору (JSON documents):
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                      Query Execution: 4ms
                    </span>
                  </div>
                  <pre className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed max-h-72">
                    {queryResult}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
