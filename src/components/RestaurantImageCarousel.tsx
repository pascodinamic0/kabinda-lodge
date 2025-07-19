import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RestaurantImageCarouselProps {
  images: Array<{ id: string; url: string; alt_text?: string; }>;
  itemName: string;
}

const RestaurantImageCarousel: React.FC<RestaurantImageCarouselProps> = ({ images, itemName }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  // Return fallback if no images
  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No image available</p>
        </div>
      </div>
    );
  }

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

  const currentImage = images[currentImageIndex];

  return (
    <>
      {/* Main Carousel */}
      <div className="relative aspect-[4/3] overflow-hidden group">
        <img
          src={currentImage.url}
          alt={currentImage.alt_text || itemName}
          className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
          onClick={openFullscreen}
        />
        
        {/* Navigation arrows - only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            
            {/* Image indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Zoom icon */}
        <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <ZoomIn className="h-4 w-4" />
        </div>
        
        {/* Image counter (if more than 1 image) */}
        {images.length > 1 && (
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium z-10">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 border-0 bg-black overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={currentImage.url}
              alt={currentImage.alt_text || itemName}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={closeFullscreen}
              className="absolute top-4 right-4 bg-black/70 text-white hover:bg-black/90 rounded-full z-50"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Item name in fullscreen */}
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm z-50">
              {itemName}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RestaurantImageCarousel;