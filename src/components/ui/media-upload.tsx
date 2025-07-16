import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, File, Loader2 } from 'lucide-react';

interface MediaUploadProps {
  bucketName?: string;
  allowedTypes?: string[];
  maxFileSize?: number; // in MB
  onUploadSuccess?: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  currentImage?: string;
  placeholder?: string;
  className?: string;
  multiple?: boolean;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  bucketName = 'media-uploads',
  allowedTypes = ['image/*'],
  maxFileSize = 10,
  onUploadSuccess,
  onUploadError,
  currentImage,
  placeholder = 'Click to upload or drag and drop',
  className = '',
  multiple = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `File type not allowed. Accepted types: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      const error = `Validation failed: ${validationError}`;
      onUploadError?.(error);
      toast({
        title: 'Upload Error',
        description: validationError,
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      
      onUploadSuccess?.(publicUrl, fileName);
      toast({
        title: 'Upload Successful',
        description: `${file.name} has been uploaded successfully`,
      });

      return publicUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      toast({
        title: 'Upload Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleFileSelect = async (files: FileList) => {
    if (!files.length) return;

    setUploading(true);

    try {
      if (multiple) {
        // Handle multiple files
        const uploadPromises = Array.from(files).map(file => uploadFile(file));
        await Promise.all(uploadPromises);
      } else {
        // Handle single file
        const file = files[0];
        const url = await uploadFile(file);
        
        if (url && file.type.startsWith('image/')) {
          setPreviewUrl(url);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className={`border-2 border-dashed transition-colors ${
        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}>
        <CardContent 
          className="p-6"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeImage}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="flex flex-col items-center justify-center py-12 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
              onClick={openFileDialog}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {allowedTypes.includes('image/*') ? (
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  ) : (
                    <File className="h-12 w-12 text-muted-foreground mb-4" />
                  )}
                  <p className="text-sm text-foreground font-medium mb-2">
                    {placeholder}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Supported formats: {allowedTypes.join(', ')} • Max size: {maxFileSize}MB
                  </p>
                  <Button variant="outline" className="mt-4" disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File{multiple ? 's' : ''}
                  </Button>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            multiple={multiple}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
          />
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        <p>• Drag and drop files here or click to browse</p>
        <p>• Files are uploaded to Supabase Storage</p>
        <p>• URLs are automatically generated for uploaded files</p>
      </div>
    </div>
  );
};

export default MediaUpload;