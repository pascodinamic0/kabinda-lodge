import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, Upload, Image, Settings, Globe, Phone, Mail, Video, Star, RefreshCw, ExternalLink, ArrowUp, ArrowDown, Download } from "lucide-react";
import MediaUpload from "@/components/ui/media-upload";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from "@/contexts/AuthContext";
import { getGoogleReviewsConfig, syncReviews, extractPlaceIdFromUrl, type GoogleReviewsConfig } from "@/services/googleReviewsService";
import { detectPlatformFromUrl, normalizeUrl, isValidUrl, normalizePlatformName } from "@/utils/socialMediaUtils";

type LanguageCode = 'en' | 'fr' | 'es' | 'pt' | 'ar';

interface WebsiteContent {
  id: string;
  section: string;
  content: any;
  language: LanguageCode;
}

const ContentManagement = () => {
  const [content, setContent] = useState<WebsiteContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const { toast } = useToast();
  const { userRole, user } = useAuth();
  
  // Lifted slideshow state to parent level to prevent loss on child remounts
  const [slideshowFormData, setSlideshowFormData] = useState<{
    images: Array<{ url: string; alt_text: string; title?: string; category?: string }>;
    autoplay: boolean;
    interval: number;
  }>({
    images: [],
    autoplay: true,
    interval: 5000,
  });
  const [slideshowInitialized, setSlideshowInitialized] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('website_content')
        .select('*')
        .eq('language', currentLanguage)
        .order('section');

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateContent = async (section: string, newContent: any) => {
    // updateContent called with section and content
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('website_content')
        .upsert(
          {
            section,
            language: currentLanguage,
            content: newContent as any,
          },
          {
            onConflict: 'section,language',
          }
        );

      if (error) {
        // Supabase operation failed
        throw error;
      }

      setContent(prev => {
        const existingIndex = prev.findIndex(item => 
          item.section === section && item.language === currentLanguage
        );
        
        if (existingIndex >= 0) {
          // Update existing item
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], content: newContent };
          return updated;
        } else {
          // Add new item
          return [...prev, {
            id: `temp-${Date.now()}`,
            section,
            language: currentLanguage,
            content: newContent
          }];
        }
      });

      // Content updated successfully
      toast({
        title: "Success",
        description: "Content updated successfully",
      });
    } catch (error) {
      // Update content error occurred
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getContentBySection = (section: string) => {
    return content.find(item => item.section === section && item.language === currentLanguage)?.content || {};
  };

  useEffect(() => {
    fetchContent();
  }, [currentLanguage]);

  // Site Branding Management
  const SiteBrandingTab = () => {
    const [formData, setFormData] = useState({
      logo_url: '',
      logo_alt: '',
      favicon_url: '',
      company_name: '',
      tagline: ''
    });
    
    const [isFormInitialized, setIsFormInitialized] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [receiptLogoUrl, setReceiptLogoUrl] = useState<string>('');

// Initialize or refresh form when content/language changes
useEffect(() => {
  const brandingContent = getContentBySection('site_branding');
  setFormData({
    logo_url: brandingContent.logo_url || '',
    logo_alt: brandingContent.logo_alt || '',
    favicon_url: brandingContent.favicon_url || '',
    company_name: brandingContent.company_name || '',
    tagline: brandingContent.tagline || ''
  });
  setIsFormInitialized(true);
  setIsFormDirty(false);
}, [content, currentLanguage]);

    // Load existing receipt logo from app settings
    useEffect(() => {
      const loadReceiptLogo = async () => {
        try {
          const { data } = await supabase
            .from('app_settings')
            .select('value')
            .eq('category', 'branding')
            .eq('key', 'receipt_logo_url')
            .maybeSingle();

          const raw = data?.value as unknown;
          let resolved: string | null = null;
          if (typeof raw === 'string') {
            let parsed: unknown = null;
            try { parsed = JSON.parse(raw); } catch { /* ignore */ }
            if (typeof parsed === 'string') resolved = parsed;
            else if (parsed && typeof parsed === 'object' && (parsed as { url?: string }).url) resolved = (parsed as { url?: string }).url || null;
            else if (raw && /^(https?:)?\//.test(raw)) resolved = raw;
          } else if (raw && typeof raw === 'object' && (raw as { url?: string }).url) {
            resolved = (raw as { url?: string }).url || null;
          }

          if (resolved) setReceiptLogoUrl(resolved);
        } catch (e) {
          // ignore
        }
      };
      loadReceiptLogo();
    }, []);

    const handleInputChange = (field: string, value: string) => {
      setIsFormDirty(true);
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
      // Saving branding with data
      const cleanFormData = {
        logo_url: formData.logo_url.trim(),
        logo_alt: formData.logo_alt.trim(),
        favicon_url: formData.favicon_url.trim(),
        company_name: formData.company_name.trim(),
        tagline: formData.tagline.trim()
      };
      
      await updateContent('site_branding', cleanFormData);
      setIsFormDirty(false);
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Site Branding
            </CardTitle>
            <CardDescription>
              Manage your website's logo, favicon, and branding elements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload Section */}
            <div className="space-y-4">
              <Label>Logo Upload</Label>
              
              
              <MediaUpload
                bucketName="media-uploads"
                allowedTypes={['image/*']}
                maxFileSize={10}
                currentImage={formData.logo_url}
                placeholder="Upload your company logo"
                onUploadSuccess={async (url, fileName) => {
                  // Logo upload success - URL received
                  const timestampedUrl = `${url}?t=${Date.now()}`;
                  const updated = { ...formData, logo_url: timestampedUrl };
                  setFormData(updated);
                  try {
                    // Auto-save to website_content
                    await updateContent('site_branding', updated);
                    // Also store for receipts in app_settings
                    await supabase.from('app_settings').upsert({
                      category: 'branding',
                      key: 'company_logo_url',
                      value: timestampedUrl,
                    });
                    toast({
                      title: "Logo uploaded",
                      description: "Saved automatically and cache-busted.",
                    });
                  } catch (e) {
                    toast({
                      title: "Auto-save failed",
                      description: "Logo uploaded but failed to save. Please click Save.",
                      variant: "destructive",
                    });
                  }
                }}
                onUploadError={(error) => {
                  // Logo upload error occurred
                  toast({
                    title: "Upload failed",
                    description: error,
                    variant: "destructive",
                  });
                }}
                onRemove={async () => {
                  const updated = { ...formData, logo_url: '' };
                  setFormData(updated);
                  setIsFormDirty(true);
                  try {
                    await updateContent('site_branding', updated);
                    await supabase
                      .from('app_settings')
                      .delete()
                      .eq('category', 'branding')
                      .eq('key', 'company_logo_url');
                    toast({ title: 'Logo removed', description: 'Changes saved.' });
                  } catch (e) {
                    toast({ title: 'Removal failed', description: 'Please try saving again.', variant: 'destructive' });
                  }
                }}
              />
            </div>

            {/* Receipt Logo for Receipts */}
            <div className="space-y-4">
              <Label>Receipt Logo (PDF/Print)</Label>
              <MediaUpload
                bucketName="media-uploads"
                allowedTypes={['image/*']}
                maxFileSize={5}
                currentImage={receiptLogoUrl}
                placeholder="Upload a separate logo for receipts (optional)"
                onUploadSuccess={async (url, fileName) => {
                  const timestampedUrl = `${url}?t=${Date.now()}`;
                  setReceiptLogoUrl(timestampedUrl);
                  try {
                    await supabase.from('app_settings').upsert({
                      category: 'branding',
                      key: 'receipt_logo_url',
                      value: timestampedUrl,
                      description: 'Logo used specifically on receipts'
                    });
                    toast({
                      title: "Receipt logo saved",
                      description: "This logo will be used on receipts.",
                    });
                  } catch (e) {
                    toast({
                      title: "Save failed",
                      description: "Uploaded but failed to save. Try again.",
                      variant: "destructive",
                    });
                  }
                }}
                onUploadError={(error) => {
                  toast({
                    title: "Upload failed",
                    description: error,
                    variant: "destructive",
                  });
                }}
                onRemove={async () => {
                  setReceiptLogoUrl('');
                  try {
                    await supabase
                      .from('app_settings')
                      .delete()
                      .eq('category', 'branding')
                      .eq('key', 'receipt_logo_url');
                    toast({ title: 'Receipt logo removed', description: 'It will no longer appear on receipts.' });
                  } catch (e) {
                    toast({ title: 'Removal failed', description: 'Please try again.', variant: 'destructive' });
                  }
                }}
              />
            </div>

            {/* Favicon Upload Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="favicon-upload" className="text-base font-semibold">
                  Favicon Upload
                </Label>
                <p className="text-sm text-muted-foreground">
                  Upload your website favicon. This icon appears in browser tabs, bookmarks, and mobile home screens. 
                  For best results, use a square PNG image (recommended: 32x32px or 64x64px).
                </p>
              </div>
              
              <MediaUpload
                bucketName="media-uploads"
                allowedTypes={['image/png', 'image/jpeg']}
                maxFileSize={5}
                currentImage={formData.favicon_url}
                placeholder="Upload favicon (prefer PNG, up to 5MB)"
                className="favicon-upload"
                onUploadSuccess={async (url, fileName) => {
                  const timestampedUrl = `${url}?t=${Date.now()}`;
                  const updated = { ...formData, favicon_url: timestampedUrl };
                  setFormData(updated);
                  setIsFormDirty(true);

                  try {
                    // Persist to website_content immediately
                    await updateContent('site_branding', updated);
                    // Persist to app_settings for global availability
                    await supabase.from('app_settings').upsert({
                      category: 'branding',
                      key: 'favicon_url',
                      value: timestampedUrl,
                      description: 'Global favicon URL'
                    });
                  } catch (e) {
                    toast({
                      title: "Warning",
                      description: "Favicon uploaded but failed to save settings. Please try saving again.",
                      variant: "destructive",
                    });
                  }

                  // Update DOM favicon immediately with comprehensive SEO support
                  try {
                    const ensureLink = (rel: string, sizes?: string) => {
                      const selector = sizes 
                        ? `link[rel="${rel}"][sizes="${sizes}"]`
                        : `link[rel="${rel}"]`;
                      let link = document.querySelector<HTMLLinkElement>(selector);
                      if (!link) {
                        link = document.createElement('link');
                        link.rel = rel as any;
                        if (sizes) link.setAttribute('sizes', sizes);
                        document.head.appendChild(link);
                      }
                      return link;
                    };

                    const urlLower = url.toLowerCase();
                    const type = urlLower.endsWith('.png') ? 'image/png' : 'image/jpeg';
                    
                    // Standard favicon links (for browsers)
                    const icon = ensureLink('icon');
                    icon.type = type;
                    icon.href = timestampedUrl;
                    icon.setAttribute('sizes', 'any');
                    
                    const shortcut = ensureLink('shortcut icon');
                    shortcut.type = type;
                    shortcut.href = timestampedUrl;

                    // Apple touch icon (for iOS devices)
                    const appleTouch = ensureLink('apple-touch-icon');
                    appleTouch.href = timestampedUrl;
                    appleTouch.setAttribute('sizes', '180x180');

                    // Additional sizes for better browser support
                    const icon32 = ensureLink('icon', '32x32');
                    icon32.type = type;
                    icon32.href = timestampedUrl;

                    const icon16 = ensureLink('icon', '16x16');
                    icon16.type = type;
                    icon16.href = timestampedUrl;

                    // Manifest icon support (for PWA)
                    const manifestIcon = ensureLink('icon', '192x192');
                    manifestIcon.type = type;
                    manifestIcon.href = timestampedUrl;

                  } catch (error) {
                    console.error('Failed to update DOM favicon:', error);
                    toast({
                      title: "Warning",
                      description: "Favicon uploaded but failed to update browser icon. Please refresh the page.",
                      variant: "destructive",
                    });
                  }

                  toast({
                    title: "Favicon uploaded successfully",
                    description: "Applied immediately and saved. Refresh the page to see changes in browser tab.",
                  });
                }}
                onUploadError={(error) => {
                  toast({
                    title: "Upload failed", 
                    description: error || "An unknown error occurred during upload. Please try again.",
                    variant: "destructive",
                  });
                }}
                onRemove={async () => {
                  const updated = { ...formData, favicon_url: '' };
                  setFormData(updated);
                  setIsFormDirty(true);

                  try {
                    await updateContent('site_branding', updated);
                    await supabase
                      .from('app_settings')
                      .delete()
                      .eq('category', 'branding')
                      .eq('key', 'favicon_url');

                    // Reset DOM favicon to default with comprehensive cleanup
                    try {
                      const removeLink = (rel: string, sizes?: string) => {
                        const selector = sizes 
                          ? `link[rel="${rel}"][sizes="${sizes}"]`
                          : `link[rel="${rel}"]`;
                        const link = document.querySelector<HTMLLinkElement>(selector);
                        if (link) {
                          link.remove();
                        }
                      };

                      // Remove all custom favicon links
                      removeLink('icon');
                      removeLink('shortcut icon');
                      removeLink('apple-touch-icon');
                      removeLink('icon', '32x32');
                      removeLink('icon', '16x16');
                      removeLink('icon', '192x192');
                      removeLink('icon', 'any');

                      // Set default favicon
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
                      icon.type = 'image/x-icon';
                      icon.href = '/favicon.ico';
                      const shortcut = ensureLink('shortcut icon');
                      shortcut.type = 'image/x-icon';
                      shortcut.href = '/favicon.ico';
                    } catch (error) {
                      console.error('Failed to reset DOM favicon:', error);
                    }

                    toast({ 
                      title: 'Favicon removed', 
                      description: 'Reverted to default favicon. Refresh the page to see changes.' 
                    });
                  } catch (e) {
                    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                    toast({ 
                      title: 'Removal failed', 
                      description: `Failed to remove favicon: ${errorMessage}. Please try again.`, 
                      variant: 'destructive' 
                    });
                  }
                }}
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  <strong>Supported formats:</strong> image/png, image/jpeg
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Max size:</strong> 5MB • <strong>Recommended:</strong> Square PNG (32x32px or 64x64px)
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> ICO files are not supported. Use PNG or JPG format. The favicon will be applied to browser tabs, bookmarks, and mobile home screens.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="logo-alt">Logo Alt Text</Label>
              <Input
                id="logo-alt"
                value={formData.logo_alt}
                onChange={(e) => handleInputChange('logo_alt', e.target.value)}
                placeholder="Company Logo"
              />
            </div>
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="Your company tagline"
              />
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Branding Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Header Contact Management
  const HeaderContactTab = () => {
    const [formData, setFormData] = useState({
      phone: '',
      email: '',
      tagline_text: ''
    });

    const [isFormInitialized, setIsFormInitialized] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);

    // Initialize form data when content is available
    useEffect(() => {
      if (!isFormInitialized && content.length > 0) {
        const headerContent = getContentBySection('header_contact');
        setFormData({
          phone: headerContent.phone || '',
          email: headerContent.email || '',
          tagline_text: headerContent.tagline_text || ''
        });
        setIsFormInitialized(true);
      }
    }, [isFormInitialized]);

    const handleInputChange = (field: string, value: string) => {
      setIsFormDirty(true);
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
      // Saving header contact with data
      await updateContent('header_contact', formData);
      setIsFormDirty(false);
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Header Contact Information
            </CardTitle>
            <CardDescription>
              Manage contact details displayed in the header bar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="header-phone">Phone Number</Label>
              <Input
                id="header-phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="header-email">Email Address</Label>
              <Input
                id="header-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="info@yourcompany.com"
              />
            </div>
            <div>
              <Label htmlFor="header-tagline">Header Tagline Text</Label>
              <Input
                id="header-tagline"
                value={formData.tagline_text}
                onChange={(e) => handleInputChange('tagline_text', e.target.value)}
                placeholder="Experience Luxury • Create Memories"
              />
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Contact Information
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Language Management
  const LanguageTab = () => {
    const [translations, setTranslations] = useState<Array<{ key: string; value: string; language: string }>>([]);
    const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);
    const [newTranslation, setNewTranslation] = useState({ key: '', value: '' });

    useEffect(() => {
      const loadTranslations = async () => {
        try {
          const { data, error } = await supabase
            .from('translations')
            .select('*')
            .eq('language', currentLanguage)
            .order('key');

          if (error) throw error;
          setTranslations(data || []);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load translations",
            variant: "destructive",
          });
        } finally {
          setIsLoadingTranslations(false);
        }
      };

      loadTranslations();
    }, []);

    const saveTranslation = async (key: string, value: string) => {
      try {
        const { error } = await supabase
          .from('translations')
          .upsert({
            key,
            language: currentLanguage,
            value
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Translation updated successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save translation",
          variant: "destructive",
        });
      }
    };

    const addNewTranslation = async () => {
      if (newTranslation.key && newTranslation.value) {
        await saveTranslation(newTranslation.key, newTranslation.value);
        setTranslations(prev => [...prev, { 
          key: newTranslation.key, 
          value: newTranslation.value,
          language: currentLanguage
        }]);
        setNewTranslation({ key: '', value: '' });
      }
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language Translations ({currentLanguage.toUpperCase()})
            </CardTitle>
            <CardDescription>
              Manage UI text translations for different languages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new translation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Translation key (e.g., nav.home)"
                value={newTranslation.key}
                onChange={(e) => setNewTranslation(prev => ({ ...prev, key: e.target.value }))}
              />
              <Input
                placeholder="Translation value"
                value={newTranslation.value}
                onChange={(e) => setNewTranslation(prev => ({ ...prev, value: e.target.value }))}
              />
              <Button onClick={addNewTranslation} disabled={!newTranslation.key || !newTranslation.value}>
                <Plus className="h-4 w-4 mr-2" />
                Add Translation
              </Button>
            </div>

            {/* Existing translations */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoadingTranslations ? (
                <div className="text-center py-4">Loading translations...</div>
              ) : (
                translations.map((translation) => (
                  <div key={translation.key} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded">
                    <div className="font-mono text-sm text-muted-foreground">
                      {translation.key}
                    </div>
                    <Input
                      value={translation.value}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setTranslations(prev => prev.map(t => 
                          t.key === translation.key ? { ...t, value: newValue } : t
                        ));
                      }}
                    />
                    <Button 
                      size="sm"
                      onClick={() => saveTranslation(translation.key, translation.value)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Hero Image Management
  const HeroImageTab = () => {
    const heroContent = getContentBySection('hero_image');
    const [formData, setFormData] = useState({
      image_url: heroContent.image_url || '',
      alt_text: heroContent.alt_text || '',
      title: heroContent.title || '',
      description: heroContent.description || '',
      video_enabled: heroContent.video_enabled || false,
      video_url: heroContent.video_url || '',
      video_poster: heroContent.video_poster || ''
    });
    const [videoUploadMethod, setVideoUploadMethod] = useState<'file' | 'url'>(
      heroContent.video_url && heroContent.video_url.startsWith('http') ? 'url' : 'file'
    );

    const handleSave = () => {
      updateContent('hero_image', formData);
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Hero Section Settings
            </CardTitle>
            <CardDescription>
              Manage the hero section background and content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video Background Settings */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Video className="h-5 w-5 text-primary" />
                  <Label htmlFor="video-enabled" className="text-sm font-medium">
                    Enable Video Background
                  </Label>
                </div>
                <Switch
                  id="video-enabled"
                  checked={formData.video_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, video_enabled: checked }))}
                />
              </div>
              
              {formData.video_enabled && (
                <div className="space-y-4 mt-4 pt-4 border-t">
                  {/* Video Upload Method Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Video Source</Label>
                    <RadioGroup 
                      value={videoUploadMethod} 
                      onValueChange={(value: 'file' | 'url') => setVideoUploadMethod(value)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="file" id="video-upload-file" />
                        <Label htmlFor="video-upload-file" className="cursor-pointer">
                          Upload File
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="url" id="video-upload-url" />
                        <Label htmlFor="video-upload-url" className="cursor-pointer">
                          Video URL
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Video File Upload */}
                  {videoUploadMethod === 'file' && (
                    <div className="space-y-3">
                      <Label>Upload Video File</Label>
                      {formData.video_url && (
                        <div className="bg-background p-3 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-primary" />
                              <span className="text-sm text-muted-foreground">
                                {formData.video_url.split('/').pop() || 'Video uploaded'}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormData(prev => ({ ...prev, video_url: '' }))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <MediaUpload
                        bucketName="media-uploads"
                        allowedTypes={['video/mp4', 'video/webm', 'video/ogg']}
                        maxFileSize={50}
                        placeholder="Upload video file (MP4, WebM, or OGG)"
                        onUploadSuccess={(url, fileName) => {
                          const timestampedUrl = `${url}?t=${Date.now()}`;
                          setFormData(prev => ({ ...prev, video_url: timestampedUrl }));
                          toast({
                            title: "Video uploaded successfully",
                            description: `Video URL: ${timestampedUrl}`,
                          });
                        }}
                        onUploadError={(error) => {
                          toast({
                            title: "Upload failed",
                            description: error,
                            variant: "destructive",
                          });
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Supported formats: MP4, WebM, OGG • Max size: 50MB
                      </p>
                    </div>
                  )}

                  {/* Video URL Input */}
                  {videoUploadMethod === 'url' && (
                    <div>
                      <Label htmlFor="video-url">Video URL</Label>
                      <Input
                        id="video-url"
                        value={formData.video_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                        placeholder="https://example.com/drone-video.mp4"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter a direct link to your video file. Recommended: MP4 format for best compatibility
                      </p>
                    </div>
                  )}

                  {/* Video Preview */}
                  {formData.video_url && (
                    <div className="bg-background p-3 rounded-lg border">
                      <Label className="text-sm text-muted-foreground mb-2 block">Video Preview</Label>
                      <video 
                        src={formData.video_url} 
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                        muted
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}

                  {/* Video Poster Image */}
                  <div>
                    <Label htmlFor="video-poster">Video Poster Image (Optional)</Label>
                    <Input
                      id="video-poster"
                      value={formData.video_poster}
                      onChange={(e) => setFormData(prev => ({ ...prev, video_poster: e.target.value }))}
                      placeholder="/lovable-uploads/video-poster.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Image shown while video loads. If not provided, the background image will be used.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Background Image Settings */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-4">
                <Image className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Background Image</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This image will be displayed when video background is disabled. It also serves as the fallback poster for video backgrounds.
              </p>
              
              {/* Hero Image Preview */}
              {formData.image_url && (
                <div className="bg-background p-3 rounded-lg border mb-4">
                  <Label className="text-sm text-muted-foreground mb-2 block">Image Preview</Label>
                  <img 
                    src={formData.image_url} 
                    alt={formData.alt_text || 'Hero Background'}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <MediaUpload
                bucketName="media-uploads"
                allowedTypes={['image/*']}
                maxFileSize={10}
                currentImage={formData.image_url}
                placeholder="Upload hero background image"
                onUploadSuccess={(url, fileName) => {
                  // Force refresh by adding timestamp to URL to prevent caching
                  const timestampedUrl = `${url}?t=${Date.now()}`;
                  setFormData(prev => ({ ...prev, image_url: timestampedUrl }));
                  toast({
                    title: "Hero image uploaded successfully",
                    description: `Background image URL: ${timestampedUrl}`,
                  });
                }}
                onUploadError={(error) => {
                  toast({
                    title: "Upload failed",
                    description: error,
                    variant: "destructive",
                  });
                }}
              />
              <div className="mt-4">
                <Label htmlFor="hero-alt-text">Alt Text</Label>
                <Input
                  id="hero-alt-text"
                  value={formData.alt_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
                  placeholder="Descriptive text for the image"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alternative text for accessibility and SEO
                </p>
              </div>
            </div>

            {/* Text Overlay Settings */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Text Overlay</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Text content displayed over the background (currently hardcoded on the home page)
              </p>
              <div>
                <Label htmlFor="hero-title">Title</Label>
                <Input
                  id="hero-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Beautiful Location"
                />
              </div>
              <div>
                <Label htmlFor="hero-description">Description</Label>
                <Input
                  id="hero-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Stunning views await you"
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Hero Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // About Us Management
  const AboutUsTab = () => {
    const aboutContent = getContentBySection('about_us');
    const [formData, setFormData] = useState({
      title: aboutContent.title || '',
      subtitle: aboutContent.subtitle || '',
      content: aboutContent.content || '',
      mission: aboutContent.mission || '',
      vision: aboutContent.vision || '',
      values: aboutContent.values || [],
      image_url: aboutContent.image_url || '',
      alt_text: aboutContent.alt_text || ''
    });

    const [newValue, setNewValue] = useState('');

    const handleSave = () => {
      updateContent('about_us', formData);
    };

    const addValue = () => {
      if (newValue.trim()) {
        setFormData(prev => ({
          ...prev,
          values: [...prev.values, newValue.trim()]
        }));
        setNewValue('');
      }
    };

    const removeValue = (index: number) => {
      setFormData(prev => ({
        ...prev,
        values: prev.values.filter((_, i) => i !== index)
      }));
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>About Us Content</CardTitle>
            <CardDescription>
              Manage the content displayed on the About Us page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="about-title">Page Title</Label>
              <Input
                id="about-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="about-subtitle">Subtitle</Label>
              <Input
                id="about-subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="about-content">Main Content</Label>
              <Textarea
                id="about-content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="about-mission">Mission Statement</Label>
              <Textarea
                id="about-mission"
                value={formData.mission}
                onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="about-vision">Vision Statement</Label>
              <Textarea
                id="about-vision"
                value={formData.vision}
                onChange={(e) => setFormData(prev => ({ ...prev, vision: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-4">
              <Label>About Us Image Upload</Label>
              
              {/* About Image Preview */}
              {formData.image_url && (
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <Label className="text-sm text-muted-foreground mb-3 block">About Us Image Preview</Label>
                  <img 
                    src={formData.image_url} 
                    alt={formData.alt_text || 'About Us Image'}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <MediaUpload
                bucketName="media-uploads"
                allowedTypes={['image/*']}
                maxFileSize={5}
                currentImage={formData.image_url}
                placeholder="Upload About Us image"
                onUploadSuccess={(url, fileName) => {
                  // Force refresh by adding timestamp to URL to prevent caching
                  const timestampedUrl = `${url}?t=${Date.now()}`;
                  setFormData(prev => ({ ...prev, image_url: timestampedUrl }));
                  toast({
                    title: "About Us image uploaded successfully",
                    description: `Image URL: ${timestampedUrl}`,
                  });
                }}
                onUploadError={(error) => {
                  toast({
                    title: "Upload failed",
                    description: error,
                    variant: "destructive",
                  });
                }}
              />
              <div>
                <Label htmlFor="about-alt">Image Alt Text</Label>
                <Input
                  id="about-alt"
                  value={formData.alt_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
                  placeholder="Descriptive text for the image"
                />
              </div>
            </div>
            
            {/* Core Values */}
            <div>
              <Label>Core Values</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Add new value"
                  onKeyPress={(e) => e.key === 'Enter' && addValue()}
                />
                <Button onClick={addValue} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.values.map((value, index) => (
                  <Badge key={`value-${value}-${index}`} variant="secondary" className="flex items-center gap-1">
                    {value}
                    <button onClick={() => removeValue(index)}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save About Us Content
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Footer Management
  const FooterTab = () => {
    const [formData, setFormData] = useState({
      company_name: '',
      address: '',
      email: '',
      phone: '',
      services: [],
      social_links: []
    });

    const [newService, setNewService] = useState('');
    const [newSocialLink, setNewSocialLink] = useState({ name: '', url: '' });
    const [isFormInitialized, setIsFormInitialized] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);

    // Initialize form data when content is available
    useEffect(() => {
      if (!isFormInitialized && content.length > 0) {
        const footerContent = getContentBySection('footer');
        
        // Handle migration from old format to new format
        let socialLinks = [];
        if (footerContent.social_links) {
          if (Array.isArray(footerContent.social_links)) {
            // New format - array of objects
            socialLinks = footerContent.social_links;
          } else {
            // Old format - convert object to array
            socialLinks = Object.entries(footerContent.social_links)
              .filter(([key, url]) => url && typeof url === 'string' && url.trim())
              .map(([key, url]) => ({ 
                name: key.charAt(0).toUpperCase() + key.slice(1), 
                url: url as string
              }));
          }
        }
        
        setFormData({
          company_name: footerContent.company_name || '',
          address: footerContent.address || '',
          email: footerContent.email || '',
          phone: footerContent.phone || '',
          services: footerContent.services || [],
          social_links: socialLinks
        });
        setIsFormInitialized(true);
      }
    }, [isFormInitialized]);

    const handleInputChange = (field: string, value: string) => {
      setIsFormDirty(true);
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addSocialLink = () => {
      const trimmedUrl = newSocialLink.url.trim();
      const trimmedName = newSocialLink.name.trim();
      
      if (!trimmedUrl) {
        toast({
          title: "Error",
          description: "Please enter a URL",
          variant: "destructive",
        });
        return;
      }
      
      // Validate URL
      if (!isValidUrl(trimmedUrl)) {
        toast({
          title: "Error",
          description: "Please enter a valid URL (e.g., https://facebook.com/yourpage)",
          variant: "destructive",
        });
        return;
      }
      
      // Normalize URL (add https:// if missing)
      const normalizedUrl = normalizeUrl(trimmedUrl);
      
      // Auto-detect platform if name is not provided
      let platformName = trimmedName;
      if (!platformName) {
        platformName = detectPlatformFromUrl(normalizedUrl);
        if (platformName === 'Unknown') {
          toast({
            title: "Warning",
            description: "Could not detect platform. Please enter a platform name.",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Normalize platform name
      const normalizedName = normalizePlatformName(platformName);
      
      setIsFormDirty(true);
      setFormData(prev => ({
        ...prev,
        social_links: [...prev.social_links, { 
          name: normalizedName, 
          url: normalizedUrl 
        }]
      }));
      setNewSocialLink({ name: '', url: '' });
      
      toast({
        title: "Success",
        description: `Added ${normalizedName} link`,
      });
    };

    const removeSocialLink = (index: number) => {
      setIsFormDirty(true);
      setFormData(prev => ({
        ...prev,
        social_links: prev.social_links.filter((_, i) => i !== index)
      }));
    };

    const updateSocialLink = (index: number, field: string, value: string) => {
      setIsFormDirty(true);
      setFormData(prev => ({
        ...prev,
        social_links: prev.social_links.map((link, i) => {
          if (i === index) {
            if (field === 'url') {
              // Validate and normalize URL
              const trimmed = value.trim();
              if (trimmed && isValidUrl(trimmed)) {
                return { ...link, url: normalizeUrl(trimmed) };
              }
              return { ...link, url: trimmed };
            } else if (field === 'name') {
              // Normalize platform name
              return { ...link, name: normalizePlatformName(value) };
            }
            return { ...link, [field]: value };
          }
          return link;
        })
      }));
    };

    const handleSave = async () => {
      // Saving footer with data
      await updateContent('footer', formData);
      setIsFormDirty(false);
    };

    const addService = () => {
      if (newService.trim()) {
        setFormData(prev => ({
          ...prev,
          services: [...prev.services, newService.trim()]
        }));
        setNewService('');
      }
    };

    const removeService = (index: number) => {
      setFormData(prev => ({
        ...prev,
        services: prev.services.filter((_, i) => i !== index)
      }));
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Footer Information</CardTitle>
            <CardDescription>
              Manage contact details and services displayed in the footer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="footer-company">Company Name</Label>
              <Input
                id="footer-company"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <Label htmlFor="footer-address">Address</Label>
              <Input
                id="footer-address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Company Street, City, State"
              />
            </div>
            <div>
              <Label htmlFor="footer-email">Email</Label>
              <Input
                id="footer-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="info@yourcompany.com"
              />
            </div>
            <div>
              <Label htmlFor="footer-phone">Phone</Label>
              <Input
                id="footer-phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            {/* Services */}
            <div>
              <Label>Services</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="Add new service"
                  onKeyPress={(e) => e.key === 'Enter' && addService()}
                />
                <Button onClick={addService} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.services.map((service, index) => (
                  <Badge key={`service-${service}-${index}`} variant="secondary" className="flex items-center gap-1">
                    {service}
                    <button onClick={() => removeService(index)}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Social Media Links</Label>
              
              {/* Add new social link */}
              <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="social-url" className="text-sm">URL *</Label>
                    <Input
                      id="social-url"
                      value={newSocialLink.url}
                      onChange={(e) => {
                        const url = e.target.value;
                        setNewSocialLink(prev => ({ ...prev, url }));
                        // Auto-detect platform when URL is entered
                        if (url.trim() && !newSocialLink.name.trim()) {
                          const detected = detectPlatformFromUrl(url);
                          if (detected !== 'Unknown') {
                            setNewSocialLink(prev => ({ ...prev, name: detected }));
                          }
                        }
                      }}
                      placeholder="https://facebook.com/yourpage"
                      onBlur={(e) => {
                        // Normalize URL on blur
                        const url = e.target.value.trim();
                        if (url && isValidUrl(url)) {
                          setNewSocialLink(prev => ({ ...prev, url: normalizeUrl(url) }));
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Platform will be auto-detected from URL
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="social-name" className="text-sm">Platform Name (optional)</Label>
                    <Input
                      id="social-name"
                      value={newSocialLink.name}
                      onChange={(e) => setNewSocialLink(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Auto-detected or enter manually"
                    />
                  </div>
                </div>
                <Button 
                  onClick={addSocialLink} 
                  variant="outline" 
                  size="sm"
                  disabled={!newSocialLink.url.trim()}
                  className="w-full md:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Social Link
                </Button>
              </div>

              {/* Existing social links */}
              <div className="space-y-2">
                {formData.social_links.map((link, index) => (
                  <div key={`social-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded">
                    <Input
                      value={link.name}
                      onChange={(e) => updateSocialLink(index, 'name', e.target.value)}
                      placeholder="Platform name"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      placeholder="URL"
                    />
                    <Button 
                      onClick={() => removeSocialLink(index)}
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ))}
                {formData.social_links.length === 0 && (
                  <p className="text-muted-foreground text-sm">No social media links added yet. Use the form above to add your first one.</p>
                )}
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Footer Content
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Amenities Management
  const AmenitiesTab = () => {
    const amenitiesContent = getContentBySection('amenities');
    const [formData, setFormData] = useState({
      title: amenitiesContent.title || '',
      subtitle: amenitiesContent.subtitle || '',
      amenities: amenitiesContent.amenities || []
    });

    const [newAmenity, setNewAmenity] = useState({
      name: '',
      description: '',
      icon: 'Star'
    });

    const handleSave = () => {
      updateContent('amenities', formData);
    };

    const addAmenity = () => {
      if (newAmenity.name.trim() && newAmenity.description.trim()) {
        setFormData(prev => ({
          ...prev,
          amenities: [...prev.amenities, { ...newAmenity }]
        }));
        setNewAmenity({ name: '', description: '', icon: 'Star' });
      }
    };

    const removeAmenity = (index: number) => {
      setFormData(prev => ({
        ...prev,
        amenities: prev.amenities.filter((_, i) => i !== index)
      }));
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Premium Amenities & Services</CardTitle>
            <CardDescription>
              Manage the amenities section on the home page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amenities-title">Section Title</Label>
              <Input
                id="amenities-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="amenities-subtitle">Subtitle</Label>
              <Input
                id="amenities-subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              />
            </div>
            
            {/* Add New Amenity */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Add New Amenity</h4>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newAmenity.name}
                  onChange={(e) => setNewAmenity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Amenity name"
                />
                <Input
                  value={newAmenity.icon}
                  onChange={(e) => setNewAmenity(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Icon name (Lucide)"
                />
              </div>
              <Input
                value={newAmenity.description}
                onChange={(e) => setNewAmenity(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
              />
              <Button onClick={addAmenity} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Amenity
              </Button>
            </div>

            {/* Current Amenities */}
            <div className="space-y-2">
              <Label>Current Amenities</Label>
              {formData.amenities.map((amenity, index) => (
                <div key={`amenity-${amenity.name}-${index}`} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{amenity.name}</div>
                    <div className="text-sm text-muted-foreground">{amenity.description}</div>
                    <div className="text-xs text-muted-foreground">Icon: {amenity.icon}</div>
                  </div>
                  <Button
                    onClick={() => removeAmenity(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Amenities Content
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Privacy Policy Management
  const PrivacyPolicyTab = () => {
    const [formData, setFormData] = useState({
      title: '',
      lastUpdated: '',
      content: ''
    });

    const [isFormInitialized, setIsFormInitialized] = useState(false);

    // Initialize form data when content is available
    useEffect(() => {
      if (!isFormInitialized && content.length > 0) {
        const privacyContent = getContentBySection('privacy_policy');
        setFormData({
          title: privacyContent.title || '',
          lastUpdated: privacyContent.lastUpdated || new Date().toISOString().split('T')[0],
          content: privacyContent.content || ''
        });
        setIsFormInitialized(true);
      }
    }, [isFormInitialized]);

    const handleInputChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
      const updatedData = {
        ...formData,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      await updateContent('privacy_policy', updatedData);
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy Content</CardTitle>
            <CardDescription>
              Manage privacy policy content for {currentLanguage.toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="privacy-title">Page Title</Label>
              <Input
                id="privacy-title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Privacy Policy"
              />
            </div>
            <div>
              <Label htmlFor="privacy-content">Privacy Policy Content</Label>
              <Textarea
                id="privacy-content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Enter your privacy policy content here..."
                rows={12}
                className="min-h-[300px]"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Last updated will be automatically set to today when saved.
              </p>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Privacy Policy
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Google Reviews Management
  const GoogleReviewsTab = () => {
    const [formData, setFormData] = useState<GoogleReviewsConfig>({
      business_profile_url: '',
      place_id: '',
      api_key: '',
      enabled: false,
      refresh_interval: 24,
      last_sync_time: null,
      review_count: 0,
    });
    const [isFormInitialized, setIsFormInitialized] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
      const loadConfig = async () => {
        try {
          const config = await getGoogleReviewsConfig();
          if (config) {
            setFormData({
              business_profile_url: config.business_profile_url || '',
              place_id: config.place_id || '',
              api_key: config.api_key || '',
              enabled: config.enabled || false,
              refresh_interval: config.refresh_interval || 24,
              last_sync_time: config.last_sync_time || null,
              review_count: config.review_count || 0,
            });
          }
          setIsFormInitialized(true);
        } catch (error) {
          console.error('Error loading Google reviews config:', error);
          setIsFormInitialized(true);
        }
      };
      loadConfig();
    }, []);

    const handleInputChange = (field: keyof GoogleReviewsConfig, value: string | number | boolean) => {
      setIsFormDirty(true);
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleUrlChange = (url: string) => {
      setIsFormDirty(true);
      setFormData(prev => {
        const extractedPlaceId = extractPlaceIdFromUrl(url) || prev.place_id;
        return {
          ...prev,
          business_profile_url: url,
          place_id: extractedPlaceId || prev.place_id,
        };
      });
    };

    const handleTestConnection = async () => {
      if (!formData.place_id || !formData.api_key) {
        toast({
          title: "Error",
          description: "Please provide both Place ID and API Key to test the connection",
          variant: "destructive",
        });
        return;
      }

      setIsTesting(true);
      try {
        const result = await syncReviews();
        if (result.success) {
          toast({
            title: "Success",
            description: `Successfully fetched ${result.count || 0} reviews from Google`,
          });
          // Update form data with sync results
          setFormData(prev => ({
            ...prev,
            last_sync_time: new Date().toISOString(),
            review_count: result.count || 0,
          }));
        } else {
          toast({
            title: "Test Failed",
            description: result.error || "Failed to fetch reviews. Please check your configuration.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to test connection",
          variant: "destructive",
        });
      } finally {
        setIsTesting(false);
      }
    };

    const handleSave = async () => {
      setIsSaving(true);
      try {
        const configToSave = {
          business_profile_url: formData.business_profile_url?.trim() || '',
          place_id: formData.place_id?.trim() || '',
          api_key: formData.api_key?.trim() || '',
          enabled: formData.enabled || false,
          refresh_interval: formData.refresh_interval || 24,
          last_sync_time: formData.last_sync_time || null,
          review_count: formData.review_count || 0,
        };

        await updateContent('google_reviews_config', configToSave);
        setIsFormDirty(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save Google reviews configuration",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    };

    if (!isFormInitialized) {
      return <div className="text-center py-4">Loading configuration...</div>;
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Google Business Profile Reviews
            </CardTitle>
            <CardDescription>
              Connect your Google Business Profile to display reviews on your website. Only Admin and SuperAdmin can access this feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="reviews-enabled" className="text-base font-medium">
                  Enable Google Reviews
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display Google Business Profile reviews on the home page
                </p>
              </div>
              <Switch
                id="reviews-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => handleInputChange('enabled', checked)}
              />
            </div>

            {/* Google Business Profile URL */}
            <div className="space-y-2">
              <Label htmlFor="business-profile-url">Google Business Profile URL</Label>
              <Input
                id="business-profile-url"
                value={formData.business_profile_url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
              />
              <p className="text-xs text-muted-foreground">
                Enter your Google Business Profile URL. The Place ID will be extracted automatically if possible.
              </p>
            </div>

            {/* Place ID */}
            <div className="space-y-2">
              <Label htmlFor="place-id">Place ID</Label>
              <Input
                id="place-id"
                value={formData.place_id}
                onChange={(e) => handleInputChange('place_id', e.target.value)}
                placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
              />
              <p className="text-xs text-muted-foreground">
                Your Google Place ID. You can find this in your Google Business Profile URL or Google Maps.
                <a
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-primary hover:underline flex items-center gap-1 inline-flex"
                >
                  Learn more
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key">Google Places API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={formData.api_key}
                onChange={(e) => handleInputChange('api_key', e.target.value)}
                placeholder="AIzaSy..."
              />
              <p className="text-xs text-muted-foreground">
                Your Google Places API key. Keep this secure and never share it publicly.
                <a
                  href="https://developers.google.com/maps/documentation/places/web-service/get-api-key"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-primary hover:underline flex items-center gap-1 inline-flex"
                >
                  Get API key
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {/* Refresh Interval */}
            <div className="space-y-2">
              <Label htmlFor="refresh-interval">Refresh Interval (hours)</Label>
              <Select
                value={formData.refresh_interval?.toString() || '24'}
                onValueChange={(value) => handleInputChange('refresh_interval', parseInt(value))}
              >
                <SelectTrigger id="refresh-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often to automatically refresh reviews from Google
              </p>
            </div>

            {/* Status Information */}
            {(formData.last_sync_time || formData.review_count !== undefined) && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium mb-2">Sync Status</h4>
                <div className="space-y-1 text-sm">
                  {formData.last_sync_time && (
                    <p className="text-muted-foreground">
                      Last sync: {new Date(formData.last_sync_time).toLocaleString()}
                    </p>
                  )}
                  {formData.review_count !== undefined && (
                    <p className="text-muted-foreground">
                      Cached reviews: {formData.review_count}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleTestConnection}
                disabled={isTesting || !formData.place_id || !formData.api_key}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !isFormDirty} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Manual Reviews Management
  const ManualReviewsTab = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showCsvImport, setShowCsvImport] = useState(false);
    const [newReview, setNewReview] = useState({
      author_name: '',
      rating: 5,
      text: '',
      created_at: new Date().toISOString().split('T')[0]
    });
    const { toast } = useToast();

    useEffect(() => {
      fetchReviews();
    }, []);

    const fetchReviews = async () => {
      setLoading(true);
      try {
        // Query with author_name field
        const { data: simpleData, error: simpleError } = await supabase
          .from('feedback')
          .select('id, rating, message, created_at, user_id, author_name')
          .order('created_at', { ascending: false })
          .limit(20);

        if (simpleError) {
          console.error('Simple query error:', simpleError);
          throw simpleError;
        }

        // If simple query works, try to get user names separately
        const reviewsWithUsers = await Promise.all(
          (simpleData as any[] || []).map(async (review: any) => {
            // Use author_name if provided (manual reviews), otherwise lookup user
            let userName = review.author_name || 'Anonymous Guest';

            if (!review.author_name && review.user_id) {
              try {
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('name')
                  .eq('id', review.user_id)
                  .single();

                if (!userError && userData) {
                  userName = userData.name || 'Anonymous Guest';
                }
              } catch (userErr) {
                console.warn('Could not fetch user name for review:', review.id);
              }
            }

            return {
              ...review,
              users: { name: userName }
            };
          })
        );

        setReviews(reviewsWithUsers);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast({
          title: "Error",
          description: "Failed to load reviews",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const handleAddReview = async () => {
      if (!newReview.author_name.trim() || !newReview.text.trim()) {
        toast({
          title: "Error",
          description: "Please fill in author name and review text",
          variant: "destructive"
        });
        return;
      }

      try {
        const reviewData = {
          rating: newReview.rating,
          message: newReview.text,
          author_name: newReview.author_name.trim(), // Store the author name
          user_id: user?.id || '00000000-0000-0000-0000-000000000000', // Use current user or default
          booking_id: null, // No booking for manual reviews
          created_at: new Date(newReview.created_at).toISOString()
        };

        const { error } = await supabase
          .from('feedback')
          .insert([reviewData]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        toast({
          title: "Success",
          description: "Review added successfully",
        });

        setNewReview({
          author_name: '',
          rating: 5,
          text: '',
          created_at: new Date().toISOString().split('T')[0]
        });
        setShowAddForm(false);
        fetchReviews();
      } catch (error: any) {
        console.error('Error adding review:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to add review. Check console for details.",
          variant: "destructive"
        });
      }
    };

    const handleDeleteReview = async (reviewId: string) => {
      if (!confirm('Are you sure you want to delete this review?')) return;

      try {
        const { error } = await supabase
          .from('feedback')
          .delete()
          .eq('id', reviewId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Review deleted successfully",
        });
        fetchReviews();
      } catch (error) {
        console.error('Error deleting review:', error);
        toast({
          title: "Error",
          description: "Failed to delete review",
          variant: "destructive"
        });
      }
    };

    const downloadCsvTemplate = () => {
      const csvContent = `author_name,rating,text,created_at
John Doe,5,"Amazing experience! The staff was very welcoming.",2024-12-20
Jane Smith,4,"Great food and excellent service.",2024-12-18
Bob Johnson,5,"Perfect location and beautiful rooms.",2024-12-15`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reviews_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "CSV template downloaded",
      });
    };

    const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv') && !file.type.includes('csv')) {
        toast({
          title: "Error",
          description: "Please select a valid CSV file",
          variant: "destructive"
        });
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csv = e.target?.result as string;
          if (!csv || csv.trim().length === 0) {
            throw new Error('CSV file is empty');
          }

          const lines = csv.split('\n').filter(line => line.trim());

          if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row');
          }

          const headers = lines[0].split(',').map(h => h.trim());
          const requiredHeaders = ['author_name', 'rating', 'text'];

          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
          }

          const reviewsToImport = [];
          let validRows = 0;
          let invalidRows = 0;

          for (let i = 1; i < lines.length; i++) {
            try {
              // Handle quoted values properly
              const values = parseCsvLine(lines[i]);
              if (values.length >= 3) {
                const rating = parseInt(values[1]);
                if (isNaN(rating) || rating < 1 || rating > 5) {
                  console.warn(`Invalid rating on line ${i + 1}: ${values[1]}, skipping row`);
                  invalidRows++;
                  continue;
                }

                let createdAt = new Date().toISOString();
                if (values[3] && values[3].trim()) {
                  const parsedDate = new Date(values[3].trim());
                  if (!isNaN(parsedDate.getTime())) {
                    createdAt = parsedDate.toISOString();
                  }
                }

                reviewsToImport.push({
                  rating,
                  message: values[2] || '',
                  author_name: values[0] || 'Anonymous Guest', // Use author_name from CSV
                  user_id: user?.id || '00000000-0000-0000-0000-000000000000',
                  booking_id: null, // No booking for CSV imports
                  created_at: createdAt
                });
                validRows++;
              } else {
                invalidRows++;
              }
            } catch (rowError) {
              console.warn(`Error processing row ${i + 1}:`, rowError);
              invalidRows++;
            }
          }

          if (reviewsToImport.length === 0) {
            throw new Error('No valid reviews found in CSV. Check your data format.');
          }

          const { error } = await supabase
            .from('feedback')
            .insert(reviewsToImport);

          if (error) throw error;

          toast({
            title: "Success",
            description: `Imported ${validRows} reviews successfully${invalidRows > 0 ? ` (${invalidRows} rows skipped)` : ''}`,
          });

          fetchReviews();
          setShowCsvImport(false);
        } catch (error: any) {
          console.error('Error importing CSV:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to import reviews",
            variant: "destructive"
          });
        }
      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the CSV file",
          variant: "destructive"
        });
      };

      reader.readAsText(file);
      // Reset file input
      event.target.value = '';
    };

    // Helper function to parse CSV lines with quoted values
    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      // Add the last field
      result.push(current.trim());
      return result;
    };

    if (loading) {
      return <div className="text-center py-8">Loading reviews...</div>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Manual Review Management</CardTitle>
                <CardDescription>
                  Add, view, and manage customer reviews manually. These reviews will appear on your website's homepage.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadCsvTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV Template
                </Button>
                <Button variant="outline" onClick={() => setShowCsvImport(!showCsvImport)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? 'Cancel' : 'Add New Review'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showCsvImport && (
              <div className="border rounded-lg p-4 mb-6 bg-muted/30">
                <h4 className="font-medium mb-4">Import Reviews from CSV</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv-file">Select CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleCsvImport}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      CSV should have columns: author_name, rating (1-5), text, created_at (optional)
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setShowCsvImport(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {showAddForm && (
              <div className="border rounded-lg p-4 mb-6 bg-muted/30">
                <h4 className="font-medium mb-4">Add New Review</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="author-name">Author Name</Label>
                    <Input
                      id="author-name"
                      value={newReview.author_name}
                      onChange={(e) => setNewReview(prev => ({ ...prev, author_name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Select
                      value={newReview.rating.toString()}
                      onValueChange={(value) => setNewReview(prev => ({ ...prev, rating: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="1">1 Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="review-text">Review Text</Label>
                    <Textarea
                      id="review-text"
                      value={newReview.text}
                      onChange={(e) => setNewReview(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="Share your experience..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="review-date">Review Date</Label>
                    <Input
                      id="review-date"
                      type="date"
                      value={newReview.created_at}
                      onChange={(e) => setNewReview(prev => ({ ...prev, created_at: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddReview}>Add Review</Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-medium">Existing Reviews ({reviews.length})</h4>
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reviews yet. Add your first review above.
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <Card key={review.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{review.users?.name || 'Anonymous'}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm">{review.message || review.comment}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteReview(review.id)}
                          className="ml-4 text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Terms of Service Management
  const TermsOfServiceTab = () => {
    const [formData, setFormData] = useState({
      title: '',
      lastUpdated: '',
      content: ''
    });

    const [isFormInitialized, setIsFormInitialized] = useState(false);

    // Initialize form data when content is available
    useEffect(() => {
      if (!isFormInitialized && content.length > 0) {
        const termsContent = getContentBySection('terms_of_service');
        setFormData({
          title: termsContent.title || '',
          lastUpdated: termsContent.lastUpdated || new Date().toISOString().split('T')[0],
          content: termsContent.content || ''
        });
        setIsFormInitialized(true);
      }
    }, [isFormInitialized]);

    const handleInputChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
      const updatedData = {
        ...formData,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      await updateContent('terms_of_service', updatedData);
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Terms of Service Content</CardTitle>
            <CardDescription>
              Manage terms of service content for {currentLanguage.toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="terms-title">Page Title</Label>
              <Input
                id="terms-title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Terms of Service"
              />
            </div>
            <div>
              <Label htmlFor="terms-content">Terms of Service Content</Label>
              <Textarea
                id="terms-content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Enter your terms of service content here..."
                rows={12}
                className="min-h-[300px]"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Last updated will be automatically set to today when saved.
              </p>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Terms of Service
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Home Slideshow Management Tab
  const HomeSlideshowTab = () => {
    // Use lifted state from parent component (slideshowFormData, setSlideshowFormData)
    // This prevents state loss when the child component remounts
    const formData = slideshowFormData;
    const setFormData = setSlideshowFormData;
    
    // #region agent log
    useEffect(() => {
      fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentManagement.tsx:2148',message:'formData state changed (lifted)',data:{imagesCount:formData.images.length,imageUrls:formData.images.map(img => img.url)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    }, [formData.images]);
    // #endregion
    
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newImageAlt, setNewImageAlt] = useState('');
    const [newImageTitle, setNewImageTitle] = useState('');
    const [newImageCategory, setNewImageCategory] = useState('');

    // Initialize formData from content only once when content is loaded
    useEffect(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentManagement.tsx:2163',message:'useEffect initialization running (lifted)',data:{slideshowInitialized,currentImagesCount:formData.images.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      // Only initialize if not already initialized
      if (!slideshowInitialized) {
        const slideshowContent = getContentBySection('home_slideshow');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentManagement.tsx:2168',message:'initializing formData from content (lifted)',data:{slideshowContent,imagesCount:slideshowContent.images?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        // Only set if there's actual content to load OR mark as initialized
        if (slideshowContent.images && slideshowContent.images.length > 0) {
          setFormData({
            images: slideshowContent.images || [],
            autoplay: slideshowContent.autoplay ?? true,
            interval: slideshowContent.interval ?? 5000,
          });
        }
        setSlideshowInitialized(true);
      }
    }, [slideshowInitialized]); // Only depend on the parent-level initialization flag

    const handleSave = async () => {
      setIsSaving(true);
      try {
        await updateContent('home_slideshow', formData);
        toast({
          title: "Success",
          description: "Slideshow updated successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update slideshow",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    };

    const handleImageUpload = (url: string) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentManagement.tsx:2186',message:'handleImageUpload called (lifted)',data:{url,newImageAlt,currentImagesCount:formData.images.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      const timestampedUrl = `${url}?t=${Date.now()}`;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentManagement.tsx:2188',message:'before setFormData (lifted)',data:{timestampedUrl,prevImagesCount:formData.images.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      setFormData(prev => {
        const newImages = [...prev.images, {
          url: timestampedUrl,
          alt_text: newImageAlt || 'Slideshow image',
          title: newImageTitle || undefined,
          category: newImageCategory || undefined,
        }];
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentManagement.tsx:2190',message:'inside setFormData updater (lifted)',data:{prevCount:prev.images.length,newCount:newImages.length,newImageUrl:timestampedUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        return {
          ...prev,
          images: newImages
        };
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentManagement.tsx:2197',message:'after setFormData (lifted)',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      setNewImageUrl('');
      setNewImageAlt('');
      setNewImageTitle('');
      setNewImageCategory('');
      toast({
        title: "Image added",
        description: "Image added to slideshow. Don't forget to save.",
      });
    };

    const handleAddImageByUrl = () => {
      if (!newImageUrl.trim()) {
        toast({
          title: "Error",
          description: "Please enter an image URL",
          variant: "destructive",
        });
        return;
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, {
          url: newImageUrl.trim(),
          alt_text: newImageAlt || 'Slideshow image',
          title: newImageTitle || undefined,
          category: newImageCategory || undefined,
        }]
      }));
      setNewImageUrl('');
      setNewImageAlt('');
      setNewImageTitle('');
      setNewImageCategory('');
      toast({
        title: "Image added",
        description: "Image added to slideshow. Don't forget to save.",
      });
    };

    const handleRemoveImage = (index: number) => {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    };

    const handleMoveImage = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === formData.images.length - 1) return;

      const newImages = [...formData.images];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      
      setFormData(prev => ({
        ...prev,
        images: newImages
      }));
    };

    const handleUpdateImage = (index: number, field: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        images: prev.images.map((img, i) => 
          i === index ? { ...img, [field]: value } : img
        )
      }));
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Home Page Slideshow
            </CardTitle>
            <CardDescription>
              Manage the slideshow images displayed on the home page. Only Admin and SuperAdmin can manage this feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto-play Settings */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoplay-enabled" className="text-base font-medium">
                    Enable Auto-play
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically transition between slides
                  </p>
                </div>
                <Switch
                  id="autoplay-enabled"
                  checked={formData.autoplay}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoplay: checked }))}
                />
              </div>
              
              {formData.autoplay && (
                <div className="mt-4">
                  <Label htmlFor="autoplay-interval">Auto-play Interval (milliseconds)</Label>
                  <Input
                    id="autoplay-interval"
                    type="number"
                    min="1000"
                    step="500"
                    value={formData.interval}
                    onChange={(e) => setFormData(prev => ({ ...prev, interval: parseInt(e.target.value) || 5000 }))}
                    placeholder="5000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Time between slide transitions (minimum 1000ms)
                  </p>
                </div>
              )}
            </div>

            {/* Add New Image */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Add New Image</h4>
              
              <div className="space-y-3">
                <MediaUpload
                  bucketName="media-uploads"
                  allowedTypes={['image/*']}
                  maxFileSize={10}
                  placeholder="Upload slideshow image"
                  onUploadSuccess={(url, fileName) => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentManagement.tsx:2325',message:'onUploadSuccess callback invoked',data:{url,fileName,hasHandleImageUpload:!!handleImageUpload},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                    handleImageUpload(url);
                  }}
                  onUploadError={(error) => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContentManagement.tsx:2330',message:'onUploadError callback invoked',data:{error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    toast({
                      title: "Upload failed",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="new-image-alt">Alt Text (required)</Label>
                    <Input
                      id="new-image-alt"
                      value={newImageAlt}
                      onChange={(e) => setNewImageAlt(e.target.value)}
                      placeholder="Descriptive text for accessibility"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-image-title">Title (optional)</Label>
                    <Input
                      id="new-image-title"
                      value={newImageTitle}
                      onChange={(e) => setNewImageTitle(e.target.value)}
                      placeholder="Image title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-image-category">Category (optional)</Label>
                    <Input
                      id="new-image-category"
                      value={newImageCategory}
                      onChange={(e) => setNewImageCategory(e.target.value)}
                      placeholder="e.g., Rooms, Amenities, Spaces"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <Label htmlFor="new-image-url">Or Add Image by URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="new-image-url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <Button onClick={handleAddImageByUrl} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add URL
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Images */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Slideshow Images ({formData.images.length})</Label>
              
              {formData.images.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-muted/30">
                  <p className="text-muted-foreground">No images added yet. Upload or add images above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.images.map((image, index) => (
                    <Card key={`slide-${index}`} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                          {/* Image Preview */}
                          <div className="md:col-span-1">
                            <img
                              src={image.url}
                              alt={image.alt_text}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                          
                          {/* Image Details */}
                          <div className="md:col-span-2 space-y-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Alt Text</Label>
                              <Input
                                value={image.alt_text}
                                onChange={(e) => handleUpdateImage(index, 'alt_text', e.target.value)}
                                placeholder="Alt text"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Title (optional)</Label>
                              <Input
                                value={image.title || ''}
                                onChange={(e) => handleUpdateImage(index, 'title', e.target.value)}
                                placeholder="Title"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Category (optional)</Label>
                              <Input
                                value={image.category || ''}
                                onChange={(e) => handleUpdateImage(index, 'category', e.target.value)}
                                placeholder="Category"
                                className="h-8"
                              />
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="md:col-span-1 flex flex-col gap-2">
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveImage(index, 'up')}
                                disabled={index === 0}
                                className="flex-1"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveImage(index, 'down')}
                                disabled={index === formData.images.length - 1}
                                className="flex-1"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveImage(index)}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Slideshow Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-muted-foreground">Loading content...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="language-select">Language:</Label>
            <Select value={currentLanguage} onValueChange={(value: LanguageCode) => setCurrentLanguage(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="branding" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto sm:overflow-x-visible -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList className="inline-flex w-full h-auto flex-wrap gap-1 md:min-h-10">
              <TabsTrigger value="branding" className="whitespace-nowrap flex-shrink-0">Branding</TabsTrigger>
              <TabsTrigger value="hero" className="whitespace-nowrap flex-shrink-0">Hero</TabsTrigger>
              <TabsTrigger value="about" className="whitespace-nowrap flex-shrink-0">About</TabsTrigger>
              <TabsTrigger value="contact" className="whitespace-nowrap flex-shrink-0">Contact</TabsTrigger>
              <TabsTrigger value="footer" className="whitespace-nowrap flex-shrink-0">Footer</TabsTrigger>
              <TabsTrigger value="language" className="whitespace-nowrap flex-shrink-0">Language</TabsTrigger>
              <TabsTrigger value="privacy" className="whitespace-nowrap flex-shrink-0">Privacy</TabsTrigger>
              <TabsTrigger value="terms" className="whitespace-nowrap flex-shrink-0">Terms</TabsTrigger>
              {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
                <>
                  <TabsTrigger value="slideshow" className="whitespace-nowrap flex-shrink-0">Slideshow</TabsTrigger>
                  <TabsTrigger value="google-reviews" className="whitespace-nowrap flex-shrink-0">Google Reviews</TabsTrigger>
                  <TabsTrigger value="manual-reviews" className="whitespace-nowrap flex-shrink-0">Manual Reviews</TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <TabsContent value="branding" className="mt-4 sm:mt-6">
            <SiteBrandingTab />
          </TabsContent>

          <TabsContent value="hero" className="mt-4 sm:mt-6">
            <HeroImageTab />
          </TabsContent>

          <TabsContent value="about" className="mt-4 sm:mt-6">
            <AboutUsTab />
          </TabsContent>

          <TabsContent value="contact" className="mt-4 sm:mt-6">
            <HeaderContactTab />
          </TabsContent>

          <TabsContent value="footer" className="mt-4 sm:mt-6">
            <FooterTab />
          </TabsContent>

          <TabsContent value="language" className="mt-4 sm:mt-6">
            <LanguageTab />
          </TabsContent>

          <TabsContent value="privacy" className="mt-4 sm:mt-6">
            <PrivacyPolicyTab />
          </TabsContent>

          <TabsContent value="terms" className="mt-4 sm:mt-6">
            <TermsOfServiceTab />
          </TabsContent>
          {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
            <>
              <TabsContent value="slideshow" className="mt-4 sm:mt-6">
                <HomeSlideshowTab />
              </TabsContent>
              <TabsContent value="google-reviews" className="mt-4 sm:mt-6">
                <GoogleReviewsTab />
              </TabsContent>

              <TabsContent value="manual-reviews" className="mt-4 sm:mt-6">
                <ManualReviewsTab />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ContentManagement;