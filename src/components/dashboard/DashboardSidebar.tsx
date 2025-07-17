import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
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
  FileText,
  Zap,
  UserCheck,
  Receipt,
  Upload,
  Download,
  ShoppingCart,
  Printer,
  CheckCircle
} from 'lucide-react';

interface SidebarItem {
  title: string;
  icon: React.ComponentType<any>;
  path: string;
}

interface SidebarGroup {
  title: string;
  icon: React.ComponentType<any>;
  items: SidebarItem[];
}

export default function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const currentPath = location.pathname;

  // Get sidebar items based on user role
  const getSidebarItems = () => {
    console.log('User role in sidebar:', userRole); // Debug log
    
    if (userRole === 'Admin') {
      return [
        {
          title: 'Dashboard',
          icon: LayoutDashboard,
          path: '/admin',
        },
        {
          title: 'Core Management',
          icon: Database,
          items: [
            { title: 'Users', icon: Users, path: '/admin/users' },
            { title: 'Rooms', icon: Bed, path: '/admin/rooms' },
          ]
        },
        {
          title: 'Operations',
          icon: Activity,
          items: [
            { title: 'Bookings', icon: Calendar, path: '/admin/bookings' },
            { title: 'Payments', icon: CreditCard, path: '/admin/payments' },
          ]
        },
        {
          title: 'Restaurant',
          icon: UtensilsCrossed,
          items: [
            { title: 'Menu', icon: UtensilsCrossed, path: '/admin/menu' },
          ]
        },
        {
          title: 'Analytics',
          icon: BarChart3,
          items: [
            { title: 'Reports', icon: BarChart3, path: '/admin/reports' },
          ]
        },
        {
          title: 'System',
          icon: Settings,
          items: [
            { title: 'Promotions', icon: Gift, path: '/admin/promotions' },
            { title: 'Content', icon: FileText, path: '/admin/content' },
          ]
        }
      ];
    } else if (userRole === 'Receptionist') {
      return [
        {
          title: 'Dashboard',
          icon: LayoutDashboard,
          path: '/reception',
        },
        {
          title: 'Bookings',
          icon: Calendar,
          items: [
            { title: 'New Booking', icon: Calendar, path: '/reception/booking' },
            { title: 'Check In/Out', icon: UserCheck, path: '/reception/checkin' },
          ]
        },
        {
          title: 'Payments',
          icon: CreditCard,
          items: [
            { title: 'Process Payment', icon: CreditCard, path: '/reception/payment' },
            { title: 'Generate Receipt', icon: Receipt, path: '/reception/receipt' },
          ]
        },
        {
          title: 'Data Management',
          icon: Database,
          items: [
            { title: 'Import Data', icon: Upload, path: '/reception/import' },
            { title: 'Export Data', icon: Download, path: '/reception/export' },
          ]
        },
        {
          title: 'Orders',
          icon: ShoppingCart,
          items: [
            { title: 'Order Management', icon: UserCheck, path: '/reception/orders' },
          ]
        }
      ];
    } else if (userRole === 'RestaurantLead') {
      return [
        {
          title: 'Dashboard',
          icon: LayoutDashboard,
          path: '/restaurant',
        },
        {
          title: 'Menu',
          icon: UtensilsCrossed,
          items: [
            { title: 'Menu Editor', icon: UtensilsCrossed, path: '/restaurant/menu' },
            { title: 'Promotions', icon: Gift, path: '/restaurant/promotions' },
          ]
        },
        {
          title: 'Orders',
          icon: ShoppingCart,
          items: [
            { title: 'Take Order', icon: ShoppingCart, path: '/restaurant/order' },
            { title: 'Approve Orders', icon: CheckCircle, path: '/restaurant/approve' },
            { title: 'Print Orders', icon: Printer, path: '/restaurant/print' },
          ]
        },
        {
          title: 'Analytics',
          icon: BarChart3,
          items: [
            { title: 'Sales Analytics', icon: BarChart3, path: '/restaurant/analytics' },
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
                {userRole === 'Admin' ? 'Admin Panel' : 
                 userRole === 'Receptionist' ? 'Reception' : 
                 'Restaurant'}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {sidebarItems.map((item: any) => {
            if (item.items) {
              return (
                <SidebarGroup key={item.title}>
                  <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {item.title}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {item.items.map((subItem: SidebarItem) => (
                        <SidebarMenuItem key={subItem.title}>
                          <SidebarMenuButton
                            onClick={() => navigate(subItem.path)}
                            className={`hover:bg-accent/50 ${isActive(subItem.path) ? 'bg-accent text-accent-foreground' : ''}`}
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
                  onClick={() => navigate(item.path)}
                  className={`hover:bg-accent/50 ${isActive(item.path) ? 'bg-accent text-accent-foreground' : ''}`}
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

    </Sidebar>
  );
}