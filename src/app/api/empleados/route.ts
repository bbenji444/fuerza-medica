import { NextResponse } from 'next/server'
import { requerirAdmin, clienteServicio } from '@/utils/supabase/admin'

export async function POST(request: Request) {
  const admin = await requerirAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { nombre, email, password, sucursal_id, rol } = await request.json()

  if (!nombre || !email || !password) {
    return NextResponse.json({ error: 'Nombre, correo y contraseña son obligatorios' }, { status: 400 })
  }
  if (rol !== 'admin_general' && !sucursal_id) {
    return NextResponse.json({ error: 'Selecciona una sucursal' }, { status: 400 })
  }

  const servicio = clienteServicio()

  const { data: nuevoUsuario, error: errorAuth } = await servicio.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (errorAuth || !nuevoUsuario.user) {
    return NextResponse.json({ error: errorAuth?.message || 'Error al crear el acceso' }, { status: 400 })
  }

  const { error: errorUsuarios } = await servicio.from('usuarios').insert({
    id: nuevoUsuario.user.id,
    nombre,
    email,
    rol: rol === 'admin_general' ? 'admin_general' : 'operador',
    sucursal_id: rol === 'admin_general' ? (sucursal_id || null) : sucursal_id,
    activo: true,
  })

  if (errorUsuarios) {
    await servicio.auth.admin.deleteUser(nuevoUsuario.user.id)
    return NextResponse.json({ error: errorUsuarios.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
