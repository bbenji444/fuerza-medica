-- Políticas RLS adicionales para poder editar cotizaciones existentes
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

-- cotizaciones: permitir actualizar cliente, sucursal, estado y total
drop policy if exists "cotizaciones_update_authenticated" on cotizaciones;
create policy "cotizaciones_update_authenticated"
  on cotizaciones for update
  to authenticated
  using (true)
  with check (true);

-- cotizacion_items: el modal de edición borra y vuelve a insertar los items,
-- por lo que se necesita permiso de DELETE además del INSERT ya existente
drop policy if exists "cotizacion_items_delete_authenticated" on cotizacion_items;
create policy "cotizacion_items_delete_authenticated"
  on cotizacion_items for delete
  to authenticated
  using (true);
