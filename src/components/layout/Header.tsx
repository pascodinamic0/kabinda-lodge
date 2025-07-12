import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Rooms & Suites", href: "/rooms" },
    { name: "Dining", href: "/dining" },
    { name: "Experiences", href: "/experiences" },
    { name: "Events", href: "/events" },
    { name: "Gallery", href: "/gallery" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="relative bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      {/* Top Contact Bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>info@kabidalodge.com</span>
            </div>
          </div>
          <div className="hidden md:block">
            <span>Experience Luxury • Create Memories</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-elegant font-bold text-xl">K</span>
            </div>
            <div>
              <h1 className="font-elegant font-bold text-2xl text-foreground">Kabinda Lodge</h1>
              <p className="text-xs text-muted-foreground font-sans">Premium Hospitality</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "font-medium transition-colors hover:text-primary relative py-2",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-foreground"
                )}
              >
                {item.name}
                {isActive(item.href) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link to="/contact">Book Now</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "block py-3 px-2 font-medium transition-colors",
                  isActive(item.href)
                    ? "text-primary border-l-2 border-primary"
                    : "text-foreground hover:text-primary"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t border-border">
              <Button className="w-full" asChild>
                <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
                  Book Now
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;