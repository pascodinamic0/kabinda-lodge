import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import SocialLinks from "@/components/ui/SocialLinks";
import { SocialLink } from "@/utils/socialMediaUtils";

interface FooterContent {
  social_links?: SocialLink[] | Array<{ url: string; platform: string; name?: string }> | { 
    facebook?: string; 
    instagram?: string; 
    twitter?: string; 
  };
  services?: string[];
  address?: string;
  phone?: string;
  email?: string;
  company_name?: string;
}

const Footer = () => {
  const [footerContent, setFooterContent] = useState<FooterContent>({});
  const { t } = useLanguage();

  useEffect(() => {
    fetchFooterContent();
  }, []);

  const fetchFooterContent = async () => {
    try {
      const { data } = await supabase
        .from('website_content')
        .select('content')
        .eq('section', 'footer')
        .single();

      if (data) {
        const content = data.content as FooterContent;
        
        // Normalize social_links to SocialLink[] format
        if (content.social_links) {
          if (Array.isArray(content.social_links)) {
            // Check if it's already in the correct format
            const normalized = content.social_links.map((link: any) => {
              if (link.name && link.url) {
                return { name: link.name, url: link.url };
              }
              // Handle old format with platform field
              if (link.platform && link.url) {
                return { name: link.platform, url: link.url };
              }
              return link;
            });
            content.social_links = normalized;
          } else if (typeof content.social_links === 'object') {
            // Convert old object format to array
            const links: SocialLink[] = [];
            Object.entries(content.social_links).forEach(([key, url]) => {
              if (url && typeof url === 'string') {
                links.push({ name: key.charAt(0).toUpperCase() + key.slice(1), url });
              }
            });
            content.social_links = links;
          }
        }
        
        setFooterContent(content);
      }
    } catch (error) {
      // Footer content fetch failed silently
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <p className="text-primary-foreground/80 leading-relaxed">
              {t('footer_description', 'Experience unparalleled luxury and comfort at Kabinda Lodge, where every detail is crafted to create unforgettable memories.')}
            </p>
            {footerContent?.social_links && Array.isArray(footerContent.social_links) && footerContent.social_links.length > 0 && (
              <SocialLinks 
                links={footerContent.social_links as SocialLink[]}
                className="text-primary-foreground hover:text-accent"
                iconSize={20}
              />
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-elegant font-semibold text-lg">{t('quick_links', 'Quick Links')}</h4>
            <nav className="space-y-2">
              <Link to="/kabinda-lodge/rooms" className="block hover:text-accent transition-colors">
                {t('rooms_suites', 'Rooms & Suites')}
              </Link>
              <Link to="/kabinda-lodge/about-us" className="block hover:text-accent transition-colors">
                {t('about_us', 'About Us')}
              </Link>
              <Link to="/kabinda-lodge/restaurant" className="block hover:text-accent transition-colors">
                {t('restaurant', 'Restaurant')}
              </Link>
              <Link to="/kabinda-lodge/contact" className="block hover:text-accent transition-colors">
                {t('contact', 'Contact')}
              </Link>
              <Link to="/kabinda-lodge/book-room" className="block hover:text-accent transition-colors">
                {t('book_now', 'Book Now')}
              </Link>
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-elegant font-semibold text-lg">{t('services', 'Services')}</h4>
            <nav className="space-y-2">
              {(footerContent?.services || [
                t('concierge', 'Concierge'),
                t('spa_wellness', 'Spa & Wellness'), 
                t('conference_facilities', 'Conference Facilities'),
                t('transportation', 'Transportation'),
                t('special_occasions', 'Special Occasions')
              ]).map((service, index: number) => (
                <a key={`service-${service}-${index}`} href="#" className="block hover:text-accent transition-colors">
                  {service}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-elegant font-semibold text-lg">{t('contact', 'Contact')}</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{footerContent?.address || t('default_address', 'Avenue Lumuba, Kabinda, DRC Congo')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <p>{footerContent?.phone || t('default_phone', '+243 97 405 58 70')}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <p>{footerContent?.email || t('default_email', 'larichardegroup@gmail.com')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/80 text-sm">
            © 2025 {footerContent?.company_name || t('company_name', 'Kabinda Lodge')}. {t('all_rights_reserved', 'All rights reserved.')}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/kabinda-lodge/privacy-policy" className="text-sm hover:text-accent transition-colors">
              {t('privacy_policy', 'Privacy Policy')}
            </Link>
            <Link to="/kabinda-lodge/terms-of-service" className="text-sm hover:text-accent transition-colors">
              {t('terms_of_service', 'Terms of Service')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;