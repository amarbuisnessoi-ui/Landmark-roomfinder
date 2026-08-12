import React from 'react';
import { User } from '../types';
import {
  Building2,
  PlusCircle,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Sparkles,
  Heart,
  Home,
  MessageSquare
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'explore' | 'owner' | 'admin' | 'user-dash';
  setActiveTab: (tab: 'explore' | 'owner' | 'admin' | 'user-dash') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenAddRoom: () => void;
  onLogout: () => void;
  favoritesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenAddRoom,
  onLogout,
  favoritesCount
}) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo & Brand */}
        <div
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-200 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-blue-900">
                Landmark
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                RoomFinder
              </span>
            </div>
          </div>
        </div>

        {/* Center Nav Items */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'explore'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-blue-600 hover:bg-white'
            }`}
          >
            <Home className="w-4 h-4" />
            Explore
          </button>

          {currentUser?.role === 'owner' && (
            <button
              onClick={() => setActiveTab('owner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'owner'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Owner Portal
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-blue-900 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Admin Panel
            </button>
          )}

          {currentUser?.role === 'user' && (
            <button
              onClick={() => setActiveTab('user-dash')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'user-dash'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              My Account
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {currentUser?.role === 'owner' && (
            <button
              onClick={onOpenAddRoom}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold text-sm shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Post a Room</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div
                onClick={() => {
                  if (currentUser.role === 'admin') setActiveTab('admin');
                  else if (currentUser.role === 'owner') setActiveTab('owner');
                  else setActiveTab('user-dash');
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-blue-600 capitalize font-medium">
                    {currentUser.role}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-2.5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                Log in
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
