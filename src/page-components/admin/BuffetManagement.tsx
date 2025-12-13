import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BuffetModal from '@/components/admin/BuffetModal';

interface BuffetOption {
  id: number;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  created_at: string;
}

export default function BuffetManagement() {
  const { toast } = useToast();
  const [buffets, setBuffets] = useState<BuffetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuffet, setSelectedBuffet] = useState<BuffetOption | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBuffets();
  }, []);

  const fetchBuffets = async () => {
    try {
      const { data, error } = await supabase
        .from('buffet_options')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setBuffets(data || []);
    } catch (error: any) {
      console.error('Error fetching buffet options:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch buffet options. The database table might be missing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBuffet = () => {
    setSelectedBuffet(null);
    setIsModalOpen(true);
  };

  const handleEditBuffet = (buffet: BuffetOption) => {
    setSelectedBuffet(buffet);
    setIsModalOpen(true);
  };

  const handleDeleteBuffet = async (id: number) => {
    try {
      const { error } = await supabase
        .from('buffet_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Buffet option deleted successfully",
      });

      fetchBuffets();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete buffet option",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Buffet Management</h1>
            <p className="text-muted-foreground">Manage buffet service packages and pricing</p>
          </div>
          <Button onClick={handleAddBuffet}>
            <Plus className="h-4 w-4 mr-2" />
            Add Buffet Option
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buffet Options</CardTitle>
            <CardDescription>Available buffet packages for conference bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading buffet options...</div>
              </div>
            ) : buffets.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">No buffet options found</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price ($)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buffets.map((buffet) => (
                    <TableRow key={buffet.id}>
                      <TableCell className="font-medium">{buffet.name}</TableCell>
                      <TableCell className="max-w-md truncate" title={buffet.description || ''}>
                        {buffet.description || '-'}
                      </TableCell>
                      <TableCell>${buffet.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {buffet.is_available ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Available
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" /> Unavailable
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditBuffet(buffet)}
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
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the buffet option
                                  "{buffet.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteBuffet(buffet.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <BuffetModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBuffet(null);
          }}
          onSuccess={fetchBuffets}
          buffet={selectedBuffet}
        />
      </div>
    </DashboardLayout>
  );
}
