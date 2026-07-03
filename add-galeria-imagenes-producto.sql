-- Galería de hasta 6 fotos por producto para la página pública de detalle
-- (miniaturas + efecto de lupa). Independiente de imagen_url/imagen_url_hover,
-- que siguen siendo la portada + swap al pasar el mouse de las tarjetas de
-- catálogo/destacados/similares (esas NO cambian). Se gestiona desde
-- /admin/inventario -> "Cambiar imagen".
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

alter table productos add column if not exists imagenes text[] not null default '{}';

-- No es una columna sensible (a diferencia de precio_costo/precio_mayoreo): se agrega
-- al grant ya restringido para "anon" (ver add-rls-publico-pagina-web.sql).
grant select (imagenes) on productos to anon;
