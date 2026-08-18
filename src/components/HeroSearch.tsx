import React from 'react';
import { Search, MapPin, DollarSign, Home, SlidersHorizontal, Sparkles, FilterX, ArrowRight } from 'lucide-react';
import { SearchFilters } from '../types';

interface HeroSearchProps {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  onSearch: () => void;
  onReset: () => void;
  totalRoomsCount: number;
  availableCount: number;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  filters,
  setFilters,
  onSearch,
  onReset,
  totalRoomsCount,
  availableCount
}) => {
  const hasActiveFilters = Boolean(
    filters.query ||
    filters.roomType !== 'All' ||
    filters.maxPrice ||
    filters.status !== 'All'
  );

  return (
    <section className="relative bg-blue-900 py-10 sm:py-16 px-3 sm:px-8 lg:px-12 overflow-hidden border-b border-blue-950/20">
      {/* Background Gradient & Decorative Blur Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 opacity-95 pointer-events-none" />
      <div className="absolute top-10 right-20 w-48 sm:w-64 h-48 sm:h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-72 sm:w-96 h-72 sm:h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-3 sm:space-y-4">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 text-[11px] sm:text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-300 shrink-0" />
          <span>Vetted stays from verified property owners</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight px-2">
          Find your perfect <span className="text-blue-300">home away from home</span>
        </h1>

        <p className="max-w-2xl mx-auto text-blue-100 text-xs sm:text-sm md:text-base opacity-90 font-normal px-2">
          Explore over <span className="text-white font-semibold">{totalRoomsCount}+</span> premium stays. From studios to penthouses, discover your ideal sanctuary.
        </p>

        {/* Search Bar: Desktop (Wide Row) & Mobile (Cleanly Stacked Cards) */}
        <div className="pt-2 sm:pt-4">
          <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-2xl shadow-xl border border-slate-100 p-2.5 sm:p-4 text-left text-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3 items-center">
              {/* Location Input */}
              <div className="p-2.5 sm:p-2 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none md:border-r md:border-slate-200 border md:border-0 border-slate-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-600 shrink-0" /> Location
                </p>
                <input
                  type="text"
                  value={filters.query}
                  onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  placeholder="Where are you going?"
                  className="w-full text-xs sm:text-sm font-medium outline-none text-slate-800 bg-transparent placeholder-slate-400 min-h-[28px]"
                />
              </div>

              {/* Room Type Selector */}
              <div className="p-2.5 sm:p-2 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none md:border-r md:border-slate-200 border md:border-0 border-slate-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Home className="w-3 h-3 text-blue-600 shrink-0" /> Room Type
                </p>
                <select
                  value={filters.roomType}
                  onChange={(e) => setFilters((prev) => ({ ...prev, roomType: e.target.value }))}
                  className="w-full text-xs sm:text-sm font-medium outline-none text-slate-800 bg-transparent cursor-pointer min-h-[28px]"
                >
                  <option value="All">All Room Types</option>
                  <option value="Studio">Studio Apartment</option>
                  <option value="Single Room">Single Room</option>
                  <option value="Double Room">Double Room</option>
                  <option value="Apartment">Full Apartment</option>
                  <option value="Suite">Luxury Suite</option>
                  <option value="Penthouse">Penthouse</option>
                </select>
              </div>

              {/* Budget Selector */}
              <div className="p-2.5 sm:p-2 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none md:border-r md:border-slate-200 border md:border-0 border-slate-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-blue-600 shrink-0" /> Budget
                </p>
                <select
                  value={filters.maxPrice || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxPrice: e.target.value ? Number(e.target.value) : null
                    }))
                  }
                  className="w-full text-xs sm:text-sm font-medium outline-none text-slate-800 bg-transparent cursor-pointer min-h-[28px]"
                >
                  <option value="">Any Monthly Budget</option>
                  <option value="500">Under Rs. 500 / mo</option>
                  <option value="800">Under Rs. 800 / mo</option>
                  <option value="1200">Under Rs. 1,200 / mo</option>
                  <option value="2000">Under Rs. 2,000 / mo</option>
                </select>
              </div>

              {/* Search & Reset Actions */}
              <div className="flex items-center gap-2 pt-1 md:pt-0 md:pl-1">
                <button
                  onClick={onSearch}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-98 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-200 transition-all cursor-pointer min-h-[44px]"
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span>Search Stays</span>
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={onReset}
                    title="Reset Search Filters"
                    className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <FilterX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Filter Pills: Horizontal scroll on mobile, centered wrap on desktop */}
        <div className="pt-2">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 px-1 sm:flex-wrap sm:justify-center text-xs">
            {['All', 'Studio', 'Single Room', 'Apartment', 'Suite', 'Penthouse'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilters((prev) => ({ ...prev, roomType: type }));
                  setTimeout(onSearch, 10);
                }}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 min-h-[34px] flex items-center ${
                  filters.roomType === type
                    ? 'bg-white text-blue-900 shadow-sm font-bold scale-102'
                    : 'bg-white/15 text-blue-100 hover:bg-white/25 active:bg-white/30'
                }`}
              >
                {type === 'All' ? 'All Stays' : type}
              </button>
            ))}

            <button
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  status: prev.status === 'Available' ? 'All' : 'Available'
                }));
                setTimeout(onSearch, 10);
              }}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 min-h-[34px] flex items-center gap-1 ${
                filters.status === 'Available'
                  ? 'bg-emerald-400 text-slate-900 font-bold scale-102 shadow-sm'
                  : 'bg-white/15 text-blue-100 hover:bg-white/25 active:bg-white/30'
              }`}
            >
              <span>🟢</span>
              <span>Available Only ({availableCount})</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

