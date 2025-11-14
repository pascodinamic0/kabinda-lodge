import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClockIcon, CheckCircle, XCircle, Package } from 'lucide-react';
import { Order } from '@/types/order';

interface OrderStatusCardsProps {
  orders: Order[];
}

export default function OrderStatusCards({ orders }: OrderStatusCardsProps) {
  const pendingCount = orders.filter(order => order.status === 'pending').length;
  const confirmedCount = orders.filter(order => order.status === 'confirmed').length;
  const completedCount = orders.filter(order => order.status === 'completed').length;
  const cancelledCount = orders.filter(order => order.status === 'cancelled').length;

  const statusCards = [
    {
      title: 'Pending Orders',
      count: pendingCount,
      icon: ClockIcon,
      gradient: 'from-warning/10 to-warning/5',
      iconColor: 'text-warning',
      description: 'Awaiting confirmation'
    },
    {
      title: 'Confirmed Orders',
      count: confirmedCount,
      icon: CheckCircle,
      gradient: 'from-primary/10 to-primary/5',
      iconColor: 'text-primary',
      description: 'Ready for preparation'
    },
    {
      title: 'Completed Orders',
      count: completedCount,
      icon: Package,
      gradient: 'from-success/10 to-success/5',
      iconColor: 'text-success',
      description: 'Successfully delivered'
    },
    {
      title: 'Cancelled Orders',
      count: cancelledCount,
      icon: XCircle,
      gradient: 'from-destructive/10 to-destructive/5',
      iconColor: 'text-destructive',
      description: 'Declined orders'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statusCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <Card key={card.title} className={`bg-gradient-to-br ${card.gradient} border-border/50`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground/80">
                {card.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {card.count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}