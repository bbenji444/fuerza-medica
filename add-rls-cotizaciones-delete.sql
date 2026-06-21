-- Política RLS para poder borrar cotizaciones completas
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

drop policy if exists "cotizaciones_delete_authenticated" on cotizaciones;
create policy "cotizaciones_delete_authenticated"
  on cotizaciones for delete
  to authenticated
  using (true);
