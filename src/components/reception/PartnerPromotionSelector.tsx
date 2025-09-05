import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Percent, Tag, Users, CheckCircle, AlertCircle } from 'lucide-react';

interface PartnerPromotion {
  id: number;
  title: string;
  description: string | null;
  discount_percent: number;
  discount_amount?: number;
  discount_type?: 'percentage' | 'fixed';
  partner_name: string | null;
  partner_contact_info: string | null;
  minimum_amount: number;
  maximum_uses: number | null;
  current_uses: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface PartnerPromotionSelectorProps {
  bookingAmount: number;
  onPromotionApplied: (promotionData: {
    promotionId: number;
    discountAmount: number;
    finalAmount: number;
    promotionTitle: string;
  }) => void;
  bookingId?: number;
  conferenceBookingId?: number;
  userId: string;
  disabled?: boolean;
}

export const PartnerPromotionSelector: React.FC<PartnerPromotionSelectorProps> = ({
  bookingAmount,
  onPromotionApplied,
  bookingId,
  conferenceBookingId,
  userId,
  disabled = false
}) => {
  const { toast } = useToast();
  const [partnerPromotions, setPartnerPromotions] = useState<PartnerPromotion[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    discountAmount: number;
    finalAmount: number;
  } | null>(null);

  useEffect(() => {
    fetchPartnerPromotions();
  }, []);

  useEffect(() => {
    if (selectedPromotionId && bookingAmount > 0) {
      calculatePreview();
    } else {
      setPreviewData(null);
    }
  }, [selectedPromotionId, bookingAmount]);

  const fetchPartnerPromotions = async () => {
    try {
      setLoading(true);
      
      // Try to fetch with new fields, fallback to basic query if they don't exist
      let data: any[] = [];
      
      try {
        const { data: newData, error } = await supabase
          .from('promotions')
          .select('*')
          .lte('start_date', new Date().toISOString().split('T')[0])
          .gte('end_date', new Date().toISOString().split('T')[0])
          .order('title');

        if (error) throw error;
        data = newData || [];
      } catch (error: any) {
        // If new fields don't exist, fall back to basic query and filter by description
        console.log('Falling back to basic promotions query');
        const { data: basicData, error: basicError } = await supabase
          .from('promotions')
          .select('*')
          .lte('start_date', new Date().toISOString().split('T')[0])
          .gte('end_date', new Date().toISOString().split('T')[0])
          .order('title');

        if (basicError) throw basicError;
        
        // Filter for partner promotions by checking if title contains a partner name (has a '-')
        data = (basicData || []).filter(promo => 
          promo.title.includes('-') || 
          (promo.description && promo.description.includes('-'))
        );
      }
      
      setPartnerPromotions(data);
    } catch (error) {
      console.error('Error fetching partner promotions:', error);
      toast({
        title: "Error",
        description: "Failed to load partner promotions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePreview = () => {
    const promotion = partnerPromotions.find(p => p.id === parseInt(selectedPromotionId));
    if (!promotion) return;

    let discountAmount: number;
    
    // Handle both new structure (with discount_type) and old structure (description-based)
    if (promotion.discount_type === 'fixed' && promotion.discount_amount) {
      discountAmount = Math.min(promotion.discount_amount, bookingAmount);
    } else if (promotion.description && promotion.description.includes('$') && promotion.description.includes('OFF')) {
      // Extract fixed amount from description like "TechCorp - $50 OFF"
      const match = promotion.description.match(/\$(\d+)\s*OFF/);
      if (match) {
        discountAmount = Math.min(parseInt(match[1]), bookingAmount);
      } else {
        discountAmount = bookingAmount * (promotion.discount_percent / 100);
      }
    } else {
      discountAmount = bookingAmount * (promotion.discount_percent / 100);
    }
    
    const finalAmount = bookingAmount - discountAmount;
    
    setPreviewData({ discountAmount, finalAmount });
  };

  const getEligiblePromotions = () => {
    return partnerPromotions.filter(promotion => {
      // Check minimum amount (only if the field exists)
      if (promotion.minimum_amount && bookingAmount < promotion.minimum_amount) return false;
      
      // Check usage limits (only if the field exists)
      if (promotion.maximum_uses && promotion.current_uses && promotion.current_uses >= promotion.maximum_uses) return false;
      
      return true;
    });
  };

  const applyPromotion = async () => {
    if (!selectedPromotionId || !previewData) return;

    try {
      setApplying(true);
      
      // Partner promotion application function not implemented yet
      // Calculate promotion manually
      const promotion = partnerPromotions.find(p => p.id === parseInt(selectedPromotionId));
      if (!promotion) throw new Error('Promotion not found');

      const discountAmount = previewData.discountAmount;
      const finalAmount = previewData.finalAmount;

      // Notify parent component
      onPromotionApplied({
        promotionId: parseInt(selectedPromotionId),
        discountAmount,
        finalAmount,
        promotionTitle: promotion.title
      });

      toast({
        title: "Promotion Applied Successfully",
        description: `${promotion.title} - $${discountAmount.toFixed(2)} discount applied`,
      });

      setIsDialogOpen(false);
      setSelectedPromotionId('');
      setPreviewData(null);
      
    } catch (error) {
      console.error('Error applying promotion:', error);
      toast({
        title: "Error",
        description: "Failed to apply promotion",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  const eligiblePromotions = getEligiblePromotions();

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full"
          disabled={disabled || bookingAmount <= 0}
        >
          <Tag className="h-4 w-4 mr-2" />
          Apply Partner Promotion
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Apply Partner Promotion
          </DialogTitle>
          <DialogDescription>
            Select a partner promotion to apply to this booking. Only eligible promotions are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Booking Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Original Amount:</span>
                <span className="font-semibold">${bookingAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Promotion Selection */}
          <div className="space-y-4">
            <Label htmlFor="promotion-select">Select Partner Promotion</Label>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="text-muted-foreground">Loading promotions...</div>
              </div>
            ) : eligiblePromotions.length === 0 ? (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No eligible partner promotions available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check minimum amount requirements or promotion availability
                </p>
              </div>
            ) : (
              <Select value={selectedPromotionId} onValueChange={setSelectedPromotionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a partner promotion" />
                </SelectTrigger>
                <SelectContent>
                  {eligiblePromotions.map((promotion) => (
                    <SelectItem key={promotion.id} value={promotion.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{promotion.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {promotion.partner_name || (promotion.title.includes('-') ? promotion.title.split(' - ')[0] : 'Partner')} • {
                              promotion.discount_type === 'fixed' ? 
                                `$${promotion.discount_amount} OFF` : 
                                promotion.description?.includes('$') ? 
                                  promotion.description.split(' - ')[1] || `${promotion.discount_percent}% OFF` :
                                  `${promotion.discount_percent}% OFF`
                            }
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Selected Promotion Details */}
            {selectedPromotionId && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  {(() => {
                    const promotion = partnerPromotions.find(p => p.id === parseInt(selectedPromotionId));
                    return promotion ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-green-800">{promotion.title}</h4>
                          <Badge variant="outline" className="border-green-300 text-green-700">
                            <Percent className="h-3 w-3 mr-1" />
                            {promotion.discount_type === 'fixed' ? 
                              `$${promotion.discount_amount} OFF` : 
                              `${promotion.discount_percent}% OFF`
                            }
                          </Badge>
                        </div>
                        
                        {promotion.description && (
                          <p className="text-sm text-green-700">{promotion.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-xs text-green-600">
                          <div>
                            <span className="font-medium">Partner:</span> {promotion.partner_name}
                          </div>
                          <div>
                            <span className="font-medium">Min. Amount:</span> ${promotion.minimum_amount}
                          </div>
                          {promotion.maximum_uses && (
                            <div className="col-span-2">
                              <span className="font-medium">Usage:</span> {promotion.current_uses}/{promotion.maximum_uses}
                            </div>
                          )}
                        </div>

                        {previewData && (
                          <div className="border-t border-green-200 pt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Discount Amount:</span>
                              <span className="font-medium text-green-700">-${previewData.discountAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-semibold">
                              <span>Final Amount:</span>
                              <span className="text-green-800">${previewData.finalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={applyPromotion}
            disabled={!selectedPromotionId || !previewData || applying}
            className="bg-green-600 hover:bg-green-700"
          >
            {applying ? (
              "Applying..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply Promotion
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
