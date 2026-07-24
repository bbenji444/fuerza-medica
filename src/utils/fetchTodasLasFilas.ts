import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * @param modificar Opcional: agrega .eq()/.order()/etc. al query antes de paginar
 *   (ej. filtrar por sucursal_id y ordenar por nombre). Sin esto, trae la tabla completa.
 */
export async function fetchTodasLasFilas<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  tabla: string,
  columnas: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modificar?: (query: any) => any
): Promise<T[]> {
  const filas: T[] = []
  // Pedimos de a 2000, pero NUNCA asumimos que la página vino completa: el "max rows" real
  // de Supabase puede ser menor (ej. 1000) — cortar el loop con "data.length < tamanoLote"
  // hacía que se detuviera después de la primera página en cualquier tabla con más filas
  // que ese tope, silenciosamente. Avanzar por data.length real (no por tamanoLote) funciona
  // sin importar cuál sea el tope del servidor.
  const tamanoLote = 2000
  let desde = 0

  while (true) {
    let query = supabase.from(tabla).select(columnas)
    if (modificar) query = modificar(query)
    const { data, error } = await query.range(desde, desde + tamanoLote - 1)

    if (error || !data || data.length === 0) break

    filas.push(...(data as T[]))
    desde += data.length
  }

  return filas
}
