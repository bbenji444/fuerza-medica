-- Políticas RLS para el módulo de cotizaciones
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

-- clientes
alter table clientes enable row level security;

drop policy if exists "clientes_select_authenticated" on clientes;
create policy "clientes_select_authenticated"
  on clientes for select
  to authenticated
  using (true);

drop policy if exists "clientes_insert_authenticated" on clientes;
create policy "clientes_insert_authenticated"
  on clientes for insert
  to authenticated
  with check (true);

-- cotizaciones
alter table cotizaciones enable row level security;

drop policy if exists "cotizaciones_select_authenticated" on cotizaciones;
create policy "cotizaciones_select_authenticated"
  on cotizaciones for select
  to authenticated
  using (true);

drop policy if exists "cotizaciones_insert_authenticated" on cotizaciones;
create policy "cotizaciones_insert_authenticated"
  on cotizaciones for insert
  to authenticated
  with check (true);

-- cotizacion_items
alter table cotizacion_items enable row level security;

drop policy if exists "cotizacion_items_select_authenticated" on cotizacion_items;
create policy "cotizacion_items_select_authenticated"
  on cotizacion_items for select
  to authenticated
  using (true);

drop policy if exists "cotizacion_items_insert_authenticated" on cotizacion_items;
create policy "cotizacion_items_insert_authenticated"
  on cotizacion_items for insert
  to authenticated
  with check (true);
