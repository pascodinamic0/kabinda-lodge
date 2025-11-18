# Conference Room Booking System - Testing Guide

## Overview
This document outlines the testing procedure for the newly overhauled conference room booking system.

## Changes Summary

### 1. Database Schema (Migration: `20251117000002_add_conference_event_fields.sql`)
- Added `event_type` (TEXT)
- Added `event_duration_hours` (NUMERIC)
- Added `buffet_required` (BOOLEAN, default FALSE)
- Added `buffet_package` (TEXT)
- Added `special_requirements` (TEXT)
- Added `guest_company` (TEXT) - already exists from previous migration

### 2. Booking Form (`BookConferenceRoom.tsx`)
**New Input Fields:**
- Event Type (Select): Corporate Meeting, Workshop/Training, Wedding/Party, Conference, Seminar, Other
- Event Duration Hours (Number): 0.5 to 24 hours, step 0.5
- Buffet Required (Checkbox): Yes/No
- Buffet Package (Select, appears when buffet checked): Standard, Premium, Deluxe, Custom
- Special Requirements (Textarea): Free text for additional requests
- Company/Organization (Text): Already existing field

**Booking Payload:**
- All new fields are included in the `conference_bookings` insert
- Data is stored both in dedicated columns and in the notes field for backward compatibility

### 3. Receipt Design (`ReceiptGenerator.tsx`)
**Conference Receipt Features:**
- Shows "EVENT DETAILS" instead of "BOOKING DETAILS"
- Displays:
  - Event Date (instead of Check-in/Check-out)
  - Event Type
  - Number of Attendees
  - Duration (hours)
  - Booking Days
  - Rate per Day
- New sections:
  - BUFFET SERVICE (if buffet_required = true)
    - Shows "Buffet Included: Yes"
    - Shows selected buffet package
  - SPECIAL REQUIREMENTS (if provided)
    - Shows special requirements text

### 4. Booking Details Dialog (`BookingDetailsDialog.tsx`)
**Conference Receipt Data:**
- Now includes all new conference-specific fields
- Properly calculates days from start_datetime to end_datetime
- Passes all fields to ReceiptGenerator

## Testing Checklist

### Phase 1: Database Migration
- [ ] Apply migration: `20251117000002_add_conference_event_fields.sql`
- [ ] Verify columns exist in `conference_bookings` table
- [ ] Verify default values (buffet_required = FALSE)

### Phase 2: Conference Room Booking (All User Roles)
#### As Receptionist:
- [ ] Navigate to available conference rooms
- [ ] Select a conference room
- [ ] Fill in all new fields:
  - [ ] Event Type: Select "Corporate Meeting"
  - [ ] Event Duration: Enter "4" hours
  - [ ] Attendees: Enter a number
  - [ ] Check "Buffet Required"
  - [ ] Select "Premium" buffet package
  - [ ] Enter special requirements: "Projector, Whiteboard, Coffee breaks every 2 hours"
  - [ ] Enter Company: "Test Company Ltd"
- [ ] Complete booking with payment
- [ ] Verify booking is created successfully
- [ ] Check that receipt shows:
  - [ ] "EVENT DETAILS" header
  - [ ] Event Type: Corporate Meeting
  - [ ] Duration: 4 hours
  - [ ] Attendees: [your number]
  - [ ] BUFFET SERVICE section appears
  - [ ] Premium package shown
  - [ ] SPECIAL REQUIREMENTS section appears with your text
  - [ ] Company name shown in guest details

#### As Admin:
- [ ] Repeat booking process
- [ ] Verify all features work identically

### Phase 3: Booking Management & Details
#### View Booking Details:
- [ ] Navigate to Booking Management
- [ ] Click on a conference booking
- [ ] In BookingDetailsDialog, click "Print Receipt"
- [ ] Verify receipt shows:
  - [ ] All event-specific details
  - [ ] Buffet section (if applicable)
  - [ ] Special requirements section (if applicable)
  - [ ] Company information
  - [ ] Professional conference-specific layout

#### Payment Verification:
- [ ] Navigate to Payment Verification page
- [ ] View a conference booking payment
- [ ] Verify company field is displayed
- [ ] Verify guest count is displayed correctly

### Phase 4: Receipt Comparison
#### Hotel Receipt (Control Test):
- [ ] Create a hotel booking
- [ ] View receipt
- [ ] Verify it shows:
  - [ ] "BOOKING DETAILS" (not "EVENT DETAILS")
  - [ ] Check-in/Check-out dates
  - [ ] Nights (not days)
  - [ ] Room price per night
  - [ ] NO buffet or special requirements sections

#### Conference Receipt:
- [ ] Create a conference booking with all fields filled
- [ ] View receipt
- [ ] Verify it shows:
  - [ ] "EVENT DETAILS" (not "BOOKING DETAILS")
  - [ ] Event date
  - [ ] Event type, attendees, duration
  - [ ] Days (not nights)
  - [ ] Rate per day
  - [ ] Buffet service section (if applicable)
  - [ ] Special requirements section (if applicable)

### Phase 5: Edge Cases
- [ ] Conference booking WITHOUT buffet
  - [ ] Verify buffet section does not appear on receipt
- [ ] Conference booking WITHOUT special requirements
  - [ ] Verify special requirements section does not appear
- [ ] Conference booking WITHOUT company
  - [ ] Verify "Not provided" is shown
- [ ] Conference booking with 0.5 hour duration
  - [ ] Verify half-hour duration is accepted and displayed
- [ ] Conference booking with empty event type
  - [ ] Verify booking works and receipt shows field only if provided

### Phase 6: Data Integrity
- [ ] Check database directly:
  ```sql
  SELECT id, event_type, event_duration_hours, buffet_required, 
         buffet_package, special_requirements, guest_company
  FROM conference_bookings
  ORDER BY created_at DESC
  LIMIT 5;
  ```
- [ ] Verify all fields are stored correctly
- [ ] Verify null values for optional fields

### Phase 7: Cross-User Consistency
- [ ] Log in as Receptionist, create conference booking
- [ ] Log in as Admin, view same booking
- [ ] Verify all details are consistent across user roles
- [ ] Verify receipt generation works identically for both roles

## Expected Results
✅ All conference bookings include event-specific information
✅ Conference receipts have a distinct professional design
✅ Hotel receipts remain unchanged
✅ All user roles (receptionist, admin) can access new features
✅ Data is stored correctly and displayed coherently
✅ Optional fields gracefully handle empty/null values
✅ No compilation or runtime errors

## Rollback Plan
If issues arise:
1. Database migration is additive (no data loss)
2. Can comment out new fields in forms
3. Receipt generator gracefully handles missing fields
4. No breaking changes to existing functionality

## Performance Considerations
- New fields are optional and lightweight (TEXT, NUMERIC, BOOLEAN)
- No impact on query performance
- Receipt generation time remains the same

## Next Steps After Testing
1. Mark all test cases as passed ✓
2. Document any issues found
3. Fix critical issues if any
4. Deploy to production (Git push)
5. Monitor for 24 hours
6. Collect user feedback

---

**Testing Date:** [To be filled]
**Tested By:** [To be filled]
**Environment:** Development
**Status:** Ready for Testing




