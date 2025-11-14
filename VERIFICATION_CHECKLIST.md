# Partner Promotions - Verification Checklist

Use this checklist to verify the partner promotions system is working correctly.

## ✅ Pre-Testing Setup

- [ ] Dev server is running (`npm run dev`)
- [ ] Database migrations have been applied
- [ ] You have Super Admin access
- [ ] You have Receptionist access
- [ ] Browser console is open (F12 → Console tab)

## ✅ Part 1: Super Admin - Create Partner Promotion

### Create Percentage Discount Promotion

- [ ] Login as Super Admin
- [ ] Navigate to **Promotions Management**
- [ ] Click **"Add Promotion"** button
- [ ] Form appears with all fields visible
- [ ] Select **"Partner Promotion"** from Promotion Type dropdown
- [ ] Additional partner fields appear:
  - [ ] Partner Name input field visible
  - [ ] Minimum Booking Amount field visible
  - [ ] Maximum Uses field visible
  - [ ] Active Status toggle visible
- [ ] Fill in the form:
  - [ ] Title: `TechCorp Employee Benefits`
  - [ ] Description: `Corporate discount for TechCorp employees`
  - [ ] Partner Name: `TechCorp`
  - [ ] Minimum Amount: `100`
  - [ ] Maximum Uses: `1000`
  - [ ] Discount Type: **Percentage (%) Off**
  - [ ] Discount Percentage: `25`
  - [ ] Start Date: Today
  - [ ] End Date: 1 year from today
  - [ ] Active Status: **ON** (toggle is blue/green)
- [ ] Click **"Create Promotion"**
- [ ] Success message appears: "Promotion created successfully"
- [ ] Promotion appears in the table
- [ ] Table shows correct values:
  - [ ] Title: "TechCorp Employee Benefits"
  - [ ] Type badge: "Partner"
  - [ ] Partner: "TechCorp"
  - [ ] Discount: "25% OFF"
  - [ ] Usage: "0"
  - [ ] Status: "active" (green badge)

### Create Fixed Amount Discount Promotion

- [ ] Click **"Add Promotion"** again
- [ ] Select **"Partner Promotion"**
- [ ] Fill in:
  - [ ] Title: `NGO Flat Discount`
  - [ ] Description: `$75 flat discount for NGO partners`
  - [ ] Partner Name: `NGO Alliance`
  - [ ] Minimum Amount: `200`
  - [ ] Maximum Uses: Leave empty
  - [ ] Discount Type: **Fixed Amount ($) Off**
  - [ ] Discount Amount: `75`
  - [ ] Start Date: Today
  - [ ] End Date: 6 months from today
  - [ ] Active Status: **ON**
- [ ] Click **"Create Promotion"**
- [ ] Success message appears
- [ ] Promotion appears in table with:
  - [ ] Discount showing "$75 OFF" or similar

### Test Edit Functionality

- [ ] Click **edit button** (pencil icon) on TechCorp promotion
- [ ] Form opens with ALL fields populated:
  - [ ] Title filled
  - [ ] Description filled
  - [ ] Partner Name: "TechCorp"
  - [ ] Minimum Amount: "100"
  - [ ] Maximum Uses: "1000"
  - [ ] Discount Type: "Percentage"
  - [ ] Discount Percentage: "25"
  - [ ] Active Status: ON
- [ ] Change minimum amount to `150`
- [ ] Click **"Update Promotion"**
- [ ] Success message appears
- [ ] Close dialog without refreshing
- [ ] Edit again to verify change was saved
- [ ] Minimum amount shows "150"

## ✅ Part 2: Database Verification

Open your database tool and run:

```sql
SELECT 
    id,
    title,
    promotion_type,
    partner_name,
    discount_type,
    discount_percent,
    discount_amount,
    minimum_amount,
    maximum_uses,
    current_uses,
    is_active,
    start_date,
    end_date
FROM promotions
WHERE promotion_type = 'partner'
ORDER BY created_at DESC;
```

Verify:
- [ ] Both promotions exist in database
- [ ] `promotion_type` = 'partner' (NOT null, NOT 'general')
- [ ] `partner_name` is filled (NOT null)
- [ ] `discount_type` is 'percentage' or 'fixed'
- [ ] `minimum_amount` has correct values
- [ ] `maximum_uses` has correct values (or null)
- [ ] `is_active` = true
- [ ] `current_uses` = 0

## ✅ Part 3: Receptionist - Booking with Partner Promotions

### Navigate to Booking

- [ ] Logout from Super Admin
- [ ] Login as Receptionist
- [ ] Go to **Rooms** page
- [ ] Select any available room
- [ ] Click **"Book Room"**

### Fill Guest Information

- [ ] Fill in required fields:
  - [ ] Guest Name: `John Smith`
  - [ ] Email: `john@techcorp.com`
  - [ ] Phone: `+1234567890`
  - [ ] Check-in Date: Tomorrow
  - [ ] Check-out Date: 3 days from tomorrow (2 nights)
  - [ ] Guests: 1
- [ ] Verify total shows in price summary (e.g., $300 for 2 nights at $150/night)

### Test Booking Type Selection

- [ ] Scroll to **"Booking Type"** section
- [ ] Two cards are visible:
  - [ ] "Standard Guest" card
  - [ ] "Partner Client" card
- [ ] Click **"Partner Client"**
- [ ] Card highlights with blue/primary border
- [ ] "Loading partner promotions..." message appears briefly

### Verify Promotions Load

Check browser console:
- [ ] See: `🔍 Fetching partner promotions...`
- [ ] See: `📦 Primary response:` with data array
- [ ] See: `✅ Filtered partner promotions:` with promotions
- [ ] No errors in console

On page:
- [ ] "Partner Promotion" dropdown/section appears
- [ ] At least 2 promotions are listed:
  - [ ] TechCorp promotion visible
  - [ ] NGO Alliance promotion visible
- [ ] Each promotion shows:
  - [ ] Partner name
  - [ ] Discount badge (percentage or fixed amount)
  - [ ] Description (if any)
  - [ ] Minimum amount requirement

### Test Minimum Amount Requirement

If booking total is less than minimum:
- [ ] Promotion shows but may have warning
- [ ] Or promotion is filtered out

If booking total meets minimum:
- [ ] Promotion is selectable
- [ ] No warnings shown

### Select and Apply Promotion

- [ ] Click on **TechCorp promotion** card
- [ ] Card highlights/selects
- [ ] Green success box appears below showing:
  - [ ] Promotion title: "TechCorp Employee Benefits"
  - [ ] Partner: TechCorp
  - [ ] Discount calculation
  - [ ] "Nightly savings: $XX.XX"
  - [ ] "New nightly rate: $XX.XX"
  - [ ] "New total: $XX.XX (you save $XX.XX)"

### Verify Discount Calculation

Original booking: $300 (2 nights × $150)
TechCorp discount: 25%
Expected discount: $75
Expected total: $225

- [ ] Discount amount = $75
- [ ] New total = $225
- [ ] Calculations are correct

### Continue to Payment

- [ ] Click **"Continue to Payment"**
- [ ] Payment screen shows:
  - [ ] "Amount Due: $225"
  - [ ] Breakdown section with:
    - [ ] Subtotal: $300
    - [ ] Partner discount: -$75 (in green)
    - [ ] Total: $225

## ✅ Part 4: Test Edge Cases

### Test with NGO Promotion (Fixed Discount)

- [ ] Go back to booking
- [ ] Change dates to make total > $200 (NGO minimum)
- [ ] Select "Partner Client"
- [ ] Click NGO Alliance promotion
- [ ] Verify fixed $75 discount is applied
- [ ] Verify math: Original - $75 = Final

### Test Active/Inactive Toggle

- [ ] As Super Admin, edit TechCorp promotion
- [ ] Turn **OFF** Active Status toggle
- [ ] Save
- [ ] As Receptionist, try booking again
- [ ] Select "Partner Client"
- [ ] TechCorp promotion should **NOT** appear in list
- [ ] Only NGO promotion visible

- [ ] As Super Admin, turn Active Status back **ON**
- [ ] As Receptionist, refresh/try again
- [ ] TechCorp promotion appears again

### Test "No Promotion" Option

- [ ] In booking, select "Partner Client"
- [ ] At top of promotions list, there's a "No promotion" option
- [ ] Click "No promotion"
- [ ] Discount section disappears
- [ ] Total returns to original amount
- [ ] Can still proceed to payment

## ✅ Part 5: System Integration

### Check Promotion Usage Tracking

After completing a booking with a promotion:
- [ ] As Super Admin, go to Promotions Management
- [ ] Check TechCorp promotion in table
- [ ] "Usage" column should increment (was 0, now 1)
- [ ] Or check **Usage Analytics** tab for detailed stats

### Check Maximum Uses Limit

If you set max uses to a low number (e.g., 2):
- [ ] Create test bookings until limit is reached
- [ ] Promotion should disappear from receptionist list
- [ ] Or show "limit reached" message

## 🎯 Final Verification

All checks passed? System is working! ✅

### Quick Success Indicators:
- ✅ Super Admin form saves all partner fields
- ✅ Database has partner promotions with correct data
- ✅ Receptionist sees partner promotions when booking
- ✅ Discounts calculate correctly (percentage and fixed)
- ✅ Payment screen shows proper breakdown
- ✅ Active/Inactive toggle works
- ✅ Usage tracking increments

## 🐛 If Something Fails:

1. **Promotions not appearing for receptionist:**
   - Run: `fix_partner_promotions.sql`
   - Check console for errors
   - Verify `promotion_type = 'partner'` in database

2. **Discount calculations wrong:**
   - Verify `discount_type` field in database
   - Check `discount_percent` or `discount_amount` values
   - Look at browser console logs

3. **Form not saving fields:**
   - Clear browser cache
   - Check if changes to PromotionsManagement.tsx are deployed
   - Verify no TypeScript errors

4. **Database errors:**
   - Check RLS policies
   - Verify promotions table has all columns
   - Run migrations again if needed

---

**Date Tested:** _______________
**Tested By:** _______________
**Result:** ☐ All Passed  ☐ Issues Found (see notes)
**Notes:** _______________________________________________

