import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Plus, KeyRound, Clock, Ban } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface KeyCard {
  id: string;
  card_number: string;
  room_id?: number;
  guest_id?: string;
  status: string;
  issued_at?: string;
  expires_at?: string;
  created_at: string;
}

interface Room {
  id: number;
  name: string;
}

interface Guest {
  id: string;
  name: string;
  email: string;
}

const statusOptions = [
  { value: 'inactive', label: 'Inactive', variant: 'outline' as const },
  { value: 'active', label: 'Active', variant: 'default' as const },
  { value: 'expired', label: 'Expired', variant: 'secondary' as const },
  { value: 'deactivated', label: 'Deactivated', variant: 'destructive' as const }
];

const KeyCardManagement = () => {
  const { toast } = useToast();
  const [keyCards, setKeyCards] = useState<KeyCard[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showNewCardDialog, setShowNewCardDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KeyCard | null>(null);
  
  const [newCard, setNewCard] = useState({
    card_number: ''
  });

  const [issueData, setIssueData] = useState({
    room_id: '',
    guest_id: '',
    days: 1
  });

  useEffect(() => {
    fetchKeyCards();
    fetchRooms();
    fetchGuests();
  }, []);

  const fetchKeyCards = async () => {
    try {
      const { data, error } = await supabase
        .from('key_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeyCards(data || []);
    } catch (error) {
      console.error('Error fetching key cards:', error);
      toast({
        title: "Error",
        description: "Failed to load key cards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchGuests = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'Guest')
        .order('name');

      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error('Error fetching guests:', error);
    }
  };

  const generateCardNumber = () => {
    return Math.random().toString().slice(2, 10).padStart(8, '0');
  };

  const handleCreateCard = async () => {
    const cardNumber = newCard.card_number || generateCardNumber();

    try {
      const { error } = await supabase
        .from('key_cards')
        .insert({
          card_number: cardNumber,
          status: 'inactive'
        });

      if (error) throw error;

      setNewCard({ card_number: '' });
      setShowNewCardDialog(false);
      fetchKeyCards();
      
      toast({
        title: "Success",
        description: "Key card created successfully",
      });
    } catch (error) {
      console.error('Error creating key card:', error);
      toast({
        title: "Error",
        description: "Failed to create key card",
        variant: "destructive",
      });
    }
  };

  const handleIssueCard = async () => {
    if (!selectedCard || !issueData.room_id || !issueData.guest_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const issuedAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + issueData.days);

      const { error } = await supabase
        .from('key_cards')
        .update({
          room_id: parseInt(issueData.room_id),
          guest_id: issueData.guest_id,
          status: 'active',
          issued_at: issuedAt.toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .eq('id', selectedCard.id);

      if (error) throw error;

      setIssueData({ room_id: '', guest_id: '', days: 1 });
      setShowIssueDialog(false);
      setSelectedCard(null);
      fetchKeyCards();
      
      toast({
        title: "Success",
        description: "Key card issued successfully",
      });
    } catch (error) {
      console.error('Error issuing key card:', error);
      toast({
        title: "Error",
        description: "Failed to issue key card",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('key_cards')
        .update({
          status: 'deactivated',
          room_id: null,
          guest_id: null,
          expires_at: null
        })
        .eq('id', cardId);

      if (error) throw error;

      fetchKeyCards();
      toast({
        title: "Success",
        description: "Key card deactivated",
      });
    } catch (error) {
      console.error('Error deactivating key card:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate key card",
        variant: "destructive",
      });
    }
  };

  const filteredCards = keyCards.filter(card => {
    if (filter === 'all') return true;
    return card.status === filter;
  });

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getRoomName = (roomId?: number) => {
    if (!roomId) return 'Not assigned';
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : `Room ${roomId}`;
  };

  const getGuestName = (guestId?: string) => {
    if (!guestId) return 'Not assigned';
    const guest = guests.find(g => g.id === guestId);
    return guest ? guest.name : 'Unknown Guest';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading key cards...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate stats
  const inactiveCards = keyCards.filter(c => c.status === 'inactive').length;
  const activeCards = keyCards.filter(c => c.status === 'active').length;
  const expiredCards = keyCards.filter(c => c.status === 'expired').length;
  const deactivatedCards = keyCards.filter(c => c.status === 'deactivated').length;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Key Card Management</h1>
          <p className="text-muted-foreground mt-2">Manage room key cards and access control</p>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Cards</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inactiveCards}</div>
              <p className="text-xs text-muted-foreground">Ready to issue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCards}</div>
              <p className="text-xs text-muted-foreground">Currently in use</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Cards</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredCards}</div>
              <p className="text-xs text-muted-foreground">Need renewal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deactivated</CardTitle>
              <Ban className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{deactivatedCards}</div>
              <p className="text-xs text-muted-foreground">Blocked cards</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cards</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showNewCardDialog} onOpenChange={setShowNewCardDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Key Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Key Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Card Number (Optional)</label>
                  <Input
                    value={newCard.card_number}
                    onChange={(e) => setNewCard({...newCard, card_number: e.target.value})}
                    placeholder="Leave empty to auto-generate"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If left empty, a card number will be automatically generated
                  </p>
                </div>

                <Button onClick={handleCreateCard} className="w-full">
                  Create Key Card
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Key Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No key cards found</h3>
                <p className="text-muted-foreground mb-4">
                  {filter === 'all' 
                    ? "No key cards have been created yet." 
                    : `No cards with status "${filter}" found.`}
                </p>
                <Dialog open={showNewCardDialog} onOpenChange={setShowNewCardDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Card
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            filteredCards.map((card) => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      #{card.card_number}
                    </CardTitle>
                    <Badge variant={getStatusInfo(card.status).variant}>
                      {getStatusInfo(card.status).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Room: </span>
                      {getRoomName(card.room_id)}
                    </div>
                    <div>
                      <span className="font-medium">Guest: </span>
                      {getGuestName(card.guest_id)}
                    </div>
                    {card.issued_at && (
                      <div>
                        <span className="font-medium">Issued: </span>
                        {new Date(card.issued_at).toLocaleDateString()}
                      </div>
                    )}
                    {card.expires_at && (
                      <div>
                        <span className="font-medium">Expires: </span>
                        {new Date(card.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    {card.status === 'inactive' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCard(card);
                          setShowIssueDialog(true);
                        }}
                      >
                        <KeyRound className="h-4 w-4 mr-1" />
                        Issue
                      </Button>
                    )}
                    {card.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeactivateCard(card.id)}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Deactivate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Issue Key Card #{selectedCard?.card_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Room *</label>
                <Select 
                  value={issueData.room_id} 
                  onValueChange={(value) => setIssueData({...issueData, room_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.id.toString()}>{room.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Guest *</label>
                <Select 
                  value={issueData.guest_id} 
                  onValueChange={(value) => setIssueData({...issueData, guest_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select guest" />
                  </SelectTrigger>
                  <SelectContent>
                    {guests.map(guest => (
                      <SelectItem key={guest.id} value={guest.id}>{guest.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Valid for (days)</label>
                <Input
                  type="number"
                  value={issueData.days}
                  onChange={(e) => setIssueData({...issueData, days: parseInt(e.target.value) || 1})}
                  min="1"
                  max="30"
                />
              </div>

              <Button onClick={handleIssueCard} className="w-full">
                Issue Key Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KeyCardManagement;