-- Permite que admin_general cambie el estado de las solicitudes web
-- (antes solo existían políticas de SELECT para authenticated e INSERT para anon).
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

drop policy if exists "solicitudes_web_update_admin" on solicitudes_web;
create policy "solicitudes_web_update_admin"
  on solicitudes_web for update
  to authenticated
  using (es_admin())
  with check (es_admin());
