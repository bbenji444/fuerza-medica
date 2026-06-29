import { createClient } from '@/utils/supabase/server'
import { obtenerUsuarioActual } from '@/utils/supabase/usuarioActual'
import { redirect } from 'next/navigation'
import ReportesView from './ReportesView'

type Periodo = 'hoy' | 'semana' | 'mes'

function calcularInicio(periodo: Periodo): Date {
  const ahora = new Date()

  if (periodo === 'hoy') {
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  }
  if (periodo === 'semana') {
    const dia = ahora.getDay()
    const diff = (dia === 0 ? -6 : 1) - dia
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + diff)
  }
  return new Date(ahora.getFullYear(), ahora.getMonth(), 1)
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string; sucursal?: string }>
}) {
  const { user, usuario } = await obtenerUsuarioActual()
  if (!user) redirect('/login')
  if (usuario?.rol !== 'admin_general') redirect('/admin/cotizaciones')

  const supabase = await createClient()
  const params = await searchParams
  const sucursalId = params.sucursal || ''

  let periodo: Periodo = 'hoy'
  let inicio: Date
  let fin: Date
  let rangoPersonalizado = false

  if (params.desde) {
    inicio = new Date(`${params.desde}T00:00:00`)
    fin = params.hasta ? new Date(`${params.hasta}T23:59:59`) : new Date()
    rangoPersonalizado = true
  } else {
    periodo = params.periodo === 'semana' || params.periodo === 'mes' ? params.periodo : 'hoy'
    inicio = calcularInicio(periodo)
    fin = new Date()
  }

  let qVentas = supabase
    .from('ventas')
    .select('id, total, sucursales(nombre)')
    .gte('creado_en', inicio.toISOString())
    .lte('creado_en', fin.toISOString())
  let qItems = supabase
    .from('venta_items')
    .select('cantidad, subtotal, producto_id, productos(codigo, nombre), ventas!inner(creado_en, sucursal_id)')
    .gte('ventas.creado_en', inicio.toISOString())
    .lte('ventas.creado_en', fin.toISOString())
  let qDetalladas = supabase
    .from('ventas')
    .select('id, folio, total, metodo_pago, creado_en, clientes(nombre), sucursales(nombre), venta_items(cantidad, precio_unitario, subtotal, productos(codigo, nombre))')
    .gte('creado_en', inicio.toISOString())
    .lte('creado_en', fin.toISOString())
    .order('creado_en', { ascending: false })

  if (sucursalId) {
    qVentas = qVentas.eq('sucursal_id', sucursalId)
    qItems = qItems.eq('ventas.sucursal_id', sucursalId)
    qDetalladas = qDetalladas.eq('sucursal_id', sucursalId)
  }

  const [{ data: sucursales }, { data: ventas }, { data: itemsVendidos }, { data: ventasDetalladas }] = await Promise.all([
    supabase.from('sucursales').select('id, nombre').order('creado_en'),
    qVentas,
    qItems,
    qDetalladas,
  ])

  const totalPeriodo = (ventas || []).reduce((sum, v) => sum + (v.total || 0), 0)

  const porProductoFecha = new Map<string, { codigo: string; nombre: string; fecha: string; cantidad: number; total: number }>()
  for (const item of (itemsVendidos || []) as any[]) {
    const codigo = item.productos?.codigo || ''
    const nombre = item.productos?.nombre || 'Desconocido'
    const fecha = item.ventas?.creado_en ? new Date(item.ventas.creado_en).toISOString().slice(0, 10) : ''
    const clave = `${item.producto_id}-${fecha}`
    const actual = porProductoFecha.get(clave) || { codigo, nombre, fecha, cantidad: 0, total: 0 }
    actual.cantidad += item.cantidad || 0
    actual.total += item.subtotal || 0
    porProductoFecha.set(clave, actual)
  }
  const productosVendidos = Array.from(porProductoFecha.values()).sort((a, b) => {
    if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha)
    return b.total - a.total
  })

  const porSucursal = new Map<string, number>()
  for (const v of (ventas || []) as any[]) {
    const nombre = v.sucursales?.nombre || 'Sin sucursal'
    porSucursal.set(nombre, (porSucursal.get(nombre) || 0) + (v.total || 0))
  }
  const comparativoSucursales = Array.from(porSucursal.entries()).map(([nombre, total]) => ({ nombre, total }))

  return (
    <div style={{ padding: '40px', backgroundColor: '#F4F8FF', minHeight: '100vh' }}>
      <h1 style={{ color: '#0D1B3E', fontSize: '24px', marginBottom: '8px' }}>
        Reportes de ventas
      </h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
        Desglose de qué se vendió, por periodo o por fecha
      </p>

      <ReportesView
        periodo={rangoPersonalizado ? '' : periodo}
        desde={params.desde || inicio.toISOString().slice(0, 10)}
        hasta={params.hasta || fin.toISOString().slice(0, 10)}
        sucursalId={sucursalId}
        sucursales={sucursales || []}
        totalPeriodo={totalPeriodo}
        numeroVentas={(ventas || []).length}
        productosVendidos={productosVendidos}
        comparativoSucursales={comparativoSucursales}
        ventasDetalladas={(ventasDetalladas || []) as any}
      />
    </div>
  )
}
