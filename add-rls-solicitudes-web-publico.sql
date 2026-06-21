-- Permite que cualquier visitante del catálogo web (sin cuenta, rol "anon") pueda
-- crear una solicitud de producto desde el formulario público.
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

drop policy if exists "solicitudes_web_insert_publico" on solicitudes_web;
create policy "solicitudes_web_insert_publico"
  on solicitudes_web for insert
  to anon
  with check (true);
