import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MediaUpload from '@/components/ui/media-upload';

interface ConferenceRoom {
  id: number;
  name: string;
  capacity: number;
  hourly_rate: number; // Note: This represents daily rate despite the field name
  status: string;
  description: string | null;
  features: string[];
}

interface ConferenceRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: ConferenceRoom | null;
  onSuccess: () => void;
}

const ConferenceRoomModal: React.FC<ConferenceRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{id: string, url: string, alt_text: string}[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    daily_rate: '',
    status: 'available',
    description: '',
    features: [] as string[],
  });

  useEffect(() => {
    const fetchExistingImages = async () => {
      if (room) {
        try {
          const { data: imagesData } = await supabase
            .from('conference_room_images')
            .select('id, image_url, alt_text')
            .eq('conference_room_id', room.id)
            .order('display_order');

          const images = (imagesData || []).map(img => ({
            id: img.id,
            url: img.image_url,
            alt_text: img.alt_text || ''
          }));

          setExistingImages(images);
        } catch (error) {
          console.error('Error fetching existing images:', error);
        }
      } else {
        setExistingImages([]);
      }
    };

    if (room) {
      setFormData({
        name: room.name,
        capacity: room.capacity.toString(),
        daily_rate: room.hourly_rate.toString(), // hourly_rate field actually stores daily rate
        status: room.status,
        description: room.description || '',
        features: room.features || [],
      });
      fetchExistingImages();
    } else {
      setFormData({
        name: '',
        capacity: '',
        daily_rate: '',
        status: 'available',
        description: '',
        features: [],
      });
      setExistingImages([]);
    }
    setUploadedImages([]);
  }, [room, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const conferenceRoomData = {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        hourly_rate: parseFloat(formData.daily_rate), // Save to hourly_rate field (which actually stores daily rate)
        status: formData.status,
        description: formData.description || null,
        features: formData.features,
      };

      let conferenceRoomId: number;

      if (room) {
        // Update existing conference room
        const { error } = await supabase
          .from('conference_rooms')
          .update(conferenceRoomData)
          .eq('id', room.id);

        if (error) throw error;
        conferenceRoomId = room.id;

        toast({
          title: "Success",
          description: "Conference room updated successfully",
        });
      } else {
        // Create new conference room
        const { data, error } = await supabase
          .from('conference_rooms')
          .insert([conferenceRoomData])
          .select()
          .single();

        if (error) throw error;
        conferenceRoomId = data.id;

        toast({
          title: "Success",
          description: "Conference room created successfully",
        });
      }

      // Save conference room images if any were uploaded
      if (uploadedImages.length > 0) {
        // First, delete existing images for this conference room
        const { error: deleteError } = await supabase
          .from('conference_room_images')
          .delete()
          .eq('conference_room_id', conferenceRoomId);

        if (deleteError) {
          console.error('Error deleting existing conference room images:', deleteError);
        }

        // Then insert new images
        const imageData = uploadedImages.map((imageUrl, index) => ({
          conference_room_id: conferenceRoomId,
          image_url: imageUrl,
          display_order: index,
          alt_text: `${formData.name} image ${index + 1}`,
        }));

        const { error: imageError } = await supabase
          .from('conference_room_images')
          .insert(imageData);

        if (imageError) {
          console.error('Error saving conference room images:', imageError);
          toast({
            title: "Warning",
            description: "Conference room saved but some images may not have been uploaded",
            variant: "destructive",
          });
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save conference room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('conference_room_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const commonFeatures = [
    'Projector',
    'Video Conferencing',
    'Whiteboard',
    'WiFi',
    'Audio System',
    'Air Conditioning',
    'Catering Available'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {room ? 'Edit Conference Room' : 'Create New Conference Room'}
          </DialogTitle>
          <DialogDescription>
            {room ? 'Update conference room details below.' : 'Enter the details for the new conference room.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Room Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Executive Conference Room"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', e.target.value)}
                placeholder="e.g., 12"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily_rate">Daily Rate ($)</Label>
              <Input
                id="daily_rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.daily_rate}
                onChange={(e) => handleChange('daily_rate', e.target.value)}
                placeholder="e.g., 150.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the conference room"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Features & Amenities</Label>
            <div className="grid grid-cols-2 gap-2">
              {commonFeatures.map((feature) => (
                <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded"
                  />
                  <span className="text-sm">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conference Room Images Management */}
          <div className="space-y-4">
            <Label>Conference Room Images</Label>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Current Images</p>
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((image) => (
                    <div key={image.id} className="relative">
                      <img 
                        src={image.url} 
                        alt={image.alt_text}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingImage(image.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        title="Delete this image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Upload New Images</p>
              <MediaUpload
                bucketName="conference-images"
                allowedTypes={['image/*']}
                maxFileSize={10}
                multiple={true}
                placeholder="Upload conference room images (multiple files supported)"
                currentImage={uploadedImages.length > 0 ? uploadedImages[uploadedImages.length - 1] : ''}
                onUploadSuccess={(url, fileName) => {
                  setUploadedImages(prev => [...prev, url]);
                  toast({
                    title: "Image uploaded",
                    description: `${fileName} uploaded successfully. Preview updated.`,
                  });
                }}
                onUploadError={(error) => {
                  toast({
                    title: "Upload failed",
                    description: error,
                    variant: "destructive",
                  });
                }}
              />
              {uploadedImages.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {uploadedImages.length} new image(s) ready to be saved with conference room
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={imageUrl} 
                          alt={`New conference room image ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          title="Remove this new image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (room ? 'Update Conference Room' : 'Create Conference Room')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConferenceRoomModal;