import React from "react";
import { Plus, List, Star, FileText, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface GuestSidebarProps {
  onNavigate: (section: string) => void;
  currentSection: string;
}

export function GuestSidebar({ onNavigate, currentSection }: GuestSidebarProps) {
  const { state, open } = useSidebar();
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const menuItems = [
    {
      group: "Client Service",
      items: [
        { 
          id: "new-request", 
          title: "New Request", 
          icon: Plus
        },
        { 
          id: "my-requests", 
          title: "My Requests", 
          icon: List
        },
      ]
    },
    {
      group: "Review",
      items: [
        { 
          id: "leave-review", 
          title: "Leave Review", 
          icon: Star
        },
        { 
          id: "my-reviews", 
          title: "My Reviews", 
          icon: FileText
        },
      ]
    }
  ];

  // Don't render sidebar on mobile when closed
  if (isMobile && !open) {
    return null;
  }

  return (
    <Sidebar
      className={cn(
        "border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        collapsed ? "w-16" : "w-64",
        isMobile && "absolute top-0 left-0 right-0 z-50 w-full border-r-0 border-b shadow-lg"
      )}
      collapsible={isMobile ? "offcanvas" : "icon"}
    >
      <SidebarHeader className="border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Guest Portal</span>
              <span className="text-xs text-muted-foreground">Services & Reviews</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {menuItems.map((group) => (
          <SidebarGroup key={group.group} className="py-2">
            <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {!collapsed && group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onNavigate(item.id)}
                      className={cn(
                        "h-9 px-2 text-sm font-medium transition-all duration-200",
                        "hover:bg-accent/70 hover:text-accent-foreground",
                        "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
                        currentSection === item.id && "bg-primary/10 text-primary border-r-2 border-primary"
                      )}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}