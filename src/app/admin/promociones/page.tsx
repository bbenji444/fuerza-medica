import { createClient } from '@/utils/supabase/server'
import { obtenerUsuarioActual } from '@/utils/supabase/usuarioActual'
import { redirect } from 'next/navigation'
import PromocionesTable from './PromocionesTable'
import { fetchTodasLasFilas } from '@/utils/fetchTodasLasFilas'

export default async function PromocionesPage() {
  const { user, usuario } = await obtenerUsuarioActual()
  if (!user) redirect('/login')
  if (usuario?.rol !== 'admin_general') redirect('/admin/cotizaciones')

  const supabase = await createClient()

  const [{ data: promociones }, productos, { data: categorias }] = await Promise.all([
    supabase
      .from('promociones')
      .select('id, nombre, tipo, valor, producto_id, categoria_id, activa, fecha_inicio, fecha_fin, creado_en, productos(nombre), categorias(nombre)')
      .order('creado_en', { ascending: false }),
    fetchTodasLasFilas<{ id: string; codigo: string; nombre: string }>(
      supabase,
      'productos',
      'id, codigo, nombre',
      (query) => query.eq('activo', true).order('nombre')
    ),
    supabase.from('categorias').select('id, nombre, categoria_padre').order('nombre'),
  ])

  return (
    <div style={{ padding: '40px', backgroundColor: '#F4F8FF', minHeight: '100vh' }}>
      <h1 style={{ color: '#0D1B3E', fontSize: '24px', marginBottom: '8px' }}>
        Promociones
      </h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
        Descuentos por producto o categoría con vigencia
      </p>

      <PromocionesTable
        promociones={(promociones || []) as any}
        productos={productos}
        categorias={categorias || []}
      />
    </div>
  )
}
