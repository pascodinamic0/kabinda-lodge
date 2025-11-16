# 📊 How to Apply the Card Programming Database Migration

## Issue
The `supabase db push` command didn't work because **Supabase CLI is not installed** on your system.

---

## ✅ Solution: 2 Easy Options

### Option 1: Apply Manually via Supabase Dashboard (RECOMMENDED - FASTEST)

This is the quickest method and doesn't require installing anything new.

#### Steps:

1. **Go to your Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Login to your account
   - Select your **Kabinda Lodge** project

2. **Open the SQL Editor**
   - In the left sidebar, click **"SQL Editor"**
   - Click **"New query"** button

3. **Copy the Migration SQL**
   - Open the file: `supabase/migrations/20251115000001_add_card_programming_fields.sql`
   - Copy ALL the contents (Ctrl+A, Ctrl+C)

4. **Paste and Run**
   - Paste the SQL into the Supabase SQL Editor
   - Click **"Run"** or press **Ctrl+Enter**

5. **Verify Success**
   - You should see: "Success. No rows returned"
   - The new tables and columns are now created!

**Time**: ~2 minutes

---

### Option 2: Install Supabase CLI and Push (If you prefer CLI)

If you want to use the CLI for future migrations:

#### Install Supabase CLI:

**For macOS (using Homebrew)**:
```bash
brew install supabase/tap/supabase
```

**For macOS (using npm)**:
```bash
npm install -g supabase
```

**Verify Installation**:
```bash
supabase --version
```

#### Link Your Project:
```bash
cd "/Users/Pascal Digny/Github Lab/Kabinda Lodge"
supabase link --project-ref YOUR_PROJECT_REF
```

To find your `PROJECT_REF`:
- Go to your Supabase Dashboard → Project Settings → General
- Copy the "Reference ID"

#### Push the Migration:
```bash
supabase db push
```

**Time**: ~5-10 minutes (including installation)

---

## 📋 What the Migration Does

The migration creates the following database changes:

### New Columns in `key_cards` table:
- `card_uid` - Unique identifier from physical card
- `card_type` - Type of card (authorization_1, installation, etc.)
- `booking_id` - Links card to booking
- `programming_status` - Status (pending, success, failed)
- `programming_data` - Data written to card (JSONB)
- `last_programmed_at` - Timestamp of last programming

### New Table: `card_programming_log`
- Audit log of all card programming attempts
- Tracks who programmed which card
- Records success/failure for each attempt
- Stores error messages for failed attempts

### Security (RLS Policies):
- Only Admin, Receptionist, and SuperAdmin can access
- Complete audit trail of all operations

---

## 🎯 RECOMMENDED: Use Option 1 (Dashboard)

**Why?**
- ✅ No installation needed
- ✅ Works immediately
- ✅ Visual feedback
- ✅ Easier to verify success
- ✅ Takes only 2 minutes

---

## 📝 Migration SQL File Location

```
supabase/migrations/20251115000001_add_card_programming_fields.sql
```

I'll display the full SQL content below so you can easily copy it:

---

## 🔍 Verify Migration Applied Successfully

After applying the migration (either method), verify it worked:

### Check in Supabase Dashboard:
1. Go to **Table Editor**
2. Find the `key_cards` table
3. You should see the new columns: `card_uid`, `card_type`, `booking_id`, etc.
4. You should see a new table: `card_programming_log`

### OR Check via SQL Editor:
```sql
-- Check if new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'key_cards' 
AND column_name IN ('card_uid', 'card_type', 'booking_id', 'programming_status');

-- Check if new table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'card_programming_log';
```

If these queries return results, the migration was successful! ✅

---

## ⏭️ After Migration is Applied

Once the migration is done, you're **100% ready** to use the card programming system!

1. ✅ Bridge Service - Running (port 3001)
2. ✅ Web App - Running (port 5173)
3. ✅ Database Migration - Applied
4. 🎯 **Ready to use!**

### Try It Now:
1. Open http://localhost:5173
2. Login as Receptionist
3. Go to any booking details
4. Click **"Program Key Cards"** button
5. The system is fully functional! 🎉

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the SQL syntax in the migration file
2. Look for error messages in Supabase dashboard
3. Make sure you're connected to the correct project
4. Try refreshing the Supabase dashboard

---

**Next Step**: Use **Option 1** (Dashboard method) - it's the fastest! 🚀

