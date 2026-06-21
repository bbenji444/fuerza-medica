import { createClient } from '@/utils/supabase/server'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default async function SucursalesPage() {
  const supabase = await createClient()

  const { data: sucursales } = await supabase
    .from('sucursales')
    .select('id, nombre, direccion, telefono')
    .eq('activa', true)
    .order('creado_en')

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 bg-fondo-claro">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Nuestras sucursales</h1>
            <p className="mt-2 text-sm text-gray-600">Visítanos, te esperamos con gusto</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {(sucursales || []).map((s) => (
              <div key={s.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="h-48 w-full bg-gray-100">
                  {s.direccion && (
                    <iframe
                      title={`Mapa ${s.nombre}`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(s.direccion)}&output=embed`}
                      className="h-full w-full border-0"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="p-6">
                  <p className="text-base font-bold text-navy">{s.nombre}</p>
                  {s.direccion && <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.direccion}</p>}
                  {s.telefono && (
                    <a href={`tel:${s.telefono}`} className="mt-3 block text-sm font-semibold text-azul">
                      {s.telefono}
                    </a>
                  )}
                  <p className="mt-3 text-xs font-semibold text-gray-500">Lunes a sábado · 9:00 a 19:00 hrs</p>
                  {s.direccion && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.direccion)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block rounded-full bg-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-navy/85"
                    >
                      Cómo llegar
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter sucursales={sucursales || []} />
    </div>
  )
}
