import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { supabase } from "@/integrations/supabase/client";

import App from "./App.tsx";
import "./index.css";

// Apply favicon from app settings if present
const setFavicon = (href: string, type?: string) => {
  const ensureLink = (rel: string) => {
    let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel as any;
      document.head.appendChild(link);
    }
    return link;
  };
  const icon = ensureLink('icon');
  if (type) icon.type = type;
  icon.href = href;
  const shortcut = ensureLink('shortcut icon');
  if (type) shortcut.type = type;
  shortcut.href = href;
};

(async () => {
  try {
    // 1) Try app_settings first
    const { data: appData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('category', 'branding')
      .eq('key', 'favicon_url')
      .maybeSingle();

    const parseVal = (raw: unknown): string | null => {
      if (!raw) return null;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'string') return parsed;
          if (parsed && typeof parsed === 'object' && (parsed as { url?: string }).url) return (parsed as { url?: string }).url || null;
        } catch {
          if (/^(https?:)?\//.test(raw)) return raw;
        }
      }
      if (raw && typeof raw === 'object' && (raw as { url?: string }).url) {
        return (raw as { url?: string }).url || null;
      }
      return null;
    };

    let url: string | null = parseVal(appData?.value as unknown);

    // 2) Fallback to website_content.site_branding.favicon_url (default to 'en')
    if (!url) {
      const { data: wc } = await supabase
        .from('website_content')
        .select('content')
        .eq('section', 'site_branding')
        .eq('language', 'en')
        .maybeSingle();
      const favFromContent = (wc?.content as any)?.favicon_url as string | undefined;
      if (favFromContent && typeof favFromContent === 'string' && favFromContent.trim()) {
        url = favFromContent.trim();
      }
    }

    // 3) Apply favicon or default
    const apply = (u: string) => {
      const lower = u.toLowerCase();
      const type = lower.endsWith('.png') ? 'image/png' : lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg' : 'image/x-icon';
      const href = `${u}${u.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setFavicon(href, type);
    };

    if (url) apply(url);
    else setFavicon('/logo.png', 'image/png');
  } catch {
    // On any error ensure a favicon exists
    setFavicon('/logo.png', 'image/png');
  }
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <App />
    </ThemeProvider>
  </StrictMode>
);
