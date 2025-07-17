import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Setting {
  id?: string;
  category: string;
  key: string;
  value: any;
  description?: string;
  user_id?: string;
}

export function useSettings(category?: string) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('app_settings')
        .select('*');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query.order('key');
      
      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error loading settings",
        description: "Failed to load settings from database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string, defaultValue: any = null) => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  const updateSetting = async (key: string, value: any, settingCategory?: string) => {
    try {
      setSaving(true);
      const categoryToUse = settingCategory || category || 'system';
      
      // First try to update existing setting
      const { data: existingData, error: fetchError } = await supabase
        .from('app_settings')
        .select('id')
        .eq('category', categoryToUse)
        .eq('key', key)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let result;
      if (existingData) {
        // Update existing setting
        result = await supabase
          .from('app_settings')
          .update({ value })
          .eq('id', existingData.id);
      } else {
        // Insert new setting
        result = await supabase
          .from('app_settings')
          .insert({
            category: categoryToUse,
            key,
            value,
            user_id: categoryToUse.startsWith('user_') ? (await supabase.auth.getUser()).data.user?.id : null
          });
      }

      if (result.error) throw result.error;

      // Update local state
      setSettings(prev => {
        const filtered = prev.filter(s => s.key !== key);
        return [...filtered, { category: categoryToUse, key, value }];
      });

      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error saving setting",
        description: "Failed to save setting to database.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateMultipleSettings = async (settingsToUpdate: Array<{ key: string; value: any; category?: string }>) => {
    try {
      setSaving(true);
      
      for (const setting of settingsToUpdate) {
        await updateSetting(setting.key, setting.value, setting.category);
      }
      
      toast({
        title: "Settings saved",
        description: "All settings have been updated successfully.",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating multiple settings:', error);
      toast({
        title: "Error saving settings",
        description: "Failed to save some settings.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [category]);

  return {
    settings,
    loading,
    saving,
    getSetting,
    updateSetting,
    updateMultipleSettings,
    refetch: fetchSettings
  };
}