import { createClient } from '@/utils/supabase/server'
import { obtenerUsuarioActual } from '@/utils/supabase/usuarioActual'
import { redirect } from 'next/navigation'
import InventarioTable from './InventarioTable'

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>
}) {
  const { user, usuario } = await obtenerUsuarioActual()
  if (!user) redirect('/login')

  const esAdmin = usuario?.rol === 'admin_general'
  const supabase = await createClient()
  const params = await searchParams

  const [{ data: sucursales }, { data: categorias }] = await Promise.all([
    supabase.from('sucursales').select('id, nombre').order('creado_en'),
    supabase.from('categorias').select('id, nombre, categoria_padre').order('nombre'),
  ])

  const sucursalActiva = esAdmin ? (params.sucursal || sucursales?.[0]?.id) : usuario?.sucursal_id

  const { data: inventario } = await supabase
    .from('inventario')
    .select(
      'id, existencia, inventario_minimo, inventario_maximo, productos(id, codigo, nombre, categoria_id, categorias(nombre), precio_costo, precio_venta, precio_mayoreo, activo, imagen_url, imagen_url_hover, imagenes, descripcion)'
    )
    .eq('sucursal_id', sucursalActiva)
    .order('productos(nombre)')

  return (
    <div style={{ padding: '40px', backgroundColor: '#F4F8FF', minHeight: '100vh' }}>
      <h1 style={{ color: '#0D1B3E', fontSize: '24px', marginBottom: '8px' }}>
        Inventario
      </h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
        Productos, precios y existencias por sucursal
      </p>

      <InventarioTable
        inventario={(inventario || []) as any}
        sucursales={sucursales || []}
        sucursalActiva={sucursalActiva}
        categorias={categorias || []}
        esAdmin={esAdmin}
      />
    </div>
  )
}
