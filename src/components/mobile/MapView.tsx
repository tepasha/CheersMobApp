import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Beer,
  Plus,
  Compass,
  Footprints,
  Navigation,
  CheckCircle2,
  TrendingUp,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Search,
  ExternalLink,
  Star,
  Users,
  Layers,
  List,
  Map as MapIcon,
  MessageCircle,
  Radio,
  RefreshCw,
  Key,
  X,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  Circle,
  useMap,
  ColorScheme,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { BuddyProfile, HangoutAlert } from '../../types';
import { sounds } from '../../services/soundService';
import { friendsService } from '../../services/friendsService';
import { ActivityAnalyticsModal } from './ActivityAnalyticsModal';
import {
  UserGeoLocation,
  PRESET_LOCATIONS,
  calculateDistanceKm,
  calculateBearing,
  formatDistance,
  simulateWalkingStep,
} from '../../services/geoService';
import {
  GOOGLE_MAPS_VENUES,
  CATEGORY_CONFIG,
  VenueCategory,
  VenuePlace,
} from '../../data/venuesData';

interface MapViewProps {
  buddies: BuddyProfile[];
  userLocation: UserGeoLocation;
  onUpdateLocation: (newLocation: UserGeoLocation) => void;
  onSelectBuddy: (buddy: BuddyProfile) => void;
  onOpenChat: (buddy: BuddyProfile) => void;
  onNewHangout: (hangout: HangoutAlert) => void;
}

interface CityCenter {
  id: 'kyiv' | 'lviv' | 'odesa' | 'dnipro' | 'kharkiv';
  name: string;
  region: string;
  lat: number;
  lng: number;
  zoom: number;
}

const CITY_CENTERS: CityCenter[] = [
  {
    id: 'kyiv',
    name: 'Київ',
    region: 'Поділ • Золоті Ворота • Хрещатик',
    lat: 50.455,
    lng: 30.518,
    zoom: 14,
  },
  {
    id: 'lviv',
    name: 'Львів',
    region: 'Площа Ринок • Старе місто',
    lat: 49.8425,
    lng: 24.032,
    zoom: 15,
  },
  {
    id: 'odesa',
    name: 'Одеса',
    region: 'Дерибасівська • Приморський',
    lat: 46.4845,
    lng: 30.738,
    zoom: 15,
  },
  {
    id: 'dnipro',
    name: 'Дніпро',
    region: 'Набережна • Центр',
    lat: 48.464,
    lng: 35.048,
    zoom: 14,
  },
  {
    id: 'kharkiv',
    name: 'Харків',
    region: 'Сумська • Майдан Свободи',
    lat: 50.0,
    lng: 36.233,
    zoom: 14,
  },
];

// Inner Controller for smooth pan/zoom on map camera
const MapCameraController: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(center);
    }
  }, [map, center.lat, center.lng]);

  useEffect(() => {
    if (map) {
      map.setZoom(zoom);
    }
  }, [map, zoom]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  buddies,
  userLocation,
  onUpdateLocation,
  onSelectBuddy,
  onOpenChat,
  onNewHangout,
}) => {
  // Navigation & View states
  const [viewDisplay, setViewDisplay] = useState<'map' | 'list'>('map');
  const [filterLayer, setFilterLayer] = useState<'all' | 'buddies' | 'venues'>('all');
  const [radiusKm, setRadiusKm] = useState<number | 'all'>(5);
  const [selectedCategory, setSelectedCategory] = useState<VenueCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCityId, setActiveCityId] = useState<CityCenter['id']>('kyiv');

  // Google Maps camera states
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: userLocation.lat,
    lng: userLocation.lng,
  });
  const [mapZoom, setMapZoom] = useState<number>(14);

  // Google Maps API Key management
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>(() => {
    const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as Record<string, any>).env : undefined;
    return (
      metaEnv?.VITE_GOOGLE_MAPS_API_KEY ||
      localStorage.getItem('gmp_api_key') ||
      ''
    );
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(googleMapsApiKey);

  // Selection states
  const [selectedBuddy, setSelectedBuddy] = useState<BuddyProfile | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<VenuePlace | null>(null);

  // Modals & drawers
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);
  const [gpsNotification, setGpsNotification] = useState<string | null>(null);

  // Check-in form states
  const [customBar, setCustomBar] = useState('Squat 17b');
  const [customNote, setCustomNote] = useState('Сиджу біля бару, замовляю крафт. Підсідайте!');
  const [drinkChoice, setDrinkChoice] = useState('Крафтове пиво / Сидр');

  // Trigger toast
  const triggerNotification = (msg: string) => {
    setGpsNotification(msg);
    setTimeout(() => setGpsNotification(null), 3500);
  };

  // Match initial city to user coordinates
  useEffect(() => {
    let closestCity = CITY_CENTERS[0];
    let minD = Infinity;
    CITY_CENTERS.forEach((c) => {
      const d = calculateDistanceKm(userLocation.lat, userLocation.lng, c.lat, c.lng);
      if (d < minD) {
        minD = d;
        closestCity = c;
      }
    });
    if (minD < 60) {
      setActiveCityId(closestCity.id);
      setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
      setMapZoom(closestCity.zoom);
    }
  }, []);

  const activeCity = useMemo(() => {
    return CITY_CENTERS.find((c) => c.id === activeCityId) || CITY_CENTERS[0];
  }, [activeCityId]);

  // Helper for walking time
  const getWalkTimeMinutes = (distKm: number) => {
    const mins = Math.max(1, Math.round((distKm / 4.5) * 60));
    return `~${mins} хв пішки`;
  };

  // Buddies with computed live distance & bearing
  const buddiesWithGeo = useMemo(() => {
    return buddies.map((b) => {
      const dist = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        b.coordinates.lat,
        b.coordinates.lng
      );
      const bearing = calculateBearing(
        userLocation.lat,
        userLocation.lng,
        b.coordinates.lat,
        b.coordinates.lng
      );
      return {
        ...b,
        distanceKm: dist,
        bearing,
      };
    });
  }, [buddies, userLocation]);

  // Filtered buddies for active view & radius
  const filteredBuddies = useMemo(() => {
    if (filterLayer === 'venues') return [];

    return buddiesWithGeo.filter((b) => {
      // Radius filter relative to user
      if (radiusKm !== 'all' && b.distanceKm > radiusKm) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.name.toLowerCase().includes(q);
        const matchTag = b.tagline.toLowerCase().includes(q);
        const matchBar = b.activeCheckIn?.barName.toLowerCase().includes(q);
        const matchLoc = b.locationName.toLowerCase().includes(q);
        if (!matchName && !matchTag && !matchBar && !matchLoc) {
          return false;
        }
      }
      return true;
    });
  }, [buddiesWithGeo, filterLayer, radiusKm, searchQuery]);

  // Venues filtered by city, category, radius and search
  const filteredVenues = useMemo(() => {
    if (filterLayer === 'buddies') return [];

    return GOOGLE_MAPS_VENUES.filter((v) => {
      // City filter
      if (v.cityId !== activeCityId) return false;

      // Category filter
      if (selectedCategory !== 'all' && v.category !== selectedCategory) {
        return false;
      }

      // Proximity distance from user
      const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, v.lat, v.lng);
      if (radiusKm !== 'all' && dist > radiusKm) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.name.toLowerCase().includes(q);
        const matchAddr = v.address.toLowerCase().includes(q);
        const matchDist = v.district.toLowerCase().includes(q);
        const matchDrink = v.popularDrinks.some((d) => d.toLowerCase().includes(q));
        if (!matchName && !matchAddr && !matchDist && !matchDrink) {
          return false;
        }
      }

      return true;
    });
  }, [filterLayer, activeCityId, selectedCategory, userLocation, radiusKm, searchQuery]);

  // Google Map Click handler (reposition user location on map click)
  const handleGoogleMapClick = (e: MapMouseEvent) => {
    if (!e.detail.latLng) return;
    const lat = Math.round(e.detail.latLng.lat * 10000) / 10000;
    const lng = Math.round(e.detail.latLng.lng * 10000) / 10000;

    sounds.playTap();
    const updatedTime = new Date().toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    onUpdateLocation({
      ...userLocation,
      lat,
      lng,
      lastUpdated: updatedTime,
      accuracyMeters: 6,
    });
    triggerNotification(`📍 Вашу точку на Google Maps переміщено (${lat}, ${lng})`);
  };

  // Center on user position
  const handleCenterOnUser = () => {
    sounds.playTap();
    setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
    setMapZoom(15);
    triggerNotification('🎯 Центровано на вашій позиції');
  };

  // Camera zoom controls
  const handleZoomIn = () => {
    sounds.playTap();
    setMapZoom((z) => Math.min(20, z + 1));
  };

  const handleZoomOut = () => {
    sounds.playTap();
    setMapZoom((z) => Math.max(8, z - 1));
  };

  // Select city
  const _handleSelectCity = (city: CityCenter) => {
    sounds.playTap();
    setActiveCityId(city.id);
    setMapCenter({ lat: city.lat, lng: city.lng });
    setMapZoom(city.zoom);
    setSelectedBuddy(null);
    setSelectedVenue(null);
    triggerNotification(`🏙️ Перехід до міста: ${city.name}`);
  };

  // Simulate walking step (+85m)
  const handleSimulateWalk = () => {
    sounds.playClink();
    const newCoords = simulateWalkingStep(userLocation.lat, userLocation.lng);
    const updatedTime = new Date().toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    onUpdateLocation({
      ...userLocation,
      lat: newCoords.lat,
      lng: newCoords.lng,
      lastUpdated: updatedTime,
      accuracyMeters: 5,
    });
    setMapCenter({ lat: newCoords.lat, lng: newCoords.lng });
    triggerNotification('🚶‍♂️ Крок пішки: координати оновлено на +85м');
  };

  // Refresh GPS coordinates
  const handleRefreshGps = () => {
    sounds.playTap();
    setIsRefreshingGps(true);
    triggerNotification('🛰️ Супутниковий запит GPS...');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const updatedTime = new Date().toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          onUpdateLocation({
            lat: Math.round(pos.coords.latitude * 10000) / 10000,
            lng: Math.round(pos.coords.longitude * 10000) / 10000,
            locationName: 'Реальна геолокація GPS',
            accuracyMeters: Math.round(pos.coords.accuracy) || 6,
            lastUpdated: updatedTime,
            isSimulated: false,
            status: 'active',
          });
          setIsRefreshingGps(false);
          triggerNotification('✅ Отримано точні супутникові координати!');
        },
        () => {
          setTimeout(() => {
            setIsRefreshingGps(false);
            triggerNotification('✅ Калібрований GPS сигнал стабільний');
          }, 600);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setTimeout(() => {
        setIsRefreshingGps(false);
        triggerNotification('✅ Калібрований GPS сигнал стабільний');
      }, 600);
    }
  };

  // Handle Preset selection
  const handleSelectPreset = (preset: (typeof PRESET_LOCATIONS)[0]) => {
    sounds.playClink();
    const updatedTime = new Date().toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    onUpdateLocation({
      lat: preset.lat,
      lng: preset.lng,
      locationName: preset.name,
      accuracyMeters: 5,
      lastUpdated: updatedTime,
      isSimulated: true,
      status: 'active',
    });
    triggerNotification(`📍 Локацію змінено: ${preset.name}`);
    setShowLocationDrawer(false);
  };

  // Check-In submission
  const handleCreateCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBar.trim()) return;

    sounds.playClink();
    const newAlert: HangoutAlert = {
      id: `hangout-${Date.now()}`,
      userId: 'me',
      userName: 'Ви (Мій чек-ін)',
      userAvatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      barName: customBar,
      locationArea: userLocation.locationName,
      drinkPreference: drinkChoice,
      description: customNote,
      createdAt: 'Щойно',
      slotsAvailable: 2,
      participantsCount: 1,
    };

    onNewHangout(newAlert);
    setShowCheckInModal(false);
    triggerNotification(`🍻 Чек-ін у "${customBar}" з'явився на мапі!`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden relative select-none">
      {/* Floating GPS Notification Toast */}
      {gpsNotification && (
        <div className="absolute top-14 left-4 right-4 z-50 bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 text-xs px-3 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 truncate font-medium">{gpsNotification}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="px-3 py-2.5 border-b border-neutral-900 bg-neutral-950/95 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Location details */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold text-neutral-100 truncate">
                  {userLocation.locationName}
                </h2>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  GPS ±{userLocation.accuracyMeters}м
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
                <span>{userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E</span>
                <span>• Оновлено {userLocation.lastUpdated}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Peak Hours Activity Graph */}
            <button
              id="map-activity-modal-btn"
              type="button"
              onClick={() => {
                sounds.playClink();
                setShowActivityModal(true);
              }}
              title="Графік активності закладів та людей (Recharts)"
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-amber-400 border border-neutral-800 transition active:scale-95 flex items-center gap-1 text-xs"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold hidden xs:inline">Пік</span>
            </button>

            {/* View toggle (Map vs List) */}
            <button
              id="map-view-toggle-btn"
              type="button"
              onClick={() => {
                sounds.playTap();
                setViewDisplay(viewDisplay === 'map' ? 'list' : 'map');
              }}
              title="Перемкнути вигляд: Мапа / Список"
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 transition active:scale-95 flex items-center gap-1 text-xs"
            >
              {viewDisplay === 'map' ? (
                <>
                  <List className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] font-semibold hidden xs:inline">Список</span>
                </>
              ) : (
                <>
                  <MapIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-semibold hidden xs:inline">Мапа</span>
                </>
              )}
            </button>

            {/* Check-in button */}
            <button
              id="map-checkin-quick-btn"
              type="button"
              onClick={() => {
                sounds.playClink();
                setShowCheckInModal(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Я в барі!</span>
            </button>

            {/* Google Maps API Key Config Button */}
            <button
              id="map-apikey-config-btn"
              type="button"
              onClick={() => {
                sounds.playTap();
                setShowApiKeyModal(true);
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 text-xs shadow-md transition active:scale-95"
              title="Налаштування Google Maps API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-mono text-[10px]">API Key</span>
            </button>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="mt-2 pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] gap-2 overflow-x-auto no-scrollbar">
          {/* Layer Filter: All / People / Venues */}
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 shrink-0">
            <button
              type="button"
              id="layer-filter-all-btn"
              onClick={() => {
                sounds.playTap();
                setFilterLayer('all');
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                filterLayer === 'all'
                  ? 'bg-amber-500 text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Всі ({filteredBuddies.length + filteredVenues.length})</span>
            </button>
            <button
              type="button"
              id="layer-filter-buddies-btn"
              onClick={() => {
                sounds.playTap();
                setFilterLayer('buddies');
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                filterLayer === 'buddies'
                  ? 'bg-emerald-500 text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Люди ({filteredBuddies.length})</span>
            </button>
            <button
              type="button"
              id="layer-filter-venues-btn"
              onClick={() => {
                sounds.playTap();
                setFilterLayer('venues');
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                filterLayer === 'venues'
                  ? 'bg-rose-500 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Beer className="w-3 h-3" />
              <span>Заклади ({filteredVenues.length})</span>
            </button>
          </div>

          {/* Proximity Radius Filter */}
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 shrink-0">
            {([1, 3, 5, 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                id={`map-radius-btn-${r}`}
                onClick={() => {
                  sounds.playTap();
                  setRadiusKm(r);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                  radiusKm === r
                    ? 'bg-neutral-200 text-neutral-950'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {r === 'all' ? 'Всі' : `${r}км`}
              </button>
            ))}
          </div>

          {/* District drawer toggle */}
          <button
            type="button"
            id="map-open-districts-btn"
            onClick={() => setShowLocationDrawer(!showLocationDrawer)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 font-medium transition shrink-0"
          >
            <Navigation className="w-3 h-3 text-amber-400" />
            <span>Район</span>
          </button>
        </div>

        {/* Venue Category Filter Chips (visible when venues are enabled) */}
        {filterLayer !== 'buddies' && (
          <div className="mt-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-[10px]">
            <button
              type="button"
              id="cat-select-all-btn"
              onClick={() => {
                sounds.playTap();
                setSelectedCategory('all');
              }}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap border transition ${
                selectedCategory === 'all'
                  ? 'bg-neutral-200 text-neutral-950 font-bold border-neutral-200'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              Всі типи
            </button>
            {(Object.keys(CATEGORY_CONFIG) as VenueCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  id={`cat-select-${cat}-btn`}
                  onClick={() => {
                    sounds.playTap();
                    setSelectedCategory(isSelected ? 'all' : cat);
                  }}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap border transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Expandable Location Selector Panel */}
      {showLocationDrawer && (
        <div className="mx-3 mt-2 p-3 bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-2 z-30 shrink-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Швидка зміна локації (райони Києва та міст)</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowLocationDrawer(false)}
              className="text-neutral-400 hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
            {PRESET_LOCATIONS.map((preset) => {
              const isCurrent = userLocation.locationName.includes(preset.name.split(' ')[0]);
              return (
                <button
                  key={preset.id}
                  type="button"
                  id={`preset-${preset.id}`}
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-center justify-between p-2 rounded-xl text-left border transition ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold">{preset.name}</p>
                    <p className="text-[10px] text-neutral-400">Бари: {preset.popularBars}</p>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                      Тут
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area: Google Maps vs Sorted List */}
      {viewDisplay === 'map' ? (
        <div className="flex-1 relative flex flex-col overflow-hidden bg-neutral-950">
          {/* Missing API Key notification banner */}
          {!googleMapsApiKey && (
            <div className="mx-3 mt-2 p-2 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200 z-30 shrink-0 shadow-lg">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px]">
                  Для доступу до Google Maps вкажіть ключ або скористайтесь{' '}
                  <a
                    href="https://mapsplatform.google.com/maps-demo-key"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold text-amber-300 hover:text-amber-200"
                  >
                    Maps Demo Key ↗
                  </a>
                </span>
              </div>
              <button
                type="button"
                id="banner-open-apikey-modal-btn"
                onClick={() => setShowApiKeyModal(true)}
                className="ml-2 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-[10px] whitespace-nowrap shadow transition active:scale-95"
              >
                Ввести ключ
              </button>
            </div>
          )}

          {/* Map Controls Overlay (Floating Top Right) */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
            {/* Zoom In */}
            <button
              type="button"
              id="map-zoom-in-btn"
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-750 shadow-lg flex items-center justify-center transition active:scale-95"
              title="Збільшити масштаб"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {/* Zoom Out */}
            <button
              type="button"
              id="map-zoom-out-btn"
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-750 shadow-lg flex items-center justify-center transition active:scale-95"
              title="Зменшити масштаб"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            {/* Center on User */}
            <button
              type="button"
              id="map-center-user-btn"
              onClick={handleCenterOnUser}
              className="w-8 h-8 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-amber-400 border border-neutral-750 shadow-lg flex items-center justify-center transition active:scale-95"
              title="Центрувати на мені"
            >
              <Crosshair className="w-4 h-4" />
            </button>
            {/* Walk Step */}
            <button
              type="button"
              id="map-walk-step-btn"
              onClick={handleSimulateWalk}
              className="w-8 h-8 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-emerald-400 border border-neutral-750 shadow-lg flex items-center justify-center transition active:scale-95"
              title="Симулювати крок пішки (+85м)"
            >
              <Footprints className="w-4 h-4" />
            </button>
            {/* Refresh GPS */}
            <button
              type="button"
              id="map-refresh-gps-btn"
              onClick={handleRefreshGps}
              disabled={isRefreshingGps}
              className="w-8 h-8 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 border border-neutral-750 shadow-lg flex items-center justify-center transition active:scale-95"
              title="Оновити GPS координати"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingGps ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            {/* API Key Modal Button */}
            <button
              type="button"
              id="map-controls-apikey-btn"
              onClick={() => setShowApiKeyModal(true)}
              className="w-8 h-8 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-amber-400 border border-neutral-750 shadow-lg flex items-center justify-center transition active:scale-95"
              title="Google Maps API Key"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Google Maps Canvas Container */}
          <div className="flex-1 w-full h-full relative min-h-[380px] overflow-hidden">
            <APIProvider apiKey={googleMapsApiKey} libraries={['marker', 'places']}>
              <GoogleMap
                id="google-maps-element"
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                colorScheme={ColorScheme.DARK}
                defaultCenter={{ lat: activeCity.lat, lng: activeCity.lng }}
                defaultZoom={14}
                gestureHandling="greedy"
                disableDefaultUI={true}
                onClick={handleGoogleMapClick}
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
              >
                <MapCameraController center={mapCenter} zoom={mapZoom} />

                {/* User Location Radar Marker */}
                <AdvancedMarker
                  position={{ lat: userLocation.lat, lng: userLocation.lng }}
                  title={`Ви тут (${userLocation.locationName})`}
                  onClick={() => {
                    sounds.playTap();
                    triggerNotification(`📍 Ваша позиція: ${userLocation.locationName} (${userLocation.lat}, ${userLocation.lng})`);
                  }}
                >
                  <div className="relative flex flex-col items-center select-none cursor-pointer">
                    <span className="absolute -inset-3 rounded-full bg-emerald-500/35 animate-ping pointer-events-none" />
                    <div className="relative w-9 h-9 rounded-full border-2 border-emerald-400 bg-neutral-900 shadow-2xl overflow-hidden flex items-center justify-center ring-2 ring-emerald-500/50">
                      <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                        alt="Ви"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-1 bg-emerald-950/95 border border-emerald-500/70 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-emerald-300 whitespace-nowrap shadow-lg flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Ви тут</span>
                    </div>
                  </div>
                </AdvancedMarker>

                {/* People Nearby Markers */}
                {(filterLayer === 'all' || filterLayer === 'buddies') &&
                  filteredBuddies.map((b) => {
                    const isSelected = selectedBuddy?.id === b.id;
                    const hasCheckIn = !!b.activeCheckIn;

                    return (
                      <AdvancedMarker
                        key={`buddy-${b.id}`}
                        position={{ lat: b.coordinates.lat, lng: b.coordinates.lng }}
                        title={`${b.name} (${formatDistance(b.distanceKm)})`}
                        onClick={() => {
                          sounds.playClink();
                          setSelectedBuddy(b);
                          setSelectedVenue(null);
                        }}
                      >
                        <div className="relative flex flex-col items-center select-none cursor-pointer transition-transform hover:scale-110">
                          {hasCheckIn && (
                            <span className="absolute -inset-2.5 rounded-full bg-rose-500/40 animate-ping pointer-events-none" />
                          )}
                          {isSelected && (
                            <span className="absolute -inset-1.5 rounded-full border-2 border-amber-400 ring-2 ring-amber-400/40 pointer-events-none animate-pulse" />
                          )}
                          <div
                            className={`relative w-8 h-8 rounded-full border-2 overflow-hidden shadow-lg ${
                              isSelected
                                ? 'border-amber-400 ring-2 ring-amber-400/70 scale-105'
                                : hasCheckIn
                                ? 'border-rose-500 ring-1 ring-rose-500/40'
                                : b.online
                                ? 'border-emerald-500'
                                : 'border-neutral-500'
                            }`}
                          >
                            <img src={b.avatar} alt={b.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[9px]">
                            {hasCheckIn ? '🍻' : b.online ? '🟢' : '⚪'}
                          </div>
                          <div className="mt-1 bg-neutral-950/95 border border-neutral-750 px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-neutral-200 whitespace-nowrap shadow-md flex items-center gap-1">
                            <span>{b.name}</span>
                            <span className="text-neutral-400 font-normal">• {formatDistance(b.distanceKm)}</span>
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                {/* Verified Venues Markers */}
                {(filterLayer === 'all' || filterLayer === 'venues') &&
                  filteredVenues.map((v) => {
                    const isSelected = selectedVenue?.id === v.id;
                    const cfg = CATEGORY_CONFIG[v.category];
                    const buddiesHere = buddiesWithGeo.filter(
                      (b) =>
                        b.activeCheckIn &&
                        b.activeCheckIn.barName.toLowerCase().includes(v.name.toLowerCase().split(' ')[0])
                    );

                    return (
                      <AdvancedMarker
                        key={`venue-${v.id}`}
                        position={{ lat: v.lat, lng: v.lng }}
                        title={`${v.name} (★${v.rating})`}
                        onClick={() => {
                          sounds.playTap();
                          setSelectedVenue(v);
                          setSelectedBuddy(null);
                        }}
                      >
                        <div className="relative flex flex-col items-center select-none cursor-pointer transition-transform hover:scale-110">
                          {isSelected && (
                            <span className="absolute -inset-1.5 rounded-xl border-2 border-amber-400 pointer-events-none animate-pulse" />
                          )}
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm shadow-xl border border-neutral-950 text-white ${
                              isSelected ? 'ring-2 ring-amber-400 scale-110' : ''
                            }`}
                            style={{ backgroundColor: cfg?.pinColor || '#f59e0b' }}
                          >
                            {cfg?.icon || '🍺'}
                          </div>
                          {buddiesHere.length > 0 && (
                            <div className="absolute -top-1.5 -right-1.5 px-1 rounded-full bg-rose-500 border border-neutral-900 text-[8px] font-bold text-white shadow">
                              {buddiesHere.length}👥
                            </div>
                          )}
                          <div
                            className={`mt-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap shadow-md flex items-center gap-1 border ${
                              isSelected
                                ? 'bg-amber-950/95 border-amber-500 text-amber-200'
                                : 'bg-neutral-950/95 border-neutral-800 text-neutral-200'
                            }`}
                          >
                            <span className="text-amber-400 font-black">★{v.rating}</span>
                            <span>{v.name.slice(0, 14)}</span>
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                {/* Coverage Radius Circle */}
                {radiusKm !== 'all' && (
                  <Circle
                    center={{ lat: userLocation.lat, lng: userLocation.lng }}
                    radius={radiusKm * 1000}
                    strokeColor="#10b981"
                    strokeOpacity={0.6}
                    strokeWeight={1.5}
                    fillColor="#10b981"
                    fillOpacity={0.06}
                  />
                )}

                {/* Selected Venue InfoWindow */}
                {selectedVenue && (
                  <InfoWindow
                    position={{ lat: selectedVenue.lat, lng: selectedVenue.lng }}
                    onCloseClick={() => setSelectedVenue(null)}
                    headerContent={
                      <div className="flex items-center gap-1 text-xs font-bold text-neutral-900">
                        <span>{CATEGORY_CONFIG[selectedVenue.category]?.icon || '🍺'}</span>
                        <span>{selectedVenue.name}</span>
                      </div>
                    }
                  >
                    <div className="text-xs text-neutral-800 max-w-[200px] p-0.5">
                      <div className="flex items-center gap-1 font-semibold text-amber-600">
                        <span>★ {selectedVenue.rating}</span>
                        <span className="text-neutral-500 font-normal">({selectedVenue.reviewCount} відгуків)</span>
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-0.5">{selectedVenue.address}</p>
                      <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2">{selectedVenue.description}</p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </APIProvider>

            {/* Bottom Status Info Strip on Map */}
            <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between text-[10px] text-neutral-400 bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 pointer-events-none">
              <span className="flex items-center gap-1.5 truncate">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">
                  Знайдено: <strong className="text-white">{filteredBuddies.length}</strong> людей,{' '}
                  <strong className="text-amber-400">{filteredVenues.length}</strong> закладів
                </span>
              </span>
              <span className="shrink-0 text-neutral-300 font-mono flex items-center gap-1">
                <span className="text-amber-400 font-bold">Google Maps</span> • {activeCity.name}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Alternative View: Sorted List Feed of Nearby People & Venues */
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 bg-neutral-950">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <List className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Люди та заклади поруч ({filteredBuddies.length + filteredVenues.length})
              </span>
            </h3>
            <span className="text-[10px] text-neutral-400">Сортування за відстанню</span>
          </div>

          {/* Search bar inside list view */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              id="map-list-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук людей або барів..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* People Section in List */}
          {(filterLayer === 'all' || filterLayer === 'buddies') && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Люди поблизу ({filteredBuddies.length})</span>
              </h4>

              {filteredBuddies.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-2">
                  У цьому радіусі людей не знайдено. Спробуйте збільшити радіус до 5км або обрати інше місто.
                </p>
              ) : (
                filteredBuddies.map((b) => (
                  <div
                    key={`list-b-${b.id}`}
                    id={`list-buddy-${b.id}`}
                    onClick={() => {
                      sounds.playClink();
                      setSelectedBuddy(b);
                      setSelectedVenue(null);
                      setViewDisplay('map');
                    }}
                    className="p-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/40 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={b.avatar}
                          alt={b.name}
                          className="w-11 h-11 rounded-full object-cover border border-emerald-500/40"
                        />
                        {b.activeCheckIn && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-neutral-950 animate-ping" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-neutral-100 truncate">
                            {b.name}, {b.age}
                          </h5>
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-800/40">
                            {formatDistance(b.distanceKm)}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {getWalkTimeMinutes(b.distanceKm)}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate">{b.tagline}</p>
                        {b.activeCheckIn && (
                          <p className="text-[10px] text-rose-400 truncate flex items-center gap-1 mt-0.5">
                            <Beer className="w-2.5 h-2.5 shrink-0" />
                            <span>Зараз у {b.activeCheckIn.barName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(b);
                      }}
                      className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition active:scale-95 shrink-0"
                      title="Відкрити чат"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Venues Section in List */}
          {(filterLayer === 'all' || filterLayer === 'venues') && (
            <div className="space-y-2 pt-2">
              <h4 className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <Beer className="w-3 h-3" />
                <span>Заклади та бари з Google Maps ({filteredVenues.length})</span>
              </h4>

              {filteredVenues.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-2">
                  Закладів у цьому радіусі не знайдено.
                </p>
              ) : (
                filteredVenues.map((v) => {
                  const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, v.lat, v.lng);
                  const cfg = CATEGORY_CONFIG[v.category];
                  return (
                    <div
                      key={`list-v-${v.id}`}
                      id={`list-venue-${v.id}`}
                      onClick={() => {
                        sounds.playTap();
                        setSelectedVenue(v);
                        setSelectedBuddy(null);
                        setViewDisplay('map');
                      }}
                      className="p-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 transition cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-xl shrink-0 border border-neutral-700">
                          {cfg?.icon || '🍺'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-neutral-100 truncate">{v.name}</h5>
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-1 rounded border border-amber-800/40 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {v.rating}
                            </span>
                            <span className="text-[10px] text-neutral-400">{formatDistance(dist)}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 truncate">
                            {v.district} • {v.address}
                          </p>
                          <p className="text-[10px] text-neutral-400 truncate">
                            Популярне: {v.popularDrinks.join(', ')}
                          </p>
                        </div>
                      </div>
                      <a
                        href={v.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition active:scale-95 shrink-0"
                        title="Відкрити в Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Buddy Detail Sheet / Floating Card */}
      {selectedBuddy && (
        <div className="mx-3 mb-2 p-3 bg-neutral-900/95 rounded-2xl border border-amber-500/40 shadow-2xl relative animate-in fade-in slide-in-from-bottom-2 z-30 shrink-0">
          <button
            type="button"
            id="close-selected-buddy-btn"
            onClick={() => setSelectedBuddy(null)}
            className="absolute top-2.5 right-2.5 p-1 text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-start gap-3">
            <img
              src={selectedBuddy.avatar}
              alt={selectedBuddy.name}
              className="w-12 h-12 rounded-xl object-cover border border-amber-400/50 shadow shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-bold text-white flex items-center gap-1">
                  {selectedBuddy.name}, {selectedBuddy.age}
                </h4>
                <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-800/60">
                  {formatDistance(selectedBuddy.distanceKm)}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {getWalkTimeMinutes(selectedBuddy.distanceKm)}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 line-clamp-1 mt-0.5">{selectedBuddy.tagline}</p>
              {selectedBuddy.activeCheckIn ? (
                <div className="mt-1 p-1.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[10px] text-rose-300 flex items-center gap-1.5">
                  <Beer className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="truncate">
                    Зараз у <strong>{selectedBuddy.activeCheckIn.barName}</strong>: &quot;{selectedBuddy.activeCheckIn.note}&quot;
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {selectedBuddy.locationName}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              id="selected-view-profile-btn"
              onClick={() => onSelectBuddy(selectedBuddy)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-[11px] font-semibold text-neutral-200 rounded-lg transition"
            >
              Анкета
            </button>
            <button
              type="button"
              id={`map-friend-btn-${selectedBuddy.id}`}
              onClick={() => {
                friendsService.toggleFriend(selectedBuddy);
              }}
              className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition border ${
                friendsService.isFriend(selectedBuddy.id)
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-neutral-700'
              }`}
              title={friendsService.isFriend(selectedBuddy.id) ? 'У ваших друзях' : 'Додати до друзів'}
            >
              {friendsService.isFriend(selectedBuddy.id) ? (
                <>
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                  <span>У друзях</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 text-amber-400" />
                  <span>+ Друг</span>
                </>
              )}
            </button>
            <button
              type="button"
              id="selected-write-chat-btn"
              onClick={() => onOpenChat(selectedBuddy)}
              className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-[11px] font-bold text-neutral-950 rounded-lg flex items-center justify-center gap-1 transition shadow"
            >
              <Beer className="w-3 h-3" />
              <span>Будьмо! / Чат</span>
            </button>
          </div>
        </div>
      )}

      {/* Selected Venue Detail Sheet / Floating Card */}
      {selectedVenue && (
        <div className="mx-3 mb-2 p-3 bg-neutral-900/95 rounded-2xl border border-rose-500/40 shadow-2xl relative animate-in fade-in slide-in-from-bottom-2 z-30 shrink-0">
          <button
            type="button"
            id="close-selected-venue-btn"
            onClick={() => setSelectedVenue(null)}
            className="absolute top-2.5 right-2.5 p-1 text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-neutral-800 flex items-center justify-center text-xl shrink-0 border border-neutral-700">
              {CATEGORY_CONFIG[selectedVenue.category]?.icon || '🍺'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-bold text-white truncate">{selectedVenue.name}</h4>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-800/60 flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  {selectedVenue.rating}
                </span>
                <span className="text-[10px] text-neutral-400">
                  ({selectedVenue.reviewCount} відгуків Google Maps)
                </span>
              </div>
              <p className="text-[10px] text-neutral-300 mt-0.5 truncate">
                {selectedVenue.district} • {selectedVenue.address} • {selectedVenue.priceTier}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">
                {selectedVenue.description}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex gap-2">
            <a
              href={selectedVenue.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-[11px] font-semibold text-neutral-200 rounded-lg flex items-center justify-center gap-1 transition"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Google Maps ↗</span>
            </a>
            <button
              type="button"
              id="venue-checkin-quick-btn"
              onClick={() => {
                setCustomBar(selectedVenue.name);
                setShowCheckInModal(true);
              }}
              className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-400 text-[11px] font-bold text-white rounded-lg flex items-center justify-center gap-1 transition shadow"
            >
              <Beer className="w-3 h-3" />
              <span>Я тут! Чек-ін</span>
            </button>
          </div>
        </div>
      )}

      {/* Check-In Modal Dialog */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              type="button"
              id="close-checkin-modal-btn"
              onClick={() => setShowCheckInModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Beer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Чек-ін у барі</h3>
                <p className="text-[11px] text-neutral-400">Позначити свою присутність на мапі</p>
              </div>
            </div>

            <form onSubmit={handleCreateCheckIn} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Назва закладу:
                </label>
                <input
                  type="text"
                  id="checkin-bar-input"
                  value={customBar}
                  onChange={(e) => setCustomBar(e.target.value)}
                  placeholder="Наприклад: Squat 17b Yard Cafe"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Що замовляєте:
                </label>
                <select
                  id="checkin-drink-select"
                  value={drinkChoice}
                  onChange={(e) => setDrinkChoice(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Крафтове пиво / Сидр">Крафтове пиво / Сидр 🍺</option>
                  <option value="Сухе вино">Сухе вино 🍷</option>
                  <option value="Авторський коктейль">Авторський коктейль 🍸</option>
                  <option value="Віскі / Бурбон">Віскі / Бурбон 🥃</option>
                  <option value="Шоти / Настоянки">Шоти / Настоянки 🍶</option>
                  <option value="Безалкогольне / Кава">Безалкогольне / Кава ☕</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Нотатка для собутильників:
                </label>
                <textarea
                  id="checkin-note-textarea"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Де саме ви сидите і чи є вільне місце..."
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-xl text-xs font-semibold transition"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  id="submit-checkin-btn"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Beer className="w-4 h-4" />
                  <span>Чек-ін на мапу!</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Analytics Modal (Peak hours charts) */}
      <ActivityAnalyticsModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
      />

      {/* Google Maps API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Google Maps API Key</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Введіть ваш ключ Google Maps API для відображення детальної карти, векторних тайлів та точок закладів.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-neutral-300">API Key:</label>
              <input
                type="text"
                id="gmp-api-key-input"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
              <div className="text-amber-400 font-semibold">Швидкий старт:</div>
              <div>
                Отримати тестовий ключ можна на{' '}
                <a
                  href="https://mapsplatform.google.com/maps-demo-key"
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-amber-300 hover:text-amber-200"
                >
                  Maps Demo Key ↗
                </a>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setTempApiKey('');
                  setGoogleMapsApiKey('');
                  localStorage.removeItem('gmp_api_key');
                  setShowApiKeyModal(false);
                  triggerNotification('Ключ API видалено');
                }}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium transition"
              >
                Очистити
              </button>
              <button
                type="button"
                id="save-gmp-api-key-btn"
                onClick={() => {
                  const cleaned = tempApiKey.trim();
                  setGoogleMapsApiKey(cleaned);
                  if (cleaned) {
                    localStorage.setItem('gmp_api_key', cleaned);
                    triggerNotification('✅ Ключ Google Maps збережено');
                  } else {
                    localStorage.removeItem('gmp_api_key');
                  }
                  setShowApiKeyModal(false);
                }}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold transition shadow-lg"
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
