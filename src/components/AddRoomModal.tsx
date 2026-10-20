import React, { useState } from 'react';
import { Room, User } from '../types';
import { LocationPickerMap } from './LocationPickerMap';
import { X, Upload, Image as ImageIcon, MapPin, DollarSign, Phone, Mail, Building, Check, Sparkles, Edit, Trash2, Star, ArrowUp, ArrowDown } from 'lucide-react';

interface AddRoomModalProps {
  onClose: () => void;
  onSubmit: (roomData: Partial<Room>) => void | Promise<void>;
  currentUser: User | null;
  roomToEdit?: Room | null;
}

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
  const [city, setCity] = useState(roomToEdit?.city || 'Kathmandu');
  const [location, setLocation] = useState(roomToEdit?.location || '');
  const [price, setPrice] = useState(roomToEdit ? String(roomToEdit.price) : '');
  const [roomType, setRoomType] = useState<any>(roomToEdit?.roomType || 'Studio');
  const [description, setDescription] = useState(roomToEdit?.description || '');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photos, setPhotos] = useState<string[]>(roomToEdit?.photos || []);
  const [photoError, setPhotoError] = useState('');
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [amenities, setAmenities] = useState<string[]>(
    roomToEdit?.amenities || ['WiFi', 'Air Conditioning']
  );
  const [contactName, setContactName] = useState(roomToEdit?.contactName || currentUser?.name || '');
  const [contactPhone, setContactPhone] = useState(
    roomToEdit?.contactPhone || currentUser?.phone || ''
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
    const url = photoUrlInput.trim();
    if (!url) return;
    if (photos.length >= 10) {
      setPhotoError('You can add up to 10 photos per room.');
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setPhotoError('Please enter a valid image URL starting with https:// or http://.');
      return;
    }
    setPhotos((previous) => [...previous, url]);
    setPhotoUrlInput('');
    setPhotoError('');
  };

  // Resize phone photos before storing them in the room record. This avoids
  // oversized JSON requests and makes uploads more reliable on mobile data.
  const compressImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`${file.name} is not an image.`));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}. Please try another photo.`));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error(`Could not open ${file.name}. Please use a JPG, PNG, or WebP photo.`));
      image.onload = () => {
        const maxDimension = 1280;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Your browser could not process this photo.'));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let compressed = canvas.toDataURL('image/jpeg', 0.68);
        // Keep each image compact so ten photos fit inside the server's JSON body limit.
        if (compressed.length > 750_000) {
          const smallerCanvas = document.createElement('canvas');
          const smallerScale = Math.min(1, 1024 / Math.max(image.width, image.height));
          smallerCanvas.width = Math.max(1, Math.round(image.width * smallerScale));
          smallerCanvas.height = Math.max(1, Math.round(image.height * smallerScale));
          const smallerContext = smallerCanvas.getContext('2d');
          if (smallerContext) {
            smallerContext.drawImage(image, 0, 0, smallerCanvas.width, smallerCanvas.height);
            compressed = smallerCanvas.toDataURL('image/jpeg', 0.55);
          }
        }
        if (compressed.length > 950_000) {
          reject(new Error(`${file.name} is too large to upload. Please choose a smaller photo.`));
          return;
        }
        resolve(compressed);
      };
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selectedFiles = Array.from(input.files || []) as File[];
    input.value = ''; // allow selecting the same photo again after removing it
    if (!selectedFiles.length) return;
    const availableSlots = Math.max(0, 10 - photos.length);
    if (availableSlots === 0) {
      setPhotoError('You can add up to 10 photos per room.');
      return;
    }
    const filesToProcess = selectedFiles.slice(0, availableSlots);
    setIsProcessingPhotos(true);
    setPhotoError('');
    try {
      const compressedPhotos: string[] = [];
      for (const file of filesToProcess) compressedPhotos.push(await compressImage(file));
      setPhotos((previous) => [...previous, ...compressedPhotos].slice(0, 10));
      if (selectedFiles.length > availableSlots) {
        setPhotoError(`Added ${availableSlots} photos. A room can have a maximum of 10.`);
      }
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Photo upload failed. Please try again.');
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const removePhoto = (index: number) => setPhotos((previous) => previous.filter((_, i) => i !== index));
  const movePhoto = (index: number, direction: -1 | 1) => {
    setPhotos((previous) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= previous.length) return previous;
      const reordered = [...previous];
      [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
      return reordered;
    });
  };

  const toggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!title.trim() || !location.trim() || !price || !contactPhone.trim()) return;
    if (photos.length === 0) {
      setPhotoError('Add at least one real room photo before publishing.');
      return;
    }
    if (isProcessingPhotos) {
      setPhotoError('Please wait until your photos finish processing.');
      return;
    }
    setPhotoError('');
    setSubmitError('');
    setIsSubmitting(true);

    try {
      await onSubmit({
      title,
      city,
      location,
      price: Number(price),
      roomType,
      description,
      photos,
      amenities,
      contactName: contactName || 'Property Owner',
      contactPhone,
      contactEmail,
      contactWhatsapp,
      status,
      latitude: latitude != null ? Number(latitude) : undefined,
      longitude: longitude != null ? Number(longitude) : undefined,
      isExactLocation: isExactLocation && latitude != null && longitude != null,
      ownerId: roomToEdit?.ownerId || currentUser?.id || ''
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
                placeholder="e.g. Kathmandu"
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
                placeholder="12000"
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
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-700">Real Room Photos * ({photos.length}/10)</label>
              <span className="text-[11px] text-slate-500">First photo is the cover</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className={`flex-1 p-3 rounded-xl border border-dashed text-blue-700 text-xs font-semibold flex items-center justify-center gap-2 min-h-[48px] ${isProcessingPhotos ? 'bg-slate-100 border-slate-300 cursor-wait' : 'bg-blue-50 hover:bg-blue-100 border-blue-300 cursor-pointer'}`}>
                <Upload className="w-4 h-4" />
                <span>{isProcessingPhotos ? 'Processing photos…' : 'Choose multiple photos from gallery'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={isProcessingPhotos || photos.length >= 10} onChange={handleFileUpload} className="hidden" />
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  placeholder="Image URL (optional)"
                  className="min-w-0 flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:border-blue-600 focus:outline-none min-h-[42px]"
                />
                <button type="button" onClick={handleAddPhoto} className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold min-h-[42px]">Add URL</button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Select up to 10 photos at once. Photos are resized on your phone before saving to keep uploads smaller.</p>
            {photoError && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">{photoError}</p>}
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <div key={`${index}-${photo.slice(0, 32)}`} className={`relative rounded-xl overflow-hidden border-2 bg-slate-100 ${index === 0 ? 'border-blue-600' : 'border-slate-200'}`}>
                    <img src={photo} alt={`Room photo ${index + 1}`} className="w-full aspect-[4/3] object-cover" />
                    {index === 0 && <span className="absolute top-1 left-1 rounded-full bg-blue-600 text-white px-2 py-1 text-[10px] font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> Cover</span>}
                    <div className="flex items-center justify-between gap-1 p-1.5 bg-white">
                      <span className="text-[10px] text-slate-500">Photo {index + 1}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" disabled={index === 0} onClick={() => movePhoto(index, -1)} aria-label="Move photo left" className="p-1 rounded bg-slate-100 disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                        <button type="button" disabled={index === photos.length - 1} onClick={() => movePhoto(index, 1)} aria-label="Move photo right" className="p-1 rounded bg-slate-100 disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                        <button type="button" onClick={() => removePhoto(index)} aria-label="Remove photo" className="p-1 rounded bg-red-50 text-red-600"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                <ImageIcon className="w-7 h-7 mx-auto mb-2 text-slate-400" />
                No room photos selected yet. Upload real photos to publish this listing.
              </div>
            )}
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
                  placeholder="98XXXXXXXX"
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
                  placeholder="98XXXXXXXX"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 min-h-[40px]"
                />
              </div>
            </div>
          </div>

          {submitError && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{submitError}</p>}

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
              disabled={isProcessingPhotos || isSubmitting}
              className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-200 cursor-pointer min-h-[44px]"
            >
              {isProcessingPhotos ? 'Processing Photos…' : isSubmitting ? 'Saving Room…' : roomToEdit ? 'Save Listing Changes' : 'Publish Room Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

