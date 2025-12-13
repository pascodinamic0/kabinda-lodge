
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xgcsmkapakcyqxzxpuqk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY3Nta2FwYWtjeXF4enhwdXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTQ3NTEsImV4cCI6MjA2NzkzMDc1MX0.N2ZaSfNJ-xOVQbevNIG7GejZPGmpImGRGIXP4uvumew';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBookings() {
  console.log('Fetching bookings...');
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      room_id,
      rooms (
        id,
        name
      )
    `)
    .limit(10);

  if (error) {
    console.error('Error fetching bookings:', error);
    return;
  }

  console.log('Bookings Sample:');
  bookings.forEach(b => {
    console.log(`Booking ID: ${b.id}, Room ID: ${b.room_id}, Room Data:`, b.rooms);
  });

  console.log('\nFetching Rooms...');
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('id, name')
    .order('id');

  if (roomsError) {
    console.error('Error fetching rooms:', roomsError);
    return;
  }

  console.log('Rooms List:');
  rooms.forEach(r => {
    console.log(`Room ID: ${r.id}, Name: "${r.name}"`);
  });
}

inspectBookings();
