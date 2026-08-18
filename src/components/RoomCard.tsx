import React, { useState } from 'react';
import { Room } from '../types';
import {
  MapPin,
  Heart,
  ChevronLeft,
  ChevronRight,
  ArrowRight
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
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer active:scale-[0.99]"
    >
      {/* Thumbnail with Room Type & Heart */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <img
          src={room.photos[currentPhotoIdx] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'}
          alt={room.title || room.roomType}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Room Type Pill */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
          <span className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold text-slate-800 tracking-wide shadow-2xs border border-slate-200/60">
            {room.roomType}
          </span>
        </div>

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

        {/* Photo Nav Arrows if multiple */}
        {room.photos.length > 1 && (
          <>
            <div className="absolute inset-x-1.5 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                onClick={prevPhoto}
                className="pointer-events-auto p-1 rounded-full bg-white/90 hover:bg-white text-slate-800 backdrop-blur-sm cursor-pointer shadow-sm min-w-[26px] min-h-[26px] flex items-center justify-center"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={nextPhoto}
                className="pointer-events-auto p-1 rounded-full bg-white/90 hover:bg-white text-slate-800 backdrop-blur-sm cursor-pointer shadow-sm min-w-[26px] min-h-[26px] flex items-center justify-center"
                aria-label="Next photo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Photo Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
              {room.photos.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1 rounded-full transition-all ${
                    idx === currentPhotoIdx ? 'bg-white w-2.5' : 'bg-white/50 w-1'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Body: Location, Price, and View Room Button */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          {/* Location */}
          <div className="flex items-center gap-1 text-slate-600 text-xs sm:text-sm font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{room.location ? `${room.location}, ${room.city}` : room.city}</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1 pt-0.5">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900">
              ${room.price}
            </span>
            <span className="text-xs text-slate-500 font-normal">/month</span>
          </div>
        </div>

        {/* View Room Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(room);
          }}
          className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 shadow-xs shadow-blue-200"
        >
          <span>View Room</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};



