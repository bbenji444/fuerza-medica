-- Habilita lectura pública (sin sesión, rol "anon") para la página web de cara al cliente.
-- Las políticas existentes ("SELECT abierto") solo cubren `to authenticated` — un visitante
-- sin login (anon) no podía leer nada de esto, confirmado con una prueba real antes de este cambio.
--
-- IMPORTANTE: en `productos` se restringen las columnas visibles para anon — nunca debe
-- exponerse `precio_costo` ni `precio_mayoreo` (información sensible del negocio) al público.
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

drop policy if exists "productos_select_publico" on productos;
create policy "productos_select_publico"
  on productos for select
  to anon
  using (activo = true);

-- Por default Supabase otorga SELECT de toda la tabla a "anon"; lo limitamos a las
-- columnas que sí queremos mostrar en el catálogo (nunca precios de costo/mayoreo).
revoke select on productos from anon;
grant select (id, codigo, nombre, precio_venta, categoria_id, imagen_url, activo, creado_en) on productos to anon;

drop policy if exists "categorias_select_publico" on categorias;
create policy "categorias_select_publico"
  on categorias for select
  to anon
  using (true);

drop policy if exists "sucursales_select_publico" on sucursales;
create policy "sucursales_select_publico"
  on sucursales for select
  to anon
  using (activa = true);
