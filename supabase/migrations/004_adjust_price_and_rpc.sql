-- 1. Create Base Prices Table
create table if not exists public.variant_base_prices (
  id uuid primary key default uuid_generate_v4(),
  variant_id uuid not null unique references public.product_variants(id) on delete cascade,
  price numeric not null check (price > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS) on the new table
alter table public.variant_base_prices enable row level security;

-- 3. Add RLS Policies
create policy "Allow authenticated users to read base prices" on public.variant_base_prices 
  for select using (auth.role() = 'authenticated');

create policy "Allow admins full access to base prices" on public.variant_base_prices 
  for all using (public.get_user_role() = 'admin');

-- 4. Drop the price column from product_variants to secure it from guest access
alter table public.product_variants drop column if exists price;

-- 5. Create safe email by mobile lookup RPC
create or replace function public.get_email_by_mobile(mobile_number text)
returns text
security definer
as $$
declare
  found_email text;
begin
  select email into found_email from public.profiles where mobile = mobile_number limit 1;
  return found_email;
end;
$$ language plpgsql;
