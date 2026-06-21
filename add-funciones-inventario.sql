-- Funciones para descontar y restituir inventario de forma atómica
-- (evitan condiciones de carrera entre ventas simultáneas y validan stock suficiente)
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

create or replace function descontar_inventario(p_producto_id uuid, p_sucursal_id uuid, p_cantidad numeric)
returns inventario
language sql
as $$
  update inventario
  set existencia = existencia - p_cantidad
  where producto_id = p_producto_id
    and sucursal_id = p_sucursal_id
    and existencia >= p_cantidad
  returning *;
$$;

create or replace function incrementar_inventario(p_producto_id uuid, p_sucursal_id uuid, p_cantidad numeric)
returns inventario
language sql
as $$
  update inventario
  set existencia = existencia + p_cantidad
  where producto_id = p_producto_id
    and sucursal_id = p_sucursal_id
  returning *;
$$;

grant execute on function descontar_inventario(uuid, uuid, numeric) to authenticated;
grant execute on function incrementar_inventario(uuid, uuid, numeric) to authenticated;
