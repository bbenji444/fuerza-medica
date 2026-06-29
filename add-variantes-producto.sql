-- Variantes de tamaño/color: productos que son el mismo artículo pero con distinta
-- talla o color (ej. "BOTA NEUMATICA WALKER" chica/mediana/grande) se agrupan con un
-- mismo `variante_grupo_id` compartido, cada uno con su propia etiqueta (`variante_nombre`,
-- ej. "Grande") y un orden de despliegue (`variante_orden`) para el selector en la página
-- pública de producto. Cada variante sigue siendo un producto/inventario independiente
-- (precio y stock propios por sucursal) — esto solo afecta cómo se presenta al público.
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

alter table productos add column if not exists variante_grupo_id uuid;
alter table productos add column if not exists variante_nombre text;
alter table productos add column if not exists variante_orden integer not null default 0;

create index if not exists idx_productos_variante_grupo on productos (variante_grupo_id) where variante_grupo_id is not null;

-- No son columnas sensibles (a diferencia de precio_costo/precio_mayoreo): se agregan
-- al grant ya restringido para "anon" (ver add-rls-publico-pagina-web.sql), necesario para
-- que el catálogo público pueda agrupar variantes y la página de producto mostrar el selector.
grant select (variante_grupo_id, variante_nombre, variante_orden) on productos to anon;
