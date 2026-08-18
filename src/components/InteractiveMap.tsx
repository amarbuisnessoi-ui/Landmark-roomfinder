import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Room } from '../types';
import { getRoomCoordinates, isRoomLocationExact, CITY_COORDINATES } from '../utils/mapUtils';
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers, ExternalLink, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface InteractiveMapProps {
  rooms: Room[];
  selectedRoom?: Room | null;
  onSelectRoom: (room: Room) => void;
  height?: string;
  className?: string;
  focusCity?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  rooms,
  selectedRoom,
  onSelectRoom,
  height = '540px',
  className = '',
  focusCity
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [activePopupRoom, setActivePopupRoom] = useState<Room | null>(null);
  const [tileProvider, setTileProvider] = useState<'standard' | 'humanitarian'>('standard');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to US center or first room's city
      const initialCenter: [number, number] = [39.8283, -98.5795];
      const initialZoom = 4;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false
      });

      const tileUrl =
        tileProvider === 'standard'
          ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          : 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Attribution bottom right
      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer if provider toggled
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrl =
      tileProvider === 'standard'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  }, [tileProvider]);

  // Update Markers when rooms list or selectedRoom changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (rooms.length === 0) return;

    const latLngBounds: L.LatLngExpression[] = [];

    rooms.forEach((room) => {
      const coords = getRoomCoordinates(room);
      latLngBounds.push([coords.lat, coords.lng]);

      const isSelected = selectedRoom?.id === room.id;
      const isAvailable = room.status === 'Available';
      const isExact = isRoomLocationExact(room);

      // Custom HTML Marker Pill with Price, Status & Exact Location indicator
      const markerHtml = `
        <div class="group transform transition-all duration-200 hover:scale-110 cursor-pointer">
          <div class="px-2.5 py-1 rounded-full shadow-md font-extrabold text-xs flex items-center gap-1 border-2 ${
            isSelected
              ? 'bg-blue-600 text-white border-white ring-4 ring-blue-300 scale-110'
              : isAvailable
              ? 'bg-white text-slate-900 border-blue-600 hover:bg-blue-50'
              : 'bg-slate-700 text-white border-slate-300'
          }">
            <span class="w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-400'}"></span>
            <span>${isExact ? '' : '~'}Rs. ${room.price}</span>
            ${isExact ? '<span class="text-[9px] text-blue-600 font-bold ml-0.5" title="Exact Location Pin">📍</span>' : ''}
          </div>
          <div class="w-0 h-0 mx-auto border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 ${
            isSelected ? 'border-t-blue-600' : isAvailable ? 'border-t-blue-600' : 'border-t-slate-700'
          }"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-room-marker',
        html: markerHtml,
        iconSize: [66, 32],
        iconAnchor: [33, 30]
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon });

      marker.on('click', () => {
        setActivePopupRoom(room);
        map.setView([coords.lat, coords.lng], Math.max(map.getZoom(), 14), {
          animate: true
        });
      });

      markersGroup.addLayer(marker);
    });

    // If single room selected, center directly on it
    if (selectedRoom) {
      const selectedCoords = getRoomCoordinates(selectedRoom);
      map.setView([selectedCoords.lat, selectedCoords.lng], 14, { animate: true });
    } else if (focusCity && CITY_COORDINATES[focusCity.toLowerCase()]) {
      const cityCoords = CITY_COORDINATES[focusCity.toLowerCase()];
      map.setView([cityCoords.lat, cityCoords.lng], 12, { animate: true });
    } else if (latLngBounds.length > 0) {
      try {
        const bounds = L.latLngBounds(latLngBounds);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch {
        // ignore bounds errors on single invalid point
      }
    }
  }, [rooms, selectedRoom, focusCity]);

  // Handle Map Navigation Helpers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 13, { animate: true });
      },
      () => {
        // Geolocation denied or unavailable
      }
    );
  };

  const handleCityShortcut = (cityName: string) => {
    const coords = CITY_COORDINATES[cityName.toLowerCase()];
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.setView([coords.lat, coords.lng], 12, { animate: true });
    }
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 ${className}`}>
      {/* Map DOM Container */}
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />

      {/* Floating City Shortcuts Header */}
      <div className="absolute top-3 left-3 right-14 z-10 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 shadow-sm">
          <MapPin className="w-3 h-3 text-blue-400" />
          <span>Quick Cities:</span>
        </span>
        {['New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Seattle', 'Miami'].map((city) => (
          <button
            key={city}
            onClick={() => handleCityShortcut(city)}
            className="bg-white/90 hover:bg-white active:bg-blue-50 text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs backdrop-blur-md border border-slate-200/80 shrink-0 transition-all cursor-pointer"
          >
            {city}
          </button>
        ))}
      </div>

      {/* Map Controls: Top Right */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-9 h-9 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-9 h-9 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleLocateMe}
          title="Center on My Location"
          className="w-9 h-9 bg-white hover:bg-blue-50 text-blue-600 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
        >
          <Navigation className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTileProvider((prev) => (prev === 'standard' ? 'humanitarian' : 'standard'))}
          title="Toggle Map Style"
          className="w-9 h-9 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Free OpenStreetMap Attribution & Disclaimer Bottom Left */}
      <div className="absolute bottom-2 left-2 z-10 bg-white/85 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[9px] text-slate-600 font-medium border border-slate-200/60 shadow-2xs">
        Map data © <span className="font-semibold text-blue-600">OpenStreetMap</span> contributors (Free & Open API)
      </div>

      {/* Active Room Floating Preview Card */}
      {activePopupRoom && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-88 z-20 bg-white rounded-2xl p-3.5 shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex gap-3 items-start">
            <img
              src={activePopupRoom.photos[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'}
              alt={activePopupRoom.title}
              className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-100 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider truncate">
                  {activePopupRoom.roomType}
                </span>
                <button
                  onClick={() => setActivePopupRoom(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">{activePopupRoom.title}</h4>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                <span>{activePopupRoom.location}, {activePopupRoom.city}</span>
              </p>

              {/* Exact vs Approximate Location Status */}
              <div className="mt-1.5">
                {isRoomLocationExact(activePopupRoom) ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Exact Owner Pin</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>Approximate Area</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-extrabold text-slate-900">
                  Rs. {activePopupRoom.price}
                  <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                </span>
                <button
                  onClick={() => onSelectRoom(activePopupRoom)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

