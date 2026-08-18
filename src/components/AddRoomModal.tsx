import React, { useState } from 'react';
import { Room, User } from '../types';
import { LocationPickerMap } from './LocationPickerMap';
import { X, Upload, Plus, Image as ImageIcon, MapPin, DollarSign, Phone, Mail, Building, Check, Sparkles, Edit } from 'lucide-react';

interface AddRoomModalProps {
  onClose: () => void;
  onSubmit: (roomData: Partial<Room>) => void;
  currentUser: User | null;
  roomToEdit?: Room | null;
}

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'
];

const AMENITY_OPTIONS = [
  'WiFi',
  'Air Conditioning',
  'Private Bath',
  'Kitchenette',
  'Balcony',
  'Washing Machine',
  'Swimming Pool',
  'Gym Access',
  'Parking Spot',
  '24/7 Security',
  'Elevator',
  'Pet Friendly'
];

export const AddRoomModal: React.FC<AddRoomModalProps> = ({
  onClose,
  onSubmit,
  currentUser,
  roomToEdit
}) => {
  const [title, setTitle] = useState(roomToEdit?.title || '');
  const [city, setCity] = useState(roomToEdit?.city || 'New York');
  const [location, setLocation] = useState(roomToEdit?.location || '');
  const [price, setPrice] = useState(roomToEdit ? String(roomToEdit.price) : '650');
  const [roomType, setRoomType] = useState<any>(roomToEdit?.roomType || 'Studio');
  const [description, setDescription] = useState(roomToEdit?.description || '');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photos, setPhotos] = useState<string[]>(
    roomToEdit?.photos && roomToEdit.photos.length > 0 ? roomToEdit.photos : [PRESET_PHOTOS[0]]
  );
  const [amenities, setAmenities] = useState<string[]>(
    roomToEdit?.amenities || ['WiFi', 'Air Conditioning']
  );
  const [contactName, setContactName] = useState(roomToEdit?.contactName || currentUser?.name || '');
  const [contactPhone, setContactPhone] = useState(
    roomToEdit?.contactPhone || currentUser?.phone || '+1 (555) 000-2222'
  );
  const [contactEmail, setContactEmail] = useState(
    roomToEdit?.contactEmail || currentUser?.email || ''
  );
  const [contactWhatsapp, setContactWhatsapp] = useState(
    roomToEdit?.contactWhatsapp || currentUser?.phone || ''
  );
  const [status, setStatus] = useState<'Available' | 'Booked'>(
    roomToEdit?.status || 'Available'
  );

  // Map Coordinates state
  const [latitude, setLatitude] = useState<number | undefined | null>(
    roomToEdit?.latitude ?? null
  );
  const [longitude, setLongitude] = useState<number | undefined | null>(
    roomToEdit?.longitude ?? null
  );
  const [isExactLocation, setIsExactLocation] = useState<boolean>(
    roomToEdit?.isExactLocation ?? (roomToEdit?.latitude != null)
  );

  const handleCoordinatesChange = (coords: { lat: number; lng: number } | null) => {
    if (coords) {
      setLatitude(coords.lat);
      setLongitude(coords.lng);
      setIsExactLocation(true);
    } else {
      setLatitude(null);
      setLongitude(null);
      setIsExactLocation(false);
    }
  };

  const handleAddPhoto = () => {
    if (photoUrlInput.trim()) {
      setPhotos([...photos, photoUrlInput.trim()]);
      setPhotoUrlInput('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos([...photos, event.target.result as string]);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !price || !contactPhone) return;

    onSubmit({
      title,
      city,
      location,
      price: Number(price),
      roomType,
      description,
      photos: photos.length > 0 ? photos : [PRESET_PHOTOS[0]],
      amenities,
      contactName: contactName || 'Property Owner',
      contactPhone,
      contactEmail,
      contactWhatsapp,
      status,
      latitude: latitude != null ? Number(latitude) : undefined,
      longitude: longitude != null ? Number(longitude) : undefined,
      isExactLocation: isExactLocation && latitude != null && longitude != null,
      ownerId: roomToEdit?.ownerId || currentUser?.id || 'owner-1'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-800">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white shadow-sm flex items-center justify-center font-bold shrink-0">
              {roomToEdit ? <Edit className="w-5 h-5" /> : <Building className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {roomToEdit ? 'Edit Room Listing' : 'Post New Room Listing'}
              </h2>
              <p className="text-xs text-slate-500">
                {roomToEdit ? 'Update details, pricing, and exact map pin location' : 'Fill in room details, photos, exact map pin, and contact info'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white text-slate-500 hover:text-slate-800 border border-slate-200 shadow-2xs transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Title & Room Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Room Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Modern Sunset Heights Studio"
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:border-blue-600 focus:outline-none min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Room Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:border-blue-600 focus:outline-none cursor-pointer min-h-[44px]"
              >
                <option value="Studio">Studio</option>
                <option value="Single Room">Single Room</option>
                <option value="Double Room">Double Room</option>
                <option value="Apartment">Full Apartment</option>
                <option value="Suite">Suite</option>
                <option value="Penthouse">Penthouse</option>
              </select>
            </div>
          </div>

          {/* Location, City & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Los Angeles"
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:border-blue-600 focus:outline-none min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Address / Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. 104 Sunset Boulevard"
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:border-blue-600 focus:outline-none min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Price (Rs./month) *</label>
              <input
                type="number"
                required
                min="50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="650"
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:border-blue-600 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Exact Map Location Picker Section */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <LocationPickerMap
              latitude={latitude}
              longitude={longitude}
              city={city}
              location={location}
              onChangeCoordinates={handleCoordinatesChange}
            />
          </div>

          {/* Status Switcher */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Room Status</label>
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setStatus('Available')}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  status === 'Available'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Available for Rent
              </button>
              <button
                type="button"
                onClick={() => setStatus('Booked')}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                  status === 'Booked'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Mark as Booked
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe room features, sunlight, lease terms, nearby transit..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:border-blue-600 focus:outline-none resize-none"
            />
          </div>

          {/* Room Photos */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700">Room Photos</label>
            
            {/* Presets picker */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500">Select Preset Images or Add URL:</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_PHOTOS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (!photos.includes(url)) setPhotos([...photos, url]);
                    }}
                    className={`aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      photos.includes(url) ? 'border-blue-600 scale-95 shadow-2xs' : 'border-slate-200 opacity-70'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL or upload */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                placeholder="Or paste image URL (https://...)"
                className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:border-blue-600 focus:outline-none min-h-[42px]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer min-h-[42px] flex items-center justify-center"
                >
                  Add URL
                </button>
                <label className="flex-1 sm:flex-none p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]">
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Amenities Checklist */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Select Amenities</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {AMENITY_OPTIONS.map((amenity) => {
                const isSelected = amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border min-h-[34px] flex items-center ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{amenity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">Owner Contact Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500">Contact Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 min-h-[40px]"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-2222"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 min-h-[40px]"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="owner@landmark.com"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 min-h-[40px]"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">WhatsApp Number</label>
                <input
                  type="text"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="+1 (555) 000-2222"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 min-h-[40px]"
                />
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="flex gap-2 sm:gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-200 cursor-pointer min-h-[44px]"
            >
              {roomToEdit ? 'Save Listing Changes' : 'Publish Room Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

