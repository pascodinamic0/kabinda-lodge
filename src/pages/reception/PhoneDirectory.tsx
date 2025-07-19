import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Search, 
  Users, 
  MapPin,
  Clock,
  Utensils,
  Car,
  Wifi,
  Shield,
  Wrench
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Contact {
  id: string;
  name: string;
  department: string;
  phone: string;
  extension?: string;
  location: string;
  hours?: string;
  description?: string;
  category: string;
}

const contacts: Contact[] = [
  // Hotel Departments
  {
    id: '1',
    name: 'Front Desk',
    department: 'Reception',
    phone: '+1 (555) 123-4567',
    extension: '0',
    location: 'Main Lobby',
    hours: '24/7',
    description: 'Guest check-in/out, general inquiries',
    category: 'hotel'
  },
  {
    id: '2',
    name: 'Housekeeping',
    department: 'Housekeeping',
    phone: '+1 (555) 123-4568',
    extension: '201',
    location: 'Service Floor',
    hours: '6:00 AM - 10:00 PM',
    description: 'Room cleaning, maintenance requests',
    category: 'hotel'
  },
  {
    id: '3',
    name: 'Security',
    department: 'Security',
    phone: '+1 (555) 123-4569',
    extension: '911',
    location: 'Security Office',
    hours: '24/7',
    description: 'Emergency response, safety concerns',
    category: 'hotel'
  },
  {
    id: '4',
    name: 'Maintenance',
    department: 'Maintenance',
    phone: '+1 (555) 123-4570',
    extension: '301',
    location: 'Basement Level',
    hours: '7:00 AM - 11:00 PM',
    description: 'Technical issues, repairs',
    category: 'hotel'
  },
  // Dining
  {
    id: '5',
    name: 'Main Restaurant',
    department: 'Dining',
    phone: '+1 (555) 123-4571',
    extension: '401',
    location: 'Ground Floor',
    hours: '6:00 AM - 11:00 PM',
    description: 'Table reservations, room service',
    category: 'dining'
  },
  {
    id: '6',
    name: 'Bar & Lounge',
    department: 'Dining',
    phone: '+1 (555) 123-4572',
    extension: '402',
    location: 'Ground Floor',
    hours: '2:00 PM - 2:00 AM',
    description: 'Drinks, light snacks',
    category: 'dining'
  },
  // Services
  {
    id: '7',
    name: 'Concierge',
    department: 'Guest Services',
    phone: '+1 (555) 123-4573',
    extension: '501',
    location: 'Main Lobby',
    hours: '6:00 AM - 10:00 PM',
    description: 'Tours, recommendations, bookings',
    category: 'services'
  },
  {
    id: '8',
    name: 'Valet Parking',
    department: 'Transportation',
    phone: '+1 (555) 123-4574',
    extension: '601',
    location: 'Main Entrance',
    hours: '24/7',
    description: 'Car parking, retrieval',
    category: 'services'
  },
  {
    id: '9',
    name: 'Business Center',
    department: 'Business Services',
    phone: '+1 (555) 123-4575',
    extension: '701',
    location: '2nd Floor',
    hours: '6:00 AM - 10:00 PM',
    description: 'Printing, internet, meeting rooms',
    category: 'services'
  },
  // Emergency
  {
    id: '10',
    name: 'Emergency Services',
    department: 'Emergency',
    phone: '911',
    location: 'External',
    hours: '24/7',
    description: 'Police, Fire, Medical Emergency',
    category: 'emergency'
  },
  {
    id: '11',
    name: 'Local Hospital',
    department: 'Medical',
    phone: '+1 (555) 999-8888',
    location: '2 miles away',
    hours: '24/7',
    description: 'St. Mary\'s General Hospital',
    category: 'emergency'
  }
];

const categories = [
  { value: 'all', label: 'All Contacts', icon: Phone },
  { value: 'hotel', label: 'Hotel Departments', icon: Users },
  { value: 'dining', label: 'Dining & Bar', icon: Utensils },
  { value: 'services', label: 'Guest Services', icon: Wifi },
  { value: 'emergency', label: 'Emergency', icon: Shield }
];

export default function PhoneDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         contact.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const categoryInfo = categories.find(cat => cat.value === category);
    return categoryInfo?.icon || Phone;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      hotel: 'bg-blue-100 text-blue-800',
      dining: 'bg-green-100 text-green-800',
      services: 'bg-purple-100 text-purple-800',
      emergency: 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Phone Directory</h1>
          <p className="text-muted-foreground">Hotel contacts and emergency numbers</p>
        </div>

        {/* Category Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.value;
            return (
              <Button
                key={category.value}
                variant={isActive ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.value)}
                className="flex items-center gap-2 h-auto p-4"
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">{category.label}</p>
                  <p className="text-xs opacity-70">
                    {contacts.filter(c => category.value === 'all' || c.category === category.value).length} contacts
                  </p>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, department, phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No contacts found matching your search criteria.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const CategoryIcon = getCategoryIcon(contact.category);
              return (
                <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CategoryIcon className="h-5 w-5" />
                          {contact.name}
                        </CardTitle>
                        <CardDescription>{contact.department}</CardDescription>
                      </div>
                      <Badge className={getCategoryColor(contact.category)}>
                        {contact.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Phone Number */}
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">{contact.phone}</span>
                        {contact.extension && (
                          <Badge variant="outline" className="text-xs">
                            Ext. {contact.extension}
                          </Badge>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => window.open(`tel:${contact.phone}`)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Call
                      </Button>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{contact.location}</span>
                      </div>
                      
                      {contact.hours && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{contact.hours}</span>
                        </div>
                      )}
                      
                      {contact.description && (
                        <p className="text-muted-foreground mt-2 text-xs bg-muted p-2 rounded">
                          {contact.description}
                        </p>
                      )}
                    </div>

                    {/* Emergency Highlight */}
                    {contact.category === 'emergency' && (
                      <div className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                        <p className="text-red-800 text-sm font-medium">
                          For immediate emergencies only
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Quick Reference */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Quick Emergency Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 border-l-4 border-red-500 bg-red-50">
                <p className="font-semibold text-red-800">Medical Emergency</p>
                <p className="text-red-700">Call 911 immediately</p>
              </div>
              <div className="p-3 border-l-4 border-orange-500 bg-orange-50">
                <p className="font-semibold text-orange-800">Security Issues</p>
                <p className="text-orange-700">Extension 911 or Front Desk</p>
              </div>
              <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                <p className="font-semibold text-blue-800">General Help</p>
                <p className="text-blue-700">Front Desk Extension 0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}