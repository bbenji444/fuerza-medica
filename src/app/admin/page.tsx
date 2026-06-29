import { createClient } from '@/utils/supabase/server'
import { obtenerUsuarioActual } from '@/utils/supabase/usuarioActual'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardCharts from './DashboardCharts'
import StockBajoCard from './StockBajoCard'
import { fetchTodasLasFilas } from '@/utils/fetchTodasLasFilas'

export default async function AdminPage() {
  const { user, usuario } = await obtenerUsuarioActual()
  if (!user) redirect('/login')
  if (usuario?.rol !== 'admin_general') redirect('/admin/cotizaciones')

  const supabase = await createClient()

  const ahora = new Date()
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

  const [
    { data: ventasHoy },
    { data: ventasMes },
    { count: cotizacionesPendientes },
    inventarioCompleto,
    { data: itemsVendidos },
    { data: sucursalesData },
  ] = await Promise.all([
    supabase.from('ventas').select('total').gte('creado_en', inicioHoy),
    supabase.from('ventas').select('total, sucursales(nombre)').gte('creado_en', inicioMes),
    supabase.from('cotizaciones').select('*', { count: 'exact', head: true }).in('estado', ['borrador', 'enviada']),
    fetchTodasLasFilas<{ producto_id: string; existencia: number; inventario_maximo: number; sucursal_id: string }>(
      supabase,
      'inventario',
      'producto_id, existencia, inventario_maximo, sucursal_id'
    ),
    supabase
      .from('venta_items')
      .select('cantidad, producto_id, productos(nombre), ventas!inner(creado_en)')
      .gte('ventas.creado_en', inicioMes),
    supabase.from('sucursales').select('id, nombre').eq('activa', true),
  ])

  const totalHoy = (ventasHoy || []).reduce((sum, v) => sum + (v.total || 0), 0)
  const totalMes = (ventasMes || []).reduce((sum, v) => sum + (v.total || 0), 0)

  // Orden fijo: Coacalco → Tultepec → resto
  const sucursalesOrdenadas = [
    ...(sucursalesData || []).filter((s) => s.nombre.toLowerCase().includes('coacalco')),
    ...(sucursalesData || []).filter((s) => s.nombre.toLowerCase().includes('tultepec')),
    ...(sucursalesData || []).filter(
      (s) => !s.nombre.toLowerCase().includes('coacalco') && !s.nombre.toLowerCase().includes('tultepec')
    ),
  ]

  const stockBajoPorSucursal = sucursalesOrdenadas.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    count: inventarioCompleto.filter(
      (i) => i.sucursal_id === s.id && i.existencia <= i.inventario_maximo / 3
    ).length,
  }))

  const ventasPorSucursal = new Map<string, number>()
  for (const v of ventasMes || []) {
    const nombre = (v as any).sucursales?.nombre || 'Sin sucursal'
    ventasPorSucursal.set(nombre, (ventasPorSucursal.get(nombre) || 0) + (v.total || 0))
  }
  const comparativoSucursales = Array.from(ventasPorSucursal.entries()).map(([nombre, total]) => ({ nombre, total }))

  const porProducto = new Map<string, { nombre: string; cantidad: number }>()
  for (const item of (itemsVendidos || []) as any[]) {
    const nombre = item.productos?.nombre || 'Desconocido'
    const actual = porProducto.get(item.producto_id) || { nombre, cantidad: 0 }
    actual.cantidad += item.cantidad || 0
    porProducto.set(item.producto_id, actual)
  }
  const topProductos = Array.from(porProducto.values())
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)

  return (
    <div style={{ padding: '40px', backgroundColor: '#F4F8FF', minHeight: '100vh' }}>
      <h1 style={{ color: '#0D1B3E', fontSize: '24px', marginBottom: '8px' }}>
        Panel de Administración — Fuerza Médica
      </h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '4px' }}>
        Bienvenido, {user.email}
      </p>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px', textTransform: 'capitalize' }}>
        {ahora.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <Link href="/admin/reportes?periodo=hoy" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Ventas de hoy</p>
            <p style={{ color: '#0D1B3E', fontSize: '24px', fontWeight: 700 }}>${totalHoy.toFixed(2)}</p>
            <p style={{ color: '#1A6DD4', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>Ver desglose →</p>
          </div>
        </Link>

        <Link href="/admin/reportes?periodo=mes" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Ventas del mes</p>
            <p style={{ color: '#0D1B3E', fontSize: '24px', fontWeight: 700 }}>${totalMes.toFixed(2)}</p>
            <p style={{ color: '#1A6DD4', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>Ver desglose →</p>
          </div>
        </Link>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Cotizaciones pendientes</p>
          <p style={{ color: '#0D1B3E', fontSize: '24px', fontWeight: 700 }}>{cotizacionesPendientes || 0}</p>
        </div>

        <StockBajoCard
          initialPorSucursal={stockBajoPorSucursal}
          sucursales={sucursalesOrdenadas}
        />
      </div>

      <DashboardCharts comparativoSucursales={comparativoSucursales} topProductos={topProductos} />
    </div>
  )
}
