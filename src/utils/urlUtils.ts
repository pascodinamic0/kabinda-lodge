/**
 * Get the base URL
 * Returns the origin without any base path since app is served at root
 */
export const getBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.origin;
};

/**
 * Get the full URL for a given path
 * @param path - The path to append (should start with /)
 * @returns The full URL
 */
export const getFullUrl = (path: string): string => {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

