import { createClient } from '@/utils/supabase/server'
import { obtenerUsuarioActual } from '@/utils/supabase/usuarioActual'
import { redirect } from 'next/navigation'
import CotizacionesTable from './CotizacionesTable'
import { fetchTodasLasFilas } from '@/utils/fetchTodasLasFilas'

export default async function CotizacionesPage() {
  const { user, usuario } = await obtenerUsuarioActual()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [
    { data: cotizaciones },
    { data: clientes },
    { data: productos },
    { data: sucursales },
    inventario,
    { data: promociones },
  ] = await Promise.all([
    supabase
      .from('cotizaciones')
      .select('id, estado, total, creado_en, cliente_id, sucursal_id, clientes(nombre, telefono, correo, direccion), sucursales(nombre)')
      .order('creado_en', { ascending: false }),
    supabase.from('clientes').select('id, nombre, telefono, correo, direccion').order('nombre'),
    supabase
      .from('productos')
      .select('id, codigo, nombre, precio_venta, precio_mayoreo, categoria_id')
      .eq('activo', true)
      .order('nombre')
      .range(0, 1999),
    supabase.from('sucursales').select('id, nombre').order('nombre'),
    fetchTodasLasFilas<{ producto_id: string; sucursal_id: string; existencia: number }>(
      supabase,
      'inventario',
      'producto_id, sucursal_id, existencia'
    ),
    supabase
      .from('promociones')
      .select('producto_id, categoria_id, tipo, valor, activa, fecha_inicio, fecha_fin')
      .eq('activa', true),
  ])

  return (
    <div style={{ padding: '40px', backgroundColor: '#F4F8FF', minHeight: '100vh' }}>
      <h1 style={{ color: '#0D1B3E', fontSize: '24px', marginBottom: '8px' }}>
        Cotizaciones
      </h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
        {cotizaciones?.length || 0} cotizaciones registradas
      </p>

      <CotizacionesTable
        cotizaciones={(cotizaciones || []) as any}
        clientes={clientes || []}
        productos={productos || []}
        sucursales={sucursales || []}
        inventario={inventario}
        promociones={promociones || []}
        usuario={usuario ? { id: user.id, rol: usuario.rol, sucursal_id: usuario.sucursal_id } : null}
      />
    </div>
  )
}
