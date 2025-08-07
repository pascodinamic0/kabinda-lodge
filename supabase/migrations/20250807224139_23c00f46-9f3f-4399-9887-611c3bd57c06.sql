
-- 1) Extend orders to support guest ownership and fulfillment details
alter table public.orders
  add column if not exists user_id uuid,
  add column if not exists fulfillment_type text not null default 'table',
  add column if not exists delivery_address text,
  add column if not exists room_number text;

-- 2) RLS policies for guest-created orders
-- Allow authenticated users to create their own orders
create policy "Users can create their own orders"
  on public.orders
  for insert
  to authenticated
  with check (auth.uid() is not null and user_id = auth.uid());

-- Allow authenticated users to view their own orders
create policy "Users can view their own orders"
  on public.orders
  for select
  to authenticated
  using (auth.uid() is not null and user_id = auth.uid());

-- Note: Existing staff policies remain in place and continue to work for Admin/RestaurantLead

-- 3) RLS policies for payments linked to guest orders
-- Allow authenticated users to create payments for their own orders
create policy "Users can create payments for their orders"
  on public.payments
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = payments.order_id
        and o.user_id = auth.uid()
    )
  );

-- Allow authenticated users to view payments for their own orders
create policy "Users can view their own order payments"
  on public.payments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = payments.order_id
        and o.user_id = auth.uid()
    )
  );
