-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Admins and Dealers)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'dealer' check (role in ('admin', 'dealer')),
  name text not null,
  shop_name text,
  mobile text not null unique,
  email text not null unique,
  address text,
  gst_number text,
  city text,
  district text,
  state text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. COMPANIES / BRANDS
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  logo text,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PRODUCTS
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete restrict,
  name text not null,
  brand text not null, -- cached company name for immediate UI access
  category text not null,
  description text,
  tech_specs text,
  image_url text,
  archived boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (company_id, name)
);

-- 4. PRODUCT VARIANTS
create table public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  pack_size numeric not null,
  unit text not null,
  price numeric not null, -- base price
  available boolean not null default true,
  archived boolean not null default false,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (product_id, pack_size, unit)
);

-- 5. DEALER PRICES
create table public.dealer_prices (
  id uuid primary key default uuid_generate_v4(),
  dealer_id uuid not null references public.profiles(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  price numeric not null check (price > 0),
  discount numeric default 0 check (discount >= 0),
  effective_from timestamp with time zone,
  effective_to timestamp with time zone,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (dealer_id, variant_id)
);

-- 6. ORDERS
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique, -- format ORD-XXXXX
  dealer_id uuid not null references public.profiles(id) on delete restrict,
  dealer_name text not null,
  shop_name text not null,
  order_date date not null default current_date,
  order_status text not null default 'new' check (order_status in ('new', 'confirmed', 'partially_confirmed', 'processing', 'dispatched', 'completed', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('paid', 'pending')),
  payment_method text not null check (payment_method in ('pay_now', 'pay_later')),
  subtotal numeric not null,
  total numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. ORDER ITEMS
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null, -- snapshot
  brand text not null, -- snapshot
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  pack_size text not null, -- snapshot
  price numeric not null, -- snapshot
  quantity integer not null check (quantity > 0),
  confirmed_quantity integer not null default 0,
  cancelled_quantity integer not null default 0,
  item_status text not null default 'pending' check (item_status in ('pending', 'confirmed', 'partially_confirmed', 'cancelled')),
  cancellation_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. DELIVERY CHALLANS
create table public.delivery_challans (
  id uuid primary key default uuid_generate_v4(),
  challan_number text not null unique, -- format DC-XXXXX
  order_id uuid not null references public.orders(id) on delete restrict,
  dealer_id uuid not null references public.profiles(id) on delete restrict,
  dispatch_date timestamp with time zone default timezone('utc'::text, now()) not null,
  hamali numeric not null default 0,
  bhada numeric not null default 0,
  other_charges numeric not null default 0,
  transport_through text,
  vehicle_number text,
  driver_name text,
  dispatch_location text,
  delivery_location text,
  business_snapshot jsonb not null, -- system settings snapshot
  dealer_snapshot jsonb not null, -- dealer profile snapshot
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. DELIVERY CHALLAN ITEMS
create table public.delivery_challan_items (
  id uuid primary key default uuid_generate_v4(),
  challan_id uuid not null references public.delivery_challans(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. SYSTEM SETTINGS
create table public.system_settings (
  id integer primary key default 1 check (id = 1), -- limits settings to a single row
  upi_id text not null,
  upi_name text not null,
  company_name text not null,
  company_address text not null,
  company_contact text not null,
  company_email text not null,
  company_gst text not null,
  allow_pay_now boolean not null default true,
  allow_pay_later boolean not null default true,
  upi_qr_code text,
  company_logo text,
  company_whatsapp text,
  company_registration text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
