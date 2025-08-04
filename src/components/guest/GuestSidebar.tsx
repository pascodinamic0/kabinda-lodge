import React, { useState } from "react";
import { MessageSquare, Plus, List, Star, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface GuestSidebarProps {
  onNavigate: (section: string) => void;
  currentSection: string;
}

export function GuestSidebar({ onNavigate, currentSection }: GuestSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const menuItems = [
    {
      group: "Client Service",
      items: [
        { 
          id: "new-request", 
          title: "New Request", 
          icon: Plus,
          description: "Create a new service request"
        },
        { 
          id: "my-requests", 
          title: "My Requests", 
          icon: List,
          description: "View your service requests"
        },
      ]
    },
    {
      group: "Review",
      items: [
        { 
          id: "leave-review", 
          title: "Leave Review", 
          icon: Star,
          description: "Submit feedback for your stay"
        },
        { 
          id: "my-reviews", 
          title: "My Reviews", 
          icon: FileText,
          description: "View your submitted reviews"
        },
      ]
    }
  ];

  return (
    <Sidebar
      className={cn(
        "border-r border-border bg-background",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-sm font-semibold">
              {!collapsed && group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onNavigate(item.id)}
                      className={cn(
                        "w-full justify-start transition-colors",
                        currentSection === item.id && "bg-accent text-accent-foreground"
                      )}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{item.title}</span>
                          {item.description && (
                            <span className="text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          )}
                        </div>
                      )}
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