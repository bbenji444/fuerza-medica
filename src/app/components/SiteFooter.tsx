import Link from 'next/link'
import Image from 'next/image'
import { infoMapaSucursales } from './sucursalesInfo'
import { FacebookIcon, InstagramIcon } from './SocialIcons'

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
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white/25">
              <Image src="/logo fuerza medica.jpg" alt="Fuerza Médica" width={64} height={64} className="object-cover" />
            </span>
            <span className="text-lg font-bold">Fuerza Médica</span>
          </div>
          <p className="text-sm leading-relaxed text-white/70">
            Equipo médico y ortopédico de calidad, con atención personalizada en nuestras sucursales.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href="https://www.facebook.com/profile.php?id=61552115147036&locale=es_LA"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook de Fuerza Médica"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <FacebookIcon className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com/fuerzamedica_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Fuerza Médica"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-white/50">Sucursales</p>
          <ul className="space-y-3">
            {sucursales.map((s) => (
              <li key={s.id} className="text-sm text-white/80">
                <p className="font-semibold text-white">{s.nombre}</p>
                {infoMapaSucursales[s.nombre] ? (
                  <>
                    {s.direccion && <p className="text-white/60">{s.direccion}</p>}
                    {s.telefono && <p className="text-white/60">{s.telefono}</p>}
                  </>
                ) : (
                  <p className="text-white/60">Próximamente</p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-white/50">Navegación</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="text-white/80 hover:text-white">Inicio</Link></li>
            <li><Link href="/catalogo" className="text-white/80 hover:text-white">Catálogo</Link></li>
            <li><Link href="/#sucursales" className="text-white/80 hover:text-white">Sucursales</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Fuerza Médica. Todos los derechos reservados.
      </div>
    </footer>
  )
}
