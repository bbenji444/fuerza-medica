import { cache } from 'react'
import { createClient } from './server'

/**
 * Memoizado por request (React.cache): sin esto, layout.tsx y cada page.tsx
 * repetían su propia llamada a auth.getUser() + select de usuarios, duplicando
 * viajes de red en cada navegación.
 */
export const obtenerUsuarioActual = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { user: null, usuario: null }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol, sucursal_id')
    .eq('id', user.id)
    .single()

  return { user, usuario }
})
