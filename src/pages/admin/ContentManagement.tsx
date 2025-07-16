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
import { Save, Plus, Trash2, Upload, Image, Settings, Globe, Phone, Mail, ArrowLeft } from "lucide-react";
import MediaUpload from "@/components/ui/media-upload";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('website_content')
        .upsert({
          section,
          language: currentLanguage,
          content: newContent,
        });

      if (error) throw error;

      setContent(prev => 
        prev.map(item => 
          item.section === section && item.language === currentLanguage
            ? { ...item, content: newContent }
            : item
        )
      );

      toast({
        title: "Success",
        description: "Content updated successfully",
      });
    } catch (error) {
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
    const brandingContent = getContentBySection('site_branding');
    const [formData, setFormData] = useState({
      logo_url: brandingContent.logo_url || '',
      logo_alt: brandingContent.logo_alt || '',
      favicon_url: brandingContent.favicon_url || '',
      company_name: brandingContent.company_name || '',
      tagline: brandingContent.tagline || ''
    });

    useEffect(() => {
      const brandingContent = getContentBySection('site_branding');
      setFormData({
        logo_url: brandingContent.logo_url || '',
        logo_alt: brandingContent.logo_alt || '',
        favicon_url: brandingContent.favicon_url || '',
        company_name: brandingContent.company_name || '',
        tagline: brandingContent.tagline || ''
      });
    }, [content, currentLanguage]);

    const handleSave = () => {
      updateContent('site_branding', formData);
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
                maxFileSize={5}
                currentImage={formData.logo_url}
                placeholder="Upload your company logo"
                onUploadSuccess={(url, fileName) => {
                  setFormData(prev => ({ ...prev, logo_url: url }));
                  toast({
                    title: "Logo uploaded",
                    description: "Logo URL has been automatically updated",
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
                <Label htmlFor="logo-url">Logo URL (Auto-filled)</Label>
                <Input
                  id="logo-url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="/lovable-uploads/logo.png"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL is automatically filled when you upload above, or paste manually
                </p>
              </div>
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
                  setFormData(prev => ({ ...prev, favicon_url: url }));
                  toast({
                    title: "Favicon uploaded",
                    description: "Favicon URL has been automatically updated",
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
                <Label htmlFor="favicon-url">Favicon URL (Auto-filled)</Label>
                <Input
                  id="favicon-url"
                  value={formData.favicon_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, favicon_url: e.target.value }))}
                  placeholder="/favicon.ico"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Favicon should be 16x16 or 32x32 pixels in ICO or PNG format
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="logo-alt">Logo Alt Text</Label>
              <Input
                id="logo-alt"
                value={formData.logo_alt}
                onChange={(e) => setFormData(prev => ({ ...prev, logo_alt: e.target.value }))}
                placeholder="Company Logo"
              />
            </div>
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
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
    const headerContent = getContentBySection('header_contact');
    const [formData, setFormData] = useState({
      phone: headerContent.phone || '',
      email: headerContent.email || '',
      tagline_text: headerContent.tagline_text || ''
    });

    useEffect(() => {
      const headerContent = getContentBySection('header_contact');
      setFormData({
        phone: headerContent.phone || '',
        email: headerContent.email || '',
        tagline_text: headerContent.tagline_text || ''
      });
    }, [content, currentLanguage]);

    const handleSave = () => {
      updateContent('header_contact', formData);
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
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="header-email">Email Address</Label>
              <Input
                id="header-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@yourcompany.com"
              />
            </div>
            <div>
              <Label htmlFor="header-tagline">Header Tagline Text</Label>
              <Input
                id="header-tagline"
                value={formData.tagline_text}
                onChange={(e) => setFormData(prev => ({ ...prev, tagline_text: e.target.value }))}
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
    const [translations, setTranslations] = useState<any[]>([]);
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
    }, [currentLanguage]);

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
              <MediaUpload
                bucketName="media-uploads"
                allowedTypes={['image/*']}
                maxFileSize={10}
                currentImage={formData.image_url}
                placeholder="Upload hero background image"
                onUploadSuccess={(url, fileName) => {
                  setFormData(prev => ({ ...prev, image_url: url }));
                  toast({
                    title: "Hero image uploaded",
                    description: "Background image URL has been automatically updated",
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
                <Label htmlFor="hero-image-url">Image URL (Auto-filled)</Label>
                <Input
                  id="hero-image-url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="/lovable-uploads/your-image.png"
                />
              </div>
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
            <div>
              <Label htmlFor="about-image">Image URL</Label>
              <Input
                id="about-image"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="about-alt">Image Alt Text</Label>
              <Input
                id="about-alt"
                value={formData.alt_text}
                onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
              />
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
    const footerContent = getContentBySection('footer');
    const [formData, setFormData] = useState({
      company_name: footerContent.company_name || '',
      address: footerContent.address || '',
      email: footerContent.email || '',
      phone: footerContent.phone || '',
      services: footerContent.services || []
    });

    const [newService, setNewService] = useState('');

    const handleSave = () => {
      updateContent('footer', formData);
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
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="footer-address">Address</Label>
              <Input
                id="footer-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="footer-email">Email</Label>
              <Input
                id="footer-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="footer-phone">Phone</Label>
              <Input
                id="footer-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Content Management</h1>
              <p className="text-muted-foreground">Manage your website content</p>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-muted-foreground">Loading content...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Content Management</h1>
            <p className="text-muted-foreground">Manage your website content and translations</p>
          </div>
          
          {/* Language Selector */}
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
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="language">Language</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
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
        </Tabs>
      </main>
    </div>
  );
};

export default ContentManagement;
