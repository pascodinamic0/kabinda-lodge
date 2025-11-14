-- Enable real-time for users table
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Enable real-time for housekeeping_tasks table  
ALTER TABLE public.housekeeping_tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.housekeeping_tasks;

-- Enable real-time for rooms table
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

-- Enable real-time for key_cards table
ALTER TABLE public.key_cards REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.key_cards;