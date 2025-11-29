import { Card, CardContent } from "@/components/ui/card";
import { Star, ExternalLink } from "lucide-react";
import { CachedReview } from "@/services/googleReviewsService";
import { Feedback } from "@/pages/Home";

interface ReviewCardProps {
  review: CachedReview | Feedback;
  source: "google" | "internal";
  businessProfileUrl?: string;
}

export const ReviewCard = ({ review, source, businessProfileUrl }: ReviewCardProps) => {
  // Determine rating and text based on source
  const rating = source === "google"
    ? (review as CachedReview).rating
    : (review as Feedback).rating || 0;
  const text = source === "google" 
    ? (review as CachedReview).text || null
    : (review as Feedback).message || null;
  const authorName = source === "google"
    ? (review as CachedReview).author_name
    : (review as Feedback).users?.name || "Anonymous Guest";
  const time = source === "google"
    ? (review as CachedReview).time
    : (review as Feedback).created_at;
  const profilePhotoUrl = source === "google"
    ? (review as CachedReview).profile_photo_url || null
    : undefined;
  const relativeTime = source === "google"
    ? (review as CachedReview).relative_time_description || null
    : undefined;

  // Format date for internal reviews
  const formattedDate = source === "internal"
    ? new Date(time).toLocaleDateString()
    : relativeTime || new Date(time).toLocaleDateString();

  // Get initials for fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="border-border hover-lift transition-smooth card-responsive h-full flex flex-col">
      <CardContent className="p-4 sm:p-6 flex flex-col flex-1">
        {/* Header with profile photo and source badge */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-3">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={authorName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <span className="text-primary font-semibold text-xs sm:text-sm">
                  {getInitials(authorName)}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-xs sm:text-sm lg:text-base text-foreground">
                {authorName}
              </p>
              {source === "google" && (
                <div className="flex items-center gap-1 mt-0.5">
                  <img
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    className="w-3 h-3"
                  />
                  <span className="text-xs text-muted-foreground">Google</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-3 sm:mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 sm:h-5 sm:w-5 ${
                i < rating
                  ? "text-accent fill-current"
                  : "text-muted-foreground/30 fill-current"
              } transition-colors`}
            />
          ))}
          <span className="ml-1 text-xs sm:text-sm text-muted-foreground">
            {rating}/5
          </span>
        </div>

        {/* Review Text */}
        {text && (
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mb-3 sm:mb-4 flex-1 line-clamp-4">
            "{text}"
          </p>
        )}

        {/* Footer with date and link */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
          {source === "google" && businessProfileUrl && (
            <a
              href={businessProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-glow transition-colors"
            >
              View on Google
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

