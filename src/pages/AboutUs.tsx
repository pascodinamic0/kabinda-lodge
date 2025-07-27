import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Mail, Phone, Star, CheckCircle, Heart, Users, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/hooks/useContent";

interface AboutContent {
  title: string;
  subtitle: string;
  content: string;
  mission: string;
  vision: string;
  values: string[];
  image_url: string;
  alt_text: string;
}

const AboutUs = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { content: aboutContent, isLoading } = useContent('about_us');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!aboutContent || Object.keys(aboutContent).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{t('content_not_available', 'Content Not Available')}</h1>
          <p className="text-muted-foreground">{t('content_load_error', 'Unable to load page content. Please try again later.')}</p>
        </div>
      </div>
    );
  }

  const iconMap = {
    CheckCircle,
    Heart,
    Users,
    Globe,
    Star,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${aboutContent.image_url})` }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{aboutContent.title || t('about_us', 'About Us')}</h1>
          <p className="text-xl md:text-2xl font-medium">{aboutContent.subtitle || t('about_us_subtitle', 'Discover Our Story')}</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">{t('our_story', 'Our Story')}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {aboutContent.content || t('default_story', 'Welcome to our establishment, where hospitality meets excellence. We are committed to providing exceptional service and unforgettable experiences for all our guests.')}
              </p>
            </div>
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <img 
                src={aboutContent.image_url || "/placeholder.svg"} 
                alt={aboutContent.alt_text || t('about_image_alt', 'About us image')}
                className="w-full h-80 object-cover"
              />
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="border-primary/20 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Star className="h-8 w-8 text-primary mr-3" />
                  <h3 className="text-2xl font-bold text-foreground">{t('our_mission', 'Our Mission')}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {aboutContent.mission || t('default_mission', 'To provide exceptional hospitality services that create memorable experiences for our guests while maintaining the highest standards of quality and service.')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-accent/20 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Globe className="h-8 w-8 text-accent mr-3" />
                  <h3 className="text-2xl font-bold text-foreground">{t('our_vision', 'Our Vision')}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {aboutContent.vision || t('default_vision', 'To be recognized as a premier destination for hospitality excellence, setting new standards in guest satisfaction and service quality.')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Core Values */}
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-8">{t('our_values', 'Our Core Values')}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(aboutContent.values || [t('excellence', 'Excellence'), t('integrity', 'Integrity'), t('innovation', 'Innovation'), t('service', 'Service')]).map((value, index) => (
                <Card key={`value-${value}-${index}`} className="border-primary/10 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-sm font-medium px-3 py-1">
                      {value}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              {t('ready_experience_excellence', 'Ready to Experience Excellence?')}
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('unforgettable_stay_description', 'Join us for an unforgettable stay where every detail is crafted to exceed your expectations.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                {t('book_your_stay', 'Book Your Stay')}
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                {t('contact_us', 'Contact Us')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;