-- 1. Create order number sequence and set its default value
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq;

-- Dynamically adjust the sequence value to start at the maximum existing order number + 1, or 1000 if no orders exist
SELECT setval('public.order_number_seq', COALESCE((
  SELECT MAX(NULLIF(regexp_replace(order_number, '\D', '', 'g'), '')::integer) 
  FROM public.orders
), 1000));

-- Set default value for orders.order_number to auto-generate
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT 'ORD-' || nextval('public.order_number_seq');


-- 2. Create challan number sequence and set its default value
CREATE SEQUENCE IF NOT EXISTS public.challan_number_seq;

-- Dynamically adjust the sequence value to start at the maximum existing challan number + 1, or 0 if no challans exist
SELECT setval('public.challan_number_seq', COALESCE((
  SELECT MAX(NULLIF(regexp_replace(challan_number, '\D', '', 'g'), '')::integer) 
  FROM public.delivery_challans
), 0));

-- Set default value for delivery_challans.challan_number to auto-generate
ALTER TABLE public.delivery_challans ALTER COLUMN challan_number SET DEFAULT 'DC-' || LPAD(nextval('public.challan_number_seq')::text, 5, '0');
