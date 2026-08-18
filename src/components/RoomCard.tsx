import React, { useState } from 'react';
import { Room } from '../types';
import { isRoomLocationExact } from '../utils/mapUtils';
import {
  MapPin,
  Eye,
  Phone,
  MessageCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onSelect: (room: Room) => void;
  isFavorite: boolean;
  onToggleFavorite: (roomId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onSelect,
  isFavorite,
  onToggleFavorite
}) => {
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIdx((prev) => (prev + 1) % room.photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIdx((prev) => (prev - 1 + room.photos.length) % room.photos.length);
  };

  return (
    <div
      onClick={() => onSelect(room)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer active:scale-[0.99]"
    >
      {/* Image Container with Slider */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <img
          src={room.photos[currentPhotoIdx] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay for bottom details */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Image Nav Arrows if multiple */}
        {room.photos.length > 1 && (
          <div className="absolute inset-x-1.5 sm:inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={prevPhoto}
              className="pointer-events-auto p-1 sm:p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 backdrop-blur-sm transition-all cursor-pointer shadow-md min-w-[26px] min-h-[26px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={nextPhoto}
              className="pointer-events-auto p-1 sm:p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 backdrop-blur-sm transition-all cursor-pointer shadow-md min-w-[26px] min-h-[26px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
              aria-label="Next photo"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(room.id);
          }}
          aria-label={isFavorite ? 'Remove from saved' : 'Save room'}
          className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all cursor-pointer shadow-md min-w-[30px] min-h-[30px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center ${
            isFavorite
              ? 'bg-rose-500 text-white'
              : 'bg-white/90 hover:bg-white text-slate-600 hover:text-rose-500'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Room Type Pill */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex items-center gap-1">
          <span className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold text-slate-800 uppercase tracking-wider shadow-2xs">
            {room.roomType}
          </span>
        </div>

        {/* Card Overlay Bottom: Title & Status */}
        <div className="absolute bottom-1.5 left-2 right-2 sm:bottom-2.5 sm:left-2.5 sm:right-2.5 flex items-center justify-between text-white gap-1.5">
          <p className="text-[11px] sm:text-sm font-bold truncate drop-shadow-sm">{room.title}</p>
          {room.status === 'Available' ? (
            <span className="bg-blue-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-2xs shrink-0">
              Available
            </span>
          ) : (
            <span className="bg-slate-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-2xs shrink-0">
              Booked
            </span>
          )}
        </div>

        {/* Photo Dots */}
        {room.photos.length > 1 && (
          <div className="absolute bottom-6 sm:bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
            {room.photos.map((_, idx) => (
              <span
                key={idx}
                className={`h-1 rounded-full transition-all ${
                  idx === currentPhotoIdx ? 'bg-white w-2 sm:w-2.5' : 'bg-white/50 w-1'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div>
          {/* Location & Views */}
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="flex items-center gap-1 text-slate-700 font-semibold truncate max-w-[70%] text-[10px] sm:text-xs">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{room.city}</span>
              {isRoomLocationExact(room) && (
                <span title="Exact Pinpoint Verified" className="text-[9px] text-emerald-600 font-bold ml-0.5">
                  ✓
                </span>
              )}
            </span>
            <span className="flex items-center gap-1 text-slate-400 shrink-0 text-[9px] sm:text-xs">
              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {room.viewsCount}
            </span>
          </div>

          {/* Description snippet */}
          <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-2 leading-relaxed">
            {room.description}
          </p>

          {/* Amenities Pills */}
          <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
            {room.amenities.slice(0, 2).map((amenity) => (
              <span
                key={amenity}
                className="px-1.5 sm:px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-medium truncate max-w-[90px] sm:max-w-none"
              >
                {amenity}
              </span>
            ))}
            {room.amenities.length > 2 && (
              <span className="px-1 py-0.5 rounded bg-slate-100 text-slate-400 text-[9px] sm:text-[10px] font-medium">
                +{room.amenities.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Footer Price & Contact/Details Actions */}
        <div className="pt-2 sm:pt-3 border-t border-slate-100 flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base sm:text-xl font-black text-slate-900">${room.price}</span>
              <span className="text-[10px] sm:text-xs text-slate-400">/mo</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <a
                href={`tel:${room.contactPhone}`}
                onClick={(e) => e.stopPropagation()}
                title={`Call Owner (${room.contactPhone})`}
                aria-label={`Call ${room.contactName}`}
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors min-w-[28px] min-h-[28px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center"
              >
                <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </a>

              {room.contactWhatsapp && (
                <a
                  href={`https://wa.me/${room.contactWhatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="WhatsApp Owner"
                  aria-label="WhatsApp Owner"
                  className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 transition-colors min-w-[28px] min-h-[28px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center"
                >
                  <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </a>
              )}
            </div>
          </div>

          <button
            onClick={() => onSelect(room)}
            className="w-full py-1.5 sm:py-2.5 border border-blue-100 bg-blue-50 text-blue-700 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer min-h-[34px] sm:min-h-[40px] flex items-center justify-center"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};


