import React, { useState } from 'react';
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
  MessageSquare,
  Menu,
  X,
  Compass
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: 'explore' | 'owner' | 'admin' | 'user-dash') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => handleTabClick('explore')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-200 group-hover:scale-105 transition-transform shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-blue-900">
                Landmark
              </span>
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                RoomFinder
              </span>
            </div>
          </div>

          {/* Desktop Center Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200">
            <button
              onClick={() => handleTabClick('explore')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
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
                onClick={() => handleTabClick('owner')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
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
                onClick={() => handleTabClick('admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
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
                onClick={() => handleTabClick('user-dash')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Post Room Button */}
            {currentUser?.role === 'owner' && (
              <button
                onClick={onOpenAddRoom}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold text-sm shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post a Room</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 sm:border-l sm:border-slate-200">
                <div
                  onClick={() => {
                    if (currentUser.role === 'admin') handleTabClick('admin');
                    else if (currentUser.role === 'owner') handleTabClick('owner');
                    else handleTabClick('user-dash');
                  }}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-all min-h-[38px]"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
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
                  className="p-2 sm:p-2.5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer items-center justify-center min-w-[40px] min-h-[40px]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
            {currentUser && (
              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                    <p className="text-[11px] text-blue-600 font-semibold capitalize">{currentUser.role} Account</p>
                  </div>
                </div>
                {favoritesCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
                    <Heart className="w-3 h-3 fill-current" />
                    {favoritesCount} Saved
                  </span>
                )}
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => handleTabClick('explore')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'explore'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Explore Stays</span>
              </button>

              {currentUser?.role === 'owner' && (
                <button
                  onClick={() => handleTabClick('owner')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'owner'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Owner Management Portal</span>
                </button>
              )}

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => handleTabClick('admin')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Admin Security Panel</span>
                </button>
              )}

              {currentUser?.role === 'user' && (
                <button
                  onClick={() => handleTabClick('user-dash')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'user-dash'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>My Account & Inquiries</span>
                </button>
              )}
            </div>

            {/* Mobile Post Room Action */}
            {currentUser?.role === 'owner' && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAddRoom();
                }}
                className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post a New Room Listing</span>
              </button>
            )}

            {!currentUser && (
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm font-semibold bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-200 transition-colors cursor-pointer"
                >
                  Sign Up (Renters & Owners)
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Sticky Bottom Navigation Bar for rapid thumb access */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => handleTabClick('explore')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            activeTab === 'explore'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Explore</span>
        </button>

        {currentUser?.role === 'owner' ? (
          <button
            onClick={() => handleTabClick('owner')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer min-w-[56px] ${
              activeTab === 'owner'
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Owner</span>
          </button>
        ) : currentUser?.role === 'admin' ? (
          <button
            onClick={() => handleTabClick('admin')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer min-w-[56px] ${
              activeTab === 'admin'
                ? 'text-blue-900 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Admin</span>
          </button>
        ) : currentUser?.role === 'user' ? (
          <button
            onClick={() => handleTabClick('user-dash')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer min-w-[56px] relative ${
              activeTab === 'user-dash'
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <Heart className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Saved</span>
            {favoritesCount > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={() => onOpenAuth('register')}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-blue-600 hover:text-blue-700 font-semibold cursor-pointer min-w-[56px]"
          >
            <Building2 className="w-5 h-5 mb-0.5 text-blue-600" />
            <span className="text-[10px]">Host</span>
          </button>
        )}

        {currentUser?.role === 'owner' ? (
          <button
            onClick={onOpenAddRoom}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-blue-600 font-bold cursor-pointer min-w-[56px]"
          >
            <PlusCircle className="w-5 h-5 mb-0.5 text-blue-600" />
            <span className="text-[10px]">Post</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (currentUser) {
                if (currentUser.role === 'admin') handleTabClick('admin');
                else if (currentUser.role === 'owner') handleTabClick('owner');
                else handleTabClick('user-dash');
              } else {
                onOpenAuth('login');
              }
            }}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-900 font-medium cursor-pointer min-w-[56px]"
          >
            <UserIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{currentUser ? 'Profile' : 'Sign In'}</span>
          </button>
        )}
      </nav>
    </>
  );
};

