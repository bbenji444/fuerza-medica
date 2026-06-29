import { createClient } from '@/utils/supabase/server'
import { obtenerUsuarioActual } from '@/utils/supabase/usuarioActual'
import { redirect } from 'next/navigation'
import DestacadosTable from './DestacadosTable'

export default async function DestacadosPage() {
  const { user, usuario } = await obtenerUsuarioActual()
  if (!user) redirect('/login')
  if (usuario?.rol !== 'admin_general') redirect('/admin/cotizaciones')

  const supabase = await createClient()

  const [{ data: destacados }, { data: productos }] = await Promise.all([
    supabase
      .from('productos_destacados')
      .select('id, posicion, producto_id, productos(codigo, nombre, precio_venta, imagen_url)')
      .order('posicion'),
    supabase
      .from('productos')
      .select('id, codigo, nombre, precio_venta')
      .eq('activo', true)
      .order('nombre')
      .range(0, 1999),
  ])

  return (
    <div style={{ padding: '40px', backgroundColor: '#F4F8FF', minHeight: '100vh' }}>
      <h1 style={{ color: '#0D1B3E', fontSize: '24px', marginBottom: '8px' }}>
        Más vendidos (página pública)
      </h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
        Elige qué productos se muestran en la sección &quot;Los más vendidos&quot; de la página de inicio. Esta lista es manual — no se calcula de las ventas reales, es para destacar lo que quieras promocionar.
      </p>

      <DestacadosTable destacados={(destacados || []) as any} productos={productos || []} />
    </div>
  )
}
