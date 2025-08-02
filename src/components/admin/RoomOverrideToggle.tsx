import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface RoomOverrideToggleProps {
  isOverrideActive: boolean;
  onToggle: (enabled: boolean) => void;
  overrideReason?: string | null;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

export function RoomOverrideToggle({ 
  isOverrideActive, 
  onToggle, 
  overrideReason,
  disabled = false,
  size = 'sm'
}: RoomOverrideToggleProps) {
  const { userRole } = useAuth();
  const isSuperAdmin = userRole === 'SuperAdmin';
  
  // Disable the toggle if user is not SuperAdmin
  const isDisabled = disabled || !isSuperAdmin;
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isOverrideActive ? "default" : "outline"}
        size={size}
        onClick={() => onToggle(!isOverrideActive)}
        disabled={isDisabled}
        className={cn(
          "transition-all duration-200 font-medium min-w-[90px]",
          isOverrideActive 
            ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600" 
            : "border-muted-foreground/30 hover:border-orange-600 hover:text-orange-600",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {isOverrideActive ? (
          <>
            <Lock className="h-4 w-4 mr-1.5" />
            Locked
          </>
        ) : (
          <>
            <Unlock className="h-4 w-4 mr-1.5" />
            Normal
          </>
        )}
      </Button>
      
      {isOverrideActive && overrideReason && (
        <div 
          className="text-xs text-muted-foreground truncate max-w-[100px]" 
          title={overrideReason}
        >
          {overrideReason}
        </div>
      )}
    </div>
  );
}