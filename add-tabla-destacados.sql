-- Productos "destacados" que el dueño del negocio elige mostrar en la landing como
-- "Los más vendidos" — es curaduría manual del negocio, NO se calcula de ventas reales.
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

create table if not exists productos_destacados (
  id uuid primary key default extensions.uuid_generate_v4(),
  producto_id uuid not null references productos(id) on delete cascade,
  posicion int not null default 0,
  creado_en timestamptz not null default now(),
  unique (producto_id)
);

alter table productos_destacados enable row level security;

-- Lectura: pública (landing) y autenticados (admin)
drop policy if exists "productos_destacados_select_publico" on productos_destacados;
create policy "productos_destacados_select_publico"
  on productos_destacados for select
  to anon, authenticated
  using (true);

-- Escritura: solo admin_general
drop policy if exists "productos_destacados_insert_admin" on productos_destacados;
create policy "productos_destacados_insert_admin"
  on productos_destacados for insert
  to authenticated
  with check (es_admin());

drop policy if exists "productos_destacados_update_admin" on productos_destacados;
create policy "productos_destacados_update_admin"
  on productos_destacados for update
  to authenticated
  using (es_admin())
  with check (es_admin());

drop policy if exists "productos_destacados_delete_admin" on productos_destacados;
create policy "productos_destacados_delete_admin"
  on productos_destacados for delete
  to authenticated
  using (es_admin());

-- Permite a "anon" leer SOLO las columnas necesarias para mostrar el producto en la landing
-- (igual patrón que el catálogo público: nunca exponer precio_costo/precio_mayoreo)
revoke select on productos_destacados from anon;
grant select (id, producto_id, posicion, creado_en) on productos_destacados to anon;
