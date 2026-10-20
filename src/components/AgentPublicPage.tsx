import React, { useMemo, useState } from 'react';
import { Room } from '../types';
import { Building2, MapPin, Phone, Share2, Copy, Check, ExternalLink } from 'lucide-react';

interface AgentPublicPageProps {
  agentId: string;
  rooms: Room[];
  onSelectRoom: (room: Room) => void;
}

const money = (value: number) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

export const AgentPublicPage: React.FC<AgentPublicPageProps> = ({ agentId, rooms, onSelectRoom }) => {
  const [copied, setCopied] = useState(false);
  const agentRooms = useMemo(() => rooms.filter((room) => room.ownerId === agentId), [rooms, agentId]);
  const availableRooms = agentRooms.filter((room) => room.status === 'Available');
  const representative = agentRooms[0];
  const agentName = representative?.contactName || 'Room owner / agent';
  const phone = representative?.contactPhone || '';
  const cities = Array.from(new Set(agentRooms.map((room) => room.city).filter(Boolean)));
  const catalogueUrl = `${window.location.origin}/?agent=${encodeURIComponent(agentId)}`;

  const copyCatalogue = async () => {
    try {
      await navigator.clipboard.writeText(catalogueUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copy your catalogue link:', catalogueUrl);
    }
  };

  const shareRoom = async (room: Room) => {
    const url = `${window.location.origin}/?room=${encodeURIComponent(room.id)}`;
    const message = `${room.title}\n${room.location}, ${room.city}\n${money(room.price)} per month\nStatus: ${room.status}\nView details: ${url}`;
    try {
      if (navigator.share) await navigator.share({ title: room.title, text: message, url });
      else {
        await navigator.clipboard.writeText(message);
        window.alert('Room advertisement copied. Paste it into WhatsApp, Facebook, or Messenger.');
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        try { await navigator.clipboard.writeText(message); window.alert('Room advertisement copied.'); }
        catch { window.prompt('Copy this advertisement:', message); }
      }
    }
  };

  return (
    <main className="flex-1 bg-slate-50">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0"><Building2 className="w-8 h-8" /></div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-amber-700">Landmark RoomFinder · Room catalogue</p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">{agentName}</h1>
                <p className="text-sm text-slate-500 mt-2">{cities.length ? cities.join(' · ') : 'Nepal'} · {availableRooms.length} available of {agentRooms.length} listed rooms</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={copyCatalogue} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-700">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Link copied' : 'Copy catalogue link'}
              </button>
              {phone && <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50"><Phone className="w-4 h-4" /> Call agent</a>}
            </div>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl mt-6">One link for all this agent’s listings. Share it with renters so they can browse rooms and check current availability.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        {agentRooms.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center"><Building2 className="w-10 h-10 mx-auto text-slate-400" /><h2 className="font-bold text-xl mt-3">No public listings found</h2><p className="text-slate-500 text-sm mt-2">This catalogue may have no rooms available yet, or the link may be outdated.</p></div>
        ) : (
          <>
            <div className="flex items-end justify-between gap-3 mb-5"><div><h2 className="text-xl font-extrabold text-slate-900">Room listings</h2><p className="text-sm text-slate-500 mt-1">Share an individual room or the whole catalogue.</p></div><span className="text-xs font-bold rounded-full bg-white border border-slate-200 px-3 py-2">{agentRooms.length} listings</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agentRooms.map((room) => (
                <article key={room.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                  <button onClick={() => onSelectRoom(room)} className="block w-full text-left relative aspect-[16/10] bg-slate-100">
                    <img src={room.photos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'} alt={room.title} className="w-full h-full object-cover" loading="lazy" />
                    <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${room.status === 'Available' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'}`}>{room.status}</span>
                  </button>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-slate-900 text-lg">{room.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-4 h-4 shrink-0" />{room.location}, {room.city}</p>
                    <p className="text-xl font-black text-amber-700 mt-3">{money(room.price)} <span className="text-xs font-medium text-slate-500">/ month</span></p>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button onClick={() => onSelectRoom(room)} className="flex-1 inline-flex justify-center items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-2.5 text-xs font-bold hover:bg-slate-700"><ExternalLink className="w-3.5 h-3.5" /> View room</button>
                      <button onClick={() => shareRoom(room)} className="inline-flex justify-center items-center gap-2 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-3 py-2.5 text-xs font-bold hover:bg-amber-100"><Share2 className="w-3.5 h-3.5" /> Share ad</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
};
