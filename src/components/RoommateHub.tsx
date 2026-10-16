import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Heart, X, MapPin, CalendarDays, Wallet, Users, Sparkles, MessageCircle, Handshake, ShieldCheck, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

type Profile = {
  userId: string; displayName: string; bio: string; city: string; area: string;
  minBudget: number; maxBudget: number; moveInDate: string; roomType: string;
  smoking: string; cleanliness: string; sleepSchedule: string;
};
type Meetup = { id: string; proposerId: string; date: string; time: string; location: string; note: string; status: string };
type Match = { id: string; profile: Profile; meetups: Meetup[] };

const blankProfile = (name = ''): Profile => ({
  userId: '', displayName: name, bio: '', city: 'Kathmandu', area: '', minBudget: 4000, maxBudget: 8000,
  moveInDate: '', roomType: 'Any', smoking: 'No preference', cleanliness: 'Tidy', sleepSchedule: 'Flexible'
});
const areas = ['Koteshwor', 'Baneshwor', 'New Baneshwor', 'Putalisadak', 'Kalimati', 'Kalanki', 'Kirtipur', 'Boudha', 'Chabahil', 'Maitidevi', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Other'];

function compatibility(a: Profile, b: Profile) {
  let score = 0;
  const details: string[] = [];
  const aArea = `${a.city} ${a.area}`.toLowerCase();
  const bArea = `${b.city} ${b.area}`.toLowerCase();
  if (aArea === bArea) { score += 35; details.push('Same preferred area'); }
  else if (a.city.toLowerCase() === b.city.toLowerCase()) { score += 23; details.push('Same city'); }
  else { details.push('Different preferred areas'); }
  const overlap = Math.max(0, Math.min(a.maxBudget, b.maxBudget) - Math.max(a.minBudget, b.minBudget));
  const span = Math.max(1, Math.max(a.maxBudget, b.maxBudget) - Math.min(a.minBudget, b.minBudget));
  const budgetScore = Math.max(0, Math.min(30, Math.round(30 * (overlap / span))));
  score += budgetScore;
  if (overlap > 0) details.push('Overlapping budgets'); else details.push('Budgets may need discussion');
  if (a.moveInDate && b.moveInDate) {
    const days = Math.abs(new Date(a.moveInDate).getTime() - new Date(b.moveInDate).getTime()) / 86400000;
    const dateScore = days <= 7 ? 20 : days <= 30 ? 12 : 3;
    score += dateScore;
    details.push(days <= 7 ? 'Similar move-in dates' : 'Move-in dates differ');
  } else { score += 10; details.push('Move-in date not specified'); }
  if (a.roomType === b.roomType || a.roomType === 'Any' || b.roomType === 'Any') { score += 10; details.push('Room type compatible'); }
  if (a.smoking === b.smoking || a.smoking === 'No preference' || b.smoking === 'No preference') score += 5;
  if (a.cleanliness === b.cleanliness || a.cleanliness === 'Flexible' || b.cleanliness === 'Flexible') score += 5;
  if (a.sleepSchedule === b.sleepSchedule || a.sleepSchedule === 'Flexible' || b.sleepSchedule === 'Flexible') score += 5;
  return { score: Math.min(100, score), details };
}

export const RoommateHub: React.FC<{ currentUser: { id: string; name: string }; rooms?: any[]; onSelectRoom?: (room: any) => void }> = ({ currentUser, rooms = [], onSelectRoom }) => {
  const [profile, setProfile] = useState<Profile>(blankProfile(currentUser.name));
  const [savedProfile, setSavedProfile] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeCard, setActiveCard] = useState(0);
  const [view, setView] = useState<'discover' | 'matches' | 'profile'>('discover');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [meetupFor, setMeetupFor] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<Match | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [meetup, setMeetup] = useState({ date: '', time: '15:00', location: '', note: '' });
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [mine, discovered, matched] = await Promise.all([
        api.getRoommateProfile(), api.discoverRoommates(), api.getRoommateMatches()
      ]);
      if (mine) { setProfile({ ...blankProfile(currentUser.name), ...mine }); setSavedProfile(true); }
      setProfiles(discovered);
      setMatches(matched);
      setActiveCard(0);
    } catch (e: any) {
      setError(e.message || 'Could not load roommate matching.');
    } finally { setLoading(false); }
  }, [currentUser.name]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!activeChat) { setMessages([]); return; }
    let alive = true;
    const refresh = async () => {
      try {
        const data = await api.getRoommateMessages(activeChat.id);
        if (alive) setMessages(data);
      } catch (e) { /* Conversation remains usable if a refresh is temporarily unavailable. */ }
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [activeChat?.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !messageDraft.trim() || sendingMessage) return;
    setSendingMessage(true);
    try {
      const sent = await api.sendRoommateMessage(activeChat.id, messageDraft.trim());
      setMessages(prev => [...prev, sent]);
      setMessageDraft('');
    } catch (e: any) { setError(e.message || 'Could not send message.'); }
    finally { setSendingMessage(false); }
  };

  const currentCard = profiles[activeCard];
  const matchScore = useMemo(() => currentCard ? compatibility(profile, currentCard) : null, [profile, currentCard]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const saved = await api.saveRoommateProfile(profile);
      setProfile({ ...profile, ...saved }); setSavedProfile(true);
      setNotice('Your roommate profile is live. Let the right connection find you!');
      await load();
      setView('discover');
    } catch (e: any) { setError(e.message || 'Could not save profile.'); }
    finally { setSaving(false); }
  };

  const swipe = async (action: 'like' | 'pass') => {
    if (!currentCard) return;
    setBusyId(currentCard.userId); setError(''); setNotice('');
    try {
      const result = await api.swipeRoommate(currentCard.userId, action);
      setProfiles(prev => prev.filter(p => p.userId !== currentCard.userId));
      setActiveCard(0);
      if (result.match?.matched) {
        setNotice(`It's a match with ${currentCard.displayName}! You can now propose a meetup.`);
        const updated = await api.getRoommateMatches(); setMatches(updated);
        setView('matches');
      } else if (action === 'like') {
        setNotice('Interest sent. If they like you too, you’ll match!');
      }
    } catch (e: any) { setError(e.message || 'Could not save your choice.'); }
    finally { setBusyId(''); }
  };

  const blockProfile = async (target: Profile) => {
    if (!window.confirm(`Block ${target.displayName}? You will no longer see each other in roommate discovery.`)) return;
    try {
      await api.blockRoommate(target.userId);
      setProfiles(prev => prev.filter(p => p.userId !== target.userId));
      setMatches(await api.getRoommateMatches());
      setNotice(`${target.displayName} has been blocked.`);
    } catch (e: any) { setError(e.message || 'Could not block this profile.'); }
  };

  const reportProfile = async (target: Profile) => {
    const reason = window.prompt('Why are you reporting this profile? (spam, fake profile, harassment, unsafe behaviour, other)');
    if (!reason?.trim()) return;
    const details = window.prompt('Add details if useful (optional).') || '';
    try {
      await api.reportRoommate(target.userId, reason.trim(), details);
      setNotice('Thanks. Your report has been submitted for review.');
    } catch (e: any) { setError(e.message || 'Could not submit report.'); }
  };

  const proposeMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetupFor) return;
    try {
      await api.createRoommateMeetup(meetupFor, meetup);
      setNotice('Meetup invitation sent. The plan is confirmed only after they accept.');
      setMeetupFor(null);
      setMeetup({ date: '', time: '15:00', location: '', note: '' });
      setMatches(await api.getRoommateMatches());
    } catch (e: any) { setError(e.message || 'Could not send meetup invitation.'); }
  };

  const respond = async (id: string, status: 'accepted' | 'declined' | 'cancelled') => {
    try {
      await api.respondToRoommateMeetup(id, status);
      setMatches(await api.getRoommateMatches());
      setNotice(status === 'accepted' ? 'Meetup accepted. You both have the plan.' : `Meetup ${status}.`);
    } catch (e: any) { setError(e.message || 'Could not update meetup.'); }
  };

  const scoreFor = (other: Profile) => compatibility(profile, other);
  const dateMin = new Date().toISOString().slice(0, 10);

  return <section className="roommate-shell">
    <div className="roommate-hero">
      <div className="roommate-hero-copy">
        <span className="roommate-eyebrow"><Sparkles size={14} /> ROOM FINDER SOCIAL</span>
        <h1>Meet your next <span>roommate.</span></h1>
        <p>Discover people with compatible budgets and living preferences. Match mutually, then arrange your own meetup in a place you both choose.</p>
        <div className="roommate-hero-points"><span><Heart size={15} /> Mutual matches</span><span><MapPin size={15} /> Your meetup, your choice</span></div>
      </div>
      <div className="roommate-hero-art" aria-hidden="true"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="art-heart"><Heart size={48} fill="currentColor" /></div><div className="float-chip chip-one">Same vibe ✨</div><div className="float-chip chip-two">Roommate material 🏠</div><div className="float-chip chip-three">Your next chapter</div></div>
    </div>

    <div className="roommate-nav" role="tablist" aria-label="Roommate sections">
      <button className={view === 'discover' ? 'active' : ''} onClick={() => setView('discover')}><Heart size={17} /> Discover</button>
      <button className={view === 'matches' ? 'active' : ''} onClick={() => setView('matches')}><Handshake size={17} /> Matches <b>{matches.length}</b></button>
      <button className={view === 'profile' ? 'active' : ''} onClick={() => setView('profile')}><Users size={17} /> My profile</button>
    </div>

    {error && <div className="roommate-alert error">{error}<button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
    {notice && <div className="roommate-alert success">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}

    {loading ? <div className="roommate-loading"><span className="loading-orb"></span><p>Finding your people…</p></div> : <>
      {view === 'profile' && <form className="roommate-profile-form" onSubmit={saveProfile}>
        <div className="section-heading"><div><span className="roommate-eyebrow">YOUR INTRODUCTION</span><h2>Build your roommate profile</h2><p>Only details you choose to share appear to other people. Keep it honest and skip anything you don't want public.</p></div><div className="profile-badge"><ShieldCheck size={18} /> {savedProfile ? 'Profile saved' : 'Not published'}</div></div>
        <div className="roommate-form-grid">
          <label>Display name<input required maxLength={60} value={profile.displayName} onChange={e => setProfile({...profile, displayName:e.target.value})} /></label>
          <label>City<select value={profile.city} onChange={e => setProfile({...profile, city:e.target.value})}><option>Kathmandu</option><option>Lalitpur</option><option>Bhaktapur</option><option>Pokhara</option><option>Chitwan</option><option>Other</option></select></label>
          <label>Preferred area<select required value={areas.includes(profile.area) ? profile.area : (profile.area ? 'Other' : '')} onChange={e => setProfile({...profile, area:e.target.value === 'Other' ? '' : e.target.value})}><option value="">Choose an area</option>{areas.map(a=><option key={a}>{a}</option>)}</select><input className="area-custom" aria-label="Type preferred area" placeholder="Or type your area" value={areas.includes(profile.area) ? '' : profile.area} onChange={e=>setProfile({...profile, area:e.target.value})} /></label>
          <label>Minimum monthly budget (NPR)<input type="number" min="0" max="10000000" required value={profile.minBudget} onChange={e=>setProfile({...profile,minBudget:Number(e.target.value)})}/></label>
          <label>Maximum monthly budget (NPR)<input type="number" min="0" max="10000000" required value={profile.maxBudget} onChange={e=>setProfile({...profile,maxBudget:Number(e.target.value)})}/></label>
          <label>Expected move-in date<input type="date" min={dateMin} value={profile.moveInDate || ''} onChange={e=>setProfile({...profile,moveInDate:e.target.value})}/></label>
          <label>Preferred room type<select value={profile.roomType} onChange={e=>setProfile({...profile,roomType:e.target.value})}><option>Any</option><option>Single Room</option><option>Double Room</option><option>Shared Room</option><option>Apartment</option><option>Studio</option></select></label>
          <label>Smoking preference<select value={profile.smoking} onChange={e=>setProfile({...profile,smoking:e.target.value})}><option>No preference</option><option>Non-smoking</option><option>Okay with smoking</option></select></label>
          <label>Cleanliness style<select value={profile.cleanliness} onChange={e=>setProfile({...profile,cleanliness:e.target.value})}><option>Tidy</option><option>Very tidy</option><option>Relaxed</option><option>Flexible</option></select></label>
          <label>Sleep schedule<select value={profile.sleepSchedule} onChange={e=>setProfile({...profile,sleepSchedule:e.target.value})}><option>Flexible</option><option>Early sleeper</option><option>Night owl</option><option>Regular daytime schedule</option></select></label>
          <label className="full-width">A little about you<textarea rows={3} maxLength={400} placeholder="What kind of shared living environment works for you?" value={profile.bio} onChange={e=>setProfile({...profile,bio:e.target.value})}/><small>{profile.bio.length}/400 characters</small></label>
        </div>
        <div className="form-footer"><span>Budget and preferences help us rank relevant profiles.</span><button className="roommate-primary" disabled={saving}>{saving ? 'Saving…' : savedProfile ? 'Save changes' : 'Publish my profile'} <ChevronRight size={17}/></button></div>
      </form>}

      {view === 'discover' && <div className="discover-layout">
        {!savedProfile ? <div className="roommate-empty"><div className="empty-icon"><Users size={32}/></div><h2>First, introduce yourself</h2><p>Create your roommate profile so the matching system can compare your budget, area, and living preferences.</p><button className="roommate-primary" onClick={()=>setView('profile')}>Create my profile <ChevronRight size={17}/></button></div> :
        currentCard ? <div className="swipe-column">
          <div className="discover-caption"><div><span className="roommate-eyebrow">YOUR NEXT POSSIBILITY</span><h2>Someone worth meeting.</h2></div><button className="icon-button" onClick={load} title="Refresh profiles"><RefreshCw size={17}/></button></div>
          <article className="swipe-card">
            <div className="swipe-card-top"><div className="avatar-bloom">{currentCard.displayName?.slice(0,1).toUpperCase() || '?'}</div><div className="profile-top-copy"><span className="match-pill"><Sparkles size={13}/> {matchScore?.score}% compatibility</span><h3>{currentCard.displayName}</h3><p><MapPin size={14}/> {currentCard.area}, {currentCard.city}</p></div></div>
            <div className="swipe-budget"><div><small>MONTHLY BUDGET</small><strong>Rs. {Number(currentCard.minBudget).toLocaleString()}–{Number(currentCard.maxBudget).toLocaleString()}</strong></div><div className="budget-icon"><Wallet size={20}/></div></div>
            <p className="swipe-bio">{currentCard.bio || 'Looking for a compatible person to explore shared accommodation with.'}</p>
            <div className="swipe-tags"><span><CalendarDays size={14}/>{currentCard.moveInDate || 'Flexible move-in'}</span><span><Users size={14}/>{currentCard.roomType || 'Any room type'}</span></div>
            <div className="compat-details"><strong>Why this match?</strong><div>{matchScore?.details.slice(0,3).map(d=><span key={d}>✓ {d}</span>)}</div></div>
            <div className="profile-safety-actions"><button onClick={()=>reportProfile(currentCard)}>Report profile</button><button onClick={()=>blockProfile(currentCard)}>Block</button></div>
            <div className="swipe-actions"><button className="swipe-pass" disabled={!!busyId} onClick={()=>swipe('pass')} aria-label="Pass this profile"><X size={25}/></button><span>Pass</span><button className="swipe-like" disabled={!!busyId} onClick={()=>swipe('like')} aria-label="Like this profile"><Heart size={23} fill="currentColor"/></button><span>Interested</span></div>
          </article>
          <p className="privacy-note"><ShieldCheck size={14}/> It's a match only when both people express interest.</p>
        </div> : <div className="roommate-empty"><div className="empty-icon"><Sparkles size={32}/></div><h2>You've seen everyone for now</h2><p>New profiles will appear here as more people join. You can edit your preferences or check your matches.</p><button className="roommate-secondary" onClick={()=>setView('profile')}>Update preferences</button><button className="roommate-primary" onClick={load}><RefreshCw size={16}/> Check again</button></div>}
        <aside className="meetup-side-card"><div className="side-card-icon"><MapPin size={20}/></div><h3>The match is just the beginning.</h3><p>When you both like each other, suggest a public meetup. You choose the place and time together—Room Finder doesn't book it for you.</p><div className="side-step"><span>01</span><p><b>Discover</b><small>See compatible profiles</small></p></div><div className="side-step"><span>02</span><p><b>Match</b><small>Interest must be mutual</small></p></div><div className="side-step"><span>03</span><p><b>Meet in person</b><small>Agree on a public location</small></p></div></aside>
      </div>}

      {view === 'matches' && <div className="matches-section"><div className="section-heading"><div><span className="roommate-eyebrow">MUTUAL INTEREST</span><h2>Your matches</h2><p>Chat privately with your match, then propose a meetup at a place you both agree on.</p></div><span className="match-count">{matches.length} {matches.length===1?'match':'matches'}</span></div>
        {matches.length===0 ? <div className="roommate-empty compact"><div className="empty-icon"><Heart size={30}/></div><h2>Your first match is out there</h2><p>Keep discovering profiles. When you both express interest, they'll appear here.</p><button className="roommate-primary" onClick={()=>setView('discover')}>Discover people <ChevronRight size={17}/></button></div> :
        <div className="match-grid">{matches.map(m=> <article className="match-card" key={m.id}>
          <div className="match-card-head"><div className="avatar-bloom small">{m.profile.displayName?.slice(0,1).toUpperCase()}</div><div><h3>{m.profile.displayName}</h3><p><MapPin size={13}/>{m.profile.area}, {m.profile.city}</p></div><span className="mutual-heart"><Heart size={17} fill="currentColor"/></span></div>
          <div className="match-card-budget">Rs. {Number(m.profile.minBudget).toLocaleString()}–{Number(m.profile.maxBudget).toLocaleString()} / month</div>
          <p className="match-card-bio">{m.profile.bio || 'Ready to explore shared accommodation.'}</p>
          {(() => {
            const combinedMax = Number(profile.maxBudget || 0) + Number(m.profile.maxBudget || 0);
            const areaNeedle = (m.profile.area || '').toLowerCase();
            const cityNeedle = (m.profile.city || '').toLowerCase();
            const suggested = rooms.filter(room => room.status === 'Available' && Number(room.price) <= combinedMax &&
              ((String(room.location || '').toLowerCase().includes(areaNeedle) && areaNeedle.length > 1) ||
               String(room.city || '').toLowerCase().includes(cityNeedle)))
              .slice(0, 2);
            return suggested.length ? <div className="suggested-rooms"><strong><span>🏠</span> Rooms to explore together</strong>{suggested.map(room =>
              <button key={room.id} onClick={() => onSelectRoom?.(room)}><span><b>{room.title}</b><small>{room.location}, {room.city}</small></span><em>Rs. {Number(room.price).toLocaleString()}/mo</em></button>
            )}</div> : null;
          })()}
          <div className="match-actions">
            <button className="roommate-secondary full-button" onClick={()=>{setActiveChat(m);setError('');}}> <MessageCircle size={16}/> Chat</button>
            <button className="roommate-primary full-button" onClick={()=>{setMeetupFor(m.id);setMeetup({...meetup,location:''});}}> <MapPin size={16}/> Propose meetup</button>
          </div>
          {m.meetups?.map(mt=><div className="meetup-item" key={mt.id}>
            <div className="meetup-item-head"><b><CalendarDays size={15}/> {mt.date} · {mt.time}</b><span className={`status-${mt.status}`}>{mt.status}</span></div>
            <p><MapPin size={14}/> {mt.location}</p>{mt.note && <small>{mt.note}</small>}
            {mt.status==='pending' && mt.proposerId !== currentUser.id && <div className="meetup-response"><button onClick={()=>respond(mt.id,'accepted')}>Accept</button><button onClick={()=>respond(mt.id,'declined')}>Decline</button></div>}
            {mt.status==='pending' && mt.proposerId === currentUser.id && <button className="cancel-meetup" onClick={()=>respond(mt.id,'cancelled')}>Cancel invitation</button>}
          </div>)}
        </article>)}</div>}
      </div>}
    </>}

    {meetupFor && <div className="meetup-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setMeetupFor(null);}}>
      <form className="meetup-modal" onSubmit={proposeMeetup}>
        <button type="button" className="modal-close" onClick={()=>setMeetupFor(null)} aria-label="Close">×</button>
        <span className="roommate-eyebrow"><MapPin size={14}/> MAKE IT REAL</span><h2>Suggest a meetup</h2><p>Choose a public place and a time. Your match can accept or decline the invitation.</p>
        <label>Meeting location<select required value={areas.includes(meetup.location) ? meetup.location : (meetup.location ? 'Other' : '')} onChange={e=>setMeetup({...meetup,location:e.target.value==='Other'?'':e.target.value})}><option value="">Choose a place or area</option>{areas.map(a=><option key={a}>{a}</option>)}</select><input aria-label="Custom meeting location" placeholder="Enter café, landmark, or public place" value={areas.includes(meetup.location) ? '' : meetup.location} onChange={e=>setMeetup({...meetup,location:e.target.value})}/></label>
        <div className="meetup-form-row"><label>Date<input required type="date" min={dateMin} value={meetup.date} onChange={e=>setMeetup({...meetup,date:e.target.value})}/></label><label>Time<input required type="time" value={meetup.time} onChange={e=>setMeetup({...meetup,time:e.target.value})}/></label></div>
        <label>Note (optional)<textarea rows={2} maxLength={300} placeholder="e.g. Let's talk about budget and areas." value={meetup.note} onChange={e=>setMeetup({...meetup,note:e.target.value})}/></label>
        <div className="safety-callout"><ShieldCheck size={17}/><span>For a first meetup, choose a busy public place. Share your plans with someone you trust.</span></div>
        <button className="roommate-primary full-button">Send meetup invitation <ChevronRight size={17}/></button>
      </form>
    </div>}

    {activeChat && <div className="meetup-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setActiveChat(null);}}>
      <div className="chat-modal" role="dialog" aria-modal="true" aria-label={`Chat with ${activeChat.profile.displayName}`}>
        <div className="chat-header"><div className="avatar-bloom small">{activeChat.profile.displayName?.slice(0,1).toUpperCase()}</div><div><span className="roommate-eyebrow">YOUR MATCH</span><h2>{activeChat.profile.displayName}</h2><p><MapPin size={13}/>{activeChat.profile.area}, {activeChat.profile.city}</p></div><button type="button" className="modal-close" onClick={()=>setActiveChat(null)} aria-label="Close chat">×</button></div>
        <div className="chat-safety"><ShieldCheck size={15}/> Keep personal details private until you feel comfortable.</div>
        <div className="chat-messages">
          {messages.length===0 ? <div className="chat-empty"><MessageCircle size={24}/><b>Say hello 👋</b><span>Ask about their preferred area, budget, or living expectations.</span></div> :
            messages.map(msg=><div key={msg.id} className={`chat-bubble ${msg.senderId===currentUser.id?'mine':'theirs'}`}><p>{msg.message}</p><time>{new Date(msg.createdAt).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time></div>)}
        </div>
        <form className="chat-compose" onSubmit={sendMessage}><input value={messageDraft} onChange={e=>setMessageDraft(e.target.value)} maxLength={1000} placeholder="Write a message…" aria-label="Write a message" /><button className="roommate-primary" disabled={sendingMessage || !messageDraft.trim()}><MessageCircle size={17}/><span>{sendingMessage?'Sending':'Send'}</span></button></form>
        <button className="chat-meet-cta" onClick={()=>{setActiveChat(null);setMeetupFor(activeChat.id);setMeetup({...meetup,location:''});}}><MapPin size={15}/> Ready to meet? Propose a public meetup</button>
      </div>
    </div>}
  </section>;
};
