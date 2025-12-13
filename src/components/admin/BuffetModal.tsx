import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface BuffetOption {
  id: number;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
}

interface BuffetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buffet: BuffetOption | null;
}

export default function BuffetModal({ isOpen, onClose, onSuccess, buffet }: BuffetModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    is_available: true,
  });

  useEffect(() => {
    if (buffet) {
      setFormData({
        name: buffet.name,
        description: buffet.description || "",
        price: buffet.price.toString(),
        is_available: buffet.is_available,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        is_available: true,
      });
    }
  }, [buffet, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const price = parseFloat(formData.price);
      if (isNaN(price)) {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid number for price",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const payload = {
        name: formData.name,
        description: formData.description || null,
        price: price,
        is_available: formData.is_available,
      };

      if (buffet) {
        const { error } = await supabase
          .from("buffet_options")
          .update(payload)
          .eq("id", buffet.id);

        if (error) throw error;
        toast({ title: "Success", description: "Buffet option updated successfully" });
      } else {
        const { error } = await supabase
          .from("buffet_options")
          .insert([payload]);

        if (error) throw error;
        toast({ title: "Success", description: "Buffet option created successfully" });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving buffet option:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save buffet option",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{buffet ? "Edit Buffet Option" : "Add Buffet Option"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked as boolean })}
            />
            <Label htmlFor="is_available">Available for booking</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

