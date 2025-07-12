import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
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
                <h3 className="font-elegant font-bold text-xl">Kabinda Lodge</h3>
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
              <Link to="/dining" className="block hover:text-accent transition-colors">
                Dining
              </Link>
              <Link to="/experiences" className="block hover:text-accent transition-colors">
                Experiences
              </Link>
              <Link to="/events" className="block hover:text-accent transition-colors">
                Events
              </Link>
              <Link to="/gallery" className="block hover:text-accent transition-colors">
                Gallery
              </Link>
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-elegant font-semibold text-lg">Services</h4>
            <nav className="space-y-2">
              <a href="#" className="block hover:text-accent transition-colors">
                Concierge
              </a>
              <a href="#" className="block hover:text-accent transition-colors">
                Spa & Wellness
              </a>
              <a href="#" className="block hover:text-accent transition-colors">
                Conference Facilities
              </a>
              <a href="#" className="block hover:text-accent transition-colors">
                Transportation
              </a>
              <a href="#" className="block hover:text-accent transition-colors">
                Special Occasions
              </a>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-elegant font-semibold text-lg">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p>123 Luxury Avenue</p>
                  <p>Paradise City, PC 12345</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <p>+1 (555) 123-4567</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <p>info@kabidalodge.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/80 text-sm">
            © 2024 Kabinda Lodge. All rights reserved.
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