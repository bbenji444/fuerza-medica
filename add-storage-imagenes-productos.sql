-- Bucket público para imágenes de producto (mostradas en /admin/inventario y en el catálogo web).
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

-- Solo admin_general puede subir/reemplazar/borrar imágenes
drop policy if exists "productos_imagenes_insert_admin" on storage.objects;
create policy "productos_imagenes_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'productos' and es_admin());

drop policy if exists "productos_imagenes_update_admin" on storage.objects;
create policy "productos_imagenes_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'productos' and es_admin());

drop policy if exists "productos_imagenes_delete_admin" on storage.objects;
create policy "productos_imagenes_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'productos' and es_admin());

-- Lectura pública (el catálogo web no tiene sesión)
drop policy if exists "productos_imagenes_select_publico" on storage.objects;
create policy "productos_imagenes_select_publico"
  on storage.objects for select
  to public
  using (bucket_id = 'productos');
