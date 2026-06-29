import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // El servidor no siempre puede escribir cookies, se ignora
          }
        },
      },
      global: {
        // Next.js cachea fetch() por default — sin esto, una página dinámica podía
        // seguir mostrando datos viejos de Supabase (ej. "Los más vendidos" vacío
        // después de agregar el primer producto destacado, hasta el próximo build).
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  )
}