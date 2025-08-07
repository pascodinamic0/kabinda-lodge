import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, Upload, Image, Settings, Globe, Phone, Mail } from "lucide-react";
import MediaUpload from "@/components/ui/media-upload";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from '@/components/dashboard/DashboardLayout';

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

    // Initialize form data only once when content is available
    useEffect(() => {
      if (!isFormInitialized && content.length > 0) {
        const brandingContent = getContentBySection('site_branding');
        // Initializing form data from content
        setFormData({
          logo_url: brandingContent.logo_url || '',
          logo_alt: brandingContent.logo_alt || '',
          favicon_url: brandingContent.favicon_url || '',
          company_name: brandingContent.company_name || '',
          tagline: brandingContent.tagline || ''
        });
        setIsFormInitialized(true);
      }
    }, [isFormInitialized]);

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
      <div className="space-y-6">
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
              />
            </div>

            {/* Favicon Upload Section */}
            <div className="space-y-4">
              <Label>Favicon Upload</Label>
              
              
              <MediaUpload
                bucketName="media-uploads"
                allowedTypes={['image/png', 'image/x-icon', 'image/vnd.microsoft.icon']}
                maxFileSize={1}
                currentImage={formData.favicon_url}
                placeholder="Upload favicon (16x16 or 32x32 pixels)"
                onUploadSuccess={(url, fileName) => {
                  // Favicon upload success - URL received
                  // Force refresh by adding timestamp to URL to prevent caching
                  const timestampedUrl = `${url}?t=${Date.now()}`;
                  setFormData(prev => ({ ...prev, favicon_url: timestampedUrl }));
                  setIsFormDirty(true);
                  toast({
                    title: "Favicon uploaded successfully",
                    description: "Favicon preview updated. Click 'Save' to apply changes.",
                  });
                }}
                onUploadError={(error) => {
                  // Favicon upload error occurred
                  toast({
                    title: "Upload failed", 
                    description: error,
                    variant: "destructive",
                  });
                }}
              />
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
      <div className="space-y-6">
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
      <div className="space-y-6">
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

    const handleSave = () => {
      updateContent('hero_image', formData);
    };

    return (
      <div className="space-y-6">
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
            {/* Video Settings */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="video-enabled"
                  checked={formData.video_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_enabled: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="video-enabled" className="text-sm font-medium">
                  Enable Video Background
                </Label>
              </div>
              
              {formData.video_enabled && (
                <div className="space-y-3 ml-6">
                  <div>
                    <Label htmlFor="video-url">Video URL</Label>
                    <Input
                      id="video-url"
                      value={formData.video_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                      placeholder="https://example.com/drone-video.mp4"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: MP4 format, under 50MB for best performance
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="video-poster">Video Poster Image</Label>
                    <Input
                      id="video-poster"
                      value={formData.video_poster}
                      onChange={(e) => setFormData(prev => ({ ...prev, video_poster: e.target.value }))}
                      placeholder="/lovable-uploads/video-poster.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Image shown while video loads
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Fallback Image Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Background Image Upload</h4>
              
              {/* Hero Image Preview */}
              {formData.image_url && (
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <Label className="text-sm text-muted-foreground mb-3 block">Hero Image Preview</Label>
                  <img 
                    src={formData.image_url} 
                    alt={formData.alt_text || 'Hero Background'}
                    className="w-full h-32 object-cover rounded-lg"
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
              <div>
                <Label htmlFor="hero-alt-text">Alt Text</Label>
                <Input
                  id="hero-alt-text"
                  value={formData.alt_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
                  placeholder="Descriptive text for the image"
                />
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-4">
              <h4 className="font-medium">Text Overlay</h4>
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
      <div className="space-y-6">
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
      if (newSocialLink.name.trim() && newSocialLink.url.trim()) {
        setIsFormDirty(true);
        setFormData(prev => ({
          ...prev,
          social_links: [...prev.social_links, { ...newSocialLink }]
        }));
        setNewSocialLink({ name: '', url: '' });
      }
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
        social_links: prev.social_links.map((link, i) => 
          i === index ? { ...link, [field]: value } : link
        )
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
      <div className="space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 border rounded-lg bg-muted/20">
                <Input
                  value={newSocialLink.name}
                  onChange={(e) => setNewSocialLink(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Platform name (e.g., Facebook, LinkedIn)"
                />
                <Input
                  value={newSocialLink.url}
                  onChange={(e) => setNewSocialLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                />
                <Button 
                  onClick={addSocialLink} 
                  variant="outline" 
                  size="sm"
                  disabled={!newSocialLink.name.trim() || !newSocialLink.url.trim()}
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
      <div className="space-y-6">
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
      <div className="space-y-6">
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
      <div className="space-y-6">
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-muted-foreground">Loading content...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
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

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="language">Language</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="terms">Terms</TabsTrigger>
          </TabsList>

          <TabsContent value="branding">
            <SiteBrandingTab />
          </TabsContent>

          <TabsContent value="contact">
            <HeaderContactTab />
          </TabsContent>

          <TabsContent value="language">
            <LanguageTab />
          </TabsContent>

          <TabsContent value="hero">
            <HeroImageTab />
          </TabsContent>

          <TabsContent value="about">
            <AboutUsTab />
          </TabsContent>

          <TabsContent value="footer">
            <FooterTab />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyPolicyTab />
          </TabsContent>

          <TabsContent value="terms">
            <TermsOfServiceTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ContentManagement;