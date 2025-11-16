# Testing Partner Promotions - Quick Guide

## Prerequisites
- System should be running (npm run dev)
- You should have Super Admin and Receptionist accounts

## Test 1: Create Partner Promotion (Super Admin)

1. **Login as Super Admin**
2. **Navigate to Promotions Management**
   - From dashboard, go to Settings → Promotions Management
3. **Click "Add Promotion"**
4. **Fill in the form:**
   - Promotion Type: **Partner Promotion**
   - Promotion Title: `TechCorp Employee Discount`
   - Description: `Exclusive discount for TechCorp staff members`
   - Partner Name: `TechCorp`
   - Minimum Booking Amount: `100`
   - Maximum Uses: `500` (optional)
   - Discount Type: **Percentage (%) Off**
   - Discount Percentage: `20`
   - Start Date: Today's date
   - End Date: One year from now
   - Active Status: **ON** (toggle should be green)
5. **Click "Create Promotion"**
6. **Verify** the promotion appears in the table with:
   - Type badge showing "Partner"
   - Partner name "TechCorp"
   - Discount showing "20% OFF"
   - Status showing "active" (green)

## Test 2: Create Another Partner Promotion (Fixed Discount)

1. **Click "Add Promotion"** again
2. **Fill in:**
   - Promotion Type: **Partner Promotion**
   - Promotion Title: `NGO Alliance Special Rate`
   - Description: `Fixed discount for NGO Alliance members`
   - Partner Name: `NGO Alliance`
   - Minimum Booking Amount: `200`
   - Maximum Uses: Leave empty
   - Discount Type: **Fixed Amount ($) Off**
   - Discount Amount: `50`
   - Start Date: Today
   - End Date: 6 months from now
   - Active Status: **ON**
3. **Click "Create Promotion"**
4. **Verify** it appears in the table

## Test 3: Book Room with Partner Promotion (Receptionist)

1. **Login as Receptionist**
2. **Navigate to Rooms**
3. **Select any available room** and click "Book Room"
4. **Fill in guest details:**
   - Guest Name: `John Doe`
   - Email: `john@techcorp.com`
   - Phone: Any valid number
   - Select check-in and check-out dates
   - Number of guests: 1

5. **Scroll to "Booking Type" section**
   - You should see two cards:
     - ✅ **Standard Guest**
     - ✅ **Partner Client**

6. **Click "Partner Client"**
   - The card should highlight with a blue border
   - Partner promotions section should appear below

7. **Verify Partner Promotions Load**
   - Check browser console (F12 → Console tab)
   - You should see logs like:
     ```
     🔍 Fetching partner promotions...
     📦 Primary response: { data: [...], error: null }
     📊 Raw promotions data: [...]
     ✅ Filtered partner promotions: [...]
     ```
   - If you see errors, check the database

8. **Select a Partner Promotion**
   - You should see cards for each partner company:
     - TechCorp Employee Discount (20% off)
     - NGO Alliance Special Rate ($50 OFF)
   - Click on "TechCorp Employee Discount"

9. **Verify Discount Applied**
   - Below the promotions, you should see a green box showing:
     - "TechCorp Employee Discount"
     - Partner: TechCorp
     - Nightly savings calculation
     - New total with discount
     - "you save $XX.XX"

10. **Continue to Payment**
    - The payment screen should show:
      - Subtotal: Original price
      - Partner discount: -$XX.XX (in green)
      - Total: Discounted price

## Test 4: Verify Eligibility Requirements

1. **Test Minimum Amount Requirement**
   - Book a room for 1 night (should be less than $100)
   - Select "Partner Client"
   - TechCorp promotion (min $100) should show warning if booking is below minimum
   
2. **Test Active/Inactive Status**
   - As Super Admin, go to Promotions Management
   - Edit TechCorp promotion
   - Turn OFF the "Active Status" toggle
   - Save
   - As Receptionist, try to book again
   - TechCorp promotion should NOT appear in the list

3. **Re-enable the Promotion**
   - Edit again and turn Active Status back ON
   - Verify it appears again for receptionist

## Expected Console Output (When Working)

When receptionist selects "Partner Client", you should see:
```
🔍 Fetching partner promotions...
📦 Primary response: { 
  data: [
    {
      id: 1,
      title: "TechCorp Employee Discount",
      partner_name: "TechCorp",
      promotion_type: "partner",
      is_active: true,
      discount_type: "percentage",
      discount_percent: 20,
      minimum_amount: 100,
      ...
    }
  ],
  error: null 
}
📊 Raw promotions data: [Object...]
✅ Filtered partner promotions: [Object...]
```

## Troubleshooting

### No promotions showing?
1. Check browser console for errors
2. Verify promotions exist in database:
   ```sql
   SELECT * FROM promotions WHERE promotion_type = 'partner' AND is_active = true;
   ```
3. Run the fix script if needed:
   ```bash
   psql -d your_database < fix_partner_promotions.sql
   ```

### "Loading partner promotions..." never completes?
- Check network tab for API errors
- Verify Supabase connection
- Check RLS policies on promotions table

### Discount not calculating correctly?
- Verify booking amount meets minimum requirement
- Check discount_type and discount_amount/discount_percent values in database
- Look at browser console for calculation logs

## Success Criteria

✅ Super Admin can create partner promotions with all fields
✅ Promotions show correct type, partner name, and discount in admin table
✅ Receptionist sees "Partner Client" option when booking
✅ Partner promotions load and display when "Partner Client" is selected
✅ Selecting a promotion applies the correct discount
✅ Payment screen shows original price, discount, and final total
✅ Minimum amount requirements are enforced
✅ Active/Inactive status works correctly









