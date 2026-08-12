import React, { useState } from 'react';
import { Room, User } from '../types';
import {
  X,
  MapPin,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MessageSquare,
  Building,
  User as UserIcon,
  ShieldCheck,
  Send,
  Calendar,
  Sparkles,
  Share2,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface RoomDetailModalProps {
  room: Room | null;
  onClose: () => void;
  currentUser: User | null;
  onSendInquiry: (roomId: string, message: string) => void;
  onUpdateStatus: (roomId: string, status: 'Available' | 'Booked') => void;
  onDeleteRoom?: (roomId: string) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  onClose,
  currentUser,
  onSendInquiry,
  onUpdateStatus,
  onDeleteRoom
}) => {
  if (!room) return null;

  const [activePhoto, setActivePhoto] = useState(room.photos[0] || '');
  const [inquiryMessage, setInquiryMessage] = useState(
    `Hello ${room.contactName}, I am interested in renting your room "${room.title}". Is it currently available for move-in?`
  );
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwnerOrAdmin =
    currentUser && (currentUser.role === 'admin' || currentUser.id === room.ownerId);

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;
    onSendInquiry(room.id, inquiryMessage);
    setInquirySubmitted(true);
    setTimeout(() => setInquirySubmitted(false), 4000);
  };

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8 text-slate-800">
        {/* Header Close Button */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleCopyShare}
            className="p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 backdrop-blur-md border border-slate-200 transition-all cursor-pointer shadow-sm"
            title="Share Room Link"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/90 hover:bg-rose-50 text-slate-600 hover:text-rose-600 backdrop-blur-md border border-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gallery Section */}
        <div className="relative bg-slate-50 p-4 border-b border-slate-100">
          <div className="relative aspect-[16/9] w-full max-h-[380px] rounded-2xl overflow-hidden bg-slate-200">
            <img
              src={activePhoto || room.photos[0]}
              alt={room.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 flex gap-2">
              {room.status === 'Available' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                  Available for Rent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-600 text-white text-xs font-bold shadow-md">
                  <XCircle className="w-4 h-4" />
                  Currently Booked
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {room.photos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {room.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(photo)}
                  className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activePhoto === photo
                      ? 'border-blue-600 scale-105 shadow-sm'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Title & Price Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
                <Building className="w-4 h-4" />
                <span>{room.roomType}</span>
                <span>•</span>
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{room.city}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{room.title}</h2>
              <p className="text-sm text-slate-500 mt-1">{room.location}</p>
            </div>

            <div className="text-left sm:text-right bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <div className="text-3xl font-black text-blue-600">${room.price}</div>
              <p className="text-xs text-slate-500 font-medium">per month (all utilities included)</p>
            </div>
          </div>

          {/* Owner Quick Status Control (If Owner or Admin) */}
          {isOwnerOrAdmin && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Owner Controls</p>
                  <p className="text-xs text-slate-500">Toggle room availability status for renters</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateStatus(room.id, 'Available')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    room.status === 'Available'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Set Available
                </button>
                <button
                  onClick={() => onUpdateStatus(room.id, 'Booked')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    room.status === 'Booked'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Set Booked
                </button>
                {onDeleteRoom && (
                  <button
                    onClick={() => onDeleteRoom(room.id)}
                    className="p-2 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                    title="Delete Room"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grid Layout: Description & Amenities vs Contact Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Room Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Description & Details</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {room.description}
                </p>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3">Amenities & Features</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {room.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Location Map & Address</span>
                </div>
                <p className="text-xs text-slate-500">{room.location}, {room.city}</p>
                <div className="w-full h-32 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-500 gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Interactive Map Preview for {room.city}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Owner Contact Card & Inquiry Form */}
            <div className="space-y-6">
              {/* Owner Info Box */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {room.contactName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{room.contactName}</h4>
                    <p className="text-xs text-blue-600 font-semibold">Verified Property Owner</p>
                  </div>
                </div>

                {/* Direct Action Phone / Email */}
                <div className="space-y-2 text-xs">
                  <a
                    href={`tel:${room.contactPhone}`}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-all font-semibold shadow-2xs"
                  >
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>Call: {room.contactPhone}</span>
                  </a>

                  {room.contactWhatsapp && (
                    <a
                      href={`https://wa.me/${room.contactWhatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all font-semibold shadow-2xs"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Owner</span>
                    </a>
                  )}

                  <a
                    href={`mailto:${room.contactEmail}`}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all font-medium"
                  >
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{room.contactEmail}</span>
                  </a>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  Send Inquiry Message
                </h4>

                {inquirySubmitted ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    ✓ Your inquiry has been sent directly to {room.contactName}!
                  </div>
                ) : (
                  <form onSubmit={handleSubmitInquiry} className="space-y-3">
                    <textarea
                      rows={3}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      placeholder="Write your message or questions..."
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none resize-none shadow-2xs"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-200 transition-colors cursor-pointer"
                    >
                      Send Message to Owner
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
