import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Github,
  MessageCircle,
  Globe
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface SocialLink {
  name: string;
  url: string;
}

/**
 * Detects the social media platform from a URL
 */
export function detectPlatformFromUrl(url: string): string {
  if (!url) return 'Unknown';
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Remove www. prefix
    const domain = hostname.replace(/^www\./, '');
    
    // Platform detection patterns
    const platformPatterns: Record<string, string[]> = {
      'Facebook': ['facebook.com', 'fb.com', 'm.facebook.com'],
      'Instagram': ['instagram.com', 'ig.com'],
      'Twitter': ['twitter.com', 'x.com', 't.co'],
      'LinkedIn': ['linkedin.com', 'lnkd.in'],
      'YouTube': ['youtube.com', 'youtu.be', 'm.youtube.com'],
      'TikTok': ['tiktok.com', 'vm.tiktok.com'],
      'WhatsApp': ['wa.me', 'whatsapp.com', 'api.whatsapp.com'],
      'Pinterest': ['pinterest.com', 'pin.it'],
      'Snapchat': ['snapchat.com', 'snapchat.com/add'],
      'Telegram': ['t.me', 'telegram.org'],
      'Discord': ['discord.com', 'discord.gg'],
      'Reddit': ['reddit.com'],
      'GitHub': ['github.com'],
      'Medium': ['medium.com'],
      'Vimeo': ['vimeo.com'],
      'Spotify': ['spotify.com', 'open.spotify.com'],
      'SoundCloud': ['soundcloud.com'],
      'Twitch': ['twitch.tv'],
      'Behance': ['behance.net'],
      'Dribbble': ['dribbble.com'],
    };
    
    for (const [platform, patterns] of Object.entries(platformPatterns)) {
      if (patterns.some(pattern => domain.includes(pattern))) {
        return platform;
      }
    }
    
    return 'Unknown';
  } catch {
    // If URL parsing fails, try simple string matching
    const urlLower = url.toLowerCase();
    if (urlLower.includes('facebook') || urlLower.includes('fb.com')) return 'Facebook';
    if (urlLower.includes('instagram') || urlLower.includes('ig.com')) return 'Instagram';
    if (urlLower.includes('twitter') || urlLower.includes('x.com')) return 'Twitter';
    if (urlLower.includes('linkedin')) return 'LinkedIn';
    if (urlLower.includes('youtube') || urlLower.includes('youtu.be')) return 'YouTube';
    if (urlLower.includes('tiktok')) return 'TikTok';
    if (urlLower.includes('whatsapp') || urlLower.includes('wa.me')) return 'WhatsApp';
    if (urlLower.includes('pinterest')) return 'Pinterest';
    if (urlLower.includes('snapchat')) return 'Snapchat';
    if (urlLower.includes('telegram') || urlLower.includes('t.me')) return 'Telegram';
    if (urlLower.includes('discord')) return 'Discord';
    if (urlLower.includes('reddit')) return 'Reddit';
    if (urlLower.includes('github')) return 'GitHub';
    if (urlLower.includes('medium')) return 'Medium';
    if (urlLower.includes('vimeo')) return 'Vimeo';
    if (urlLower.includes('spotify')) return 'Spotify';
    if (urlLower.includes('soundcloud')) return 'SoundCloud';
    if (urlLower.includes('twitch')) return 'Twitch';
    if (urlLower.includes('behance')) return 'Behance';
    if (urlLower.includes('dribbble')) return 'Dribbble';
    
    return 'Unknown';
  }
}

/**
 * Gets the Lucide icon component for a platform
 */
export function getPlatformIcon(platformName: string): LucideIcon {
  const normalizedName = platformName.toLowerCase().trim();
  
  const iconMap: Record<string, LucideIcon> = {
    'facebook': Facebook,
    'instagram': Instagram,
    'twitter': Twitter,
    'linkedin': Linkedin,
    'youtube': Youtube,
    'github': Github,
    'whatsapp': MessageCircle,
  };
  
  return iconMap[normalizedName] || Globe;
}

/**
 * Gets the platform icon URL from Simple Icons CDN for platforms without Lucide icons
 */
export function getPlatformIconUrl(platformName: string, size: number = 24): string {
  const normalizedName = platformName.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  // Simple Icons CDN
  return `https://cdn.simpleicons.org/${normalizedName}/${size}`;
}

/**
 * Checks if a platform has a Lucide icon
 */
export function hasLucideIcon(platformName: string): boolean {
  const normalizedName = platformName.toLowerCase().trim();
  const platformsWithLucide = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'github', 'whatsapp'];
  return platformsWithLucide.includes(normalizedName);
}

/**
 * Normalizes platform name (capitalizes first letter, handles common variations)
 */
export function normalizePlatformName(name: string): string {
  if (!name) return 'Unknown';
  
  const normalized = name.trim();
  const lower = normalized.toLowerCase();
  
  // Handle common variations
  const variations: Record<string, string> = {
    'fb': 'Facebook',
    'ig': 'Instagram',
    'insta': 'Instagram',
    'yt': 'YouTube',
    'li': 'LinkedIn',
    'wa': 'WhatsApp',
    'x': 'Twitter',
  };
  
  if (variations[lower]) {
    return variations[lower];
  }
  
  // Capitalize first letter
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Validates if a URL is valid
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // Try adding https:// if missing
    try {
      const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
      new URL(urlWithProtocol);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Normalizes a URL (adds https:// if missing)
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  return `https://${trimmed}`;
}


