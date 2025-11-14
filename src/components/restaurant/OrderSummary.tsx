
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Trash2, CheckCircle, CreditCard, Banknote, Smartphone, Building2, Wallet } from 'lucide-react';
import { MenuItem, RestaurantTable } from '@/types/restaurant';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';

interface OrderItem {
  menu_item_id: number;
  menu_item: MenuItem;
  quantity: number;
  notes?: string;
}

interface OrderSummaryProps {
  orderItems: OrderItem[];
  selectedTable: RestaurantTable | null;
  paymentMethod: string;
  onUpdateQuantity: (menuItemId: number, newQuantity: number) => void;
  onRemoveItem: (menuItemId: number) => void;
  onUpdateNotes: (menuItemId: number, notes: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onSubmitOrder: () => void;
  calculateTotal: () => number;
  submitting: boolean;
}

export default function OrderSummary({
  orderItems,
  selectedTable,
  paymentMethod,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onPaymentMethodChange,
  onSubmitOrder,
  calculateTotal,
  submitting
}: OrderSummaryProps) {
  const { paymentMethods, loading: paymentMethodsLoading } = usePaymentMethods();
  const total = calculateTotal();

  // Map icon names to Lucide icons
  const getIcon = (iconName: string | null) => {
    if (!iconName) return Wallet;
    const iconMap: Record<string, any> = {
      'banknote': Banknote,
      'credit-card': CreditCard,
      'smartphone': Smartphone,
      'building-2': Building2,
      'wallet': Wallet,
    };
    return iconMap[iconName] || Wallet;
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        {selectedTable && (
          <div className="text-sm text-gray-600">
            Table {selectedTable.table_number} • {selectedTable.location_description}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {orderItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No items in order
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {orderItems.map((item) => (
                <div key={item.menu_item_id} className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{item.menu_item.name}</div>
                      <div className="text-sm text-gray-600">
                        ${item.menu_item.price.toFixed(2)} each
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.menu_item_id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.menu_item_id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.menu_item_id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="font-medium">
                      ${(item.menu_item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${item.menu_item_id}`} className="text-sm">
                      Special Instructions
                    </Label>
                    <Textarea
                      id={`notes-${item.menu_item_id}`}
                      placeholder="Add any special instructions..."
                      value={item.notes || ''}
                      onChange={(e) => onUpdateNotes(item.menu_item_id, e.target.value)}
                      className="text-sm"
                      rows={2}
                    />
                  </div>

                  <Separator />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Method</Label>
                {paymentMethodsLoading ? (
                  <div className="w-full p-2 border rounded-lg text-muted-foreground text-sm">
                    Loading payment methods...
                  </div>
                ) : (
                  <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => {
                        const IconComponent = getIcon(method.icon_name);
                        return (
                          <SelectItem key={method.id} value={method.code}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {method.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button
                onClick={onSubmitOrder}
                disabled={!selectedTable || orderItems.length === 0 || submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Order...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Create Order
                  </>
                )}
              </Button>

              {!selectedTable && (
                <p className="text-sm text-red-600 text-center">
                  Please select a table to continue
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
