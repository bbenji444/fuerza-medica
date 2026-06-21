-- Migración: módulo de Ventas (tablas + RLS)
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

create sequence if not exists ventas_folio_seq;

create table if not exists ventas (
  id uuid primary key default extensions.uuid_generate_v4(),
  folio text not null default ('V-' || lpad(nextval('ventas_folio_seq')::text, 4, '0')),
  sucursal_id uuid references sucursales(id),
  usuario_id uuid references usuarios(id),
  cliente_id uuid references clientes(id),
  metodo_pago text not null default 'efectivo',
  total numeric not null default 0,
  cotizacion_id uuid references cotizaciones(id) on delete set null,
  creado_en timestamptz not null default now()
);

create table if not exists venta_items (
  id uuid primary key default extensions.uuid_generate_v4(),
  venta_id uuid references ventas(id),
  producto_id uuid references productos(id),
  cantidad numeric not null,
  precio_unitario numeric not null,
  subtotal numeric generated always as (cantidad * precio_unitario) stored
);

alter table ventas enable row level security;

drop policy if exists "ventas_select_authenticated" on ventas;
create policy "ventas_select_authenticated"
  on ventas for select
  to authenticated
  using (true);

drop policy if exists "ventas_insert_authenticated" on ventas;
create policy "ventas_insert_authenticated"
  on ventas for insert
  to authenticated
  with check (true);

alter table venta_items enable row level security;

drop policy if exists "venta_items_select_authenticated" on venta_items;
create policy "venta_items_select_authenticated"
  on venta_items for select
  to authenticated
  using (true);

drop policy if exists "venta_items_insert_authenticated" on venta_items;
create policy "venta_items_insert_authenticated"
  on venta_items for insert
  to authenticated
  with check (true);
