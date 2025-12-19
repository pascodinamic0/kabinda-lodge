/**
 * Get the base URL including the base path
 * This ensures all redirect URLs work correctly with the /kabinda-lodge base path
 */
export const getBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return `${window.location.origin}/kabinda-lodge`;
};

/**
 * Get the full URL for a given path
 * @param path - The path to append (should start with /)
 * @returns The full URL with base path
 */
export const getFullUrl = (path: string): string => {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

