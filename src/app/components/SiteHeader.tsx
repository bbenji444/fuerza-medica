'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const enlaces = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/sucursales', label: 'Sucursales' },
]

export default function SiteHeader() {
  const [abierto, setAbierto] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-navy shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-3" onClick={() => setAbierto(false)}>
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white">
            <Image src="/logo fuerza medica.jpg" alt="Fuerza Médica" width={44} height={44} className="object-cover" />
          </span>
          <span className="text-lg font-bold text-white tracking-tight">Fuerza Médica</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} className="text-sm font-semibold text-white/85 transition hover:text-white">
              {e.label}
            </Link>
          ))}
          <Link
            href="/catalogo"
            className="rounded-full bg-azul px-5 py-2 text-sm font-bold text-white transition hover:bg-azul/90"
          >
            Ver catálogo
          </Link>
        </nav>

        <button
          onClick={() => setAbierto(!abierto)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label="Abrir menú"
        >
          <span className={`block h-0.5 w-6 bg-white transition ${abierto ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-6 bg-white transition ${abierto ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-white transition ${abierto ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {abierto && (
        <nav className="flex flex-col gap-1 border-t border-white/10 bg-navy px-5 pb-4 md:hidden">
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              onClick={() => setAbierto(false)}
              className="rounded-lg px-3 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
            >
              {e.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
