
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { MenuItem } from '@/types/restaurant';

interface MenuItemsListProps {
  menuItems: MenuItem[];
  onAddToOrder: (menuItem: MenuItem, quantity?: number) => void;
}

export default function MenuItemsList({ menuItems, onAddToOrder }: MenuItemsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Menu Items</CardTitle>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="max-h-96 overflow-y-auto space-y-4">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category}>
            {selectedCategory === 'All' && (
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">
                {category}
              </h3>
            )}
            
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-semibold text-primary">
                          ${item.price.toFixed(2)}
                        </span>
                        {!item.is_available && (
                          <Badge variant="secondary">Unavailable</Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => onAddToOrder(item)}
                      disabled={!item.is_available}
                      className="ml-4"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No menu items found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
