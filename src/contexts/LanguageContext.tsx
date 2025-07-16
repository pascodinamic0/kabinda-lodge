import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type LanguageCode = 'en' | 'fr' | 'es' | 'pt' | 'ar';

interface Translation {
  key: string;
  language: LanguageCode;
  value: string;
}

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  translations: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  isLoading: boolean;
  supportedLanguages: LanguageCode[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const detectBrowserLanguage = (): LanguageCode => {
  const browserLang = navigator.language.split('-')[0] as LanguageCode;
  const supportedLanguages: LanguageCode[] = ['en', 'fr', 'es', 'pt', 'ar'];
  return supportedLanguages.includes(browserLang) ? browserLang : 'en';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [supportedLanguages] = useState<LanguageCode[]>(['en', 'fr']);

  useEffect(() => {
    // Initialize language from localStorage or browser detection
    const initializeLanguage = async () => {
      const savedLanguage = localStorage.getItem('preferred-language') as LanguageCode;
      
      if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage);
      } else {
        // Check if auto-detection is enabled
        try {
          const { data: settings } = await supabase
            .from('website_content')
            .select('content')
            .eq('section', 'site_settings')
            .eq('language', 'en')
            .single();

          if (settings?.content && typeof settings.content === 'object' && 
              'auto_detect_language' in settings.content && 
              settings.content.auto_detect_language) {
            const detectedLang = detectBrowserLanguage();
            setCurrentLanguage(detectedLang);
            localStorage.setItem('preferred-language', detectedLang);
          }
        } catch (error) {
          console.error('Failed to load language settings:', error);
        }
      }
    };

    initializeLanguage();
  }, [supportedLanguages]);

  useEffect(() => {
    // Load translations for current language
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('translations')
          .select('key, value')
          .eq('language', currentLanguage);

        if (error) throw error;

        const translationMap = data?.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>) || {};

        setTranslations(translationMap);
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [currentLanguage]);

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    translations,
    t,
    isLoading,
    supportedLanguages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};