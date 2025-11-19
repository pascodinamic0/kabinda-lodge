-- Migration: Fix conference_bookings RLS policies for Receptionist access
-- Created: 2024-11-17
-- Purpose: Allow Receptionists to view and manage all conference bookings (matching bookings table behavior)
-- Issue: Receptionists could not view conference booking details in BookingManagement page

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Admins can view all conference bookings" ON public.conference_bookings;
DROP POLICY IF EXISTS "Admins can manage all conference bookings" ON public.conference_bookings;

-- Create new policy allowing Staff (Admin, Receptionist, SuperAdmin) to view all conference bookings
-- This matches the policy for regular bookings table
CREATE POLICY "Staff can view all conference bookings" 
ON public.conference_bookings 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'Receptionist'::app_role, 'SuperAdmin'::app_role]));

-- Create policy allowing Admins and SuperAdmins to manage (INSERT, UPDATE, DELETE) all conference bookings
-- Receptionists can view but not modify (consistent with typical reception desk permissions)
CREATE POLICY "Admins can manage all conference bookings" 
ON public.conference_bookings 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['Admin'::app_role, 'SuperAdmin'::app_role]));

-- Add helpful comment
COMMENT ON TABLE public.conference_bookings IS 'Conference room bookings with RLS policies allowing staff to view and admins to manage';

