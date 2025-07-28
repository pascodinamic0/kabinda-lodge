import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const [footerContent, setFooterContent] = useState<any>(null);
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
        setFooterContent(data.content);
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
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-elegant font-bold text-lg">K</span>
              </div>
              <div>
                <h3 className="font-elegant font-bold text-xl">
                  {footerContent?.company_name || t('company_name', 'Kabinda Lodge')}
                </h3>
                <p className="text-xs text-primary-foreground/80">{t('premium_hospitality', 'Premium Hospitality')}</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              {t('footer_description', 'Experience unparalleled luxury and comfort at Kabinda Lodge, where every detail is crafted to create unforgettable memories.')}
            </p>
            <div className="flex space-x-4">
              {footerContent?.social_links && Array.isArray(footerContent.social_links) 
                ? footerContent.social_links.map((link: any, index: number) => (
                    <a 
                      key={`social-${index}`}
                      href={link.url || "#"} 
                      className="hover:text-accent transition-colors"
                      target={link.url ? "_blank" : "_self"}
                      rel={link.url ? "noopener noreferrer" : ""}
                      title={link.name}
                    >
                      {/* Default to Facebook icon for now, but display the platform name */}
                      {link.name?.toLowerCase() === 'facebook' ? (
                        <Facebook className="h-5 w-5" />
                      ) : link.name?.toLowerCase() === 'instagram' ? (
                        <Instagram className="h-5 w-5" />
                      ) : link.name?.toLowerCase() === 'twitter' ? (
                        <Twitter className="h-5 w-5" />
                      ) : (
                        <div className="h-5 w-5 bg-current rounded flex items-center justify-center text-xs font-bold">
                          {link.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                      )}
                    </a>
                  ))
                : (
                    // Fallback for old format or no social links
                    <>
                      {footerContent?.social_links?.facebook && (
                        <a href={footerContent.social_links.facebook} className="hover:text-accent transition-colors" target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-5 w-5" />
                        </a>
                      )}
                      {footerContent?.social_links?.instagram && (
                        <a href={footerContent.social_links.instagram} className="hover:text-accent transition-colors" target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-5 w-5" />
                        </a>
                      )}
                      {footerContent?.social_links?.twitter && (
                        <a href={footerContent.social_links.twitter} className="hover:text-accent transition-colors" target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-5 w-5" />
                        </a>
                      )}
                    </>
                  )
              }
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-elegant font-semibold text-lg">{t('quick_links', 'Quick Links')}</h4>
            <nav className="space-y-2">
              <Link to="/rooms" className="block hover:text-accent transition-colors">
                {t('rooms_suites', 'Rooms & Suites')}
              </Link>
              <Link to="/about" className="block hover:text-accent transition-colors">
                {t('about_us', 'About Us')}
              </Link>
              <Link to="/restaurant-dashboard" className="block hover:text-accent transition-colors">
                {t('restaurant', 'Restaurant')}
              </Link>
              <Link to="/contact" className="block hover:text-accent transition-colors">
                {t('contact', 'Contact')}
              </Link>
              <Link to="/auth" className="block hover:text-accent transition-colors">
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
              ]).map((service: string, index: number) => (
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
            © 2024 {footerContent?.company_name || t('company_name', 'Kabinda Lodge')}. {t('all_rights_reserved', 'All rights reserved.')}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-sm hover:text-accent transition-colors">
              {t('privacy_policy', 'Privacy Policy')}
            </Link>
            <Link to="/terms" className="text-sm hover:text-accent transition-colors">
              {t('terms_of_service', 'Terms of Service')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;