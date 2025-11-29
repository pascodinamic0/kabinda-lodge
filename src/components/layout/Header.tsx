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
import SocialLinks from "@/components/ui/SocialLinks";
import { SocialLink } from "@/utils/socialMediaUtils";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const { currentLanguage, setSystemLanguage, t, supportedLanguages, canChangeLanguage } = useLanguage();
  
  // Load dynamic content
  const { content: brandingContent } = useContent('site_branding');
  const { content: headerContent } = useContent('header_contact');
  const { content: footerContent } = useContent('footer');
  
  const [dynamicContent, setDynamicContent] = useState({
    logo_url: "",
    company_name: "Kabinda Lodge",
    tagline: "Premium Hospitality",
    phone: "+1 (555) 123-4567",
    email: "info@kabidalodge.com",
    tagline_text: "Experience Luxury • Create Memories"
  });

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    setDynamicContent({
      logo_url: (brandingContent.logo_url as string) || "",
      company_name: (brandingContent.company_name as string) || "Kabinda Lodge", 
      tagline: (brandingContent.tagline as string) || "Premium Hospitality",
      phone: (headerContent.phone as string) || "+1 (555) 123-4567",
      email: (headerContent.email as string) || "info@kabidalodge.com",
      tagline_text: (headerContent.tagline_text as string) || "Experience Luxury • Create Memories"
    });
    
    // Extract social links from footer content
    if (footerContent?.social_links) {
      if (Array.isArray(footerContent.social_links)) {
        const normalized = footerContent.social_links.map((link: any) => {
          if (link.name && link.url) {
            return { name: link.name, url: link.url };
          }
          if (link.platform && link.url) {
            return { name: link.platform, url: link.url };
          }
          return link;
        }).filter((link: any) => link.name && link.url);
        setSocialLinks(normalized);
      } else if (typeof footerContent.social_links === 'object') {
        const links: SocialLink[] = [];
        Object.entries(footerContent.social_links).forEach(([key, url]) => {
          if (url && typeof url === 'string') {
            links.push({ name: key.charAt(0).toUpperCase() + key.slice(1), url });
          }
        });
        setSocialLinks(links);
      }
    }
  }, [brandingContent, headerContent, footerContent]);

  const navigation = [
    { name: t("nav.home", "Home"), href: "/kabinda-lodge" },
    { name: t("nav.rooms", "Rooms"), href: "/kabinda-lodge/rooms" },
    { name: t("nav.conference", "Conference Room"), href: "/kabinda-lodge/conference" },
    { name: t("nav.about", "About"), href: "/kabinda-lodge/about" },
    { name: t("nav.restaurant", "Restaurant"), href: "/kabinda-lodge/restaurant" },
    { name: t("nav.contact", "Contact"), href: "/kabinda-lodge/contact" },
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
      <div className="bg-primary text-primary-foreground py-1 sm:py-2 px-2 sm:px-4">
        <div className="container mx-auto flex justify-between items-center text-xs sm:text-sm">
          <div className="flex items-center space-x-2 sm:space-x-6">
            <div className="hidden xs:flex items-center space-x-1 sm:space-x-2">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">{dynamicContent.phone}</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate max-w-[120px] sm:max-w-none">{dynamicContent.email}</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            <span className="text-xs lg:text-sm">{dynamicContent.tagline_text}</span>
            
            {/* Social Media Links */}
            {socialLinks.length > 0 && (
              <SocialLinks 
                links={socialLinks}
                className="text-primary-foreground/80 hover:text-primary-foreground"
                iconSize={16}
                variant="minimal"
              />
            )}
            
            {/* Language Switcher - Only for SuperAdmin */}
            {canChangeLanguage && (
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
                      onClick={() => setSystemLanguage(lang)}
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
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Company Logo Design */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/kabinda-lodge/about" className="flex flex-col items-center group transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-1 mb-1">
                <span className="font-elegant font-bold text-lg sm:text-xl lg:text-2xl text-primary group-hover:text-primary/80 transition-colors">
                  Kabinda Lodge
                </span>
              </div>
              
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-4 lg:w-6 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                <p className="text-xs text-muted-foreground font-sans tracking-wider uppercase opacity-80 px-1">
                  {dynamicContent.tagline}
                </p>
                <div className="w-4 lg:w-6 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              </div>
            </Link>
          </div>

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
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            {user ? (
              // Authenticated user menu
              <>
                {userRole === 'Guest' ? (
                  // Guest user menu
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/kabinda-lodge/my-bookings" className="gap-2">
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
                        userRole === 'Admin' ? '/kabinda-lodge/admin' :
                        userRole === 'Receptionist' ? '/kabinda-lodge/reception' :
                        userRole === 'RestaurantLead' ? '/kabinda-lodge/restaurant-dashboard' : '/kabinda-lodge'
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
                  <Link to="/kabinda-lodge/auth">{t("auth.staff_login", "Staff Login")}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/kabinda-lodge/rooms">{t("auth.book_now", "Book Now")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-1.5 sm:p-2 rounded-md hover:bg-accent/50 transition-colors touch-manipulation"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-sm">
          <nav className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "block py-3 px-3 rounded-md font-medium transition-colors touch-manipulation",
                    isActive(item.href)
                      ? "text-primary bg-primary/10 border-l-2 border-primary"
                      : "text-foreground hover:text-primary hover:bg-accent/50"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="pt-3 mt-3 border-t border-border space-y-2">
              {user ? (
                // Authenticated mobile menu
                <>
                  {userRole === 'Guest' ? (
                    <>
                      <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                        <Link to="/kabinda-lodge/my-bookings" onClick={() => setIsMenuOpen(false)}>
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
                          userRole === 'Admin' ? '/kabinda-lodge/admin' :
                          userRole === 'Receptionist' ? '/kabinda-lodge/reception' :
                          userRole === 'RestaurantLead' ? '/kabinda-lodge/restaurant-dashboard' : '/kabinda-lodge'
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
                    <Link to="/kabinda-lodge/auth" onClick={() => setIsMenuOpen(false)}>
                      {t("auth.staff_login", "Staff Login")}
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to="/kabinda-lodge/rooms" onClick={() => setIsMenuOpen(false)}>
                      {t("auth.book_now", "Book Now")}
                    </Link>
                  </Button>
                  
                  {/* Mobile Language Switcher - Only for SuperAdmin */}
                  {canChangeLanguage && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Language</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {supportedLanguages.map((lang) => (
                          <Button
                            key={lang}
                            variant={currentLanguage === lang ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSystemLanguage(lang);
                              setIsMenuOpen(false);
                            }}
                            className="flex items-center gap-1.5 touch-manipulation"
                          >
                            <span>{getLanguageFlag(lang)}</span>
                            <span className="text-xs">{getLanguageName(lang)}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
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