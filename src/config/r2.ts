/**
 * Cloudflare R2 Configuration and Helpers
 */

// Centralized public R2 base URL
export const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-51f77dea193744bc8566b65ad00a0ace.r2.dev';

/**
 * Resolves a product image reference into a loadable URL.
 * Supports:
 * 1. Cloudflare R2 object keys (e.g. "products/coragen.jpg")
 * 2. Full HTTP/HTTPS URLs (e.g. "https://images.unsplash.com/...")
 * 3. Base64 Data URLs (e.g. "data:image/svg+xml;...")
 * 4. Local asset paths and IndexedDB filename keys (e.g. "coragen.jpg")
 * 
 * @param imageKey The image filename, key, or URL
 * @returns The fully qualified or local URL
 */
export function getProductImageUrl(imageKey: string | null | undefined): string {
  if (!imageKey) return "";

  // If it's already a full URL or local path reference, return it as-is
  if (
    imageKey.startsWith('http://') || 
    imageKey.startsWith('https://') || 
    imageKey.startsWith('data:') ||
    imageKey.startsWith('/') ||
    imageKey.startsWith('./') ||
    imageKey.startsWith('../')
  ) {
    return imageKey;
  }

  // If it matches an R2 key structure (e.g. starts with "products/"), prepend R2 URL
  if (imageKey.startsWith('products/')) {
    const normalizedBase = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
    return `${normalizedBase}/${imageKey}`;
  }

  // Fallback: return as-is for local IndexedDB lookup
  return imageKey;
}
