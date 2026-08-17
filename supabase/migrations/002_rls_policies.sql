-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.dealer_prices enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.delivery_challans enable row level security;
alter table public.delivery_challan_items enable row level security;
alter table public.system_settings enable row level security;

-- Helper function to fetch role
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer;

-- 1. PROFILES POLICIES
create policy "Allow profile creation during signup" on public.profiles for insert with check (auth.uid() = id);
create policy "Allow users to read own profile" on public.profiles for select using (auth.uid() = id or public.get_user_role() = 'admin');
create policy "Allow profile update by own user or admin" on public.profiles for update using (auth.uid() = id or public.get_user_role() = 'admin');

-- 2. COMPANIES POLICIES
create policy "Allow anyone to read active companies" on public.companies for select using (status = 'active' or public.get_user_role() = 'admin');
create policy "Allow admins full access to companies" on public.companies for all using (public.get_user_role() = 'admin');

-- 3. PRODUCTS POLICIES
create policy "Allow anyone to read active products" on public.products for select using (archived = false or public.get_user_role() = 'admin');
create policy "Allow admins full access to products" on public.products for all using (public.get_user_role() = 'admin');

-- 4. PRODUCT VARIANTS POLICIES
create policy "Allow anyone to read variants" on public.product_variants for select using (true);
create policy "Allow admins full access to variants" on public.product_variants for all using (public.get_user_role() = 'admin');

-- 5. DEALER PRICES POLICIES
create policy "Allow dealers to read their own prices" on public.dealer_prices for select using (auth.uid() = dealer_id or public.get_user_role() = 'admin');
create policy "Allow admins full access to dealer prices" on public.dealer_prices for all using (public.get_user_role() = 'admin');

-- 6. ORDERS POLICIES
create policy "Allow dealers to create orders" on public.orders for insert with check (auth.uid() = dealer_id);
create policy "Allow users to read their own orders" on public.orders for select using (auth.uid() = dealer_id or public.get_user_role() = 'admin');
create policy "Allow updates by admins or dealers on new orders" on public.orders for update using (public.get_user_role() = 'admin' or (auth.uid() = dealer_id and order_status = 'new'));

-- 7. ORDER ITEMS POLICIES
create policy "Allow users to create order items" on public.order_items for insert with check (exists (select 1 from public.orders where orders.id = order_id and orders.dealer_id = auth.uid()));
create policy "Allow users to read order items" on public.order_items for select using (exists (select 1 from public.orders where orders.id = order_id and (orders.dealer_id = auth.uid() or public.get_user_role() = 'admin')));
create policy "Allow admins to update order items" on public.order_items for update using (public.get_user_role() = 'admin');

-- 8. DELIVERY CHALLANS POLICIES
create policy "Allow users to read own challans" on public.delivery_challans for select using (auth.uid() = dealer_id or public.get_user_role() = 'admin');
create policy "Allow admins full access to challans" on public.delivery_challans for all using (public.get_user_role() = 'admin');

-- 9. DELIVERY CHALLAN ITEMS POLICIES
create policy "Allow users to read challan items" on public.delivery_challan_items for select using (exists (select 1 from public.delivery_challans where delivery_challans.id = challan_id and (delivery_challans.dealer_id = auth.uid() or public.get_user_role() = 'admin')));
create policy "Allow admins full access to challan items" on public.delivery_challan_items for all using (public.get_user_role() = 'admin');

-- 10. SYSTEM SETTINGS POLICIES
create policy "Allow anyone to read system settings" on public.system_settings for select using (true);
create policy "Allow admins to modify system settings" on public.system_settings for update using (public.get_user_role() = 'admin');
