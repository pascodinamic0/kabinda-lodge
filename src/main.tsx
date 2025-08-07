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
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('category', 'branding')
      .eq('key', 'favicon_url')
      .maybeSingle();

    const raw = data?.value as unknown;
    let url: string | null = null;
    if (typeof raw === 'string') {
      let parsed: unknown = null;
      try { parsed = JSON.parse(raw); } catch {}
      if (typeof parsed === 'string') url = parsed;
      else if (parsed && typeof parsed === 'object' && (parsed as { url?: string }).url) url = (parsed as { url?: string }).url || null;
      else if (/^(https?:)?\//.test(raw)) url = raw;
    } else if (raw && typeof raw === 'object' && (raw as { url?: string }).url) {
      url = (raw as { url?: string }).url || null;
    }

    if (url) {
      const type = url.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      // Cache-bust
      const href = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setFavicon(href, type);
    }
  } catch {
    // ignore
  }
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <App />
      <Toaster />
    </ThemeProvider>
  </StrictMode>
);
