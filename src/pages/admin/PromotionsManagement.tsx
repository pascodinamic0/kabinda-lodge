import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PartnerPromotionUsageReport } from '@/components/admin/PartnerPromotionUsageReport';

interface Promotion {
  id: number;
  title: string;
  description: string | null;
  discount_percent: number;
  discount_amount?: number;
  discount_type?: 'percentage' | 'fixed';
  start_date: string;
  end_date: string;
  created_at: string;
  promotion_type?: 'general' | 'partner';
  partner_name?: string;
  partner_contact_info?: string;
  minimum_amount?: number;
  maximum_uses?: number;
  current_uses?: number;
  is_active?: boolean;
}

export default function PromotionsManagement() {
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_percent: '',
    discount_amount: '',
    start_date: '',
    end_date: '',
    promotion_type: 'general' as 'general' | 'partner',
    partner_name: '',
    partner_contact_info: '',
      minimum_amount: '',
      maximum_uses: '',
      is_active: true
    });
    setEditingPromotion(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (promotion: Promotion) => {
    setFormData({
      title: promotion.title,
      description: promotion.description || '',
      discount_type: promotion.discount_type || (promotion.discount_amount ? 'fixed' : 'percentage'),
      discount_percent: promotion.discount_percent?.toString() || '',
      discount_amount: promotion.discount_amount?.toString() || '',
      start_date: promotion.start_date,
      end_date: promotion.end_date,
      promotion_type: promotion.promotion_type || 'general',
      partner_name: promotion.partner_name || '',
      partner_contact_info: promotion.partner_contact_info || '',
        is_active: formData.is_active
      };

      // Add partner-specific fields if it's a partner promotion
      if (formData.promotion_type === 'partner') {
        promotionData.partner_name = formData.partner_name.trim();
        promotionData.minimum_amount = formData.minimum_amount ? Number(formData.minimum_amount) : 0;
        promotionData.maximum_uses = formData.maximum_uses ? Number(formData.maximum_uses) : null;
        promotionData.current_uses = 0; // Initialize to 0 for new promotions
      }

      console.log('Attempting to save promotion:', promotionData);

      if (editingPromotion) {
        // Update existing promotion
        const { error } = await supabase
          .from('promotions')
          .update(promotionData)
          .eq('id', editingPromotion.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Promotion updated successfully",
        });
      } else {
        // Create new promotion
        const { error } = await supabase
          .from('promotions')
          .insert([promotionData]);

        if (error) throw error;

        toast({
          title: "Success", 
          description: "Promotion created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPromotions();
    } catch (error: any) {
      console.error('Error saving promotion:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save promotion",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (promotionId: number) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Promotion deleted successfully",
      });

      fetchPromotions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete promotion",
        variant: "destructive",
      });
    }
  };

  const getPromotionStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { status: 'upcoming', color: 'bg-blue-500' };
    } else if (now > end) {
      return { status: 'expired', color: 'bg-gray-500' };
    } else {
      return { status: 'active', color: 'bg-green-500' };
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Promotions Management</h1>
            <p className="text-muted-foreground">Manage general and partner promotions</p>
          </div>
        </div>

        <Tabs defaultValue="manage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Manage Promotions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Usage Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-6">
            <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Promotions Management</CardTitle>
                <CardDescription className="text-sm">View and manage hotel promotions and discounts</CardDescription>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Promotion
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading promotions...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => {
                    const { status, color } = getPromotionStatus(promotion.start_date, promotion.end_date);
                    return (
                      <TableRow key={promotion.id}>
                        <TableCell className="font-medium">{promotion.title}</TableCell>
                        <TableCell>
                          <Badge variant={promotion.promotion_type === 'partner' ? 'default' : 'secondary'}>
                            {promotion.promotion_type === 'partner' ? 'Partner' : 'General'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {promotion.promotion_type === 'partner' && promotion.partner_name ? promotion.partner_name : '-'}
                        </TableCell>
                        <TableCell>
                          {promotion.discount_type === 'fixed' && promotion.discount_amount !== undefined && promotion.discount_amount !== null
                            ? `$${Number(promotion.discount_amount).toFixed(2)} OFF`
                            : `${promotion.discount_percent}% OFF`}
                        </TableCell>
                        <TableCell>
                          {promotion.current_uses || 0}
                        </TableCell>
                        <TableCell>
                          {new Date(promotion.start_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(promotion.end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={color}>
                              {status}
                            </Badge>
                            {promotion.is_active === false && (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditDialog(promotion)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{promotion.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(promotion.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Promotion Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
              </DialogTitle>
              <DialogDescription>
                {editingPromotion ? 'Update promotion details below.' : 'Enter the details for the new promotion.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="promotion-type">Promotion Type</Label>
                <Select 
                  value={formData.promotion_type} 
                  onValueChange={(value: 'general' | 'partner') =>
                    setFormData(prev => ({
                      ...prev,
                      promotion_type: value,
                      partner_name: value === 'partner' ? prev.partner_name : '',
                      partner_contact_info: value === 'partner' ? prev.partner_contact_info : '',
                      maximum_uses: value === 'partner' ? prev.maximum_uses : ''
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select promotion type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Promotion</SelectItem>
                    <SelectItem value="partner">Partner Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Promotion Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={formData.promotion_type === 'partner' ? "e.g., TechCorp Employee Discount" : "e.g., Summer Sale"}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Short summary that staff and guests will see"
                  rows={3}
                />
              </div>

              {formData.promotion_type === 'partner' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="partner-name">Partner Name</Label>
                    <Input
                      id="partner-name"
                      value={formData.partner_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, partner_name: e.target.value }))}
                      placeholder="e.g., TechCorp"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="partner-contact">Partner Contact Info (optional)</Label>
                    <Input
                      id="partner-contact"
                      value={formData.partner_contact_info}
                      onChange={(e) => setFormData(prev => ({ ...prev, partner_contact_info: e.target.value }))}
                      placeholder="e.g., partnerships@techcorp.com"
                    />
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <Label htmlFor="discount-type">Discount Type</Label>
                <Select 
                  value={formData.discount_type} 
                  onValueChange={(value: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, discount_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%) Off</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($) Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.discount_type === 'percentage' ? (
                <div className="grid gap-2">
                  <Label htmlFor="discount-percent">Discount Percentage</Label>
                  <Input
                    id="discount-percent"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: e.target.value }))}
                    placeholder="e.g., 15"
                  />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="discount-amount">Discount Amount ($)</Label>
                  <Input
                    id="discount-amount"
                    type="number"
                    min="1"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                    placeholder="e.g., 50"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minimum-amount">Minimum Booking Amount ($)</Label>
                  <Input
                    id="minimum-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimum_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_amount: e.target.value }))}
                    placeholder="e.g., 200"
                  />
                </div>

                {formData.promotion_type === 'partner' && (
                  <div className="grid gap-2">
                    <Label htmlFor="maximum-uses">Maximum Uses (optional)</Label>
                    <Input
                      id="maximum-uses"
                      type="number"
                      min="1"
                      value={formData.maximum_uses}
                      onChange={(e) => setFormData(prev => ({ ...prev, maximum_uses: e.target.value }))}
                      placeholder="Leave blank for unlimited"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 p-3">
                <div>
                  <Label htmlFor="is-active" className="text-base">Active Promotion</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle off to pause this promotion without deleting it
                  </p>
                </div>
                <Switch
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </TabsContent>

          <TabsContent value="analytics">
            <PartnerPromotionUsageReport />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}