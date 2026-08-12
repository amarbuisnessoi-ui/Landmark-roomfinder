export type UserRole = 'user' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export type RoomStatus = 'Available' | 'Booked';

export type RoomType =
  | 'Single Room'
  | 'Double Room'
  | 'Studio'
  | 'Apartment'
  | 'Suite'
  | 'Shared Room'
  | 'Penthouse';

export interface Room {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  city: string;
  roomType: RoomType;
  status: RoomStatus;
  photos: string[];
  amenities: string[];
  ownerId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsapp?: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry {
  id: string;
  roomId: string;
  roomTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  ownerId: string;
  message: string;
  status: 'Pending' | 'Contacted' | 'Closed';
  createdAt: string;
}

export interface AnalyticsStats {
  totalUsers: number;
  totalOwners: number;
  totalRooms: number;
  availableRooms: number;
  bookedRooms: number;
  totalPageViews: number;
  totalInquiries: number;
  viewsTrend: { date: string; views: number; inquiries: number }[];
  roomsByCity: { city: string; count: number }[];
  roomsByType: { type: string; count: number }[];
}

export interface SearchFilters {
  query: string;
  city: string;
  minPrice: number | null;
  maxPrice: number | null;
  roomType: string;
  status: string;
  amenities: string[];
}
