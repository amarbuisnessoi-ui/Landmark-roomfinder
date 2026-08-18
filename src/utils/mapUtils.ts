import { Room } from '../types';

export interface LatLng {
  lat: number;
  lng: number;
}

// Known coordinates table for fast instant centering without network delay
export const CITY_COORDINATES: Record<string, LatLng> = {
  'new york': { lat: 40.7128, lng: -74.006 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  seattle: { lat: 47.6062, lng: -122.3321 },
  miami: { lat: 25.7617, lng: -80.1918 },
  austin: { lat: 30.2672, lng: -97.7431 },
  boston: { lat: 42.3601, lng: -71.0589 },
  denver: { lat: 39.7392, lng: -104.9903 },
  london: { lat: 51.5074, lng: -0.1278 },
  toronto: { lat: 43.6532, lng: -79.3832 },
  kathmandu: { lat: 27.7172, lng: 85.324 },
  pokhara: { lat: 28.2096, lng: 83.9856 },
  lalitpur: { lat: 27.6644, lng: 85.3188 },
  sydney: { lat: -33.8688, lng: 151.2093 }
};

export function isValidCoordinates(lat: any, lng: any): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  const latNum = Number(lat);
  const lngNum = Number(lng);
  return (
    !isNaN(latNum) &&
    !isNaN(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180
  );
}

export function isRoomLocationExact(room: Room): boolean {
  return Boolean(
    isValidCoordinates(room.latitude, room.longitude) &&
    (room.isExactLocation === undefined || room.isExactLocation === true)
  );
}

// Retrieves the exact location if set, or fallback approximate city coordinates
export function getRoomCoordinates(room: Room): LatLng {
  if (isValidCoordinates(room.latitude, room.longitude)) {
    return { lat: Number(room.latitude), lng: Number(room.longitude) };
  }

  const cityKey = (room.city || '').trim().toLowerCase();
  const base = CITY_COORDINATES[cityKey] || { lat: 40.7128, lng: -74.006 };

  // Slight deterministic offset only for approximate city pins so they don't stack directly on top of each other
  let hash = 0;
  for (let i = 0; i < room.id.length; i++) {
    hash = (hash << 5) - hash + room.id.charCodeAt(i);
    hash |= 0;
  }
  const jitterLat = ((Math.abs(hash) % 100) - 50) * 0.0003;
  const jitterLng = (((Math.abs(hash * 31)) % 100) - 50) * 0.0003;

  return {
    lat: Number((base.lat + jitterLat).toFixed(6)),
    lng: Number((base.lng + jitterLng).toFixed(6))
  };
}

// Free Nominatim OpenStreetMap Forward Geocoder
export async function geocodeLocation(query: string): Promise<LatLng | null> {
  if (!query || !query.trim()) return null;
  const clean = query.trim().toLowerCase();

  if (CITY_COORDINATES[clean]) {
    return CITY_COORDINATES[clean];
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (isValidCoordinates(lat, lon)) {
        return { lat: Number(lat.toFixed(6)), lng: Number(lon.toFixed(6)) };
      }
    }
  } catch {
    // Fallback if network blocked
  }
  return null;
}

// Free Nominatim OpenStreetMap Reverse Geocoder
export async function reverseGeocode(lat: number, lng: number): Promise<{ displayName?: string; city?: string; road?: string } | null> {
  if (!isValidCoordinates(lat, lng)) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.address) {
      const city =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.municipality ||
        data.address.county ||
        '';
      const road = data.address.road || data.address.neighbourhood || data.address.suburb || '';
      return {
        displayName: data.display_name,
        city,
        road
      };
    }
  } catch {
    // Graceful fallback
  }
  return null;
}
