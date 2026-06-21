-- Políticas RLS para poder borrar ventas completas
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

drop policy if exists "ventas_delete_authenticated" on ventas;
create policy "ventas_delete_authenticated"
  on ventas for delete
  to authenticated
  using (true);

drop policy if exists "venta_items_delete_authenticated" on venta_items;
create policy "venta_items_delete_authenticated"
  on venta_items for delete
  to authenticated
  using (true);
