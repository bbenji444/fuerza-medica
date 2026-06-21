import { NextResponse } from 'next/server'
import { requerirAdmin, clienteServicio } from '@/utils/supabase/admin'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requerirAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const servicio = clienteServicio()

  if (body.accion === 'activar' || body.accion === 'desactivar') {
    const ban_duration = body.accion === 'desactivar' ? '876000h' : 'none'

    const { error: errorBan } = await servicio.auth.admin.updateUserById(id, { ban_duration })
    if (errorBan) return NextResponse.json({ error: errorBan.message }, { status: 400 })

    const { error: errorActivo } = await servicio
      .from('usuarios')
      .update({ activo: body.accion === 'activar' })
      .eq('id', id)

    if (errorActivo) return NextResponse.json({ error: errorActivo.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  }

  if (body.accion === 'resetear_password') {
    if (!body.password || body.password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }
    const { error } = await servicio.auth.admin.updateUserById(id, { password: body.password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  const { nombre, sucursal_id, rol } = body
  const { error } = await servicio
    .from('usuarios')
    .update({
      nombre,
      rol: rol === 'admin_general' ? 'admin_general' : 'operador',
      sucursal_id: rol === 'admin_general' ? (sucursal_id || null) : sucursal_id,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
