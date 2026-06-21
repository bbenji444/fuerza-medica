import type { SupabaseClient } from '@supabase/supabase-js'

export type ItemParaDescuento = {
  producto_id: string
  nombre: string
  cantidad: number
}

export async function descontarInventarioCarrito(
  supabase: SupabaseClient,
  sucursalId: string,
  items: ItemParaDescuento[]
): Promise<string | null> {
  const aplicados: ItemParaDescuento[] = []

  for (const item of items) {
    const { data, error } = await supabase.rpc('descontar_inventario', {
      p_producto_id: item.producto_id,
      p_sucursal_id: sucursalId,
      p_cantidad: item.cantidad,
    })

    // Cuando no hay suficiente stock, la función no encuentra fila que actualizar
    // y Postgres devuelve un registro con todos los campos en null (no un null real).
    if (error || !data || data.id == null) {
      await restituirInventarioCarrito(supabase, sucursalId, aplicados)
      return `No hay suficiente stock de "${item.nombre}" en esta sucursal.`
    }

    aplicados.push(item)
  }

  return null
}

export async function restituirInventarioCarrito(
  supabase: SupabaseClient,
  sucursalId: string,
  items: ItemParaDescuento[]
): Promise<void> {
  await Promise.all(
    items.map((item) =>
      supabase.rpc('incrementar_inventario', {
        p_producto_id: item.producto_id,
        p_sucursal_id: sucursalId,
        p_cantidad: item.cantidad,
      })
    )
  )
}
