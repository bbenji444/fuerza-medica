import { createClient } from '@/utils/supabase/server'
import { obtenerUsuarioActual } from '@/utils/supabase/usuarioActual'
import { redirect } from 'next/navigation'
import VariantesManager from './VariantesManager'

export default async function VariantesPage() {
  const { user, usuario } = await obtenerUsuarioActual()
  if (!user) redirect('/login')
  if (usuario?.rol !== 'admin_general') redirect('/admin/cotizaciones')

  const supabase = await createClient()

  const { data: productos } = await supabase
    .from('productos')
    .select('id, codigo, nombre, precio_venta, precio_costo, precio_mayoreo, variante_grupo_id, variante_nombre, variante_orden')
    .eq('activo', true)
    .order('nombre')
    .range(0, 1999)

  return (
    <div style={{ padding: '40px', backgroundColor: '#F4F8FF', minHeight: '100vh' }}>
      <h1 style={{ color: '#0D1B3E', fontSize: '24px', marginBottom: '8px' }}>
        Variantes de producto (tamaño / color)
      </h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
        Agrupa productos que son el mismo artículo en distinto tamaño o color (ej. &quot;Bota Walker&quot; chica/mediana/grande) para que en la página pública aparezcan como un solo producto con un selector — cada uno conserva su propio precio e inventario.
      </p>

      <VariantesManager productos={productos || []} />
    </div>
  )
}
