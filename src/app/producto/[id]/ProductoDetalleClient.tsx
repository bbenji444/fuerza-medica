'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProductoImagen from '../../components/ProductoImagen'
import { useCart } from '../../components/CartContext'

type Producto = {
  id: string
  codigo: string
  nombre: string
  precio_venta: number
  imagen_url: string | null
  imagen_url_hover: string | null
  descripcion: string | null
  variante_nombre?: string | null
}

type Disponibilidad = { nombre: string; existencia: number }

type Variante = {
  id: string
  variante_nombre: string | null
  variante_orden: number
  precio_venta: number
}

type Similar = {
  id: string
  nombre: string
  precio_venta: number
  imagen_url: string | null
  imagen_url_hover: string | null
}

export default function ProductoDetalleClient({
  producto,
  nombreCategoria,
  disponibilidad,
  totalDisponible,
  variantes,
  similares,
}: {
  producto: Producto
  nombreCategoria: string | null
  disponibilidad: Disponibilidad[]
  totalDisponible: number
  variantes: Variante[]
  similares: Similar[]
}) {
  const { agregar } = useCart()
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)
  const agotado = totalDisponible <= 0

  function cambiarCantidad(delta: number) {
    setCantidad((c) => {
      const nueva = c + delta
      if (nueva < 1) return 1
      if (totalDisponible > 0 && nueva > totalDisponible) return totalDisponible
      return nueva
    })
  }

  function handleAgregar() {
    agregar(
      { id: producto.id, nombre: producto.nombre, precio_venta: producto.precio_venta, imagen_url: producto.imagen_url },
      cantidad
    )
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav className="mb-6 text-xs text-gray-500">
        <Link href="/" className="hover:text-azul">Inicio</Link>
        <span className="mx-1.5">/</span>
        <Link href="/catalogo" className="hover:text-azul">Catálogo</Link>
        {nombreCategoria && (
          <>
            <span className="mx-1.5">/</span>
            <span>{nombreCategoria}</span>
          </>
        )}
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="flex h-80 items-center justify-center rounded-2xl bg-white p-6 shadow-sm md:h-[420px]">
          <ProductoImagen
            imagenUrl={producto.imagen_url}
            imagenUrlHover={producto.imagen_url_hover}
            nombre={producto.nombre}
            width={400}
            height={400}
            className="h-full w-full object-contain"
            classNamePlaceholder="h-40 w-40 rounded-full object-cover opacity-70"
          />
        </div>

        <div>
          {nombreCategoria && (
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-azul">{nombreCategoria}</p>
          )}
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{producto.nombre}</h1>
          <p className="mt-1 text-xs text-gray-400">Código: {producto.codigo}</p>

          <p className="mt-5 text-3xl font-extrabold text-azul">${producto.precio_venta?.toFixed(2)}</p>

          {variantes.length > 1 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navy">Elige una opción</p>
              <div className="flex flex-wrap gap-2">
                {variantes.map((v) => (
                  <Link
                    key={v.id}
                    href={`/producto/${v.id}`}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      v.id === producto.id
                        ? 'border-azul bg-azul text-white'
                        : 'border-gray-200 bg-white text-navy hover:border-azul'
                    }`}
                  >
                    {v.variante_nombre || 'Opción'}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            {agotado ? (
              <p className="text-sm font-bold text-[#B81C1C]">Agotado por el momento</p>
            ) : (
              <>
                <p className="text-sm font-bold text-[#1A7A3E]">Disponible: {totalDisponible} unidades en total</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  {disponibilidad.map((d) => (
                    <li key={d.nombre}>
                      {d.nombre}: {d.existencia > 0 ? `${d.existencia} disponibles` : 'sin stock'}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => cambiarCantidad(-1)}
                disabled={agotado}
                className="flex h-10 w-10 items-center justify-center text-lg font-bold text-navy disabled:opacity-40"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-semibold text-navy">{cantidad}</span>
              <button
                type="button"
                onClick={() => cambiarCantidad(1)}
                disabled={agotado || cantidad >= totalDisponible}
                className="flex h-10 w-10 items-center justify-center text-lg font-bold text-navy disabled:opacity-40"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAgregar}
              disabled={agotado}
              className="flex-1 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1fb959] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {agregado ? '✓ Agregado al carrito' : 'Agregar al carrito'}
            </button>
          </div>

          {producto.descripcion && (
            <div className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Descripción</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{producto.descripcion}</p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Especificaciones</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
              <li><span className="font-semibold text-navy">Código:</span> {producto.codigo}</li>
              {nombreCategoria && (
                <li><span className="font-semibold text-navy">Categoría:</span> {nombreCategoria}</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {similares.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 text-xl font-extrabold text-navy">Productos similares</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
            {similares.map((p) => (
              <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg">
                <Link href={`/producto/${p.id}`} className="flex h-32 items-center justify-center bg-fondo-claro">
                  <ProductoImagen
                    imagenUrl={p.imagen_url}
                    imagenUrlHover={p.imagen_url_hover}
                    nombre={p.nombre}
                    width={140}
                    height={128}
                    className="h-32 w-full object-contain p-3"
                    classNamePlaceholder="h-20 w-20 rounded-full object-cover opacity-70"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-3">
                  <Link href={`/producto/${p.id}`} className="line-clamp-2 flex-1 text-xs font-semibold text-navy hover:text-azul">
                    {p.nombre}
                  </Link>
                  <p className="mt-1.5 text-sm font-extrabold text-azul">${p.precio_venta?.toFixed(2)}</p>
                  <button
                    onClick={() => agregar({ id: p.id, nombre: p.nombre, precio_venta: p.precio_venta, imagen_url: p.imagen_url })}
                    className="mt-2 rounded-full bg-[#25D366] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#1fb959]"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
