-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('Admin', 'Receptionist', 'RestaurantLead');

-- Create Users table (profiles)
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role app_role NOT NULL DEFAULT 'Receptionist',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Rooms table
CREATE TABLE public.rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'occupied', 'maintenance')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Bookings table
CREATE TABLE public.bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id INTEGER NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'checked-in', 'checked-out', 'cancelled')),
  total_price NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MenuItems table
CREATE TABLE public.menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Orders table
CREATE TABLE public.orders (
  id SERIAL PRIMARY KEY,
  table_number INTEGER,
  waiter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  tracking_number TEXT UNIQUE NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create OrderItems table
CREATE TABLE public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  notes TEXT
);

-- Create Payments table
CREATE TABLE public.payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES public.bookings(id) ON DELETE SET NULL,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('Airtel Money DRC', 'Vodacom M-Pesa DRC', 'Equity BCDC')),
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Promotions table
CREATE TABLE public.promotions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'Receptionist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for Users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.get_current_user_role() = 'Admin');

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (public.get_current_user_role() = 'Admin');

CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (public.get_current_user_role() = 'Admin');

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (public.get_current_user_role() = 'Admin');

-- RLS Policies for Rooms table
CREATE POLICY "Everyone can view rooms" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage rooms" ON public.rooms
  FOR ALL USING (public.get_current_user_role() = 'Admin');

CREATE POLICY "Receptionists can update room status" ON public.rooms
  FOR UPDATE USING (public.get_current_user_role() IN ('Admin', 'Receptionist'));

-- RLS Policies for Bookings table
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Staff can view all bookings" ON public.bookings
  FOR SELECT USING (public.get_current_user_role() IN ('Admin', 'Receptionist'));

CREATE POLICY "Staff can manage bookings" ON public.bookings
  FOR ALL USING (public.get_current_user_role() IN ('Admin', 'Receptionist'));

-- RLS Policies for Menu Items table
CREATE POLICY "Everyone can view menu items" ON public.menu_items
  FOR SELECT USING (true);

CREATE POLICY "Restaurant staff can manage menu" ON public.menu_items
  FOR ALL USING (public.get_current_user_role() IN ('Admin', 'RestaurantLead'));

-- RLS Policies for Orders table
CREATE POLICY "Restaurant staff can view orders" ON public.orders
  FOR SELECT USING (public.get_current_user_role() IN ('Admin', 'RestaurantLead') OR waiter_id = auth.uid());

CREATE POLICY "Restaurant staff can manage orders" ON public.orders
  FOR ALL USING (public.get_current_user_role() IN ('Admin', 'RestaurantLead'));

-- RLS Policies for Order Items table
CREATE POLICY "Restaurant staff can view order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (public.get_current_user_role() IN ('Admin', 'RestaurantLead') OR orders.waiter_id = auth.uid())
    )
  );

CREATE POLICY "Restaurant staff can manage order items" ON public.order_items
  FOR ALL USING (public.get_current_user_role() IN ('Admin', 'RestaurantLead'));

-- RLS Policies for Payments table
CREATE POLICY "Staff can view payments" ON public.payments
  FOR SELECT USING (public.get_current_user_role() IN ('Admin', 'Receptionist'));

CREATE POLICY "Staff can manage payments" ON public.payments
  FOR ALL USING (public.get_current_user_role() IN ('Admin', 'Receptionist'));

-- RLS Policies for Promotions table
CREATE POLICY "Everyone can view active promotions" ON public.promotions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage promotions" ON public.promotions
  FOR ALL USING (public.get_current_user_role() = 'Admin');

-- Insert some sample data
INSERT INTO public.rooms (name, type, price, status, description) VALUES
('Room 101', 'single', 50000, 'available', 'Comfortable single room with city view'),
('Room 102', 'double', 80000, 'available', 'Spacious double room with garden view'),
('Room 201', 'suite', 120000, 'available', 'Luxury suite with balcony'),
('Room 202', 'double', 80000, 'maintenance', 'Double room currently under maintenance');

INSERT INTO public.menu_items (name, description, category, price, is_available) VALUES
('Grilled Chicken', 'Tender grilled chicken with herbs', 'Main Course', 15000, true),
('Fish & Chips', 'Fresh fish with crispy fries', 'Main Course', 18000, true),
('Caesar Salad', 'Fresh lettuce with caesar dressing', 'Appetizer', 8000, true),
('Chocolate Cake', 'Rich chocolate cake slice', 'Dessert', 6000, true),
('Local Beer', 'Cold local beer', 'Beverages', 3000, true);

INSERT INTO public.promotions (title, description, discount_percent, start_date, end_date) VALUES
('Weekend Special', 'Get 20% off on weekend bookings', 20, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('Happy Hour', '15% off on food orders between 4-6 PM', 15, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days');