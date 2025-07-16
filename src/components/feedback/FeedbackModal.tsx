import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  roomName: string;
  onSubmit: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  roomName,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const MIN_MESSAGE_LENGTH = 20;
  const MAX_MESSAGE_LENGTH = 500;

  const getProgressValue = () => {
    if (rating !== 5) return 0;
    if (message.length < MIN_MESSAGE_LENGTH) {
      return (message.length / MIN_MESSAGE_LENGTH) * 50;
    }
    return 50 + ((message.length - MIN_MESSAGE_LENGTH) / (MAX_MESSAGE_LENGTH - MIN_MESSAGE_LENGTH)) * 50;
  };

  const getProgressColor = () => {
    const progress = getProgressValue();
    if (progress < 25) return "bg-destructive";
    if (progress < 50) return "bg-orange-500";
    if (progress < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const canSubmit = () => {
    if (rating === 0) return false;
    if (rating === 5) {
      return message.length >= MIN_MESSAGE_LENGTH && message.length <= MAX_MESSAGE_LENGTH;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          booking_id: bookingId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          rating,
          message: rating === 5 ? message : null,
        });

      if (error) throw error;

      toast({
        title: "Thank you for your feedback!",
        description: "Your review has been submitted successfully.",
      });

      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setMessage("");
    setHoveredStar(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Stay</DialogTitle>
          <DialogDescription>
            How was your experience at {roomName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm font-medium mb-3">Rate your overall experience</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-colors duration-200"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredStar || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    } transition-colors duration-200`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Message for 5-star ratings */}
          {rating === 5 && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tell us what made your stay special
                </label>
                <Textarea
                  placeholder="Share your experience (minimum 20 characters)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={MAX_MESSAGE_LENGTH}
                  className="resize-none"
                  rows={4}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {message.length}/{MAX_MESSAGE_LENGTH} characters
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Message quality</span>
                  <span>
                    {message.length < MIN_MESSAGE_LENGTH
                      ? "Too short"
                      : getProgressValue() >= 75
                      ? "Perfect!"
                      : "Good"}
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={getProgressValue()} 
                    className="h-2"
                  />
                  <div 
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                    style={{ width: `${getProgressValue()}%` }}
                  />
                </div>
                {message.length < MIN_MESSAGE_LENGTH && message.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Please write at least {MIN_MESSAGE_LENGTH - message.length} more characters
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!canSubmit() || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;