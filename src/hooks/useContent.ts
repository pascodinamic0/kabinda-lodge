import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContentData {
  [key: string]: any;
}

export const useContent = (section: string) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState<ContentData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to get content for current language
        let { data, error: fetchError } = await supabase
          .from('website_content')
          .select('content')
          .eq('section', section)
          .eq('language', currentLanguage)
          .single();

        // If no content found for current language, fallback to English
        if (!data && currentLanguage !== 'en') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('website_content')
            .select('content')
            .eq('section', section)
            .eq('language', 'en')
            .single();
          
          data = fallbackData;
          fetchError = fallbackError;
        }

        if (fetchError) throw fetchError;
        
        setContent((data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) ? data.content : {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
        setContent({});
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [section, currentLanguage]);

  return { content, isLoading, error };
};