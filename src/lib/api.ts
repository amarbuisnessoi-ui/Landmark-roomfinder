import { AnalyticsStats, Inquiry, Room, User } from '../types';

let cachedCsrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const res = await fetch('/api/auth/csrf', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.csrfToken) {
        cachedCsrfToken = data.csrfToken;
        return data.csrfToken;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch CSRF token:', e);
  }
  return '';
}

async function getMutationHeaders(extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getCsrfToken();
  return {
    'Content-Type': 'application/json',
    'x-csrf-token': token,
    ...extraHeaders
  };
}

export const api = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.csrfToken) {
        cachedCsrfToken = data.csrfToken;
      }
      return data.user || null;
    } catch (e) {
      return null;
    }
  },

  async trackView(roomId?: string): Promise<void> {
    try {
      const headers = await getMutationHeaders();
      await fetch('/api/analytics/view', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ roomId })
      });
    } catch (e) {
      console.warn('Analytics view error:', e);
    }
  },

  async getAnalytics(): Promise<AnalyticsStats> {
    const res = await fetch('/api/analytics/stats', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  },

  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'user' | 'owner';
  }): Promise<{ user: User; message: string }> {
    const headers = await getMutationHeaders();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.csrfToken) {
      cachedCsrfToken = result.csrfToken;
    }
    if (!res.ok) throw new Error(result.error || 'Registration failed');
    return result;
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: User; message: string }> {
    const headers = await getMutationHeaders();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.csrfToken) {
      cachedCsrfToken = result.csrfToken;
    }
    if (!res.ok) throw new Error(result.error || 'Login failed');
    return result;
  },

  async logout(): Promise<void> {
    const headers = await getMutationHeaders();
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers,
      credentials: 'include'
    });
    cachedCsrfToken = null;
  },

  async getRooms(params?: Record<string, any>): Promise<Room[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const res = await fetch(`/api/rooms?${searchParams.toString()}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
  },

  async getRoom(id: string): Promise<Room> {
    const res = await fetch(`/api/rooms/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch room');
    return res.json();
  },

  async createRoom(roomData: Partial<Room>): Promise<{ room: Room; message: string }> {
    const headers = await getMutationHeaders();
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(roomData)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create room');
    return result;
  },

  async updateRoom(id: string, roomData: Partial<Room>): Promise<{ room: Room; message: string }> {
    const headers = await getMutationHeaders();
    const res = await fetch(`/api/rooms/${id}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(roomData)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update room');
    return result;
  },

  async deleteRoom(id: string): Promise<{ message: string }> {
    const headers = await getMutationHeaders();
    const res = await fetch(`/api/rooms/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete room');
    return result;
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/admin/users', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const headers = await getMutationHeaders();
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete user');
    return result;
  },

  async sendInquiry(data: Partial<Inquiry>): Promise<{ inquiry: Inquiry; message: string }> {
    const headers = await getMutationHeaders();
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to send inquiry');
    return result;
  },

  async getOwnerInquiries(ownerId: string): Promise<Inquiry[]> {
    const res = await fetch(`/api/inquiries/owner/${ownerId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch owner inquiries');
    return res.json();
  },

  async getUserInquiries(userId: string): Promise<Inquiry[]> {
    const res = await fetch(`/api/inquiries/user/${userId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch user inquiries');
    return res.json();
  },

  async getRoommateProfile(): Promise<any> {
    const res = await fetch('/api/roommates/me', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load roommate profile');
    return data.profile;
  },

  async saveRoommateProfile(profile: Record<string, any>): Promise<any> {
    const headers = await getMutationHeaders();
    const res = await fetch('/api/roommates/me', { method: 'PUT', headers, credentials: 'include', body: JSON.stringify(profile) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save roommate profile');
    return data.profile;
  },

  async discoverRoommates(): Promise<any[]> {
    const res = await fetch('/api/roommates/discover', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load roommate profiles');
    return data;
  },

  async swipeRoommate(targetUserId: string, action: 'like' | 'pass'): Promise<any> {
    const headers = await getMutationHeaders();
    const res = await fetch('/api/roommates/swipe', { method: 'POST', headers, credentials: 'include', body: JSON.stringify({ targetUserId, action }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save your choice');
    return data;
  },

  async getRoommateMatches(): Promise<any[]> {
    const res = await fetch('/api/roommates/matches', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load matches');
    return data;
  },

  async createRoommateMeetup(matchId: string, details: Record<string, string>): Promise<any> {
    const headers = await getMutationHeaders();
    const res = await fetch(`/api/roommates/matches/${encodeURIComponent(matchId)}/meetups`, { method: 'POST', headers, credentials: 'include', body: JSON.stringify(details) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to propose meetup');
    return data.meetup;
  },

  async respondToRoommateMeetup(meetupId: string, status: 'accepted' | 'declined' | 'cancelled'): Promise<void> {
    const headers = await getMutationHeaders();
    const res = await fetch(`/api/roommates/meetups/${encodeURIComponent(meetupId)}`, { method: 'PATCH', headers, credentials: 'include', body: JSON.stringify({ status }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update meetup');
  },

  async getRoommateMessages(matchId: string): Promise<any[]> {
    const res = await fetch(`/api/roommates/matches/${encodeURIComponent(matchId)}/messages`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load conversation');
    return data;
  },

  async sendRoommateMessage(matchId: string, message: string): Promise<any> {
    const headers = await getMutationHeaders();
    const res = await fetch(`/api/roommates/matches/${encodeURIComponent(matchId)}/messages`, { method: 'POST', headers, credentials: 'include', body: JSON.stringify({ message }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send message');
    return data.message;
  },

  async blockRoommate(targetUserId: string): Promise<void> {
    const headers = await getMutationHeaders();
    const res = await fetch('/api/roommates/block', { method: 'POST', headers, credentials: 'include', body: JSON.stringify({ targetUserId }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to block profile');
  },

  async reportRoommate(targetUserId: string, reason: string, details = ''): Promise<void> {
    const headers = await getMutationHeaders();
    const res = await fetch('/api/roommates/report', { method: 'POST', headers, credentials: 'include', body: JSON.stringify({ targetUserId, reason, details }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to report profile');
  }

};

