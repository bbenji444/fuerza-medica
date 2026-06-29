import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import MasVendidosSection from './components/MasVendidosSection'
import MarcasCarousel from './components/MarcasCarousel'
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton'
import { infoMapaSucursales, ordenarSucursales } from './components/sucursalesInfo'

export default async function Home() {
  const supabase = await createClient()

  const [{ data: destacadosData }, { data: sucursalesData }] = await Promise.all([
    supabase
      .from('productos_destacados')
      .select('posicion, productos(id, nombre, precio_venta, imagen_url, imagen_url_hover)')
      .order('posicion'),
    supabase.from('sucursales').select('id, nombre, direccion, telefono').eq('activa', true).order('creado_en'),
  ])

  const destacados = (
    (destacadosData || []) as unknown as { productos: { id: string; nombre: string; precio_venta: number; imagen_url: string | null; imagen_url_hover: string | null } | null }[]
  )
    .map((d) => d.productos)
    .filter((p): p is { id: string; nombre: string; precio_venta: number; imagen_url: string | null; imagen_url_hover: string | null } => !!p)

  const sucursales = ordenarSucursales(sucursalesData || [])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex h-screen flex-col">
        <SiteHeader />

        {/* Hero — ocupa el resto de la pantalla de inicio */}
        <section className="relative flex flex-1 items-center overflow-hidden bg-navy">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover object-top"
          >
            <source src="/hero-video.mov" />
          </video>
          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-12 md:py-28">
            <div className="max-w-xl">
              <span className="mb-3 inline-block rounded-full bg-azul/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-azul drop-shadow-md">
                Equipo médico y ortopédico
              </span>
              <h1 className="text-3xl font-extrabold leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] sm:text-5xl">
                Todo lo que necesitas para el cuidado de la salud
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] sm:text-base">
                Material de curación, instrumental, desechables y equipo médico al alcance de tu mano.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
                <Link
                  href="/catalogo"
                  className="rounded-full bg-azul px-6 py-3 text-sm font-bold text-white shadow-lg shadow-azul/30 transition hover:bg-azul/90 sm:px-7 sm:py-3.5"
                >
                  Ver catálogo completo
                </Link>
                <Link
                  href="#sucursales"
                  className="rounded-full border border-white/40 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10 sm:px-7 sm:py-3.5"
                >
                  Nuestras sucursales
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <main className="flex-1">
        {/* Valores */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 sm:grid-cols-3">
            {[
              { titulo: 'Calidad garantizada', texto: 'Productos de proveedores confiables, listos para uso clínico y doméstico.', icono: '✅' },
              { titulo: 'Atención personalizada', texto: 'Te ayudamos a encontrar exactamente lo que necesitas, sin complicaciones.', icono: '🤝' },
              { titulo: '3 sucursales', texto: 'Coacalco, Tultepec y más — siempre cerca de ti.', icono: '📍' },
            ].map((v) => (
              <div key={v.titulo} className="rounded-2xl bg-fondo-claro p-6">
                <span className="text-3xl">{v.icono}</span>
                <p className="mt-3 text-base font-bold text-navy">{v.titulo}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{v.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Los más vendidos (curado manualmente desde /admin/destacados) */}
        <MasVendidosSection productos={destacados} />

        {/* Nuestras Marcas */}
        <MarcasCarousel />

        {/* Sucursales */}
        <section className="bg-fondo-claro" id="sucursales">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">Sucursales</h2>
              <p className="mt-2 text-sm text-gray-600">Visítanos, te esperamos con gusto</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {sucursales.map((s) => {
                const info = infoMapaSucursales[s.nombre]
                const proximamente = !info

                return (
                  <div key={s.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="flex h-48 w-full items-center justify-center bg-gray-100">
                      {info ? (
                        <iframe
                          title={`Mapa ${s.nombre}`}
                          src={info.cidEmbed}
                          className="h-full w-full border-0"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-400">Próximamente</span>
                      )}
                    </div>
                    <div className="p-6">
                      <p className="text-base font-bold text-navy">{s.nombre}</p>
                      {proximamente ? (
                        <p className="mt-2 text-sm font-semibold text-azul">Próximamente</p>
                      ) : (
                        <>
                          {s.direccion && <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.direccion}</p>}
                          {s.telefono && (
                            <a href={`tel:${s.telefono}`} className="mt-3 block text-sm font-semibold text-azul">
                              {s.telefono}
                            </a>
                          )}
                          <p className="mt-3 text-xs font-semibold text-gray-500">Lunes a sábado · 9:00 a 19:00 hrs</p>
                          <a
                            href={info.urlCompleta}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-block rounded-full bg-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-navy/85"
                          >
                            Cómo llegar
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-azul">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-14 text-center">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">¿Buscas un producto en especial?</h2>
            <p className="max-w-xl text-sm text-white/85">
              Explora nuestro catálogo completo o solicita un producto y te contactamos.
            </p>
            <Link
              href="/catalogo"
              className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-azul transition hover:bg-white/90"
            >
              Ir al catálogo
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter sucursales={sucursales} />
      <WhatsAppFloatingButton />
    </div>
  )
}
