import React, { useState } from 'react';
import { Inquiry, Room, User } from '../types';
import {
  Building,
  PlusCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  MessageSquare,
  Phone,
  Mail,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface OwnerDashboardProps {
  currentUser: User;
  rooms: Room[];
  inquiries: Inquiry[];
  onOpenAddRoom: () => void;
  onUpdateStatus: (roomId: string, status: 'Available' | 'Booked') => void;
  onDeleteRoom: (roomId: string) => void;
  onSelectRoom: (room: Room) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  currentUser,
  rooms,
  inquiries,
  onOpenAddRoom,
  onUpdateStatus,
  onDeleteRoom,
  onSelectRoom
}) => {
  const myRooms = rooms.filter((r) => r.ownerId === currentUser.id);
  const availableCount = myRooms.filter((r) => r.status === 'Available').length;
  const bookedCount = myRooms.filter((r) => r.status === 'Booked').length;
  const totalViews = myRooms.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);

  const [activeTab, setActiveTab] = useState<'rooms' | 'inquiries'>('rooms');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-800">
      {/* Header & Stats Banner */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-2">
              <Building className="w-4 h-4" />
              <span>Owner Portal & Management</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Welcome, {currentUser.name}!
            </h1>
            <p className="text-sm text-slate-500">
              Manage your room listings, update booking availability, and view tenant inquiries.
            </p>
          </div>

          <button
            onClick={onOpenAddRoom}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-200 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Room</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500">Total Listed Rooms</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{myRooms.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
            <p className="text-xs font-semibold text-blue-700">Available Rooms</p>
            <p className="text-3xl font-black text-blue-700 mt-1">{availableCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600">Booked Rooms</p>
            <p className="text-3xl font-black text-slate-700 mt-1">{bookedCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600">Total Views Received</p>
            <p className="text-3xl font-black text-blue-600 mt-1">{totalViews}</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rooms'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>My Rooms ({myRooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'inquiries'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Tenant Inquiries ({inquiries.length})</span>
        </button>
      </div>

      {/* Rooms Table / Grid */}
      {activeTab === 'rooms' && (
        <div>
          {myRooms.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <Building className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No rooms listed yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Post your first room listing with photos, price, and contact information to start receiving inquiries.
              </p>
              <button
                onClick={onOpenAddRoom}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
              >
                Post Room Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-slate-100">
                    <img
                      src={room.photos[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                          room.status === 'Available'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {room.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">{room.location}, {room.city}</p>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">{room.title}</h3>
                      <p className="text-lg font-extrabold text-blue-600 mt-1">${room.price} <span className="text-xs font-normal text-slate-500">/ mo</span></p>
                    </div>

                    {/* Quick Status Toggle */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[11px] text-slate-500 font-semibold">Quick Status Update:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onUpdateStatus(room.id, 'Available')}
                          className={`py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            room.status === 'Available'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Available
                        </button>
                        <button
                          onClick={() => onUpdateStatus(room.id, 'Booked')}
                          className={`py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            room.status === 'Booked'
                              ? 'bg-slate-700 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Booked
                        </button>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => onSelectRoom(room)}
                          className="flex-1 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          View Listing
                        </button>
                        <button
                          onClick={() => onDeleteRoom(room.id)}
                          className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inquiries Tab */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No tenant inquiries yet</p>
              <p className="text-xs text-slate-500">Inquiries sent by interested users will appear here.</p>
            </div>
          ) : (
            inquiries.map((inq) => (
              <div
                key={inq.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs text-blue-600 font-semibold">Regarding: {inq.roomTitle}</span>
                    <h4 className="text-base font-bold text-slate-900">{inq.userName}</h4>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{inq.message}"
                </p>

                <div className="flex items-center gap-4 text-xs font-medium pt-1">
                  <a href={`tel:${inq.userPhone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Call: {inq.userPhone}
                  </a>
                  <a href={`mailto:${inq.userEmail}`} className="text-slate-500 hover:underline flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {inq.userEmail}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
