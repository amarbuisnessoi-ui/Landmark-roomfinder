import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CITY_COORDINATES, geocodeLocation, isValidCoordinates, reverseGeocode } from '../utils/mapUtils';
import { MapPin, Navigation, Search, RotateCcw, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface LocationPickerMapProps {
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  location?: string;
  onChangeCoordinates: (coords: { lat: number; lng: number } | null) => void;
  onSuggestAddress?: (suggested: { address?: string; city?: string }) => void;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  city,
  location,
  onChangeCoordinates,
  onSuggestAddress
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [tileStyle, setTileStyle] = useState<'standard' | 'humanitarian'>('standard');
  const [geocodedAddressHint, setGeocodedAddressHint] = useState<string | null>(null);

  const hasCoords = isValidCoordinates(latitude, longitude);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Determine initial center
      let initialLat = 40.7128;
      let initialLng = -74.006;
      let initialZoom = 13;

      if (hasCoords) {
        initialLat = Number(latitude);
        initialLng = Number(longitude);
        initialZoom = 15;
      } else if (city && CITY_COORDINATES[city.trim().toLowerCase()]) {
        const cityCenter = CITY_COORDINATES[city.trim().toLowerCase()];
        initialLat = cityCenter.lat;
        initialLng = cityCenter.lng;
        initialZoom = 13;
      }

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false
      });

      const tileUrl =
        tileStyle === 'standard'
          ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          : 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Add click handler to place / move pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const cleanLat = Number(lat.toFixed(6));
        const cleanLng = Number(lng.toFixed(6));
        onChangeCoordinates({ lat: cleanLat, lng: cleanLng });

        // Trigger reverse geocoding to suggest address if desired
        reverseGeocode(cleanLat, cleanLng).then((res) => {
          if (res?.displayName) {
            setGeocodedAddressHint(res.displayName);
          }
        });
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Marker when latitude / longitude props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hasCoords) {
      const lat = Number(latitude);
      const lng = Number(longitude);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const customPin = L.divIcon({
          className: 'custom-picker-pin',
          html: `
            <div class="flex flex-col items-center cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-full">
              <div class="px-2.5 py-1 bg-blue-600 text-white font-black text-[11px] rounded-full shadow-lg border-2 border-white flex items-center gap-1">
                <span>📍 Drop Pin</span>
              </div>
              <div class="w-3 h-3 bg-blue-600 transform rotate-45 -mt-1.5 border-r-2 border-b-2 border-white shadow-xs"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const newMarker = L.marker([lat, lng], {
          icon: customPin,
          draggable: true
        }).addTo(map);

        newMarker.on('dragend', (e) => {
          const markerPos = e.target.getLatLng();
          const cleanLat = Number(markerPos.lat.toFixed(6));
          const cleanLng = Number(markerPos.lng.toFixed(6));
          onChangeCoordinates({ lat: cleanLat, lng: cleanLng });

          reverseGeocode(cleanLat, cleanLng).then((res) => {
            if (res?.displayName) {
              setGeocodedAddressHint(res.displayName);
            }
          });
        });

        markerRef.current = newMarker;
      }
    } else {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }
  }, [latitude, longitude, hasCoords]);

  // Center on Address or City button
  const handleFindOnMap = async () => {
    const query = [location, city].filter(Boolean).join(', ');
    if (!query) return;

    setIsGeocoding(true);
    try {
      const result = await geocodeLocation(query);
      if (result && mapInstanceRef.current) {
        mapInstanceRef.current.setView([result.lat, result.lng], 15, { animate: true });
        onChangeCoordinates(result);
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  // Locate Current Device Position
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const cleanLat = Number(lat.toFixed(6));
        const cleanLng = Number(lng.toFixed(6));
        mapInstanceRef.current?.setView([cleanLat, cleanLng], 16, { animate: true });
        onChangeCoordinates({ lat: cleanLat, lng: cleanLng });
      },
      (err) => {
        console.warn('Geolocation error:', err);
      }
    );
  };

  // Clear Pin
  const handleClearPin = () => {
    onChangeCoordinates(null);
    setGeocodedAddressHint(null);
  };

  return (
    <div className="space-y-2">
      {/* Header & Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>Pinpoint Exact Room Location on Map</span>
        </label>

        {hasCoords ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Exact Pin Set ({Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)})</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Approximate (Click map to drop exact pin)</span>
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500">
        Click anywhere on the map or drag the pin to set the exact spot where renters will find your room.
      </p>

      {/* Map Card Container */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-100">
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-56 sm:h-64 z-0" />

        {/* Floating Action Buttons */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleLocateMe}
            title="Use My Current GPS Location"
            className="p-2 bg-white/95 hover:bg-white text-blue-600 rounded-xl shadow-md border border-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer backdrop-blur-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">My GPS</span>
          </button>

          {(location || city) && (
            <button
              type="button"
              onClick={handleFindOnMap}
              disabled={isGeocoding}
              title="Search Address on Map"
              className="p-2 bg-white/95 hover:bg-white text-slate-700 rounded-xl shadow-md border border-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer backdrop-blur-sm"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] hidden sm:inline">
                {isGeocoding ? 'Finding...' : 'Find Address'}
              </span>
            </button>
          )}

          {hasCoords && (
            <button
              type="button"
              onClick={handleClearPin}
              title="Reset / Remove Pin"
              className="p-2 bg-white/95 hover:bg-rose-50 text-rose-600 rounded-xl shadow-md border border-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer backdrop-blur-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Bottom Coordinates Bar */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px]">
          <div className="flex items-center gap-2 truncate">
            <span className="text-blue-400 font-bold">Coordinates:</span>
            {hasCoords ? (
              <span className="font-mono text-emerald-300">
                Lat: {Number(latitude).toFixed(6)} | Lng: {Number(longitude).toFixed(6)}
              </span>
            ) : (
              <span className="text-slate-300 italic">No pin placed yet</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 shrink-0 ml-2">OpenStreetMap Free API</span>
        </div>
      </div>

      {/* Suggested Reverse Geocoded Hint */}
      {geocodedAddressHint && (
        <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-[11px] text-slate-700">
          <p className="truncate mr-2">
            <span className="font-semibold text-blue-800">Detected Area:</span> {geocodedAddressHint}
          </p>
        </div>
      )}
    </div>
  );
};
