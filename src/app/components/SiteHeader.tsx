'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from './CartContext'
import CartDrawer from './CartDrawer'
import { PhoneIcon, SearchIcon, ChevronIcon } from './SocialIcons'
import { createClient } from '@/utils/supabase/client'

type Categoria = {
  id: string
  nombre: string
  categoria_padre: string | null
}

function normalizar(s: string) {
  return s
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').trim()
}

const enlaces = [
  { href: '/', label: 'Inicio' },
  { href: '/#sucursales', label: 'Sucursales' },
]

export default function SiteHeader() {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [catMenuAbierto, setCatMenuAbierto] = useState(false)
  const [categoriaHover, setCategoriaHover] = useState('')
  const [catMobileAbierto, setCatMobileAbierto] = useState(false)
  const [catMobileExpanded, setCatMobileExpanded] = useState('')
  const catMenuRef = useRef<HTMLDivElement>(null)
  const { cantidadTotal, abrirCarrito } = useCart()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categorias')
      .select('id, nombre, categoria_padre')
      .order('nombre')
      .then(({ data }) => {
        if (data) {
          const filtradas = data.filter((c) => normalizar(c.nombre) !== 'sin categoria')
          setCategorias(filtradas)
          const primera = filtradas.find((c) => !c.categoria_padre)
          if (primera) setCategoriaHover(primera.id)
        }
      })
  }, [])

  useEffect(() => {
    if (!catMenuAbierto) return
    function handleClick(e: MouseEvent) {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) {
        setCatMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [catMenuAbierto])

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    setAbierto(false)
    router.push(busqueda.trim() ? `/catalogo?buscar=${encodeURIComponent(busqueda.trim())}` : '/catalogo')
  }

  const principales = categorias.filter((c) => !c.categoria_padre)
  const subcatsDe = (padreId: string) => categorias.filter((c) => c.categoria_padre === padreId)

  function abrirCatMenu() {
    setCatMenuAbierto(true)
    if (!categoriaHover && principales.length > 0) setCategoriaHover(principales[0].id)
  }

  function irACategoria(id: string) {
    router.push(`/catalogo?categoria=${id}`)
    setCatMenuAbierto(false)
    setAbierto(false)
    setCatMobileAbierto(false)
  }

  function irASubcategoria(subId: string) {
    router.push(`/catalogo?subcategoria=${subId}`)
    setCatMenuAbierto(false)
    setAbierto(false)
    setCatMobileAbierto(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-white to-[#E8F0FF] shadow-sm border-b border-gray-200">

      {/* ──────────────────────────────────────────
          ESCRITORIO (≥ sm)
          ────────────────────────────────────────── */}
      <div className="hidden sm:flex">

        {/* Logo — ícono hasta la izquierda, texto (tagline + nombre) a la derecha */}
        <Link
          href="/"
          onClick={() => setAbierto(false)}
          className="flex shrink-0 items-center gap-3 self-stretch pl-5 pr-4"
        >
          <span className="relative h-16 w-16 shrink-0 lg:h-20 lg:w-20">
            <Image
              src="/logo-icono.png"
              alt="Fuerza Médica"
              fill
              sizes="80px"
              priority
              style={{ objectFit: 'contain' }}
            />
          </span>
          <span className="flex flex-col whitespace-nowrap">
            <span className="text-[11px] font-semibold uppercase tracking-normal text-azul lg:text-xs">
              Equipo médico/ortopédico
            </span>
            <span className="text-2xl font-extrabold leading-none tracking-tight text-navy lg:text-[28px]">
              Fuerza Médica
            </span>
          </span>
        </Link>

        {/* Columna derecha — sin overflow-hidden para que el dropdown no se corte */}
        <div className="flex flex-1 items-center pl-8 pr-6 py-5 gap-5">

          {/* Buscador */}
          <form onSubmit={buscar} className="hidden md:block w-80 shrink-0">
            <div className="relative w-full">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A6DD4]" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1A6DD4] placeholder:text-[#1A6DD4]/50 shadow-sm focus:border-azul focus:outline-none"
              />
            </div>
          </form>

          {/* Nav links */}
          <nav className="hidden items-center gap-5 md:flex">
            {enlaces.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="text-sm font-semibold text-navy transition hover:text-azul"
              >
                {e.label}
              </Link>
            ))}

            {/* Dropdown categorías */}
            <div
              ref={catMenuRef}
              className="relative"
              onMouseEnter={abrirCatMenu}
              onMouseLeave={() => setCatMenuAbierto(false)}
            >
              <button
                type="button"
                onClick={() => (catMenuAbierto ? setCatMenuAbierto(false) : abrirCatMenu())}
                className="flex items-center gap-1.5 text-sm font-semibold text-navy transition hover:text-azul"
              >
                Categorías
                <ChevronIcon className={`h-3 w-3 transition-transform ${catMenuAbierto ? 'rotate-90' : ''}`} />
              </button>

              {catMenuAbierto && (
                <div className="absolute left-0 top-full z-50 flex overflow-hidden rounded-b-2xl rounded-tr-2xl bg-white shadow-2xl ring-1 ring-black/5">
                  <div className="max-h-[min(70vh,480px)] w-52 overflow-y-auto border-r border-gray-100 py-1.5">
                    {principales.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseEnter={() => setCategoriaHover(c.id)}
                        onClick={() => irACategoria(c.id)}
                        className={`flex w-full items-center justify-between px-4 py-1.5 text-left text-[13px] font-medium transition ${
                          categoriaHover === c.id
                            ? 'bg-[#F4F8FF] text-[#1A6DD4]'
                            : 'text-[#0D1B3E] hover:bg-[#F4F8FF]'
                        }`}
                      >
                        {c.nombre}
                        <ChevronIcon className="h-3 w-3 shrink-0 text-gray-300" />
                      </button>
                    ))}
                  </div>
                  <div className="max-h-[min(70vh,480px)] w-60 overflow-y-auto py-1.5">
                    <button
                      type="button"
                      onClick={() => irACategoria(categoriaHover)}
                      className="block w-full px-4 py-1.5 text-left text-[13px] font-semibold text-[#1A6DD4] hover:bg-[#F4F8FF]"
                    >
                      Todo en esta categoría →
                    </button>
                    {subcatsDe(categoriaHover).length === 0 ? (
                      <p className="px-4 py-3 text-[13px] text-gray-400">Sin subcategorías</p>
                    ) : (
                      subcatsDe(categoriaHover).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => irASubcategoria(s.id)}
                          className="block w-full px-4 py-1.5 text-left text-[13px] text-gray-600 transition hover:bg-[#F4F8FF] hover:text-[#1A6DD4]"
                        >
                          {s.nombre}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/catalogo"
              className="rounded-full bg-azul px-5 py-2 text-sm font-bold text-white transition hover:bg-azul/90"
            >
              Ver catálogo
            </Link>

            <a
              href="tel:5575070124"
              className="flex items-center gap-1.5 text-xs font-semibold text-navy/60 transition hover:text-azul"
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              55 7507 0124
            </a>

            <button onClick={abrirCarrito} className="relative" aria-label="Ver carrito">
              <span className="text-xl">🛒</span>
              {cantidadTotal > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#25D366] px-1 text-[11px] font-bold text-white">
                  {cantidadTotal}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* ──────────────────────────────────────────
          MÓVIL
          ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3 sm:hidden">
        <Link href="/" onClick={() => setAbierto(false)} className="flex shrink-0 items-center gap-2">
          <Image src="/logo-icono.png" alt="Fuerza Médica" width={40} height={40} className="object-contain" />
          <span className="flex flex-col whitespace-nowrap">
            <span className="text-[9px] font-semibold uppercase tracking-normal text-azul">
              Equipo médico/ortopédico
            </span>
            <span className="text-base font-extrabold leading-tight tracking-tight text-navy">Fuerza Médica</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={abrirCarrito} className="relative" aria-label="Ver carrito">
            <span className="text-xl">🛒</span>
            {cantidadTotal > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#25D366] px-1 text-[11px] font-bold text-white">
                {cantidadTotal}
              </span>
            )}
          </button>
          <button
            onClick={() => setAbierto(!abierto)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
            aria-label="Abrir menú"
          >
            <span className={`block h-0.5 w-6 bg-navy transition ${abierto ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-6 bg-navy transition ${abierto ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-navy transition ${abierto ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {abierto && (
        <nav className="flex flex-col gap-1 border-t border-gray-200 bg-white px-5 pb-4 pt-3 sm:hidden">
          <form onSubmit={buscar} className="mb-2 flex">
            <div className="relative w-full">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A6DD4]" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1A6DD4] placeholder:text-[#1A6DD4]/50 focus:border-azul focus:outline-none"
              />
            </div>
          </form>
          <a href="tel:5575070124" className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-navy/60">
            <PhoneIcon className="h-4 w-4" />
            Llámanos: 55 7507 0124
          </a>
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              onClick={() => setAbierto(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-navy hover:bg-[#F4F8FF] hover:text-azul"
            >
              {e.label}
            </Link>
          ))}

          {/* Categorías acordeón */}
          <div>
            <button
              type="button"
              onClick={() => setCatMobileAbierto(!catMobileAbierto)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-navy hover:bg-[#F4F8FF] hover:text-azul"
            >
              Categorías
              <ChevronIcon className={`h-3.5 w-3.5 transition-transform ${catMobileAbierto ? 'rotate-90' : ''}`} />
            </button>
            {catMobileAbierto && (
              <div className="ml-3 mt-1 flex flex-col gap-0.5">
                {principales.map((c) => {
                  const subs = subcatsDe(c.id)
                  return (
                    <div key={c.id}>
                      <button
                        type="button"
                        onClick={() =>
                          subs.length > 0
                            ? setCatMobileExpanded(catMobileExpanded === c.id ? '' : c.id)
                            : irACategoria(c.id)
                        }
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-navy/70 hover:bg-[#F4F8FF] hover:text-azul"
                      >
                        {c.nombre}
                        {subs.length > 0 && (
                          <ChevronIcon className={`h-3 w-3 transition-transform ${catMobileExpanded === c.id ? 'rotate-90' : ''}`} />
                        )}
                      </button>
                      {catMobileExpanded === c.id && (
                        <div className="ml-3 flex flex-col gap-0.5 pb-1">
                          <button
                            type="button"
                            onClick={() => irACategoria(c.id)}
                            className="rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-azul hover:bg-[#F4F8FF]"
                          >
                            Todo en {c.nombre}
                          </button>
                          {subs.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => irASubcategoria(s.id)}
                              className="rounded-lg px-3 py-1.5 text-left text-xs text-navy/60 hover:bg-[#F4F8FF] hover:text-azul"
                            >
                              {s.nombre}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Link
            href="/catalogo"
            onClick={() => setAbierto(false)}
            className="mt-2 rounded-full bg-azul px-4 py-2.5 text-center text-sm font-bold text-white"
          >
            Ver catálogo
          </Link>
        </nav>
      )}

      <CartDrawer />
    </header>
  )
}
