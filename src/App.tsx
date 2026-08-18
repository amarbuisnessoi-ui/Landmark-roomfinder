import React, { useEffect, useState } from 'react';
import { AnalyticsStats, Inquiry, Room, SearchFilters, User } from './types';
import { api } from './lib/api';
import { Navbar } from './components/Navbar';
import { HeroSearch } from './components/HeroSearch';
import { RoomCard } from './components/RoomCard';
import { RoomDetailModal } from './components/RoomDetailModal';
import { AddRoomModal } from './components/AddRoomModal';
import { AuthModal } from './components/AuthModal';
import { OwnerDashboard } from './components/OwnerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { Footer } from './components/Footer';
import { InteractiveMap } from './components/InteractiveMap';
import { Building2, Sparkles, LayoutGrid, Map as MapIcon, Columns } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const [activeTab, setActiveTab] = useState<'explore' | 'owner' | 'admin' | 'user-dash'>('explore');
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'split'>('grid');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    city: 'All',
    minPrice: null,
    maxPrice: null,
    roomType: 'All',
    status: 'All',
    amenities: []
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      await api.trackView();
      const roomsData = await api.getRooms();
      setRooms(roomsData);

      // Check active user session
      const user = await api.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        if (user.role === 'admin') {
          const statsData = await api.getAnalytics();
          setStats(statsData);
        }
      }
    } catch (e) {
      console.warn('Error loading initial API data:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter Rooms
  const handleSearch = async () => {
    try {
      const filtered = await api.getRooms({
        query: filters.query,
        roomType: filters.roomType,
        maxPrice: filters.maxPrice,
        status: filters.status
      });
      setRooms(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetFilters = async () => {
    setFilters({
      query: '',
      city: 'All',
      minPrice: null,
      maxPrice: null,
      roomType: 'All',
      status: 'All',
      amenities: []
    });
    const all = await api.getRooms();
    setRooms(all);
  };

  // Favorite toggle
  const toggleFavorite = (roomId: string) => {
    setFavorites((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
    showToast(favorites.includes(roomId) ? 'Removed from favorites' : 'Saved to favorites!');
  };

  // Auth Handlers
  const handleLogin = async (data: { email: string; password: string }) => {
    const result = await api.login(data);
    setCurrentUser(result.user);
    showToast(`Welcome back, ${result.user.name}!`);

    // Automatic redirect for Admin if role is admin
    if (result.user.role === 'admin') {
      setActiveTab('admin');
      loadAdminData();
    } else if (result.user.role === 'owner') {
      setActiveTab('owner');
      loadOwnerData(result.user.id);
    } else {
      setActiveTab('explore');
      loadUserData(result.user.id);
    }
  };

  const handleRegister = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'user' | 'owner';
  }) => {
    const result = await api.register(data);
    setCurrentUser(result.user);
    showToast(`Account created successfully! Welcome, ${result.user.name}`);

    if (result.user.role === 'admin') {
      setActiveTab('admin');
      loadAdminData();
    } else if (result.user.role === 'owner') {
      setActiveTab('owner');
      loadOwnerData(result.user.id);
    } else {
      setActiveTab('explore');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setActiveTab('explore');
    showToast('Logged out successfully.');
  };

  // Room Select Details
  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    api.trackView(room.id);
  };

  // Create or Update Room (Owner / Admin)
  const handleSaveRoom = async (roomData: Partial<Room>) => {
    try {
      if (roomToEdit) {
        const result = await api.updateRoom(roomToEdit.id, roomData);
        setRooms((prev) => prev.map((r) => (r.id === roomToEdit.id ? result.room : r)));
        if (selectedRoom?.id === roomToEdit.id) {
          setSelectedRoom(result.room);
        }
        showToast('Room listing and location updated successfully!');
      } else {
        const result = await api.createRoom(roomData);
        setRooms((prev) => [result.room, ...prev]);
        showToast('Room published successfully!');
      }
      setShowAddRoom(false);
      setRoomToEdit(null);
      loadInitialData();
    } catch (err: any) {
      alert(err.message || 'Failed to save room.');
    }
  };

  // Update Status Available <-> Booked
  const handleUpdateStatus = async (roomId: string, status: 'Available' | 'Booked') => {
    try {
      const result = await api.updateRoom(roomId, { status });
      setRooms((prev) => prev.map((r) => (r.id === roomId ? result.room : r)));
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(result.room);
      }
      showToast(`Room marked as ${status}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  // Delete Room
  const handleDeleteRoom = async (roomId: string) => {
    try {
      await api.deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (selectedRoom?.id === roomId) setSelectedRoom(null);
      showToast('Room deleted.');
      loadInitialData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete room.');
    }
  };

  // Admin Data Load
  const loadAdminData = async () => {
    try {
      const uList = await api.getUsers();
      setUsers(uList);
      const sData = await api.getAnalytics();
      setStats(sData);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string) => {
    try {
      await api.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setRooms((prev) => prev.filter((r) => r.ownerId !== userId));
      showToast('User account deleted.');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  // Inquiries
  const handleSendInquiry = async (roomId: string, message: string) => {
    if (!selectedRoom) return;
    try {
      await api.sendInquiry({
        roomId,
        roomTitle: selectedRoom.title,
        userId: currentUser?.id || 'guest',
        userName: currentUser?.name || 'Interested Renter',
        userEmail: currentUser?.email || 'guest@landmark.com',
        userPhone: currentUser?.phone || '+1 (555) 000-0000',
        ownerId: selectedRoom.ownerId,
        message
      });
      showToast('Inquiry message sent to room owner!');
    } catch (err: any) {
      alert(err.message || 'Failed to send inquiry.');
    }
  };

  const loadOwnerData = async (ownerId: string) => {
    try {
      const inqs = await api.getOwnerInquiries(ownerId);
      setInquiries(inqs);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      const inqs = await api.getUserInquiries(userId);
      setInquiries(inqs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') loadAdminData();
    if (activeTab === 'owner' && currentUser) loadOwnerData(currentUser.id);
    if (activeTab === 'user-dash' && currentUser) loadUserData(currentUser.id);
  }, [activeTab]);

  const availableCount = rooms.filter((r) => r.status === 'Available').length;
  const favoriteRoomsList = rooms.filter((r) => favorites.includes(r.id));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl text-white text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={(mode) => setAuthModalMode(mode || 'login')}
        onOpenAddRoom={() => setShowAddRoom(true)}
        onLogout={handleLogout}
        favoritesCount={favorites.length}
      />

      {/* Main Content Areas based on Active Tab */}
      <main className="flex-1 pb-16 md:pb-0">
        {activeTab === 'explore' && (
          <div>
            {/* Floating Hero Search Section */}
            <HeroSearch
              filters={filters}
              setFilters={setFilters}
              onSearch={handleSearch}
              onReset={handleResetFilters}
              totalRoomsCount={rooms.length}
              availableCount={availableCount}
            />

            {/* Featured Room Listings Grid & Map Views */}
            <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-3 sm:pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Featured Stays Near You
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                    Showing <span className="text-blue-600 font-semibold">{rooms.length}</span> room listings matching your criteria
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* View Mode Switcher: Grid vs Map vs Split */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                        viewMode === 'grid'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Grid</span>
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                        viewMode === 'map'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>Map</span>
                    </button>
                    <button
                      onClick={() => setViewMode('split')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                        viewMode === 'split'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Split</span>
                    </button>
                  </div>

                  {!currentUser && (
                    <button
                      onClick={() => setAuthModalMode('register')}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-full bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 border border-blue-200 text-xs font-semibold transition-all cursor-pointer min-h-[36px]"
                    >
                      <span>Post a room &rarr;</span>
                    </button>
                  )}
                </div>
              </div>

              {rooms.length === 0 ? (
                <div className="text-center py-16 sm:py-20 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4 p-4">
                  <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">No rooms match your search</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your location query, price filter, or room type selection.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold cursor-pointer shadow-md shadow-blue-200 min-h-[42px]"
                  >
                    Reset Search Filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Map Only View */}
                  {viewMode === 'map' && (
                    <div className="space-y-4">
                      <InteractiveMap
                        rooms={rooms}
                        onSelectRoom={handleSelectRoom}
                        height="640px"
                        focusCity={filters.city !== 'All' ? filters.city : undefined}
                      />
                    </div>
                  )}

                  {/* Split View: Interactive Map on top + 2-column mobile / multi-column desktop grid below */}
                  {viewMode === 'split' && (
                    <div className="space-y-6">
                      <div className="rounded-3xl overflow-hidden shadow-sm">
                        <InteractiveMap
                          rooms={rooms}
                          onSelectRoom={handleSelectRoom}
                          height="360px"
                          focusCity={filters.city !== 'All' ? filters.city : undefined}
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                        {rooms.map((room) => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            onSelect={handleSelectRoom}
                            isFavorite={favorites.includes(room.id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Standard 2-Column Mobile Grid View */}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                      {rooms.map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          onSelect={handleSelectRoom}
                          isFavorite={favorites.includes(room.id)}
                          onToggleFavorite={toggleFavorite}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}

        {activeTab === 'owner' && currentUser && (
          <OwnerDashboard
            currentUser={currentUser}
            rooms={rooms}
            inquiries={inquiries}
            onOpenAddRoom={() => {
              setRoomToEdit(null);
              setShowAddRoom(true);
            }}
            onEditRoom={(room) => {
              setRoomToEdit(room);
              setShowAddRoom(true);
            }}
            onUpdateStatus={handleUpdateStatus}
            onDeleteRoom={handleDeleteRoom}
            onSelectRoom={handleSelectRoom}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            stats={stats}
            users={users}
            rooms={rooms}
            onDeleteUser={handleDeleteUser}
            onDeleteRoom={handleDeleteRoom}
            onRefresh={loadAdminData}
          />
        )}

        {activeTab === 'user-dash' && currentUser && (
          <UserDashboard
            currentUser={currentUser}
            favoriteRooms={favoriteRoomsList}
            inquiries={inquiries}
            onSelectRoom={handleSelectRoom}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </main>

      {/* Modals */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          currentUser={currentUser}
          onSendInquiry={handleSendInquiry}
          onUpdateStatus={handleUpdateStatus}
          onDeleteRoom={handleDeleteRoom}
        />
      )}

      {showAddRoom && (
        <AddRoomModal
          onClose={() => {
            setShowAddRoom(false);
            setRoomToEdit(null);
          }}
          onSubmit={handleSaveRoom}
          currentUser={currentUser}
          roomToEdit={roomToEdit}
        />
      )}

      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
