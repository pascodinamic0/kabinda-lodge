import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Promotion {
  id: number;
  title: string;
  description: string | null;
  discount_percent: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function PromotionsManagement() {
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
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
      toast({
        title: "Error",
        description: "Failed to fetch promotions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Promotions Management</CardTitle>
                <CardDescription className="text-sm">View and manage hotel promotions and discounts</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4" />
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
                    <TableHead>Discount</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => {
                    const { status, color } = getPromotionStatus(promotion.start_date, promotion.end_date);
                    return (
                      <TableRow key={promotion.id}>
                        <TableCell className="font-medium">{promotion.title}</TableCell>
                        <TableCell>{promotion.discount_percent}% OFF</TableCell>
                        <TableCell>
                          {new Date(promotion.start_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(promotion.end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={color}>
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {promotion.description || 'No description'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      </div>
    </DashboardLayout>
  );
}