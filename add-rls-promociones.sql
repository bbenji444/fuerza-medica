-- Políticas RLS para el módulo de promociones (descuentos)
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

alter table promociones enable row level security;

drop policy if exists "promociones_select_authenticated" on promociones;
create policy "promociones_select_authenticated"
  on promociones for select
  to authenticated
  using (true);

drop policy if exists "promociones_insert_authenticated" on promociones;
create policy "promociones_insert_authenticated"
  on promociones for insert
  to authenticated
  with check (true);

drop policy if exists "promociones_update_authenticated" on promociones;
create policy "promociones_update_authenticated"
  on promociones for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "promociones_delete_authenticated" on promociones;
create policy "promociones_delete_authenticated"
  on promociones for delete
  to authenticated
  using (true);
