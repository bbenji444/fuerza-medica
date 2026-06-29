import { obtenerUsuarioActual } from '@/utils/supabase/usuarioActual'
import Sidebar from './Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { usuario } = await obtenerUsuarioActual()
  const rol = usuario?.rol || 'operador'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <Sidebar rol={rol} />
      <div className="admin-content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}
