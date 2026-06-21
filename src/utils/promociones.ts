export type Promocion = {
  producto_id: string | null
  categoria_id: string | null
  tipo: string
  valor: number
  activa: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
}

function vigente(p: Promocion): boolean {
  if (!p.activa) return false
  const hoy = new Date().toISOString().slice(0, 10)
  if (p.fecha_inicio && hoy < p.fecha_inicio) return false
  if (p.fecha_fin && hoy > p.fecha_fin) return false
  return true
}

export function promocionAplicable(
  promociones: Promocion[],
  productoId: string,
  categoriaId: string | null | undefined
): Promocion | null {
  const vigentes = promociones.filter(vigente)
  return (
    vigentes.find((p) => p.producto_id === productoId) ||
    vigentes.find((p) => p.categoria_id && p.categoria_id === categoriaId) ||
    null
  )
}

export function precioConDescuento(precioBase: number, promocion: Promocion | null): number {
  if (!promocion) return precioBase
  if (promocion.tipo === 'porcentaje') return Math.max(0, precioBase * (1 - promocion.valor / 100))
  if (promocion.tipo === 'precio_fijo') return Math.max(0, precioBase - promocion.valor)
  if (promocion.tipo === 'precio_especial') return Math.max(0, promocion.valor)
  return precioBase
}
