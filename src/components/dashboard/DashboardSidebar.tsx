
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  CheckCircle,
  MessageSquare,
  Wrench,
  Package,
  Phone,
  Hotel,
  MapPin,
  Star,
  Table,
  Shield
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
  console.log('📁 DashboardSidebar: Component rendering started');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  console.log('📁 DashboardSidebar: Auth data:', { userEmail: user?.email, userRole });
  console.log('📁 DashboardSidebar: Location:', location.pathname);
  console.log('📁 DashboardSidebar: Sidebar state:', { collapsed });

  const currentPath = location.pathname;

  // Get sidebar items based on user role
  const getSidebarItems = () => {
    console.log('📁 DashboardSidebar: Getting sidebar items for role:', userRole);
    
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
      console.log('📁 DashboardSidebar: Building receptionist menu');
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
            { title: 'New Booking', icon: Calendar, path: '/kabinda-lodge/rooms' },
            { title: 'Process Payments', icon: CreditCard, path: '/kabinda-lodge/admin/payment-verification' },
          ]
        },
        {
          title: 'Guest Services',
          icon: MessageSquare,
          items: [
            { title: 'Lost & Found', icon: Package, path: '/kabinda-lodge/reception/lost-found' },
            { title: 'Phone Directory', icon: Phone, path: '/kabinda-lodge/reception/directory' },
            { title: 'Review Management', icon: Star, path: '/kabinda-lodge/reception/reviews' },
            { title: 'Payment Verification', icon: CreditCard, path: '/kabinda-lodge/reception/payment-verification' },
          ]
        }
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
            { title: 'Approve Orders', icon: CheckCircle, path: '/kabinda-lodge/restaurant/approve' },
            { title: 'Print Orders', icon: Printer, path: '/kabinda-lodge/restaurant/print' },
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
    
    console.log('📁 DashboardSidebar: No matching role, returning empty array');
    return [];
  };

  const sidebarItems = getSidebarItems();
  console.log('📁 DashboardSidebar: Sidebar items:', sidebarItems);

  const isActive = (path: string) => currentPath === path;

  console.log('📁 DashboardSidebar: Rendering sidebar with', sidebarItems.length, 'items');

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
