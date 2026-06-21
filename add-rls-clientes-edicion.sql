-- Políticas RLS para poder editar y eliminar clientes existentes
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

drop policy if exists "clientes_update_authenticated" on clientes;
create policy "clientes_update_authenticated"
  on clientes for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "clientes_delete_authenticated" on clientes;
create policy "clientes_delete_authenticated"
  on clientes for delete
  to authenticated
  using (true);
