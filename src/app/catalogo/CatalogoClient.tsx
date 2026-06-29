'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CategoriasMegaMenu from './CategoriasMegaMenu'
import { useCart } from '../components/CartContext'
import ProductoImagen from '../components/ProductoImagen'

type Producto = {
  id: string
  codigo: string
  nombre: string
  precio_venta: number
  categoria_id: string | null
  imagen_url: string | null
  imagen_url_hover?: string | null
  variante_grupo_id?: string | null
  variante_orden?: number
}

type Categoria = {
  id: string
  nombre: string
  categoria_padre: string | null
}

const TAMANO_PAGINA = 24

export default function CatalogoClient({
  productos,
  categorias,
}: {
  productos: Producto[]
  categorias: Categoria[]
}) {
  const searchParams = useSearchParams()
  const { agregar } = useCart()

  const [busqueda, setBusqueda] = useState(searchParams.get('buscar') || '')
  const [categoriaFiltro, setCategoriaFiltro] = useState(searchParams.get('categoria') || '')
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState(searchParams.get('subcategoria') || '')
  const [cantidadVisible, setCantidadVisible] = useState(TAMANO_PAGINA)
  const sentinelaRef = useRef<HTMLDivElement>(null)

  const idsParaFiltrar = categoriaFiltro
    ? [categoriaFiltro, ...categorias.filter((c) => c.categoria_padre === categoriaFiltro).map((c) => c.id)]
    : []

  const filtrados = useMemo(() => {
    const coincidentes = productos
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

    // Las variantes de tamaño/color del mismo producto (mismo variante_grupo_id)
    // se muestran como una sola tarjeta — la de menor variante_orden entre las que coincidieron.
    const representantePorGrupo = new Map<string, Producto>()
    for (const p of coincidentes) {
      if (!p.variante_grupo_id) continue
      const actual = representantePorGrupo.get(p.variante_grupo_id)
      if (!actual || (p.variante_orden ?? 0) < (actual.variante_orden ?? 0)) {
        representantePorGrupo.set(p.variante_grupo_id, p)
      }
    }

    return coincidentes.filter(
      (p) => !p.variante_grupo_id || representantePorGrupo.get(p.variante_grupo_id)?.id === p.id
    )
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

  function seleccionarCategoria(categoriaId: string, subcategoriaId: string) {
    setCategoriaFiltro(categoriaId)
    setSubcategoriaFiltro(subcategoriaId)
  }

  function limpiarCategoria() {
    setCategoriaFiltro('')
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

        <CategoriasMegaMenu
          categorias={categorias}
          categoriaFiltro={categoriaFiltro}
          subcategoriaFiltro={subcategoriaFiltro}
          onSeleccionar={seleccionarCategoria}
          onLimpiar={limpiarCategoria}
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl bg-white p-16 text-center text-gray-500 shadow-sm">
          No encontramos productos que coincidan con tu búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4">
          {visibles.map((p) => (
            <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg">
              <Link href={`/producto/${p.id}`} className="flex h-28 items-center justify-center bg-fondo-claro sm:h-36">
                <ProductoImagen
                  imagenUrl={p.imagen_url}
                  imagenUrlHover={p.imagen_url_hover}
                  nombre={p.nombre}
                  width={160}
                  height={144}
                  className="h-28 w-full object-contain p-2 sm:h-36 sm:p-3"
                  classNamePlaceholder="h-20 w-20 rounded-full object-cover opacity-70 sm:h-24 sm:w-24"
                />
              </Link>
              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <Link href={`/producto/${p.id}`} className="line-clamp-2 flex-1 text-xs font-semibold text-navy hover:text-azul sm:text-sm">
                  {p.nombre}
                </Link>
                <p className="mt-1.5 text-base font-extrabold text-azul sm:mt-2 sm:text-lg">${p.precio_venta?.toFixed(2)}</p>
                <button
                  onClick={() => agregar(p)}
                  className="mt-2 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#1fb959] sm:mt-3 sm:px-4 sm:py-2"
                >
                  + Carrito
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
    </div>
  )
}
