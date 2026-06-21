import { createClient } from '@/utils/supabase/server'
import { obtenerUsuarioActual } from '@/utils/supabase/usuarioActual'
import { redirect } from 'next/navigation'
import EmpleadosTable from './EmpleadosTable'

export default async function EmpleadosPage() {
  const { user, usuario } = await obtenerUsuarioActual()
  if (!user) redirect('/login')
  if (usuario?.rol !== 'admin_general') redirect('/admin/cotizaciones')

  const supabase = await createClient()

  const [{ data: empleados }, { data: sucursales }] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id, nombre, email, rol, sucursal_id, activo, creado_en, sucursales(nombre)')
      .order('creado_en', { ascending: false }),
    supabase.from('sucursales').select('id, nombre').order('nombre'),
  ])

  return (
    <div style={{ padding: '40px', backgroundColor: '#F4F8FF', minHeight: '100vh' }}>
      <h1 style={{ color: '#0D1B3E', fontSize: '24px', marginBottom: '8px' }}>
        Empleados
      </h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
        Accesos al panel de administración por sucursal
      </p>

      <EmpleadosTable empleados={(empleados || []) as any} sucursales={sucursales || []} />
    </div>
  )
}
