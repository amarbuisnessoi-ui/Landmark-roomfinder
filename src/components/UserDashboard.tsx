import React from 'react';
import { Inquiry, Room, User } from '../types';
import { User as UserIcon, Heart, MessageSquare, Building, Phone, Mail } from 'lucide-react';
import { RoomCard } from './RoomCard';

interface UserDashboardProps {
  currentUser: User;
  favoriteRooms: Room[];
  inquiries: Inquiry[];
  onSelectRoom: (room: Room) => void;
  onToggleFavorite: (roomId: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  favoriteRooms,
  inquiries,
  onSelectRoom,
  onToggleFavorite
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-800">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-1">
              <span>Verified Renter Account</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">{currentUser.name}</h1>
            <p className="text-xs text-slate-500">{currentUser.email} • {currentUser.phone || 'No phone set'}</p>
          </div>
        </div>
      </div>

      {/* Saved Favorite Rooms Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Heart className="w-5 h-5 text-rose-500 fill-current" />
          <h2 className="text-xl font-bold text-slate-900">Saved Favorite Rooms ({favoriteRooms.length})</h2>
        </div>

        {favoriteRooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <Heart className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No favorite rooms saved yet</p>
            <p className="text-xs text-slate-500">Click the heart icon on any room card while browsing to save it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {favoriteRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={onSelectRoom}
                isFavorite={true}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {/* My Submitted Inquiries Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">My Sent Room Inquiries ({inquiries.length})</h2>
        </div>

        {inquiries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No inquiries sent yet</p>
            <p className="text-xs text-slate-500">Contact property owners on any room listing to send inquiries.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inquiries.map((inq) => (
              <div key={inq.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-blue-600">{inq.roomTitle}</span>
                  <span className="text-[10px] text-slate-400">{new Date(inq.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{inq.message}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
