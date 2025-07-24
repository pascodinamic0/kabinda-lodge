import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Gift, 
  RefreshCw, 
  Calendar, 
  DollarSign, 
  Receipt,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Promotion {
  id: number;
  title: string;
  description: string | null;
  discount_percent: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface PromotionSetting {
  promotion_id: number | null;
  enabled: boolean;
}

export default function RestaurantPromotions() {
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [receiptPromotion, setReceiptPromotion] = useState<PromotionSetting>({
    promotion_id: null,
    enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPromotions();
    fetchReceiptPromotionSetting();
  }, []);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast({
        title: "Error",
        description: "Failed to load promotions",
        variant: "destructive"
      });
    }
  };

  const fetchReceiptPromotionSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'receipt_promotion')
        .eq('category', 'restaurant')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const setting = data.value as any;
        setReceiptPromotion({
          promotion_id: setting.promotion_id || null,
          enabled: setting.enabled || false
        });
      }
    } catch (error) {
      console.error('Error fetching receipt promotion setting:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReceiptPromotion = async (promotionId: number | null, enabled: boolean) => {
    setUpdating(true);
    try {
      const newSetting: PromotionSetting = {
        promotion_id: promotionId,
        enabled
      };

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'receipt_promotion',
          category: 'restaurant',
          value: newSetting as any,
          description: 'Active promotion to display on receipts'
        });

      if (error) throw error;

      setReceiptPromotion(newSetting);
      
      toast({
        title: "Success",
        description: enabled 
          ? "Promotion activated for receipts" 
          : "Promotion disabled for receipts"
      });
    } catch (error) {
      console.error('Error updating receipt promotion:', error);
      toast({
        title: "Error",
        description: "Failed to update promotion setting",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);
    return now >= startDate && now <= endDate;
  };

  const isPromotionSelected = (promotionId: number) => {
    return receiptPromotion.promotion_id === promotionId;
  };

  const getStatusBadge = (promotion: Promotion) => {
    const isActive = isPromotionActive(promotion);
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </>
        )}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Restaurant Promotions">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Restaurant Promotions" subtitle="Manage promotional offers for receipts">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Restaurant Promotions</h1>
            <p className="text-muted-foreground">
              Manage promotional offers that appear on customer receipts
            </p>
          </div>
          <Button
            onClick={() => {
              fetchPromotions();
              fetchReceiptPromotionSetting();
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Current Receipt Promotion */}
        {receiptPromotion.enabled && receiptPromotion.promotion_id && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Receipt className="h-5 w-5" />
                Active Receipt Promotion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const activePromo = promotions.find(p => p.id === receiptPromotion.promotion_id);
                return activePromo ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-green-900">{activePromo.title}</h4>
                      <p className="text-sm text-green-700">{activePromo.description}</p>
                      <p className="text-sm text-green-600 mt-1">
                        {activePromo.discount_percent}% discount
                      </p>
                    </div>
                    <Button
                      onClick={() => updateReceiptPromotion(null, false)}
                      disabled={updating}
                      variant="outline"
                      size="sm"
                    >
                      Disable
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Selected promotion not found
                  </p>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Promotions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Promotions</h2>
          
          {promotions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No promotions available. Contact admin to create promotions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {promotions.map((promotion) => (
                <Card key={promotion.id} className="w-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{promotion.title}</CardTitle>
                        {promotion.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {promotion.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(promotion)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Promotion Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="font-medium">{promotion.discount_percent}%</span> discount
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(promotion.start_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Until {new Date(promotion.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Receipt Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor={`receipt-${promotion.id}`} className="text-sm font-medium">
                          Show on Receipts
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Display this promotion on customer receipts
                        </p>
                      </div>
                      <Switch
                        id={`receipt-${promotion.id}`}
                        checked={isPromotionSelected(promotion.id) && receiptPromotion.enabled}
                        disabled={updating || !isPromotionActive(promotion)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateReceiptPromotion(promotion.id, true);
                          } else {
                            updateReceiptPromotion(null, false);
                          }
                        }}
                      />
                    </div>

                    {!isPromotionActive(promotion) && (
                      <p className="text-xs text-muted-foreground">
                        This promotion is not currently active and cannot be enabled for receipts.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}