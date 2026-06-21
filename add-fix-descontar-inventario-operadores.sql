-- Corrige bug: los operadores (rol != admin_general) no podían completar ventas.
--
-- Causa: las políticas RLS de inventario para UPDATE quedaron como "solo es_admin()"
-- (para bloquear edición directa de inventario por operadores). Pero descontar_inventario()
-- e incrementar_inventario() estaban definidas como `security invoker` (el comportamiento
-- por default), así que al venderse un producto, la función corría con los permisos de
-- quien hace la venta — y un operador no tiene permiso de UPDATE en inventario, por lo que
-- el descuento de stock fallaba silenciosamente (0 filas afectadas) y la venta se cancelaba.
--
-- Fix: marcarlas `security definer` (corren con privilegios elevados, sin pasar por RLS),
-- pero agregando el chequeo de permiso EXPLÍCITAMENTE dentro de la función, ya que RLS
-- ya no las protege automáticamente.
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard -> SQL Editor)

create or replace function descontar_inventario(p_producto_id uuid, p_sucursal_id uuid, p_cantidad numeric)
returns inventario
language plpgsql
security definer
set search_path = public
as $$
declare
  resultado inventario;
begin
  if not (es_admin() or p_sucursal_id = mi_sucursal()) then
    raise exception 'No tienes permiso para modificar el inventario de esa sucursal';
  end if;

  update inventario
  set existencia = existencia - p_cantidad
  where producto_id = p_producto_id
    and sucursal_id = p_sucursal_id
    and existencia >= p_cantidad
  returning * into resultado;

  return resultado;
end;
$$;

create or replace function incrementar_inventario(p_producto_id uuid, p_sucursal_id uuid, p_cantidad numeric)
returns inventario
language plpgsql
security definer
set search_path = public
as $$
declare
  resultado inventario;
begin
  if not (es_admin() or p_sucursal_id = mi_sucursal()) then
    raise exception 'No tienes permiso para modificar el inventario de esa sucursal';
  end if;

  update inventario
  set existencia = existencia + p_cantidad
  where producto_id = p_producto_id
    and sucursal_id = p_sucursal_id
  returning * into resultado;

  return resultado;
end;
$$;

grant execute on function descontar_inventario(uuid, uuid, numeric) to authenticated;
grant execute on function incrementar_inventario(uuid, uuid, numeric) to authenticated;
