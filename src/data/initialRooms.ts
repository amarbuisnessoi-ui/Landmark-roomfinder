import { Room } from '../types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1',
    title: 'Modern Sunset Heights Studio & Terrace',
    description:
      'A beautifully furnished sunlit studio apartment with panoramic city views, high-speed fiber internet, modular kitchenette, and a private balcony. Located near downtown cafes and central transit.',
    price: 650,
    location: '104 Sunset Boulevard, Westside',
    city: 'New York',
    roomType: 'Studio',
    status: 'Available',
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['WiFi', 'Air Conditioning', 'Kitchenette', 'Balcony', 'Washing Machine', 'Security Guard'],
    ownerId: 'owner-1',
    contactName: 'Marcus Vance',
    contactPhone: '+1 (555) 234-8901',
    contactEmail: 'marcus.vance@landmark.com',
    contactWhatsapp: '+15552348901',
    viewsCount: 342,
    latitude: 40.73061,
    longitude: -73.93524,
    isExactLocation: true,
    createdAt: '2026-07-15T10:00:00.000Z',
    updatedAt: '2026-07-15T10:00:00.000Z'
  },
  {
    id: 'room-2',
    title: 'Luxury 1-Bedroom Ocean Breeze Suite',
    description:
      'Spacious luxury oceanview suite with hardwood floors, king-size bed, marble bathroom, and central climate control. Perfect for long-term professionals or couples seeking refined comfort.',
    price: 1200,
    location: '42 Shoreline Drive, Marina District',
    city: 'Los Angeles',
    roomType: 'Apartment',
    status: 'Available',
    photos: [
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['WiFi', 'Air Conditioning', 'Gym Access', 'Swimming Pool', 'Private Bath', 'Parking Spot'],
    ownerId: 'owner-2',
    contactName: 'Elena Rostova',
    contactPhone: '+1 (555) 876-1234',
    contactEmail: 'elena.rostova@landmark.com',
    contactWhatsapp: '+15558761234',
    viewsCount: 512,
    latitude: 33.98505,
    longitude: -118.46948,
    isExactLocation: true,
    createdAt: '2026-07-20T14:30:00.000Z',
    updatedAt: '2026-08-01T09:15:00.000Z'
  },
  {
    id: 'room-3',
    title: 'Cozy Downtown Single Room near Tech Hub',
    description:
      'Quiet, fully furnished private room in a modern shared apartment. Features a ergonomic desk, high-speed WiFi, wardrobe, and shared gourmet kitchen.',
    price: 450,
    location: '788 Innovation Way, Tech District',
    city: 'San Francisco',
    roomType: 'Single Room',
    status: 'Booked',
    photos: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['WiFi', 'Shared Kitchen', 'Work Desk', 'Laundry Service', 'Heating'],
    ownerId: 'owner-1',
    contactName: 'Marcus Vance',
    contactPhone: '+1 (555) 234-8901',
    contactEmail: 'marcus.vance@landmark.com',
    contactWhatsapp: '+15552348901',
    viewsCount: 289,
    latitude: 37.77493,
    longitude: -122.41942,
    isExactLocation: true,
    createdAt: '2026-07-25T08:00:00.000Z',
    updatedAt: '2026-08-05T11:20:00.000Z'
  },
  {
    id: 'room-4',
    title: 'Executive Penthouse Loft with Skyline Panorama',
    description:
      'Ultra-exclusive penthouse room with floor-to-ceiling windows, private jacuzzi, smart home features, and dedicated elevator access in the heart of downtown.',
    price: 2100,
    location: '1 Metropolitan Tower, Financial Center',
    city: 'Chicago',
    roomType: 'Penthouse',
    status: 'Available',
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['WiFi', 'Air Conditioning', 'Jacuzzi', 'Elevator', '24/7 Concierge', 'Valet Parking'],
    ownerId: 'owner-3',
    contactName: 'David Sterling',
    contactPhone: '+1 (555) 432-9087',
    contactEmail: 'david.sterling@landmark.com',
    contactWhatsapp: '+15554329087',
    viewsCount: 678,
    latitude: 41.88183,
    longitude: -87.62318,
    isExactLocation: true,
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z'
  },
  {
    id: 'room-5',
    title: 'Charming Garden View Double Room',
    description:
      'Peaceful double bedroom in a quiet residential neighborhood. Surrounded by lush greenery, featuring hardwood floorings, queen mattress, and quiet workspace.',
    price: 520,
    location: '312 Maple Leaf Avenue',
    city: 'Seattle',
    roomType: 'Double Room',
    status: 'Available',
    photos: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['WiFi', 'Garden Access', 'Heating', 'Quiet Area', 'Free Parking'],
    ownerId: 'owner-2',
    contactName: 'Elena Rostova',
    contactPhone: '+1 (555) 876-1234',
    contactEmail: 'elena.rostova@landmark.com',
    contactWhatsapp: '+15558761234',
    viewsCount: 195,
    latitude: 47.60801,
    longitude: -122.33517,
    isExactLocation: true,
    createdAt: '2026-08-03T09:00:00.000Z',
    updatedAt: '2026-08-03T09:00:00.000Z'
  },
  {
    id: 'room-6',
    title: 'Minimalist Urban Studio near Metro Station',
    description:
      'Compact, efficient studio room with high ceilings, large double-pane windows, induction stove, private bath, and keyless smart door lock.',
    price: 580,
    location: '55 Central Plaza, Downtown',
    city: 'Miami',
    roomType: 'Studio',
    status: 'Booked',
    photos: [
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['WiFi', 'Smart Lock', 'Air Conditioning', 'Elevator', 'Pet Friendly'],
    ownerId: 'owner-3',
    contactName: 'David Sterling',
    contactPhone: '+1 (555) 432-9087',
    contactEmail: 'david.sterling@landmark.com',
    contactWhatsapp: '+15554329087',
    viewsCount: 420,
    latitude: 25.77427,
    longitude: -80.19366,
    isExactLocation: true,
    createdAt: '2026-08-04T15:00:00.000Z',
    updatedAt: '2026-08-06T10:00:00.000Z'
  }
];
