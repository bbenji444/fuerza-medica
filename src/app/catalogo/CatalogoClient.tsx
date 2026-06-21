'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import SolicitarProductoModal from './SolicitarProductoModal'

type Producto = {
  id: string
  codigo: string
  nombre: string
  precio_venta: number
  categoria_id: string | null
  imagen_url: string | null
}

type Categoria = {
  id: string
  nombre: string
  categoria_padre: string | null
}

type Sucursal = {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
}

const TAMANO_PAGINA = 24

export default function CatalogoClient({
  productos,
  categorias,
  sucursales,
}: {
  productos: Producto[]
  categorias: Categoria[]
  sucursales: Sucursal[]
}) {
  const searchParams = useSearchParams()

  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState(searchParams.get('categoria') || '')
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState('')
  const [cantidadVisible, setCantidadVisible] = useState(TAMANO_PAGINA)
  const [productoSolicitar, setProductoSolicitar] = useState<Producto | null>(null)
  const sentinelaRef = useRef<HTMLDivElement>(null)

  const categoriasPrincipales = categorias.filter((c) => !c.categoria_padre)
  const subcategoriasDisponibles = categorias.filter((c) => c.categoria_padre === categoriaFiltro)
  const idsParaFiltrar = categoriaFiltro
    ? [categoriaFiltro, ...categorias.filter((c) => c.categoria_padre === categoriaFiltro).map((c) => c.id)]
    : []

  const filtrados = useMemo(() => {
    return productos
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
      )
      .filter((p) => {
        if (subcategoriaFiltro) return p.categoria_id === subcategoriaFiltro
        if (categoriaFiltro) return idsParaFiltrar.includes(p.categoria_id || '')
        return true
      })
  }, [productos, busqueda, categoriaFiltro, subcategoriaFiltro, idsParaFiltrar])

  const visibles = filtrados.slice(0, cantidadVisible)

  useEffect(() => {
    setCantidadVisible(TAMANO_PAGINA)
  }, [busqueda, categoriaFiltro, subcategoriaFiltro])

  useEffect(() => {
    const el = sentinelaRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCantidadVisible((c) => Math.min(c + TAMANO_PAGINA, filtrados.length))
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [filtrados.length])

  function cambiarCategoria(id: string) {
    setCategoriaFiltro(id)
    setSubcategoriaFiltro('')
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Catálogo de productos</h1>
        <p className="mt-2 text-sm text-gray-600">{filtrados.length} productos disponibles</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="min-w-[220px] flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-azul focus:outline-none sm:max-w-sm"
        />

        <select
          value={categoriaFiltro}
          onChange={(e) => cambiarCategoria(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-azul focus:outline-none"
        >
          <option value="">Todas las categorías</option>
          {categoriasPrincipales.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        {categoriaFiltro && subcategoriasDisponibles.length > 0 && (
          <select
            value={subcategoriaFiltro}
            onChange={(e) => setSubcategoriaFiltro(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-azul focus:outline-none"
          >
            <option value="">Todas las subcategorías</option>
            {subcategoriasDisponibles.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl bg-white p-16 text-center text-gray-500 shadow-sm">
          No encontramos productos que coincidan con tu búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {visibles.map((p) => (
            <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg">
              <div className="flex h-36 items-center justify-center bg-fondo-claro">
                {p.imagen_url ? (
                  <Image src={p.imagen_url} alt={p.nombre} width={160} height={144} className="h-36 w-full object-contain p-3" />
                ) : (
                  <span className="text-4xl opacity-30">⚕️</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="line-clamp-2 flex-1 text-sm font-semibold text-navy">{p.nombre}</p>
                <p className="mt-2 text-lg font-extrabold text-azul">${p.precio_venta?.toFixed(2)}</p>
                <button
                  onClick={() => setProductoSolicitar(p)}
                  className="mt-3 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-navy/85"
                >
                  Solicitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cantidadVisible < filtrados.length && (
        <div ref={sentinelaRef} className="flex justify-center py-10">
          <span className="text-sm text-gray-400">Cargando más productos...</span>
        </div>
      )}

      {productoSolicitar && (
        <SolicitarProductoModal
          producto={productoSolicitar}
          sucursales={sucursales}
          onCerrar={() => setProductoSolicitar(null)}
        />
      )}
    </div>
  )
}
