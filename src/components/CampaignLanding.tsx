import React, { useEffect, useMemo, useState } from 'react';
import { Award, Copy, Share2, Users, Megaphone, ArrowRight, CheckCircle2, LogIn, Home } from 'lucide-react';

type Progress = { shares: number; reached: number; badgeUnlocked: boolean; claimed?: boolean };
const getToken = (key: string) => {
  let value = localStorage.getItem(key);
  if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value); }
  return value;
};

async function csrf() {
  const response = await fetch('/api/auth/csrf', { credentials: 'include' });
  if (!response.ok) return '';
  const data = await response.json();
  return data.csrfToken || '';
}

export const CampaignLanding: React.FC = () => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const incomingRef = (params.get('ref') || '').toUpperCase();
  const incomingGuest = params.get('g') || '';
  if (incomingRef) localStorage.setItem('lrf_campaign_referral_code', incomingRef);
  const ownGuestId = getToken('lrf_campaign_guest_id');
  const ownPublicKey = getToken('lrf_campaign_public_key').replace(/-/g, '').toUpperCase();
  const [progress, setProgress] = useState<Progress>({ shares: 0, reached: 0, badgeUnlocked: false });
  const [ownCode, setOwnCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('');
  const ownLink = `${window.location.origin}/spread?${ownCode ? `ref=${encodeURIComponent(ownCode)}` : `g=${encodeURIComponent(ownPublicKey)}`}`;

  useEffect(() => {
    const visitorId = getToken('lrf_campaign_visitor_id').replace(/-/g, '').toUpperCase();
    // Count this visit as reach for the person whose link brought the visitor here.
    if (incomingRef || (incomingGuest && incomingGuest !== ownPublicKey)) {
      void csrf().then(token => fetch('/api/campaign/track', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'x-csrf-token': token }, body: JSON.stringify({ eventType: 'visit', ref: incomingRef || undefined, campaignKey: incomingRef ? undefined : incomingGuest, guestId: ownGuestId, visitorId }) }));
    }
    void fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).then(async data => {
      setIsLoggedIn(Boolean(data.user));
      if (data.user) { try { const r = await fetch('/api/referrals/me', { credentials: 'include' }); if (r.ok) { const d = await r.json(); setOwnCode(d.code || ''); } } catch { /* sharing with a guest link still works */ } }
    }).catch(() => undefined);
  }, []);

  useEffect(() => { const query = ownCode ? `ref=${encodeURIComponent(ownCode)}` : `g=${encodeURIComponent(ownPublicKey)}`; void fetch(`/api/campaign/progress?${query}`, { credentials: 'include' }).then(r => r.json()).then(setProgress).catch(() => undefined); }, [ownCode]);

  const trackShare = async () => {
    const token = await csrf();
    const response = await fetch('/api/campaign/track', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ eventType: 'share', ref: ownCode || undefined, campaignKey: ownCode ? undefined : ownPublicKey, guestId: ownGuestId })
    });
    if (!response.ok) throw new Error('Could not record your share. Please try again.');
    setProgress(previous => ({ ...previous, shares: previous.shares + 1, badgeUnlocked: true }));
  };

  const share = async () => {
    try {
      await trackShare();
      if (navigator.share) {
        await navigator.share({ title: 'Landmark Room Finder — Share the movement', text: 'Know someone looking for a room or roommate in Nepal? Discover Landmark Room Finder, share the word, and unlock community badges!', url: ownLink });
      } else {
        await navigator.clipboard.writeText(ownLink); setCopied(true); setTimeout(() => setCopied(false), 1800);
      }
      setStatus('Share initiated! Your progress has been updated.');
    } catch (error: any) { if (error?.name !== 'AbortError') setStatus(error.message || 'Sharing could not be started.'); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(ownLink); await trackShare(); setCopied(true); setStatus('Link copied and share action recorded.'); setTimeout(() => setCopied(false), 1800); }
    catch (error: any) { setStatus(error.message || 'Could not copy the link.'); }
  };

  const claim = () => {
    localStorage.setItem('lrf_campaign_claim_pending', '1');
    window.location.href = `/?campaignClaim=1&guestId=${encodeURIComponent(ownGuestId)}${incomingRef ? `&ref=${encodeURIComponent(incomingRef)}` : ''}`;
  };

  return <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-50 px-4 py-8 sm:py-14">
    <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 px-6 py-10 text-white sm:px-12 sm:py-14">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10"/><div className="absolute -bottom-24 right-36 h-56 w-56 rounded-full bg-white/10"/>
        <a href="/" className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold"><Home className="h-4 w-4"/> Landmark Room Finder</a>
        <div className="relative mt-8 max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1 text-xs font-extrabold text-slate-900"><Megaphone className="h-4 w-4"/> THE COMMUNITY GROWTH CAMPAIGN</div>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">One share can help someone find a place to call home.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-indigo-100 sm:text-lg">Help more people in Nepal discover rooms, rentals, and compatible roommates. Spread the word, build your impact, and unlock community badges as you go.</p>
          <div className="mt-7 flex flex-wrap gap-3"><button onClick={() => void share()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-extrabold text-indigo-800 shadow-lg hover:bg-indigo-50"><Share2 className="h-5 w-5"/> Share the campaign <ArrowRight className="h-4 w-4"/></button><button onClick={() => void copy()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-bold text-white hover:bg-white/20"><Copy className="h-4 w-4"/>{copied ? 'Copied!' : 'Copy my link'}</button></div>
        </div>
      </header>
      <section className="grid gap-4 p-5 sm:grid-cols-3 sm:p-8">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><Share2 className="h-6 w-6 text-indigo-700"/><div className="mt-3 text-3xl font-black text-slate-900">{progress.shares}</div><div className="mt-1 text-sm font-bold text-slate-700">Shares initiated</div><p className="mt-2 text-xs leading-5 text-slate-500">Each time you initiate sharing or copy your campaign link. This does not claim message delivery.</p></div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><Users className="h-6 w-6 text-emerald-700"/><div className="mt-3 text-3xl font-black text-slate-900">{progress.reached}</div><div className="mt-1 text-sm font-bold text-slate-700">Unique visitors reached</div><p className="mt-2 text-xs leading-5 text-slate-500">Distinct browser tokens opening your personal link. Repeat visits from the same token count once.</p></div>
        <div className={`rounded-2xl border p-5 ${progress.badgeUnlocked ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><Award className={`h-6 w-6 ${progress.badgeUnlocked ? 'text-amber-600' : 'text-slate-400'}`}/><div className="mt-3 text-xl font-black text-slate-900">{progress.badgeUnlocked ? 'First Share unlocked!' : '🌱 First Share badge'}</div><div className="mt-1 text-sm font-bold text-slate-700">{progress.badgeUnlocked ? 'Ready to claim' : 'Your first milestone'}</div><p className="mt-2 text-xs leading-5 text-slate-500">Initiate one share to unlock the first badge. Log in to attach your progress to your account.</p></div>
      </section>
      <section className="grid gap-8 border-t border-slate-100 px-5 py-8 sm:grid-cols-2 sm:px-8">
        <div><h2 className="text-2xl font-black text-slate-900">How it works</h2><ol className="mt-5 space-y-4 text-sm text-slate-600">{[['01','Discover','Learn about Landmark Room Finder and the campaign.'],['02','Share','Send your personal campaign link to friends and communities.'],['03','Unlock','Your first badge unlocks after you initiate a share.'],['04','Claim','Sign in or create an account to save your badge and progress.']].map(([n,title,body]) => <li key={n} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-black text-indigo-700">{n}</span><span><strong className="block text-slate-900">{title}</strong>{body}</span></li>)}</ol></div>
        <div className="rounded-2xl bg-slate-950 p-6 text-white"><CheckCircle2 className="h-7 w-7 text-emerald-400"/><h2 className="mt-3 text-2xl font-black">Your journey, saved</h2><p className="mt-3 text-sm leading-6 text-slate-300">Start without an account. When you claim your badge, we’ll connect eligible campaign activity to your Landmark account so you can continue from your existing dashboard.</p><button onClick={() => progress.badgeUnlocked ? claim() : void share()} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 font-extrabold text-slate-950 hover:bg-amber-200">{progress.badgeUnlocked ? (isLoggedIn ? 'Save my badge and progress' : 'Log in to claim my badge') : 'Share once to unlock your first badge'} {progress.badgeUnlocked ? <LogIn className="h-4 w-4"/> : <Share2 className="h-4 w-4"/>}</button><a href="/" className="mt-4 block text-center text-xs font-semibold text-indigo-200 hover:text-white">Explore the room finder instead</a></div>
      </section>
      {status && <div role="status" className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-sm font-semibold text-indigo-800">{status}</div>}
      <footer className="border-t border-slate-100 px-6 py-4 text-center text-xs text-slate-400">Landmark Room Finder · Share the word, help someone find a home.</footer>
    </div>
  </main>;
};
