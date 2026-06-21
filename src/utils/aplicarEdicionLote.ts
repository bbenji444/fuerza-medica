import { SupabaseClient } from '@supabase/supabase-js'

export type FilaLote = { id: string; valor: number | string | boolean }

// Tope de ids por URL (.in()) y de peticiones concurrentes (.eq() individuales) por lote.
// Mandar todo de golpe (ej. 1376 productos) saturaba el navegador/red y tronaba con
// "TypeError: Failed to fetch" en cuanto UNA petición fallaba, cancelando el reporte
// de las demás aunque sí se hubieran aplicado.
const TAMANO_LOTE_IN = 100
const TAMANO_LOTE_CONCURRENTE = 50

function dividirEnLotes<T>(arr: T[], tamano: number): T[][] {
  const lotes: T[][] = []
  for (let i = 0; i < arr.length; i += tamano) {
    lotes.push(arr.slice(i, i + tamano))
  }
  return lotes
}

export async function aplicarEdicionLote(
  supabase: SupabaseClient,
  tabla: string,
  campo: string,
  filas: FilaLote[]
): Promise<string | null> {
  if (filas.length === 0) return null

  const todasIguales = filas.every((f) => f.valor === filas[0].valor)

  if (todasIguales) {
    let fallidos = 0

    for (const lote of dividirEnLotes(filas, TAMANO_LOTE_IN)) {
      const { error } = await supabase
        .from(tabla)
        .update({ [campo]: filas[0].valor })
        .in('id', lote.map((f) => f.id))
      if (error) fallidos += lote.length
    }

    if (fallidos > 0) {
      return `No se pudieron actualizar ${fallidos} de ${filas.length} productos. Intenta de nuevo (puede ser una saturación momentánea de red).`
    }
    return null
  }

  let fallidos = 0

  for (const lote of dividirEnLotes(filas, TAMANO_LOTE_CONCURRENTE)) {
    const resultados = await Promise.allSettled(
      lote.map((f) => supabase.from(tabla).update({ [campo]: f.valor }).eq('id', f.id))
    )
    fallidos += resultados.filter((r) => (r.status === 'rejected' ? true : !!r.value.error)).length
  }

  if (fallidos > 0) {
    return `No se pudieron actualizar ${fallidos} de ${filas.length} productos. Intenta de nuevo (puede ser una saturación momentánea de red).`
  }
  return null
}
