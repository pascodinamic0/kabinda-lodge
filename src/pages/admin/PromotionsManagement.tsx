import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Promotions Management</h1>
            <p className="text-muted-foreground">Manage offers and promotions</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Active Promotions</CardTitle>
                <CardDescription>Manage special offers and discounts</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Promotion
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
                        <TableCell className="max-w-xs truncate">
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
      </main>
    </div>
  );
}