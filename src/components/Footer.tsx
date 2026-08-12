import React from 'react';
import { Building2, Heart, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 text-slate-500 py-10 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-200">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-blue-900">Landmark RoomFinder</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            The premier platform connecting room owners with renters across major cities. Find verified available accommodations with direct owner contact.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Popular Locations</h4>
          <ul className="space-y-2 text-xs">
            <li className="hover:text-blue-600 cursor-pointer">New York Studios & Rooms</li>
            <li className="hover:text-blue-600 cursor-pointer">Los Angeles Oceanview Suites</li>
            <li className="hover:text-blue-600 cursor-pointer">San Francisco Tech Hub Rooms</li>
            <li className="hover:text-blue-600 cursor-pointer">Chicago Executive Penthouses</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Room Categories</h4>
          <ul className="space-y-2 text-xs">
            <li className="hover:text-blue-600 cursor-pointer">Studio Apartments</li>
            <li className="hover:text-blue-600 cursor-pointer">Single Bedrooms</li>
            <li className="hover:text-blue-600 cursor-pointer">Double Bedrooms</li>
            <li className="hover:text-blue-600 cursor-pointer">Full Family Apartments</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Security & System Status</h4>
          <p className="text-xs text-slate-500 mb-3">
            Platform data is encrypted & verified daily by Landmark admins.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Live & Secure</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <div className="flex gap-4 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
          <span>Verified Stays</span>
          <span>•</span>
          <span>Instant Owner Connect</span>
          <span>•</span>
          <span>24/7 Support</span>
        </div>
        <p>© {new Date().getFullYear()} Landmark RoomFinder. All rights reserved.</p>
      </div>
    </footer>
  );
};
