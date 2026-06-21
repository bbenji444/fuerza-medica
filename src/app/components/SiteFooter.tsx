import Link from 'next/link'
import Image from 'next/image'

type Sucursal = {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
}

export default function SiteFooter({ sucursales }: { sucursales: Sucursal[] }) {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white">
              <Image src="/logo fuerza medica.jpg" alt="Fuerza Médica" width={48} height={48} className="object-cover" />
            </span>
            <span className="text-lg font-bold">Fuerza Médica</span>
          </div>
          <p className="text-sm leading-relaxed text-white/70">
            Equipo médico y ortopédico de calidad, con atención personalizada en nuestras sucursales.
          </p>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-white/50">Sucursales</p>
          <ul className="space-y-3">
            {sucursales.map((s) => (
              <li key={s.id} className="text-sm text-white/80">
                <p className="font-semibold text-white">{s.nombre}</p>
                {s.direccion && <p className="text-white/60">{s.direccion}</p>}
                {s.telefono && <p className="text-white/60">{s.telefono}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-white/50">Navegación</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="text-white/80 hover:text-white">Inicio</Link></li>
            <li><Link href="/catalogo" className="text-white/80 hover:text-white">Catálogo</Link></li>
            <li><Link href="/sucursales" className="text-white/80 hover:text-white">Sucursales</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Fuerza Médica. Todos los derechos reservados.
      </div>
    </footer>
  )
}
