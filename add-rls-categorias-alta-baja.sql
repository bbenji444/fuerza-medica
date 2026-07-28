-- Permite dar de alta (INSERT), editar (UPDATE) y borrar (DELETE) categorías
-- desde el panel admin (Inventario -> Gestionar categorías). Hasta ahora
-- "categorias" solo tenía política de SELECT; toda alta se hacía por SQL
-- directo en Supabase con la service role key.
-- Mismo patrón que add-rls-productos-inventario-alta-baja.sql: gateado por
-- es_admin() (los operadores tienen Inventario en modo solo lectura).
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

drop policy if exists "categorias_insert_admin" on categorias;
create policy "categorias_insert_admin"
  on categorias for insert
  to authenticated
  with check (es_admin());

drop policy if exists "categorias_update_admin" on categorias;
create policy "categorias_update_admin"
  on categorias for update
  to authenticated
  using (es_admin())
  with check (es_admin());

drop policy if exists "categorias_delete_admin" on categorias;
create policy "categorias_delete_admin"
  on categorias for delete
  to authenticated
  using (es_admin());
