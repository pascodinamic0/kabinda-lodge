import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Bed, 
  Calendar, 
  UtensilsCrossed, 
  BarChart3, 
  Gift,
  CreditCard,
  Settings,
  LayoutDashboard,
  Database,
  Activity,

  Zap,
  UserCheck,
  Receipt,
  Upload,
  Download,
  ShoppingCart,
  Printer,
  CheckCircle,
  MessageSquare,
  Wrench,
  Package,
  Phone,
  Hotel,
  MapPin,
  Star,
  Table,
  Shield,
  AlertTriangle,
  Trash2,
  Presentation,
  Mail,
} from 'lucide-react';
import { FileText } from 'lucide-react';
import { NotificationData } from '../../types/common';

interface SidebarItem {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string;
}

interface SidebarGroup {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items: SidebarItem[];
}

export default function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  // Database reset state
  const [resetLoading, setResetLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);

  const currentPath = location.pathname;

  // Complete database reset function
  const handleDatabaseReset = async () => {
    if (confirmText !== 'RESET') {
      toast({
        title: t('reset.invalid_confirmation', 'Invalid Confirmation'),
        description: t('reset.invalid_text', 'Please type "RESET" exactly to confirm the complete reset'),
        variant: "destructive"
      });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.rpc('complete_data_reset');
      
      if (error) {
        throw error;
      }

      toast({
        title: t('reset.success', 'Complete Reset Successful'),
        description: t('reset.success_text', 'All historical data has been wiped from the system. All rooms, tables, and conference rooms have been reset to available status.'),
        variant: "default"
      });
      
      // Close dialog and reset confirmation text
      setShowResetDialog(false);
      setConfirmText('');
      
    } catch (error) {
      console.error('Error resetting database:', error);
      toast({
        title: t('reset.failed', 'Reset Failed'),
        description: t('reset.failed_text', error instanceof Error ? error.message : 'Failed to complete data reset. Please try again.'),
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };

  // Get sidebar items based on user role
  const getSidebarItems = () => {
    
    if (userRole === 'SuperAdmin') {
      return [
        {
          title: 'Dashboard',
          icon: Shield,
          path: '/kabinda-lodge/super-admin',
        },
        {
          title: 'User Management',
          icon: Users,
          items: [
            { title: 'All Users', icon: Users, path: '/kabinda-lodge/admin/users' },
          ]
        },
        {
          title: 'System Control',
          icon: Shield,
          items: [
            { title: 'Room Overrides', icon: Bed, path: '/kabinda-lodge/admin/rooms' },
            { title: 'Payment Settings', icon: CreditCard, path: '/kabinda-lodge/admin/payment-management' },
          ]
        },
        {
          title: 'Analytics',
          icon: BarChart3,
          items: [
            { title: 'System Reports', icon: BarChart3, path: '/kabinda-lodge/admin/reports' },
            { title: 'Email Settings', icon: Mail, path: '/kabinda-lodge/admin/email-settings' },
          ]
        },
        {
          title: 'Reset Area',
          icon: AlertTriangle,
          items: [
            { title: 'Reset Data', icon: AlertTriangle, path: '/kabinda-lodge/super-admin' },
          ]
        }
      ];
    } else if (userRole === 'Admin') {
      return [
        {
          title: 'Dashboard',
          icon: LayoutDashboard,
          path: '/kabinda-lodge/admin',
        },
        {
          title: 'Core Management',
          icon: Database,
          items: [
            { title: 'Rooms', icon: Bed, path: '/kabinda-lodge/admin/rooms' },
            { title: 'Conference Rooms', icon: Presentation, path: '/kabinda-lodge/admin/conference-rooms' },
          ]
        },
        {
          title: 'Operations',
          icon: Activity,
          items: [
            { title: 'Bookings', icon: Calendar, path: '/kabinda-lodge/admin/bookings' },
            { title: 'Payments', icon: CreditCard, path: '/kabinda-lodge/admin/payments' },
          ]
        },
        {
          title: 'Restaurant',
          icon: UtensilsCrossed,
          items: [
            { title: 'Menu', icon: UtensilsCrossed, path: '/kabinda-lodge/admin/menu' },
            { title: 'Restaurant Tables', icon: Table, path: '/kabinda-lodge/admin/restaurant-tables' },
          ]
        },
        {
          title: 'System',
          icon: Database,
          items: [
            { title: 'Promotions', icon: Gift, path: '/kabinda-lodge/admin/promotions' },
            { title: 'Content', icon: FileText, path: '/kabinda-lodge/admin/content' },
          ]
        }
      ];
    } else if (userRole === 'Receptionist') {
      
      return [
        {
          title: 'Dashboard',
          icon: LayoutDashboard,
          path: '/kabinda-lodge/reception',
        },
        {
          title: 'Booking Process',
          icon: Calendar,
          items: [
            { title: 'New Room Booking', icon: Calendar, path: '/kabinda-lodge/room-selection' },
            { title: 'Conference Rooms', icon: Hotel, path: '/kabinda-lodge/reception/conference-selection' },
            { title: 'Payment Verification', icon: CreditCard, path: '/kabinda-lodge/reception/payment-verification' },
          ]
        },
        {
          title: 'Guest Services',
          icon: MessageSquare,
          items: [
            { title: 'Lost & Found', icon: Package, path: '/kabinda-lodge/reception/lost-found' },
            { title: 'Review Management', icon: Star, path: '/kabinda-lodge/reception/reviews' },
          ]
        },
      ];
    } else if (userRole === 'RestaurantLead') {
      return [
        {
          title: 'Dashboard',
          icon: LayoutDashboard,
          path: '/kabinda-lodge/restaurant-dashboard',
        },
        {
          title: 'Quick Actions',
          icon: Zap,
          items: [
            { title: 'New Order', icon: ShoppingCart, path: '/kabinda-lodge/restaurant/order' },
            { title: 'Manage Orders', icon: CheckCircle, path: '/kabinda-lodge/restaurant/orders' },
            { title: 'Table Management', icon: Table, path: '/kabinda-lodge/restaurant/tables' },
          ]
        },
        {
          title: 'Menu',
          icon: UtensilsCrossed,
          items: [
            { title: 'Menu Editor', icon: UtensilsCrossed, path: '/kabinda-lodge/restaurant/menu' },
            { title: 'Promotions', icon: Gift, path: '/kabinda-lodge/restaurant/promotions' },
          ]
        },

        {
          title: 'Orders',
          icon: ShoppingCart,
          items: [
          ]
        },
        {
          title: 'Analytics',
          icon: BarChart3,
          items: [
            { title: 'Sales Analytics', icon: BarChart3, path: '/kabinda-lodge/restaurant/analytics' },
          ]
        }
      ];
    }
    
    return [];
  };

  const sidebarItems = getSidebarItems();

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-sm">Kabinda Lodge</h2>
              <p className="text-xs text-muted-foreground">
                {userRole === 'SuperAdmin' ? 'Super Admin' :
                 userRole === 'Admin' ? 'Admin Panel' : 
                 userRole === 'Receptionist' ? 'Reception' : 
                 'Restaurant'}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {sidebarItems.map((item: SidebarItem | SidebarGroup) => {
            if ('items' in item && item.items) {
              return (
                <SidebarGroup key={item.title}>
                  <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {item.title}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {('items' in item ? item.items : []).map((subItem: SidebarItem) => (
                        <SidebarMenuItem key={subItem.title}>
                          <SidebarMenuButton
                            onClick={() => {
                              if (subItem.title === 'Reset Data') {
                                setShowResetDialog(true);
                              } else {
                                navigate(subItem.path);
                              }
                            }}
                            className={`hover:bg-accent/50 ${isActive(subItem.path) ? 'bg-accent text-accent-foreground' : ''} ${subItem.title === 'Reset Data' ? 'text-red-600 hover:text-red-700 hover:bg-red-50 bg-red-100' : ''}`}
                          >
                            <subItem.icon className="h-4 w-4" />
                            {!collapsed && <span>{subItem.title}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  onClick={() => navigate('path' in item ? item.path : '/')}
                  className={`hover:bg-accent/50 ${isActive('path' in item ? item.path : '/') ? 'bg-accent text-accent-foreground' : ''}`}
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      
      {/* Database Reset Dialog for Super Admin */}
      {userRole === 'SuperAdmin' && (
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                {t('reset.confirm_title', 'Confirm Database Reset')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('reset.confirm_text', 'This action cannot be undone. All historical data and guest users will be permanently deleted.')}
                <br /><br />
                <strong>{t('reset.type_reset', 'Type "RESET" to confirm:')}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="confirm-text">{t('message.confirm', 'Confirmation')}</Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={t('reset.type_reset_placeholder', 'Type RESET to confirm')}
                  className="mt-1"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('action.cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDatabaseReset}
                disabled={confirmText !== 'RESET' || resetLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {resetLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('reset.loading', 'Resetting...')}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('reset.button', 'Reset Database')}
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Sidebar>
  );
}
