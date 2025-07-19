import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  UserPlus, 
  Eye, 
  Edit, 
  Phone, 
  Mail,
  Calendar,
  MapPin 
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  activeBookings: number;
  totalBookings: number;
  lastStay?: string;
}

export default function GuestManagement() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      
      // Get all users with guest role and their booking info
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, phone, created_at')
        .eq('role', 'Guest');

      if (usersError) throw usersError;

      // Get booking counts for each guest
      const guestData = await Promise.all(
        users.map(async (user) => {
          const { data: bookings } = await supabase
            .from('bookings')
            .select('id, status, start_date, end_date')
            .eq('user_id', user.id);

          const activeBookings = bookings?.filter(b => 
            b.status === 'booked' && 
            new Date(b.end_date) >= new Date()
          ).length || 0;

          const lastBooking = bookings?.sort((a, b) => 
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          )[0];

          return {
            ...user,
            activeBookings,
            totalBookings: bookings?.length || 0,
            lastStay: lastBooking ? lastBooking.start_date : undefined
          };
        })
      );

      setGuests(guestData);
    } catch (error) {
      console.error('Error fetching guests:', error);
      toast({
        title: "Error",
        description: "Failed to load guest data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone?.includes(searchTerm)
  );

  const getGuestStatus = (guest: Guest) => {
    if (guest.activeBookings > 0) return { label: 'Active Guest', variant: 'default' as const };
    if (guest.totalBookings > 0) return { label: 'Previous Guest', variant: 'secondary' as const };
    return { label: 'New Guest', variant: 'outline' as const };
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Guest Management</h1>
          <p className="text-muted-foreground">Manage guest profiles and view booking history</p>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search guests by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Guest
          </Button>
        </div>

        {/* Guests List */}
        <div className="grid gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredGuests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No guests found matching your search.</p>
              </CardContent>
            </Card>
          ) : (
            filteredGuests.map((guest) => {
              const status = getGuestStatus(guest);
              return (
                <Card key={guest.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {guest.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">{guest.name}</h3>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{guest.email}</span>
                            </div>
                            {guest.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{guest.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {guest.totalBookings} booking{guest.totalBookings !== 1 ? 's' : ''}
                                {guest.lastStay && ` • Last: ${new Date(guest.lastStay).toLocaleDateString()}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}