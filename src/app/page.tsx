import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'

const iconosPorCategoria: Record<string, string> = {
  'Curación': '🩹',
  'Desechables': '🧤',
  'Instrumental': '🔬',
  'Diagnóstico': '🩺',
  'Mobiliario y Equipo': '🛏️',
}

function iconoPara(nombre: string) {
  return iconosPorCategoria[nombre] || '⚕️'
}

export default async function Home() {
  const supabase = await createClient()

  const [{ data: categorias }, { data: sucursales }] = await Promise.all([
    supabase.from('categorias').select('id, nombre').is('categoria_padre', null).order('nombre'),
    supabase.from('sucursales').select('id, nombre, direccion, telefono').eq('activa', true).order('creado_en'),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-[#142a5c]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:py-28">
            <div>
              <span className="mb-4 inline-block rounded-full bg-azul/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-azul">
                Equipo médico y ortopédico
              </span>
              <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Todo lo que necesitas para el cuidado de la salud
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
                Material de curación, instrumental, desechables y equipo médico al alcance de tu mano.
                Tres sucursales listas para atenderte con calidad y precios justos.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/catalogo"
                  className="rounded-full bg-azul px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-azul/30 transition hover:bg-azul/90"
                >
                  Ver catálogo completo
                </Link>
                <Link
                  href="/sucursales"
                  className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Nuestras sucursales
                </Link>
              </div>
            </div>
            <div className="hidden justify-center md:flex">
              <div className="flex h-72 w-72 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-full bg-white shadow-2xl">
                  <Image src="/logo fuerza medica.jpg" alt="Fuerza Médica" width={224} height={224} className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

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

        {/* Categorías */}
        <section className="bg-fondo-claro">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">Explora por categoría</h2>
              <p className="mt-2 text-sm text-gray-600">Encuentra rápido lo que buscas</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {(categorias || []).map((c) => (
                <Link
                  key={c.id}
                  href={`/catalogo?categoria=${c.id}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="text-3xl transition group-hover:scale-110">{iconoPara(c.nombre)}</span>
                  <span className="text-sm font-semibold text-navy">{c.nombre}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Sucursales */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">Visítanos</h2>
              <p className="mt-2 text-sm text-gray-600">Estamos cerca de ti</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {(sucursales || []).map((s) => (
                <div key={s.id} className="rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <p className="text-base font-bold text-navy">{s.nombre}</p>
                  {s.direccion && <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.direccion}</p>}
                  {s.telefono && <p className="mt-2 text-sm font-semibold text-azul">{s.telefono}</p>}
                  <p className="mt-3 text-xs text-gray-500">Lunes a sábado · 9:00 a 19:00 hrs</p>
                </div>
              ))}
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

      <SiteFooter sucursales={sucursales || []} />
    </div>
  )
}
