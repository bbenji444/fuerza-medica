import type { SupabaseClient } from '@supabase/supabase-js'

export async function fetchTodasLasFilas<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  tabla: string,
  columnas: string
): Promise<T[]> {
  const filas: T[] = []
  const tamanoLote = 2000 // tope duro del servidor; usarlo completo minimiza el número de viajes de red
  let desde = 0

  while (true) {
    const { data, error } = await supabase.from(tabla).select(columnas).range(desde, desde + tamanoLote - 1)

    if (error || !data || data.length === 0) break

    filas.push(...(data as T[]))

    if (data.length < tamanoLote) break
    desde += tamanoLote
  }

  return filas
}
