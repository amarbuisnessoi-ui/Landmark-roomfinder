import bcrypt from 'bcryptjs';

/**
 * Password Hashing & Verification
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * XSS & HTML Input Escaping/Sanitization
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Email & Phone Format Validation
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // Allow phone characters +, -, spaces, parens, digits, min length 7
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15 && /^\d+$/.test(cleaned);
}

/**
 * Image / Photo URL Security Validation
 * Prevents executable/malicious URLs, path traversal, unsafe protocols
 */
export function validatePhotoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Prevent path traversal
  if (trimmed.includes('..') || trimmed.includes('%2e%2e')) {
    return false;
  }

  // Allow standard image Data URLs (jpeg, png, webp, gif) up to 10MB
  if (trimmed.startsWith('data:image/')) {
    const isAllowedMime = /^data:image\/(jpeg|png|webp|gif);base64,/i.test(trimmed);
    return isAllowedMime && trimmed.length <= 14 * 1024 * 1024;
  }

  // Allow HTTP/HTTPS URLs
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    // Check extension if present to prevent executable or script file downloads
    const pathname = parsed.pathname.toLowerCase();
    const forbiddenExts = ['.exe', '.php', '.js', '.sh', '.bat', '.cmd', '.py', '.rb', '.pl', '.dll', '.jar', '.html', '.htm', '.svg'];
    if (forbiddenExts.some((ext) => pathname.endsWith(ext))) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function validatePhotosArray(photos: any): string[] {
  if (!Array.isArray(photos)) {
    return ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'];
  }
  const validPhotos = photos
    .filter((p) => typeof p === 'string' && validatePhotoUrl(p))
    .slice(0, 10); // Limit maximum 10 photos

  return validPhotos.length > 0
    ? validPhotos
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'];
}
