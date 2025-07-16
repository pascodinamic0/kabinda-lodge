import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const [footerContent, setFooterContent] = useState<any>(null);

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
      console.error('Error fetching footer content:', error);
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
                  {footerContent?.company_name || "Kabinda Lodge"}
                </h3>
                <p className="text-xs text-primary-foreground/80">Premium Hospitality</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              Experience unparalleled luxury and comfort at Kabinda Lodge, where every detail 
              is crafted to create unforgettable memories.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-elegant font-semibold text-lg">Quick Links</h4>
            <nav className="space-y-2">
              <Link to="/rooms" className="block hover:text-accent transition-colors">
                Rooms & Suites
              </Link>
              <Link to="/about" className="block hover:text-accent transition-colors">
                About Us
              </Link>
              <Link to="/dining" className="block hover:text-accent transition-colors">
                Dining
              </Link>
              <Link to="/contact" className="block hover:text-accent transition-colors">
                Contact
              </Link>
              <Link to="/auth" className="block hover:text-accent transition-colors">
                Book Now
              </Link>
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-elegant font-semibold text-lg">Services</h4>
            <nav className="space-y-2">
              {(footerContent?.services || [
                "Concierge",
                "Spa & Wellness", 
                "Conference Facilities",
                "Transportation",
                "Special Occasions"
              ]).map((service: string, index: number) => (
                <a key={index} href="#" className="block hover:text-accent transition-colors">
                  {service}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-elegant font-semibold text-lg">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{footerContent?.address || "123 Lodge Road, Kabinda City"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <p>{footerContent?.phone || "+1 (555) 123-4567"}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <p>{footerContent?.email || "info@kakindalodge.com"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/80 text-sm">
            © 2024 {footerContent?.company_name || "Kabinda Lodge"}. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-sm hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm hover:text-accent transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;