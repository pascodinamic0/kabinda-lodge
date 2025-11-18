import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ReceiptGenerator } from "@/components/ReceiptGenerator";
import { useRealtimeRooms } from "@/hooks/useRealtimeData";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { Calendar, Users, MapPin, Phone, CreditCard, CheckCircle, Tag, Gift } from "lucide-react";
import { hasBookingConflict, isBookingActive } from "@/utils/bookingUtils";
import { BookingFieldConfig, DynamicFieldData } from "@/types/bookingFields";
import { renderDynamicField, validateDynamicFields } from "@/utils/dynamicFields";

type PartnerPromotion = {
  id: number;
  title: string;
  description?: string | null;
  discount_percent: number;
  discount_type?: "percentage" | "fixed" | null;
  discount_amount?: number | null;
  partner_name?: string | null;
  minimum_amount?: number | null;
  maximum_uses?: number | null;
  current_uses?: number | null;
  promotion_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
};


const BookRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session, userRole, loading: authLoading } = useAuth();
  const { paymentMethods, loading: paymentMethodsLoading } = usePaymentMethods();
  const [room, setRoom] = useState<{ id: number; name: string; type: string; price: number; description?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [activePromotion, setActivePromotion] = useState<{ id: number; title: string; discount_percent: number; description: string } | null>(null);
  const [dateConflict, setDateConflict] = useState<string | null>(null);
  const [dynamicFields, setDynamicFields] = useState<BookingFieldConfig[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<DynamicFieldData>({});
  const [dynamicFieldErrors, setDynamicFieldErrors] = useState<Record<string, string>>({});
  const [isPartnerBooking, setIsPartnerBooking] = useState(false);
  const [partnerPromotions, setPartnerPromotions] = useState<PartnerPromotion[]>([]);
  const [partnerPromotionsLoading, setPartnerPromotionsLoading] = useState(false);
  const [partnerPromotionsFetched, setPartnerPromotionsFetched] = useState(false);
  const [partnerPromotionError, setPartnerPromotionError] = useState<string | null>(null);
  const [selectedPartnerPromotionId, setSelectedPartnerPromotionId] = useState<string>("");

  const handleBookingTypeSelect = useCallback(
    (type: "standard" | "partner") => {
      if (type === "partner") {
        setIsPartnerBooking(true);
        if (!selectedPartnerPromotionId) {
          setPartnerPromotionError(null);
        }
      } else {
        setIsPartnerBooking(false);
        setSelectedPartnerPromotionId("");
        setPartnerPromotionError(null);
      }
    },
    [selectedPartnerPromotionId]
  );

  const handlePartnerPromotionSelect = useCallback(
    (value: string) => {
      setSelectedPartnerPromotionId(value);
      if (!value) {
        setPartnerPromotionError(null);
      }
    },
    []
  );

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    guests: 1,
    notes: "",
    contactPhone: "",
    transactionRef: "",
    paymentMethod: "",
    guestName: "",
    guestEmail: "",
    idType: "",
    idNumber: ""
  });

  const fetchPartnerPromotions = useCallback(async () => {
    try {
      setPartnerPromotionsLoading(true);
      const today = new Date();

      console.log('🔍 Fetching partner promotions...');

      const selectColumns =
        "id, title, description, discount_percent, discount_type, discount_amount, partner_name, minimum_amount, maximum_uses, current_uses, promotion_type, start_date, end_date, is_active";

      const primaryResponse = await (supabase as any)
        .from("promotions")
        .select(selectColumns)
        .eq("promotion_type", "partner")
        .eq("is_active", true)
        .order("title", { ascending: true });

      console.log('📦 Primary response:', primaryResponse);

      let promotionsData: PartnerPromotion[] | null = null;

      if (primaryResponse.error) {
        console.warn('⚠️ Primary query failed, trying fallback:', primaryResponse.error);

        // Fallback: fetch all promotions and filter client-side (handles older schemas without promotion_type / is_active columns)
        const fallbackResponse = await (supabase as any)
          .from("promotions")
          .select("*")
          .order("title", { ascending: true });

        console.log('📦 Fallback response:', fallbackResponse);

        if (fallbackResponse.error) {
          throw fallbackResponse.error;
        }

        promotionsData = (fallbackResponse.data ?? []) as unknown as PartnerPromotion[];
      } else {
        promotionsData = (primaryResponse.data ?? []) as unknown as PartnerPromotion[];
      }

      console.log('📊 Raw promotions data:', promotionsData);

      const filteredPromotions = (promotionsData || []).filter((promotion) => {
        const isPartnerPromotion =
          promotion.promotion_type === "partner" ||
          promotion.title?.toLowerCase().includes("partner") ||
          promotion.title?.includes("-") ||
          promotion.partner_name;

        if (!isPartnerPromotion) {
          console.log('❌ Not a partner promotion:', promotion.title);
          return false;
        }

        if (
          Object.prototype.hasOwnProperty.call(promotion, "is_active") &&
          promotion.is_active === false
        ) {
          console.log('❌ Inactive promotion:', promotion.title);
          return false;
        }

        const startDate = promotion.start_date ? new Date(promotion.start_date) : null;
        const endDate = promotion.end_date ? new Date(promotion.end_date) : null;

        const hasStarted = !startDate || startDate <= today;
        const notExpired = !endDate || endDate >= today;

        if (!hasStarted || !notExpired) {
          console.log('❌ Date range invalid:', promotion.title, { startDate, endDate, today });
        }

        return hasStarted && notExpired;
      });

      console.log('✅ Filtered partner promotions:', filteredPromotions);
      setPartnerPromotions(filteredPromotions);
    } catch (error) {
      console.error("❌ Error fetching partner promotions:", error);
      toast({
        title: "Partner rates unavailable",
        description: "We couldn't load partner promotions right now. Please try again or continue with the standard rate.",
        variant: "destructive"
      });
    } finally {
      setPartnerPromotionsLoading(false);
      setPartnerPromotionsFetched(true);
    }
  }, [toast]);

  const selectedPartnerPromotion = useMemo(
    () => partnerPromotions.find((promotion) => promotion.id.toString() === selectedPartnerPromotionId) || null,
    [partnerPromotions, selectedPartnerPromotionId]
  );

  const nights = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = end.getTime() - start.getTime();
    if (Number.isNaN(diffTime) || diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [formData.startDate, formData.endDate]);

  const baseTotal = useMemo(() => {
    if (!room) return 0;
    return nights * (room.price || 0);
  }, [nights, room]);

  const partnerDiscountAmount = useMemo(() => {
    if (!selectedPartnerPromotion || baseTotal <= 0 || nights <= 0) return 0;

    const minimumAmount = Number(selectedPartnerPromotion.minimum_amount ?? 0);
    if (minimumAmount > 0 && baseTotal < minimumAmount) {
      return 0;
    }

    let discount = 0;
    if (selectedPartnerPromotion.discount_type === "fixed" && selectedPartnerPromotion.discount_amount !== null && selectedPartnerPromotion.discount_amount !== undefined) {
      // Apply fixed discount PER NIGHT (multiply by number of nights)
      discount = Number(selectedPartnerPromotion.discount_amount) * nights;
    } else {
      const percent = Number(selectedPartnerPromotion.discount_percent || 0);
      discount = baseTotal * (percent / 100);
    }

    if (!Number.isFinite(discount) || discount < 0) {
      return 0;
    }

    return Math.min(discount, baseTotal);
  }, [selectedPartnerPromotion, baseTotal, nights]);

  const finalTotal = useMemo(() => Math.max(baseTotal - partnerDiscountAmount, 0), [baseTotal, partnerDiscountAmount]);
  const hasBookingAmount = finalTotal > 0 || baseTotal > 0;

  const eligiblePartnerPromotions = useMemo(() => {
    if (partnerPromotions.length === 0) return [];

    return partnerPromotions.filter((promotion) => {
      const usageLimit = promotion.maximum_uses !== null && promotion.maximum_uses !== undefined;
      const usageExceeded =
        usageLimit &&
        promotion.current_uses !== null &&
        promotion.current_uses !== undefined &&
        Number(promotion.current_uses) >= Number(promotion.maximum_uses);

      if (usageExceeded) {
        return false;
      }

      const minimumAmount = Number(promotion.minimum_amount ?? 0);
      if (minimumAmount > 0 && baseTotal > 0 && baseTotal < minimumAmount) {
        return false;
      }

      return true;
    });
  }, [partnerPromotions, baseTotal]);

  const formatCurrency = useCallback((amount: number) => {
    if (!Number.isFinite(amount)) return "0.00";
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  const isPartnerSelectionValid =
    !isPartnerBooking || (!partnerPromotionError && !partnerPromotionsLoading);
  const disableBookingSubmit = submitting || !isPartnerSelectionValid;

  const partnerPromotionReceipt = useMemo(() => {
    if (partnerDiscountAmount > 0 && selectedPartnerPromotion && baseTotal > 0) {
      let discountPercentForReceipt = Number(selectedPartnerPromotion.discount_percent || 0);
      if (selectedPartnerPromotion.discount_type === "fixed" && baseTotal > 0) {
        discountPercentForReceipt = Number(((partnerDiscountAmount / baseTotal) * 100).toFixed(2));
      }

      return {
        title: selectedPartnerPromotion.title,
        description: selectedPartnerPromotion.description || "",
        discount_percent: discountPercentForReceipt
      };
    }
    return null;
  }, [partnerDiscountAmount, selectedPartnerPromotion, baseTotal]);

  const receiptPromotion = partnerPromotionReceipt || activePromotion || undefined;

  const nightlyBaseRate = room?.price || 0;
  const nightlyDiscount = useMemo(() => {
    if (nights <= 0) return 0;
    return partnerDiscountAmount / nights;
  }, [partnerDiscountAmount, nights]);

  const nightlyTotal = useMemo(() => {
    if (nights <= 0) return nightlyBaseRate;
    return Math.max((finalTotal || 0) / nights, 0);
  }, [finalTotal, nights, nightlyBaseRate]);


  // Use realtime data for rooms
  useRealtimeRooms(() => {
    if (id && !room) {
      fetchRoom();
    }
  });

  useEffect(() => {
    // Component mounted/updated
    
    if (authLoading) {

      return;
    }
    
    if (!user) {

      navigate('/kabinda-lodge/client-auth');
      return;
    }
    

    if (id) {
      fetchRoom();
      fetchActivePromotion();
      fetchDynamicFields();
    }
  }, [user, userRole, authLoading, id, navigate]);

  useEffect(() => {
    fetchPartnerPromotions().catch(console.error);
  }, [fetchPartnerPromotions]);

  useEffect(() => {
    if (
      isPartnerBooking &&
      !partnerPromotionsFetched &&
      !partnerPromotionsLoading &&
      partnerPromotions.length === 0
    ) {
      fetchPartnerPromotions().catch(console.error);
    }
  }, [
    isPartnerBooking,
    partnerPromotionsFetched,
    partnerPromotionsLoading,
    partnerPromotions.length,
    fetchPartnerPromotions
  ]);

  useEffect(() => {
    if (!selectedPartnerPromotion) {
      setPartnerPromotionError(null);
      return;
    }

    const minimumAmount = Number(selectedPartnerPromotion.minimum_amount ?? 0);

    if (minimumAmount > 0 && baseTotal < minimumAmount) {
      setPartnerPromotionError(`Minimum booking amount of $${formatCurrency(minimumAmount)} required for this partner promotion.`);
      return;
    }

    setPartnerPromotionError(null);
  }, [selectedPartnerPromotion, baseTotal, formatCurrency]);

  useEffect(() => {
    if (!selectedPartnerPromotionId) return;

    const stillEligible = eligiblePartnerPromotions.some((promotion) => promotion.id.toString() === selectedPartnerPromotionId);
    if (!stillEligible) {
      if (selectedPartnerPromotion && baseTotal > 0) {
        toast({
          title: "Partner promotion removed",
          description: "The selected partner promotion is no longer eligible for the current booking details."
        });
      }
      setSelectedPartnerPromotionId("");
    }
  }, [eligiblePartnerPromotions, selectedPartnerPromotionId, selectedPartnerPromotion, baseTotal, toast]);

  useEffect(() => {
    if (isPartnerBooking && eligiblePartnerPromotions.length > 0 && !selectedPartnerPromotionId) {
      // Auto-select first eligible promotion when switching to partner mode
      setSelectedPartnerPromotionId(eligiblePartnerPromotions[0].id.toString());
      console.log('✅ Auto-selected promotion:', eligiblePartnerPromotions[0].title);
    }
  }, [isPartnerBooking, eligiblePartnerPromotions, selectedPartnerPromotionId]);

  const fetchDynamicFields = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('booking_fields_config')
        .select('*')
        .eq('is_active', true)
        .contains('applies_to', ['room'])
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching dynamic fields:', error);
        // Don't show error to user, just log it - fields are optional
        return;
      }

      setDynamicFields((data as any) || []);
    } catch (error) {
      console.error('Error fetching dynamic fields:', error);
    }
  };

  const fetchRoom = async () => {
    if (!id) {
      console.error('BookRoom: No room ID provided');
      toast({
        title: "Error",
        description: "No room ID provided",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {

      setLoading(true);
      
      const roomIdNumber = parseInt(id);

      
      if (isNaN(roomIdNumber)) {
        console.error('BookRoom: Invalid room ID format:', id);
        toast({
          title: "Invalid Room ID",
          description: "The room ID format is invalid",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomIdNumber)
        .maybeSingle();

      console.log('BookRoom: Supabase query completed', { 
        data: data, 
        error: error,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : null
      });
      
      if (error) {
        console.error('BookRoom: Supabase error:', error);
        toast({
          title: "Database Error",
          description: error.message || "Failed to fetch room details",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      if (!data) {
        console.error('BookRoom: No room found for ID:', id);
        toast({
          title: "Room Not Found",
          description: `Room with ID ${id} could not be found`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      console.log('BookRoom: Successfully retrieved room data:', {
        id: data.id,
        name: data.name,
        type: data.type,
        price: data.price,
        status: data.status
      });
      
      setRoom(data);
      
    } catch (error: unknown) {
      console.error('BookRoom: Unexpected error while fetching room:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading the room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePromotion = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .lte('start_date', new Date().toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActivePromotion(data);
    } catch (error) {
      console.log('BookRoom: No active promotion found or error fetching promotions');
    }
  };



  const checkDateConflict = async (startDate: string, endDate: string) => {
    if (!startDate || !endDate || !id) return;

    try {
      // First, update room statuses to ensure they reflect current booking expiration (9:30 AM)
      await supabase.rpc('check_expired_bookings');

      // Fetch all bookings for this room that might conflict
      // We'll filter them client-side using the booking utility to account for 9:30 AM expiration
      const { data: allBookings, error } = await supabase
        .from('bookings')
        .select('start_date, end_date, notes, status')
        .eq('room_id', parseInt(id))
        .in('status', ['booked', 'confirmed', 'pending_verification']);

      if (error) throw error;

      // Check for conflicts using the utility function that accounts for 9:30 AM expiration
      const hasConflict = hasBookingConflict(startDate, endDate, allBookings || []);

      if (hasConflict) {
        // Find the conflicting bookings for display
        const conflictingBookings = (allBookings || []).filter(booking => {
          // Check if this booking is active and overlaps with the proposed dates
          if (!isBookingActive(booking.start_date, booking.end_date, booking.status)) {
            return false;
          }
          // Check for date overlap
          return startDate < booking.end_date && endDate > booking.start_date;
        });

        const conflictInfo = conflictingBookings.map(c => 
          `${c.start_date} to ${c.end_date}`
        ).join(', ');
        setDateConflict(`This room is already booked for: ${conflictInfo}`);
        return true;
      } else {
        setDateConflict(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking date conflicts:', error);
      return false;
    }
  };

  const calculateNights = () => nights;
  const calculateBaseTotal = () => baseTotal;
  const calculatePartnerDiscount = () => partnerDiscountAmount;
  const calculateTotal = () => finalTotal;



  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (dateConflict) {
      toast({
        title: "Cannot Create Booking",
        description: "Please select different dates to avoid conflicts.",
        variant: "destructive",
      });
      return;
    }

    // Validate dynamic fields
    const fieldErrors = validateDynamicFields(dynamicFields, dynamicFieldValues);
    if (Object.keys(fieldErrors).length > 0) {
      setDynamicFieldErrors(fieldErrors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }
    setDynamicFieldErrors({});

    // Enhanced authentication check
    if (!user || !session) {
      console.error('Booking submission failed - authentication required');
      toast({
        title: "Authentication Required",
        description: "Please log in again to continue with booking creation.",
        variant: "destructive",
      });
      navigate('/kabinda-lodge/client-auth');
      return;
    }

    // Allow partner bookings without promotion (user can select "No promotion")
    // Only validate if there's a promotion error (minimum amount not met, etc.)
    if (isPartnerBooking && selectedPartnerPromotionId && !selectedPartnerPromotion) {
      toast({
        title: "Invalid promotion",
        description: "The selected promotion is no longer available. Please choose another or proceed without a promotion.",
        variant: "destructive"
      });
      return;
    }

    if (partnerPromotionError) {
      toast({
        title: "Partner promotion not eligible",
        description: partnerPromotionError,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      console.log('Creating booking for user:', user.id);
      const baseTotalAmount = calculateBaseTotal();
      const partnerDiscount = calculatePartnerDiscount();
      const totalPrice = Math.max(baseTotalAmount - partnerDiscount, 0);
      const isPartnerPromotionApplied = Boolean(selectedPartnerPromotion && partnerDiscount > 0);
      
      const bookingPayload: Record<string, unknown> = {
        user_id: user.id,
        room_id: parseInt(id!),
        start_date: formData.startDate,
        end_date: formData.endDate,
        total_price: totalPrice,
        guest_name: formData.guestName,
        guest_email: formData.guestEmail,
        guest_phone: formData.contactPhone,
        guest_id_type: formData.idType,
        guest_id_number: formData.idNumber,
        notes: formData.notes || null,
        status: 'pending_payment'
      };

      if (isPartnerPromotionApplied && selectedPartnerPromotion) {
        bookingPayload.original_price = baseTotalAmount;
        bookingPayload.discount_amount = partnerDiscount;
        bookingPayload.promotion_id = selectedPartnerPromotion.id;
      }
      
      // Create booking with native guest columns
      const { data: booking, error: bookingError } = await (supabase as any)
        .from('bookings')
        .insert([bookingPayload])
        .select()
        .single();

      if (bookingError) {
        console.error('Booking creation error:', bookingError);
        if (bookingError.message.includes('row-level security')) {
          throw new Error('Permission denied. Please log in again and try again.');
        } else if (bookingError.message.includes('foreign key')) {
          throw new Error('Invalid room reference. Please refresh and try again.');
        } else {
          throw bookingError;
        }
      }

      console.log('Booking created successfully:', booking.id);

      // Save dynamic field values
      if (dynamicFields.length > 0 && Object.keys(dynamicFieldValues).length > 0) {
        const fieldValuesToInsert = dynamicFields
          .filter(field => dynamicFieldValues[field.field_name] !== undefined && dynamicFieldValues[field.field_name] !== '')
          .map(field => ({
            booking_id: booking.id,
            field_id: field.id,
            field_value: String(dynamicFieldValues[field.field_name])
          }));

        if (fieldValuesToInsert.length > 0) {
          const { error: fieldValuesError } = await (supabase as any)
            .from('booking_field_values')
            .insert(fieldValuesToInsert);

          if (fieldValuesError) {
            console.error('Error saving dynamic field values:', fieldValuesError);
            // Don't fail the booking if field values fail to save, just log it
          }
        }
      }

      // Update room status
      await supabase.rpc('check_expired_bookings');

      setBookingId(booking.id);
      setStep(2);
      
      toast({
        title: "Booking Created",
        description: "Please proceed with payment to confirm your booking.",
      });
      
    } catch (error: unknown) {
      console.error('Booking submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      
      toast({
        title: "Booking Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Enhanced authentication check
      if (!user || !session) {
        console.error('Payment submission failed - authentication required');
        toast({
          title: "Authentication Required",
          description: "Please log in again to continue with payment submission.",
          variant: "destructive",
        });
        navigate('/kabinda-lodge/client-auth');
        return;
      }

      // Validate payment method and transaction reference
      if (!formData.paymentMethod) {
        throw new Error('Please select a payment method');
      }

      if (formData.paymentMethod !== 'cash' && !formData.transactionRef) {
        throw new Error('Transaction reference is required for mobile money payments');
      }

      // Verify booking exists; allow staff to process payments for any booking
      console.log('Verifying booking exists for payment:', { bookingId, userId: user?.id, role: userRole });
      const { data: booking, error: bookingVerifyError } = await supabase
        .from('bookings')
        .select('user_id, id, status')
        .eq('id', bookingId)
        .single();

      if (bookingVerifyError) {
        console.error('Payment validation error - booking verification failed:', bookingVerifyError);
        throw new Error('Unable to verify booking details. Please try again.');
      }

      if (!booking) {
        console.error('Payment validation error - booking not found:', bookingId);
        throw new Error('Booking not found. Please contact support.');
      }

      const paymentStatus = (formData.paymentMethod === 'cash' && userRole === 'Receptionist') 
        ? 'verified' 
        : 'pending_verification';

      console.log('Creating payment record:', {
        booking_id: bookingId,
        amount: calculateTotal(),
        method: formData.paymentMethod,
        status: paymentStatus,
        user_id: user?.id,
        session_id: session?.access_token ? 'present' : 'missing'
      });

      // Create payment with retry mechanism for RLS issues
      let paymentError;
      let retryCount = 0;
      const maxRetries = 2;

      // Use the payment method code directly from the database
      const persistedMethod = formData.paymentMethod;

      while (retryCount <= maxRetries) {
        const { error } = await supabase
          .from('payments')
          .insert([
            {
              booking_id: bookingId,
              amount: calculateTotal(),
              method: persistedMethod,
              transaction_ref: formData.paymentMethod === 'cash' 
                ? `CASH-${Date.now()}` 
                : formData.transactionRef,
              status: paymentStatus
            }
          ]);

        if (!error) {
          paymentError = null;
          break;
        }

        paymentError = error;
        retryCount++;

        if (retryCount <= maxRetries) {
          console.warn(`Payment creation attempt ${retryCount} failed, retrying...`, error);
          // Brief delay before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (paymentError) {
        console.error('Payment creation error after retries:', paymentError);
        
        // Provide specific error messages based on error type
        if (paymentError.message.includes('row-level security') || paymentError.message.includes('permission denied')) {
          throw new Error('Permission denied. Please refresh the page and try again.');
        } else if (paymentError.message.includes('foreign key')) {
          throw new Error('Invalid booking reference. Please refresh and try again.');
        } else {
          throw new Error(`Payment creation failed: ${paymentError.message}`);
        }
      }

      console.log('Payment record created successfully');

      // Update booking status based on payment method
      const newBookingStatus = (formData.paymentMethod === 'cash' && userRole === 'Receptionist') 
        ? 'confirmed' 
        : 'pending_verification';
        
      console.log('Updating booking status:', { newBookingStatus, bookingId });
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({ status: newBookingStatus })
        .eq('id', bookingId);
      
      if (bookingUpdateError) {
        console.error('Booking status update error:', bookingUpdateError);
        // Don't throw here since payment was already created
        toast({
          title: "Payment Processed",
          description: "Payment recorded but booking status update failed. Please contact reception.",
          variant: "destructive",
        });
      }

      setStep(3);
      
      toast({
        title: formData.paymentMethod === 'cash' && userRole === 'Receptionist' 
          ? "Booking Confirmed" 
          : "Payment Submitted Successfully",
        description: formData.paymentMethod === 'cash' && userRole === 'Receptionist'
          ? "Cash payment confirmed. Booking is now active and guest can check in."
          : "Your payment information has been submitted successfully. Your booking is now pending verification and you'll receive confirmation within 2-4 hours.",
      });

      if (formData.paymentMethod === 'cash' && userRole === 'Receptionist') {
        setShowReceipt(true);
      }
    } catch (error: unknown) {
      console.error('Payment submission error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while processing your payment';
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {authLoading ? 'Authenticating...' : 'Loading room details...'}
          </p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="container max-w-4xl">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Room Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  The room you're looking for could not be found or may no longer be available.
                </p>
                <div className="space-x-4">
                  <Button onClick={() => navigate('/kabinda-lodge/room-selection')}>
                    Back to Room Selection
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/kabinda-lodge')}>
                    Return Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book Your Stay</h1>
          <div className="flex items-center gap-2">
            <Badge variant={step === 1 ? "default" : step > 1 ? "secondary" : "outline"}>
              1. Booking Details
            </Badge>
            <Badge variant={step === 2 ? "default" : step > 2 ? "secondary" : "outline"}>
              2. Payment
            </Badge>
            <Badge variant={step === 3 ? "default" : "outline"}>
              3. Confirmation
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Room Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Room Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-xl">{room.name}</h3>
                  <p className="text-muted-foreground">{room.type}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{room.description}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="font-semibold">Price per night:</span>
                  <span className="text-xl font-bold">${room.price}</span>
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span>Nights:</span>
                      <span>{calculateNights()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>${formatCurrency(baseTotal)}</span>
                    </div>
                    {partnerDiscountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Partner discount:</span>
                        <span>- ${formatCurrency(partnerDiscountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>${formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Booking Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBookingSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Check-in Date</Label>
                         <Input
                           type="date"
                           id="startDate"
                           value={formData.startDate}
                           onChange={async (e) => {
                             const newStartDate = e.target.value;
                             setFormData({ ...formData, startDate: newStartDate });
                             if (newStartDate && formData.endDate) {
                               await checkDateConflict(newStartDate, formData.endDate);
                             }
                           }}
                           required
                           min={new Date().toISOString().split('T')[0]}
                         />
                       </div>
                       <div>
                         <Label htmlFor="endDate">Check-out Date</Label>
                         <Input
                           type="date"
                           id="endDate"
                           value={formData.endDate}
                           onChange={async (e) => {
                             const newEndDate = e.target.value;
                             setFormData({ ...formData, endDate: newEndDate });
                             if (formData.startDate && newEndDate) {
                               await checkDateConflict(formData.startDate, newEndDate);
                             }
                           }}
                           required
                           min={formData.startDate || new Date().toISOString().split('T')[0]}
                         />
                       </div>
                     </div>

                     {dateConflict && (
                       <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                         <p className="text-red-800 font-medium">⚠️ Booking Conflict</p>
                         <p className="text-sm text-red-700 mt-1">{dateConflict}</p>
                       </div>
                     )}

                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="guestName">Guest Name</Label>
                         <Input
                           type="text"
                           id="guestName"
                           value={formData.guestName}
                           onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                           placeholder="Full name of the guest"
                           required
                         />
                       </div>
                       <div>
                         <Label htmlFor="guestEmail">Guest Email</Label>
                         <Input
                           type="email"
                           id="guestEmail"
                           value={formData.guestEmail}
                           onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                           placeholder="guest@example.com"
                           required
                         />
                       </div>
                     </div>

                     <div>
                       <Label htmlFor="guests" className="flex items-center gap-2">
                         <Users className="h-4 w-4" />
                         Number of Guests
                       </Label>
                       <Input
                         type="number"
                         id="guests"
                         min={1}
                         max={6}
                         value={formData.guests}
                         onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                         required
                       />
                     </div>

                    <div>
                      <Label htmlFor="contactPhone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Phone Number
                      </Label>
                      <Input
                        type="tel"
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+243 xxx xxx xxx"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="idType">ID Type</Label>
                        <select
                          id="idType"
                          className="w-full p-2 border rounded-lg"
                          value={formData.idType}
                          onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                          required
                        >
                          <option value="">Select ID type</option>
                          <option value="citizen_id">Citizen ID</option>
                          <option value="passport">Passport Number</option>
                          <option value="driving_license">Driving License Number</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="idNumber">ID Number</Label>
                        <Input
                          type="text"
                          id="idNumber"
                          value={formData.idNumber}
                          onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                          placeholder="Enter ID number"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Special Requests (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any special requests or notes..."
                        rows={3}
                      />
                    </div>

                    <div className="pt-4 border-t space-y-4">
                      <div>
                        <Label>Booking Type</Label>
                        <div role="radiogroup" aria-label="Booking Type" className="mt-3 grid gap-4 sm:grid-cols-2">
                          <button
                            type="button"
                            role="radio"
                            aria-checked={!isPartnerBooking}
                            onClick={() => handleBookingTypeSelect("standard")}
                            className={`flex flex-col gap-2 rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                              !isPartnerBooking ? "border-primary bg-primary/5 shadow-sm" : ""
                            }`}
                          >
                            <span className="text-base font-semibold">Standard Guest</span>
                            <span className="text-sm text-muted-foreground">
                              Book directly with Kabinda Lodge at public rates with full flexibility.
                            </span>
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={isPartnerBooking}
                            onClick={() => handleBookingTypeSelect("partner")}
                            className={`flex flex-col gap-2 rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                              isPartnerBooking ? "border-primary bg-primary/5 shadow-sm" : ""
                            }`}
                          >
                            <span className="text-base font-semibold">Partner Client</span>
                            <span className="text-sm text-muted-foreground">
                              Use your corporate or partner benefits and apply exclusive promotions.
                            </span>
                            {partnerPromotionsLoading && isPartnerBooking && (
                              <span className="text-xs text-muted-foreground">Loading partner offers…</span>
                            )}
                          </button>
                        </div>
                      </div>

                      {isPartnerBooking && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="partnerPromotion">Partner Promotion</Label>
                          {partnerPromotionsLoading ? (
                            <div className="mt-2 w-full rounded-lg border p-3 text-sm text-muted-foreground">
                              Loading partner promotions...
                            </div>
                          ) : (
                            <div className="mt-2 space-y-3">
                              {eligiblePartnerPromotions.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Gift className="h-4 w-4" />
                                    <span>No partner promotions currently match this stay.</span>
                                  </div>
                                  <p className="mt-1 text-xs">
                                    {hasBookingAmount
                                      ? "Adjust stay details or check back later for partner offers."
                                      : "Select stay dates to view available partner promotions."}
                                  </p>
                                </div>
                              ) : (
                                <div className="grid gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handlePartnerPromotionSelect("")}
                                    className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all hover:border-primary/70 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                                      selectedPartnerPromotionId === ""
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border bg-background"
                                    }`}
                                  >
                                    <span className="text-sm font-medium">No promotion</span>
                                    <span className="text-xs text-muted-foreground">
                                      Proceed without applying a partner discount.
                                    </span>
                                  </button>

                                  {eligiblePartnerPromotions.map((promotion) => {
                                    const isSelected = selectedPartnerPromotionId === promotion.id.toString();
                                    const isFixed = promotion.discount_type === "fixed";
                                    const discountLabel = isFixed
                                      ? `Save $${formatCurrency(Number(promotion.discount_amount || 0))}`
                                      : `${promotion.discount_percent}% off`;

                                    return (
                                      <button
                                        key={promotion.id}
                                        type="button"
                                        onClick={() => handlePartnerPromotionSelect(promotion.id.toString())}
                                        className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                                          isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-semibold">{promotion.title}</span>
                                          <Badge variant={isSelected ? "default" : "secondary"} className="flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            {discountLabel}
                                          </Badge>
                                        </div>
                                        {promotion.partner_name && (
                                          <span className="text-xs text-muted-foreground">
                                            Partner: {promotion.partner_name}
                                          </span>
                                        )}
                                        {promotion.description && (
                                          <p className="text-xs text-muted-foreground">{promotion.description}</p>
                                        )}
                                        {promotion.minimum_amount && Number(promotion.minimum_amount) > 0 && (
                                          <p className="text-xs text-muted-foreground">
                                            Minimum spend ${formatCurrency(Number(promotion.minimum_amount))}
                                          </p>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          </div>

                          {partnerPromotionError && (
                            <p className="text-sm text-red-600">{partnerPromotionError}</p>
                          )}

                          {!partnerPromotionsLoading && eligiblePartnerPromotions.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              {hasBookingAmount
                                ? "No partner promotions are currently available for the selected stay."
                                : "Select your stay dates to view available partner promotions."}
                            </p>
                          )}

                          {selectedPartnerPromotion && partnerDiscountAmount > 0 && (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                              <div className="flex items-center gap-2 text-green-800 font-semibold">
                                <Tag className="h-4 w-4" />
                                <span>{selectedPartnerPromotion.title}</span>
                              </div>
                              {selectedPartnerPromotion.partner_name && (
                                <p className="text-sm text-green-700">
                                  Partner: {selectedPartnerPromotion.partner_name}
                                </p>
                              )}
                              <div className="space-y-1 text-sm text-green-700">
                                <p>
                                  Discount Applied:{" "}
                                  {selectedPartnerPromotion.discount_type === "fixed"
                                    ? `$${formatCurrency(Number(selectedPartnerPromotion.discount_amount || 0))}`
                                    : `${selectedPartnerPromotion.discount_percent}%`}{" "}
                                  off your stay
                                </p>
                                {nights > 0 && (
                                  <p>
                                    Nightly savings: ${formatCurrency(nightlyDiscount)} • New nightly rate: $
                                    {formatCurrency(nightlyTotal)}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-green-800">
                                New total: ${formatCurrency(finalTotal)} (you save ${formatCurrency(partnerDiscountAmount)})
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Dynamic Fields */}
                    {dynamicFields.length > 0 && (
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-lg">Additional Information</h3>
                        {dynamicFields.map((field) => (
                          <div key={field.id}>
                            {renderDynamicField(
                              field,
                              dynamicFieldValues[field.field_name] || '',
                              (value) => {
                                setDynamicFieldValues(prev => ({
                                  ...prev,
                                  [field.field_name]: value
                                }));
                                // Clear error when user starts typing
                                if (dynamicFieldErrors[field.field_name]) {
                                  setDynamicFieldErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[field.field_name];
                                    return newErrors;
                                  });
                                }
                              },
                              dynamicFieldErrors[field.field_name]
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={disableBookingSubmit}>
                      {submitting ? "Creating Booking..." : "Continue to Payment"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        Amount Due: ${formatCurrency(finalTotal)}
                      </h3>
                      <p className="text-blue-800 text-sm">
                        Please use one of the mobile money services below to complete your payment.
                      </p>
                    </div>
                    <div className="rounded-md border border-blue-100 bg-white p-3 space-y-1 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>${formatCurrency(baseTotal)}</span>
                      </div>
                      {partnerDiscountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Partner discount</span>
                          <span>- ${formatCurrency(partnerDiscountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-blue-900">
                        <span>Amount to pay</span>
                        <span>${formatCurrency(finalTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedPartnerPromotion && partnerDiscountAmount > 0 && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center gap-2 text-green-800 font-semibold">
                        <Tag className="h-4 w-4" />
                        <span>{selectedPartnerPromotion.title} applied</span>
                      </div>
                      <p className="mt-1 text-sm text-green-700">
                        Partner savings: ${formatCurrency(partnerDiscountAmount)} off the original ${formatCurrency(baseTotal)}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-red-600 mb-2">Vodacom M-Pesa</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 998 765 432</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-orange-600 mb-2">Orange Money</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 816 543 210</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-red-500 mb-2">Airtel Money</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 970 123 456</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-blue-600 mb-2">Equity BCDC</h4>
                      <p className="text-sm text-muted-foreground mb-2">Bank transfer to:</p>
                      <p className="font-mono font-semibold">Account: XXXX-XXXX-XXXX</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-green-600 mb-2">Pepele Mobile</h4>
                      <p className="text-sm text-muted-foreground mb-2">Send money to:</p>
                      <p className="font-mono font-semibold">+243 821 987 654</p>
                      <p className="text-sm text-muted-foreground">Reference: HOTEL-{bookingId}</p>
                    </div>
                   </div>

                   {userRole === 'Receptionist' && (
                     <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                       <h4 className="font-semibold text-green-600 mb-2">💵 Cash Payment</h4>
                       <p className="text-sm text-green-700 mb-2">Accept cash payment directly from guest</p>
                       <p className="text-sm text-muted-foreground">Available only for reception staff</p>
                     </div>
                   )}

                  <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-6 border-t">
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method Used</Label>
                      {paymentMethodsLoading ? (
                        <div className="w-full p-2 border rounded-lg text-muted-foreground">
                          Loading payment methods...
                        </div>
                      ) : (
                        <select
                          id="paymentMethod"
                          className="w-full p-2 border rounded-lg"
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          required
                        >
                          <option value="">Select payment method</option>
                          {paymentMethods.map((method) => (
                            <option key={method.id} value={method.code}>
                              {method.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {formData.paymentMethod && formData.paymentMethod !== 'cash' && (
                      <div>
                        <Label htmlFor="transactionRef">Transaction Reference Number</Label>
                        <Input
                          type="text"
                          id="transactionRef"
                          value={formData.transactionRef}
                          onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                          placeholder="Enter the transaction ID/reference from your mobile money"
                          required
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          This is the confirmation code you received after sending the money
                        </p>
                      </div>
                    )}

                    {formData.paymentMethod === 'cash' && userRole === 'Receptionist' && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-800 font-medium">
                          💵 Cash Payment Selected
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          This payment will be marked as completed immediately upon submission.
                        </p>
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Processing..." : 
                       formData.paymentMethod === 'cash' && userRole === 'Receptionist' 
                         ? "Complete Cash Payment" 
                         : "Submit Payment Information"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Booking Submitted Successfully!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                     <h3 className="font-semibold text-green-900 mb-2">
                       {formData.paymentMethod === 'cash' && userRole === 'Receptionist' 
                         ? "Cash Payment Completed!" 
                         : "What happens next?"}
                     </h3>
                     {formData.paymentMethod === 'cash' && userRole === 'Receptionist' ? (
                       <ul className="text-green-800 text-sm space-y-1">
                         <li>• Cash payment has been processed and confirmed</li>
                         <li>• Your booking is now active and confirmed</li>
                         <li>• Guest can proceed to their room</li>
                         <li>• Your booking reference is: <span className="font-mono font-semibold">HOTEL-{bookingId}</span></li>
                       </ul>
                     ) : (
                       <ul className="text-green-800 text-sm space-y-1">
                         <li>• Our team will verify your payment within 2-4 hours</li>
                         <li>• You'll receive a confirmation email once verified</li>
                         <li>• Your booking reference is: <span className="font-mono font-semibold">HOTEL-{bookingId}</span></li>
                       </ul>
                     )}
                  </div>

                   <div className="space-y-2">
                     {formData.paymentMethod === 'cash' && userRole === 'Receptionist' ? (
                       <p className="text-sm text-muted-foreground">
                         <strong>Cash Payment Confirmed:</strong> The booking is now active and ready for guest check-in.
                       </p>
                     ) : (
                       <>
                         <p className="text-sm text-muted-foreground">
                           <strong>Important:</strong> Please keep your transaction reference number safe. 
                           You may need it if there are any issues with payment verification.
                         </p>
                         <p className="text-sm text-muted-foreground">
                           If you don't receive confirmation within 4 hours, please contact us with your booking reference.
                         </p>
                       </>
                     )}
                  </div>

                   {selectedPartnerPromotion && partnerDiscountAmount > 0 && (
                     <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-1">
                       <div className="flex items-center gap-2 text-green-800 font-semibold">
                         <Tag className="h-4 w-4" />
                         <span>Partner promotion applied</span>
                       </div>
                       <p className="text-sm text-green-700">{selectedPartnerPromotion.title}</p>
                       <p className="text-sm text-green-700">
                         You saved ${formatCurrency(partnerDiscountAmount)} on this booking.
                       </p>
                     </div>
                   )}

                    <div className="flex gap-3 pt-4">
                      {formData.paymentMethod === 'cash' && userRole === 'Receptionist' && (
                        <Button onClick={() => setShowReceipt(true)} className="flex-1">
                          Generate Receipt
                        </Button>
                      )}
                      {(userRole === 'Receptionist' || userRole === 'Admin') && (
                        <Button onClick={() => navigate('/kabinda-lodge/room-selection')} className="flex-1">
                          New Booking
                        </Button>
                      )}
                     <Button onClick={() => navigate('/kabinda-lodge')}>
                       Return Home
                     </Button>
                   </div>
                </CardContent>
              </Card>
            )}
           </div>
         </div>
       </div>

       {showReceipt && room && bookingId && (
         <ReceiptGenerator
            receiptData={{
              bookingId,
              guestName: formData.guestName,
              guestEmail: formData.guestEmail,
              guestPhone: formData.contactPhone,
             roomName: room.name,
             roomType: room.type,
             checkIn: formData.startDate,
             checkOut: formData.endDate,
             nights: calculateNights(),
             roomPrice: room.price,
             totalAmount: calculateTotal(),
             paymentMethod: formData.paymentMethod,
             transactionRef: formData.transactionRef,
             promotion: receiptPromotion,
             createdAt: new Date().toISOString()
           }}
           onClose={() => setShowReceipt(false)}
         />
       )}
    </div>
  );
};

export default BookRoom;
