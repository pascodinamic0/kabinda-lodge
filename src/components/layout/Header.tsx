import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, Mail, User, Calendar, LogOut, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/hooks/useContent";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const { currentLanguage, setLanguage, t, supportedLanguages } = useLanguage();
  
  // Load dynamic content
  const { content: brandingContent } = useContent('site_branding');
  const { content: headerContent } = useContent('header_contact');
  
  const [dynamicContent, setDynamicContent] = useState({
    logo_url: "",
    company_name: "Kabinda Lodge",
    tagline: "Premium Hospitality",
    phone: "+1 (555) 123-4567",
    email: "info@kabidalodge.com",
    tagline_text: "Experience Luxury • Create Memories"
  });

  useEffect(() => {
    setDynamicContent({
      logo_url: brandingContent.logo_url || "",
      company_name: brandingContent.company_name || "Kabinda Lodge", 
      tagline: brandingContent.tagline || "Premium Hospitality",
      phone: headerContent.phone || "+1 (555) 123-4567",
      email: headerContent.email || "info@kabidalodge.com",
      tagline_text: headerContent.tagline_text || "Experience Luxury • Create Memories"
    });
  }, [brandingContent, headerContent]);

  const navigation = [
    { name: t("nav.home", "Home"), href: "/" },
    { name: t("nav.rooms", "Rooms"), href: "/rooms" },
    { name: t("nav.conference", "Conference Room"), href: "/conference" },
    { name: t("nav.about", "About"), href: "/about" },
    { name: t("nav.restaurant", "Restaurant"), href: "/restaurant" },
    { name: t("nav.contact", "Contact"), href: "/contact" },
  ];

  const getLanguageFlag = (lang: string) => {
    const flags = {
      en: "🇺🇸",
      fr: "🇫🇷",
      es: "🇪🇸", 
      pt: "🇵🇹",
      ar: "🇸🇦"
    };
    return flags[lang as keyof typeof flags] || "🌐";
  };

  const getLanguageName = (lang: string) => {
    const names = {
      en: "English",
      fr: "Français",
      es: "Español",
      pt: "Português", 
      ar: "العربية"
    };
    return names[lang as keyof typeof names] || lang;
  };


  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <header className="relative bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      {/* Top Contact Bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>{dynamicContent.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>{dynamicContent.email}</span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <span>{dynamicContent.tagline_text}</span>
            
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-primary-foreground hover:bg-primary-glow/20">
                  <Globe className="h-4 w-4" />
                  <span>{getLanguageFlag(currentLanguage)}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {supportedLanguages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      currentLanguage === lang && "bg-accent"
                    )}
                  >
                    <span>{getLanguageFlag(lang)}</span>
                    <span>{getLanguageName(lang)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Navigation placeholder */}
          <div></div>

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

          {/* Desktop Auth/CTA Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              // Authenticated user menu
              <>
                {userRole === 'Guest' ? (
                  // Guest user menu
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/my-bookings" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        {t("auth.my_bookings", "My Bookings")}
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                      <LogOut className="h-4 w-4" />
                      {t("auth.sign_out", "Sign Out")}
                    </Button>
                  </>
                ) : (
                  // Staff user menu
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={
                        userRole === 'Admin' ? '/admin' :
                        userRole === 'Receptionist' ? '/reception' :
                        userRole === 'RestaurantLead' ? '/restaurant-dashboard' : '/'
                      }>
                        <User className="h-4 w-4 mr-2" />
                        {t("common.dashboard", "Dashboard")}
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                      <LogOut className="h-4 w-4" />
                      {t("auth.sign_out", "Sign Out")}
                    </Button>
                  </>
                )}
              </>
            ) : (
              // Non-authenticated menu
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">{t("auth.staff_login", "Staff Login")}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/rooms">{t("auth.book_now", "Book Now")}</Link>
                </Button>
              </>
            )}
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
            <div className="pt-4 mt-4 border-t border-border space-y-2">
              {user ? (
                // Authenticated mobile menu
                <>
                  {userRole === 'Guest' ? (
                    <>
                      <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                        <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)}>
                          <Calendar className="h-4 w-4" />
                          {t("auth.my_bookings", "My Bookings")}
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        {t("auth.sign_out", "Sign Out")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                        <Link to={
                          userRole === 'Admin' ? '/admin' :
                          userRole === 'Receptionist' ? '/reception' :
                          userRole === 'RestaurantLead' ? '/restaurant-dashboard' : '/'
                        } onClick={() => setIsMenuOpen(false)}>
                          <User className="h-4 w-4" />
                          {t("common.dashboard", "Dashboard")}
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        {t("auth.sign_out", "Sign Out")}
                      </Button>
                    </>
                  )}
                </>
              ) : (
                // Non-authenticated mobile menu
                <>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      {t("auth.staff_login", "Staff Login")}
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to="/rooms" onClick={() => setIsMenuOpen(false)}>
                      {t("auth.book_now", "Book Now")}
                    </Link>
                  </Button>
                  
                  {/* Mobile Language Switcher */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      {supportedLanguages.map((lang) => (
                        <Button
                          key={lang}
                          variant={currentLanguage === lang ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setLanguage(lang);
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center gap-1"
                        >
                          <span>{getLanguageFlag(lang)}</span>
                          <span className="text-xs">{getLanguageName(lang)}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;