'use client'

import { useEffect, useRef, useState } from 'react'
import { MenuIcon, ChevronIcon } from '../components/SocialIcons'

type Categoria = {
  id: string
  nombre: string
  categoria_padre: string | null
}

function normalizar(s: string) {
  return s
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .trim()
}

export default function CategoriasMegaMenu({
  categorias,
  categoriaFiltro,
  subcategoriaFiltro,
  onSeleccionar,
  onLimpiar,
}: {
  categorias: Categoria[]
  categoriaFiltro: string
  subcategoriaFiltro: string
  onSeleccionar: (categoriaId: string, subcategoriaId: string) => void
  onLimpiar: () => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [categoriaActiva, setCategoriaActiva] = useState('')
  const [acordeonAbierto, setAcordeonAbierto] = useState('')
  const contenedorRef = useRef<HTMLDivElement>(null)

  const principales = categorias.filter((c) => !c.categoria_padre && normalizar(c.nombre) !== 'sin categoria')
  const subcatsDe = (padreId: string) => categorias.filter((c) => c.categoria_padre === padreId)

  useEffect(() => {
    if (!abierto) return
    function alHacerClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', alHacerClickFuera)
    return () => document.removeEventListener('mousedown', alHacerClickFuera)
  }, [abierto])

  function abrir() {
    setAbierto(true)
    setCategoriaActiva(categoriaFiltro || principales[0]?.id || '')
  }

  function elegirCategoria(id: string) {
    onSeleccionar(id, '')
    setAbierto(false)
  }

  function elegirSubcategoria(categoriaId: string, subId: string) {
    onSeleccionar(categoriaId, subId)
    setAbierto(false)
  }

  function limpiar() {
    onLimpiar()
    setAbierto(false)
  }

  const nombreCategoriaActiva = categorias.find((c) => c.id === categoriaFiltro)?.nombre
  const nombreSubcategoriaActiva = categorias.find((c) => c.id === subcategoriaFiltro)?.nombre
  const etiqueta = nombreSubcategoriaActiva || nombreCategoriaActiva

  return (
    <div ref={contenedorRef} className="relative" onMouseLeave={() => setAbierto(false)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => (abierto ? setAbierto(false) : abrir())}
          onMouseEnter={abrir}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:border-azul"
        >
          <MenuIcon className="h-4 w-4" />
          {etiqueta ? `Categoría: ${etiqueta}` : 'Navegar categorías'}
        </button>
        {etiqueta && (
          <button type="button" onClick={limpiar} className="text-xs font-semibold text-gray-400 transition hover:text-azul">
            Quitar filtro ✕
          </button>
        )}
      </div>

      {abierto && (
        <>
          {/* Desktop: flyout lateral con hover */}
          <div className="absolute left-0 top-full z-30 hidden overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 md:flex">
            <div className="max-h-[min(70vh,480px)] w-52 overflow-y-auto border-r border-gray-100 py-1.5">
              <button
                type="button"
                onClick={limpiar}
                className="block w-full px-4 py-1.5 text-left text-[13px] font-semibold text-azul hover:bg-fondo-claro"
              >
                Todas las categorías
              </button>
              {principales.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseEnter={() => setCategoriaActiva(c.id)}
                  onClick={() => elegirCategoria(c.id)}
                  className={`flex w-full items-center justify-between px-4 py-1.5 text-left text-[13px] font-medium transition ${
                    categoriaActiva === c.id ? 'bg-fondo-claro text-azul' : 'text-navy hover:bg-fondo-claro'
                  }`}
                >
                  {c.nombre}
                  <ChevronIcon className="h-3 w-3 shrink-0 text-gray-300" />
                </button>
              ))}
            </div>
            <div className="max-h-[min(70vh,480px)] w-64 overflow-y-auto py-1.5">
              {subcatsDe(categoriaActiva).length === 0 ? (
                <p className="px-4 py-3 text-[13px] text-gray-400">Sin subcategorías — clic en la categoría para ver todo</p>
              ) : (
                subcatsDe(categoriaActiva).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => elegirSubcategoria(categoriaActiva, s.id)}
                    className={`block w-full px-4 py-1.5 text-left text-[13px] transition hover:bg-fondo-claro hover:text-azul ${
                      subcategoriaFiltro === s.id ? 'font-semibold text-azul' : 'text-gray-600'
                    }`}
                  >
                    {s.nombre}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Móvil: acordeón vertical */}
          <div className="absolute left-0 top-full z-30 max-h-[70vh] w-72 overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 md:hidden">
            <button
              type="button"
              onClick={limpiar}
              className="block w-full border-b border-gray-100 px-5 py-3 text-left text-sm font-semibold text-azul"
            >
              Todas las categorías
            </button>
            {principales.map((c) => {
              const subs = subcatsDe(c.id)
              const expandido = acordeonAbierto === c.id
              return (
                <div key={c.id} className="border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => (subs.length > 0 ? setAcordeonAbierto(expandido ? '' : c.id) : elegirCategoria(c.id))}
                    className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-medium text-navy"
                  >
                    {c.nombre}
                    {subs.length > 0 && <ChevronIcon className={`h-3.5 w-3.5 transition ${expandido ? 'rotate-90' : ''}`} />}
                  </button>
                  {expandido && subs.length > 0 && (
                    <div className="bg-fondo-claro/60 pb-1">
                      <button
                        type="button"
                        onClick={() => elegirCategoria(c.id)}
                        className="block w-full px-8 py-2 text-left text-xs font-semibold text-azul"
                      >
                        Todo en {c.nombre}
                      </button>
                      {subs.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => elegirSubcategoria(c.id, s.id)}
                          className="block w-full px-8 py-2 text-left text-sm text-gray-600"
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
        </>
      )}
    </div>
  )
}
