import React, { useState } from "react";
import { SocialLink, detectPlatformFromUrl, getPlatformIcon, hasLucideIcon, getPlatformIconUrl, normalizePlatformName } from "@/utils/socialMediaUtils";
import { cn } from "@/lib/utils";

interface SocialLinksProps {
  links: SocialLink[];
  className?: string;
  iconSize?: number;
  showLabels?: boolean;
  variant?: "default" | "minimal" | "buttons";
}

const SocialLinks: React.FC<SocialLinksProps> = ({
  links,
  className,
  iconSize = 24,
  showLabels = false,
  variant = "default"
}) => {
  if (!links || links.length === 0) {
    return null;
  }

  const PlatformIcon: React.FC<{ link: SocialLink }> = ({ link }) => {
    const [imageError, setImageError] = useState(false);
    
    // Use provided name or detect from URL
    const platformName = link.name 
      ? normalizePlatformName(link.name)
      : detectPlatformFromUrl(link.url);
    
    const normalizedName = platformName.toLowerCase().trim();
    
    // Check if we have a Lucide icon
    if (hasLucideIcon(normalizedName)) {
      const IconComponent = getPlatformIcon(normalizedName);
      return <IconComponent style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />;
    }
    
    // Use Simple Icons CDN for platforms without Lucide icons
    if (imageError) {
      // Fallback to a generic icon if image fails to load
      return (
        <div
          style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
          className="rounded-full bg-current flex items-center justify-center text-xs font-bold"
        >
          {platformName.charAt(0).toUpperCase()}
        </div>
      );
    }
    
    return (
      <img
        src={getPlatformIconUrl(platformName, iconSize)}
        alt={platformName}
        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
        className="object-contain"
        onError={() => setImageError(true)}
      />
    );
  };
  
  const getIconForLink = (link: SocialLink) => {
    return <PlatformIcon link={link} />;
  };

  const renderLink = (link: SocialLink, index: number) => {
    const platformName = link.name 
      ? normalizePlatformName(link.name)
      : detectPlatformFromUrl(link.url);
    
    const baseClasses = "transition-colors hover:opacity-80";
    
    if (variant === "buttons") {
      return (
        <a
          key={`social-${index}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={platformName}
          className={cn(
            baseClasses,
            "inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-accent",
            className
          )}
        >
          {getIconForLink(link)}
          {showLabels && <span className="text-sm">{platformName}</span>}
        </a>
      );
    }
    
    if (variant === "minimal") {
      return (
        <a
          key={`social-${index}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={platformName}
          className={cn(baseClasses, "text-muted-foreground hover:text-foreground", className)}
        >
          {getIconForLink(link)}
        </a>
      );
    }
    
    // Default variant
    return (
      <a
        key={`social-${index}`}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        title={platformName}
        className={cn(baseClasses, "hover:text-accent", className)}
      >
        {getIconForLink(link)}
      </a>
    );
  };

  return (
    <div className={cn("flex items-center gap-3 sm:gap-4", variant === "buttons" && "flex-wrap")}>
      {links.map((link, index) => renderLink(link, index))}
    </div>
  );
};

export default SocialLinks;

