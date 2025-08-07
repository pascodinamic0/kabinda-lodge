import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2 } from 'lucide-react';

export interface FloatingCartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface FloatingCartProps {
  items: FloatingCartItem[];
  onCheckout: () => void;
  onClear: () => void;
}

export default function FloatingCart({ items, onCheckout, onClear }: FloatingCartProps) {
  if (!items || items.length === 0) return null;

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="shadow-elegant w-[320px]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="font-semibold">Cart</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {totalItems} item{totalItems !== 1 ? 's' : ''} • Subtotal ${subtotal.toFixed(2)}
          </div>

          <Separator />

          <div className="max-h-40 overflow-y-auto space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="line-clamp-1">{item.name} × {item.quantity}</span>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={onCheckout}>
            Proceed to Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
