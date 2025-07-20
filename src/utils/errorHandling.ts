import { toast } from "@/hooks/use-toast";

export const handleError = (error: any, defaultMessage: string, showToast: boolean = true) => {
  const errorMessage = error?.message || defaultMessage;
  
  if (showToast) {
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  }
  
  // Log to console in development only
  if (process.env.NODE_ENV === 'development') {
    console.error(errorMessage, error);
  }
};

export const handleSuccess = (message: string, showToast: boolean = true) => {
  if (showToast) {
    toast({
      title: "Success",
      description: message,
    });
  }
};