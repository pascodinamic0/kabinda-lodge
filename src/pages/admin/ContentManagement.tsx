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
import { Save, Plus, Trash2, Upload, Image } from "lucide-react";

interface WebsiteContent {
  id: string;
  section: string;
  content: any;
}

const ContentManagement = () => {
  const [content, setContent] = useState<WebsiteContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('website_content')
        .select('*')
        .order('section');

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
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
          content: newContent,
        });

      if (error) throw error;

      setContent(prev => 
        prev.map(item => 
          item.section === section 
            ? { ...item, content: newContent }
            : item
        )
      );

      toast({
        title: "Success",
        description: "Content updated successfully",
      });
    } catch (error) {
      console.error('Error updating content:', error);
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
    return content.find(item => item.section === section)?.content || {};
  };

  // Hero Image Management
  const HeroImageTab = () => {
    const heroContent = getContentBySection('hero_image');
    const [formData, setFormData] = useState({
      image_url: heroContent.image_url || '',
      alt_text: heroContent.alt_text || '',
      title: heroContent.title || '',
      description: heroContent.description || ''
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
              Hero Image Settings
            </CardTitle>
            <CardDescription>
              Manage the beautiful location image on the home page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hero-image-url">Image URL</Label>
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
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
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
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
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
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
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
                <div key={index} className="flex items-center justify-between p-3 border rounded">
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
        <p className="text-muted-foreground">
          Manage all website content and customization options
        </p>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hero">Hero Image</TabsTrigger>
          <TabsTrigger value="about">About Us</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <HeroImageTab />
        </TabsContent>

        <TabsContent value="about">
          <AboutUsTab />
        </TabsContent>

        <TabsContent value="footer">
          <FooterTab />
        </TabsContent>

        <TabsContent value="amenities">
          <AmenitiesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagement;