-- Create database search and lookup indexes
create index idx_products_company on public.products(company_id);
create index idx_products_category on public.products(category);
create index idx_product_variants_sku on public.product_variants(sku);
create index idx_product_variants_product on public.product_variants(product_id);
create index idx_orders_dealer on public.orders(dealer_id);
create index idx_orders_number on public.orders(order_number);
create index idx_orders_status on public.orders(order_status);
create index idx_order_items_order on public.order_items(order_id);
create index idx_delivery_challans_order on public.delivery_challans(order_id);
