import React, { useState } from 'react';
import { Room } from '../types';
import {
  MapPin,
  Eye,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building
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
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

        {/* Image Nav Arrows if multiple */}
        {room.photos.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={prevPhoto}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-sm transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPhoto}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-sm transition-all cursor-pointer shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(room.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all cursor-pointer shadow-sm ${
            isFavorite
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 hover:bg-white text-slate-600 hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Status Badge & Room Type */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-800 uppercase tracking-wider shadow-sm">
            {room.roomType}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <p className="text-sm font-semibold truncate pr-2">{room.title}</p>
          {room.status === 'Available' ? (
            <span className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm shrink-0">
              Available
            </span>
          ) : (
            <span className="bg-slate-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm shrink-0">
              Booked
            </span>
          )}
        </div>

        {/* Photo Dots Indicator */}
        {room.photos.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
            {room.photos.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentPhotoIdx ? 'bg-white w-2.5' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Location & Views */}
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span className="flex items-center gap-1 text-slate-600 font-semibold truncate max-w-[70%]">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              {room.location}, {room.city}
            </span>
            <span className="flex items-center gap-1 text-slate-400 shrink-0">
              <Eye className="w-3.5 h-3.5" />
              {room.viewsCount}
            </span>
          </div>

          {/* Description snippet */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {room.description}
          </p>

          {/* Amenities Pills */}
          <div className="flex flex-wrap gap-1 mt-2.5">
            {room.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
              >
                {amenity}
              </span>
            ))}
            {room.amenities.length > 3 && (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-medium">
                +{room.amenities.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Footer Price & Details Button */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-extrabold text-slate-900">${room.price}</span>
              <span className="text-xs text-slate-400">/mo</span>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${room.contactPhone}`}
                onClick={(e) => e.stopPropagation()}
                title={`Call Owner (${room.contactPhone})`}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>

              {room.contactWhatsapp && (
                <a
                  href={`https://wa.me/${room.contactWhatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="WhatsApp Owner"
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <button
            onClick={() => onSelect(room)}
            className="w-full py-2 border border-blue-100 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
