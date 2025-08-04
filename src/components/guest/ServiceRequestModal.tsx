import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const requestTypes = [
  "Housekeeping",
  "Maintenance",
  "Room Service",
  "Technical Support",
  "Concierge",
  "Other"
];

const priorityOptions = [
  { value: "low", label: "Low", icon: Clock, color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", icon: AlertCircle, color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", icon: Zap, color: "bg-red-100 text-red-800" }
];

export function ServiceRequestModal({ isOpen, onClose, onSubmit }: ServiceRequestModalProps) {
  const [requestType, setRequestType] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestType || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('guest_service_requests')
        .insert([
          {
            user_id: user?.id,
            request_type: requestType,
            priority,
            description: description.trim(),
            room_number: roomNumber.trim() || null,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your service request has been submitted successfully. Our team will respond shortly.",
      });

      // Reset form
      setRequestType("");
      setPriority("medium");
      setDescription("");
      setRoomNumber("");
      
      onSubmit();
      onClose();
    } catch (error: any) {
      console.error('Error submitting service request:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRequestType("");
    setPriority("medium");
    setDescription("");
    setRoomNumber("");
    onClose();
  };

  const selectedPriority = priorityOptions.find(p => p.value === priority);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Service Request</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="request-type">Service Type *</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {requestTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPriority && (
              <Badge className={`mt-1 ${selectedPriority.color}`}>
                <selectedPriority.icon className="h-3 w-3 mr-1" />
                {selectedPriority.label}
              </Badge>
            )}
          </div>

          <div>
            <Label htmlFor="room-number">Room Number (Optional)</Label>
            <Input
              id="room-number"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g., 101, 205"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe your request in detail..."
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {description.length}/500 characters
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !requestType || !description.trim()}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}