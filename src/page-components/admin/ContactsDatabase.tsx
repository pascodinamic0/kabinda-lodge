import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Download, Search, Users, Phone, Mail, Building2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import * as XLSX from 'xlsx';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string[];
  last_seen: string;
}

export default function ContactsDatabase() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchTerm]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const contactMap = new Map<string, Contact>();

      // Fetch Staff to exclude
      const { data: staffUsers, error: staffError } = await supabase
        .from('users')
        .select('email, phone')
        .neq('role', 'Guest');
      
      if (staffError) {
        console.error('Error fetching staff:', staffError);
      }

      const staffEmails = new Set((staffUsers || []).map(u => u.email?.toLowerCase()).filter(Boolean));
      const staffPhones = new Set((staffUsers || []).map(u => u.phone).filter(Boolean));

      // Helper to add/merge contacts
      const addContact = (
        name: string | null,
        email: string | null,
        phone: string | null,
        company: string | null,
        source: string,
        date: string
      ) => {
        if (!name && !email && !phone) return;
        
        // Exclude staff
        if (email && staffEmails.has(email.toLowerCase())) return;
        if (phone && staffPhones.has(phone)) return;
        
        // Key generation: prioritize email, then phone, then name (with fallback)
        let key = email?.toLowerCase();
        if (!key && phone) key = `phone:${phone}`;
        if (!key && name) key = `name:${name.toLowerCase()}`;
        if (!key) return; // Should not happen given check above

        const existing = contactMap.get(key);
        
        if (existing) {
          // Merge data
          existing.name = existing.name || name || 'Unknown';
          existing.email = existing.email || email;
          existing.phone = existing.phone || phone;
          existing.company = existing.company || company;
          if (!existing.source.includes(source)) existing.source.push(source);
          if (new Date(date) > new Date(existing.last_seen)) existing.last_seen = date;
          contactMap.set(key, existing);
        } else {
          contactMap.set(key, {
            id: key,
            name: name || 'Unknown',
            email: email,
            phone: phone,
            company: company,
            source: [source],
            last_seen: date
          });
        }
      };

      // Fetch from Users (Guests only)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('name, email, phone, created_at')
        .eq('role', 'Guest');
      
      if (usersError) console.error('Error fetching users:', usersError);
      users?.forEach(u => addContact(u.name, u.email, u.phone, null, 'Guest Account', u.created_at));

      // Fetch from Bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('guest_name, guest_email, guest_phone, created_at');

      if (bookingsError) console.error('Error fetching bookings:', bookingsError);
      bookings?.forEach(b => addContact(b.guest_name, b.guest_email, b.guest_phone, null, 'Room Booking', b.created_at));

      // Fetch from Conference Bookings
      const { data: confBookings, error: confError } = await supabase
        .from('conference_bookings')
        .select('guest_name, guest_email, guest_phone, guest_company, created_at');

      if (confError) console.error('Error fetching conference bookings:', confError);
      confBookings?.forEach(b => addContact(b.guest_name, b.guest_email, b.guest_phone, b.guest_company, 'Conference', b.created_at || new Date().toISOString()));

      // Fetch from Dining Reservations
      const { data: dining, error: diningError } = await supabase
        .from('dining_reservations')
        .select('guest_name, guest_email, guest_phone, created_at');

      if (diningError) console.error('Error fetching dining reservations:', diningError);
      dining?.forEach(d => addContact(d.guest_name, d.guest_email, d.guest_phone, null, 'Dining', d.created_at || new Date().toISOString()));

      const sortedContacts = Array.from(contactMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      setContacts(sortedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    if (!searchTerm) {
      setFilteredContacts(contacts);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = contacts.filter(contact => 
      contact.name.toLowerCase().includes(term) ||
      (contact.email && contact.email.toLowerCase().includes(term)) ||
      (contact.phone && contact.phone.includes(term)) ||
      (contact.company && contact.company.toLowerCase().includes(term))
    );
    setFilteredContacts(filtered);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredContacts.map(contact => ({
      Name: contact.name,
      Email: contact.email || '',
      Phone: contact.phone || '',
      Company: contact.company || '',
      'Sources': contact.source.join(', '),
      'Last Seen': new Date(contact.last_seen).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    
    // Auto-width columns
    const max_width = dataToExport.reduce((w, r) => Math.max(w, r.Name.length), 10);
    worksheet["!cols"] = [ { wch: max_width } ];

    XLSX.writeFile(workbook, "Kabinda_Lodge_Contacts.xlsx");
    
    toast({
      title: "Export Successful",
      description: `Exported ${filteredContacts.length} contacts to Excel`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Contacts Database
                </CardTitle>
                <CardDescription>
                  Comprehensive database of all guests and contacts across the system
                </CardDescription>
              </div>
              <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Last Seen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {contact.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {contact.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {contact.email}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {contact.phone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.company && (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                {contact.company}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {contact.source.map((s, i) => (
                                <span key={i} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {new Date(contact.last_seen).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No contacts found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredContacts.length} of {contacts.length} total contacts
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
