-- Permite dar de alta (INSERT) y de baja (DELETE) productos e inventario
-- Solo admin_general (igual que UPDATE, ya configurado antes)
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

drop policy if exists "productos_insert_admin" on productos;
create policy "productos_insert_admin"
  on productos for insert
  to authenticated
  with check (es_admin());

drop policy if exists "productos_delete_admin" on productos;
create policy "productos_delete_admin"
  on productos for delete
  to authenticated
  using (es_admin());

drop policy if exists "inventario_insert_admin" on inventario;
create policy "inventario_insert_admin"
  on inventario for insert
  to authenticated
  with check (es_admin());

drop policy if exists "inventario_delete_admin" on inventario;
create policy "inventario_delete_admin"
  on inventario for delete
  to authenticated
  using (es_admin());
