-- Permite, al vender un producto sin stock suficiente en la sucursal actual,
-- consultar puntualmente en qué OTRAS sucursales sí hay (solo para ese producto,
-- no expone el inventario completo de las otras sucursales — un operador normal
-- no puede verlo por RLS, así que esta función security definer abre una rendija
-- controlada solo con el dato necesario: nombre de sucursal + existencia).
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

create or replace function disponibilidad_producto_otras_sucursales(p_producto_id uuid, p_sucursal_actual uuid)
returns table(sucursal_nombre text, existencia numeric)
language sql
security definer
set search_path = public
as $$
  select s.nombre, i.existencia
  from inventario i
  join sucursales s on s.id = i.sucursal_id
  where i.producto_id = p_producto_id
    and i.sucursal_id <> p_sucursal_actual
  order by s.nombre;
$$;

grant execute on function disponibilidad_producto_otras_sucursales(uuid, uuid) to authenticated;
