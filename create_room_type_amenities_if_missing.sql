-- Create room_type_amenities table if it doesn't exist
-- Run this in your Supabase SQL Editor

-- Check if table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_type_amenities') THEN
        -- Create the table
        CREATE TABLE public.room_type_amenities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
            amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE(room_type_id, amenity_id)
        );

        -- Enable RLS
        ALTER TABLE public.room_type_amenities ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Everyone can view room type amenities" ON public.room_type_amenities
        FOR SELECT USING (true);

        CREATE POLICY "Admins can manage room type amenities" ON public.room_type_amenities
        FOR ALL USING (get_current_user_role() = 'Admin'::app_role);

        RAISE NOTICE 'room_type_amenities table created successfully';
    ELSE
        RAISE NOTICE 'room_type_amenities table already exists';
    END IF;
END $$;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'room_type_amenities'
ORDER BY ordinal_position;

-- Show any existing data
SELECT 'Existing room_type_amenities data:' as info;
SELECT 
    rt.name as room_type_name,
    a.name as amenity_name,
    rta.created_at
FROM room_type_amenities rta
JOIN room_types rt ON rta.room_type_id = rt.id
JOIN amenities a ON rta.amenity_id = a.id
ORDER BY rt.name, a.name;

