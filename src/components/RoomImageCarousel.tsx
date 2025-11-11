import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface RoomImageCarouselProps {
  images: Array<{
    id: string;
    url: string;
    alt_text?: string;
  }>;
  roomName: string;
}

const RoomImageCarousel: React.FC<RoomImageCarouselProps> = ({ images, roomName }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<{ [key: number]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openFullscreen = () => {
    setIsFullscreenOpen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreenOpen(false);
  };

  useEffect(() => {
    // Preload next and previous images for smooth transitions
    const preloadImages = () => {
      const indicesToPreload = [
        (currentImageIndex + 1) % images.length,
        (currentImageIndex - 1 + images.length) % images.length,
      ];
      
      indicesToPreload.forEach((index) => {
        if (!imageLoaded[index] && images[index]) {
          const img = new Image();
          img.src = images[index].url;
          img.onload = () => {
            setImageLoaded((prev) => ({ ...prev, [index]: true }));
          };
        }
      });
    };

    if (images.length > 0) {
      preloadImages();
    }
  }, [currentImageIndex, images, imageLoaded]);

  const handleImageLoad = () => {
    setImageLoaded((prev) => ({ ...prev, [currentImageIndex]: true }));
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
  };

  if (images.length === 0) {
    return (
      <div className="relative h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Carousel */}
      <div className="relative h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden group">
        {/* Skeleton loader */}
        {isLoading && !imageLoaded[currentImageIndex] && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        
        <img
          ref={imgRef}
          src={images[currentImageIndex].url}
          alt={images[currentImageIndex].alt_text || `${roomName} image ${currentImageIndex + 1}`}
          loading={currentImageIndex === 0 ? "eager" : "lazy"}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover cursor-pointer transition-all duration-300 group-hover:scale-105 ${
            imageLoaded[currentImageIndex] ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={openFullscreen}
          decoding="async"
        />
        
        {/* Zoom icon overlay */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center cursor-pointer"
          onClick={openFullscreen}
        >
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setIsLoading(true);
                prevImage();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setIsLoading(true);
                nextImage();
              }}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {images.map((image, index) => (
              <button
                key={`image-indicator-${index}-${image.id}`}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLoading(true);
                  setCurrentImageIndex(index);
                }}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 border-0 bg-black overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={images[currentImageIndex].url}
              alt={images[currentImageIndex].alt_text || `${roomName} image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Fullscreen navigation - only show if more than 1 image */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition-colors z-50"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition-colors z-50"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                
                {/* Fullscreen image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-2 rounded font-medium z-50">
                  {currentImageIndex + 1} of {images.length}
                </div>
              </>
            )}
            
            {/* Close button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 bg-black/70 text-white hover:bg-black/90 rounded-full p-3 z-50 transition-colors"
              aria-label="Close fullscreen"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Room name in fullscreen */}
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm z-50">
              {roomName}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoomImageCarousel;