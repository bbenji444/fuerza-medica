'use client'

import Link from 'next/link'
import { useCart } from './CartContext'
import ProductoImagen from './ProductoImagen'

type ProductoDestacado = {
  id: string
  nombre: string
  precio_venta: number
  imagen_url: string | null
  imagen_url_hover: string | null
}

export default function MasVendidosSection({ productos }: { productos: ProductoDestacado[] }) {
  const { agregar } = useCart()

  if (productos.length === 0) return null

  return (
    <section className="bg-fondo-claro" id="mas-vendidos">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">Los más vendidos</h2>
          <p className="mt-2 text-sm text-gray-600">Lo que más le gusta a nuestros clientes</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4">
          {productos.map((p) => (
            <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg">
              <Link href={`/producto/${p.id}`} className="flex h-28 items-center justify-center bg-fondo-claro sm:h-36">
                <ProductoImagen
                  imagenUrl={p.imagen_url}
                  imagenUrlHover={p.imagen_url_hover}
                  nombre={p.nombre}
                  width={160}
                  height={144}
                  className="h-28 w-full object-contain p-2 sm:h-36 sm:p-3"
                />
              </Link>
              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <Link href={`/producto/${p.id}`} className="line-clamp-2 flex-1 text-xs font-semibold text-navy hover:text-azul sm:text-sm">
                  {p.nombre}
                </Link>
                <p className="mt-1.5 text-base font-extrabold text-azul sm:mt-2 sm:text-lg">${p.precio_venta?.toFixed(2)}</p>
                <button
                  onClick={() => agregar({ id: p.id, nombre: p.nombre, precio_venta: p.precio_venta, imagen_url: p.imagen_url })}
                  className="mt-2 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#1fb959] sm:mt-3 sm:px-4 sm:py-2"
                >
                  + Carrito
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/catalogo"
            className="rounded-full bg-azul px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-azul/30 transition hover:bg-azul/90"
          >
            Ver catálogo completo
          </Link>
        </div>
      </div>
    </section>
  )
}
