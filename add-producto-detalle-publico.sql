-- Vista de detalle de producto en la página pública (estilo Amazon/MercadoLibre):
-- segunda imagen para el efecto hover + descripción del producto, editables desde
-- /admin/inventario, y visibles también para "anon" (catálogo público).
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

alter table productos add column if not exists imagen_url_hover text;
alter table productos add column if not exists descripcion text;

-- Estas dos columnas no son sensibles (a diferencia de precio_costo/precio_mayoreo),
-- así que se agregan al grant de columnas ya restringido para "anon"
-- (ver add-rls-publico-pagina-web.sql, que dejó el grant limitado a columnas específicas).
grant select (imagen_url_hover, descripcion) on productos to anon;

-- Disponibilidad de stock por sucursal para la página pública de detalle de producto.
-- La tabla `inventario` NO tiene política para "anon" a propósito (el catálogo no expone
-- existencias completas de ningún producto). Esta función security definer abre una rendija
-- controlada: solo nombre de sucursal + existencia, de UN producto puntual a la vez —
-- mismo patrón que disponibilidad_producto_otras_sucursales (esa es para operadores autenticados).
create or replace function disponibilidad_producto_publica(p_producto_id uuid)
returns table(sucursal_nombre text, existencia numeric)
language sql
security definer
set search_path = public
as $$
  select s.nombre, i.existencia
  from inventario i
  join sucursales s on s.id = i.sucursal_id
  where i.producto_id = p_producto_id
    and s.activa = true
  order by s.nombre;
$$;

grant execute on function disponibilidad_producto_publica(uuid) to anon;
