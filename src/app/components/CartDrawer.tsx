'use client'

import Image from 'next/image'
import { useCart } from './CartContext'

const NUMERO_WHATSAPP = '525575070124'

export default function CartDrawer() {
  const { items, abierto, cerrarCarrito, quitar, actualizarCantidad, vaciar, total, cantidadTotal } = useCart()

  function comprarPorWhatsapp() {
    const lineas = items.map(
      (i) => `• ${i.cantidad}x ${i.nombre} — $${(i.precio_venta * i.cantidad).toFixed(2)}`
    )
    const mensaje = [
      'Hola, quiero comprar lo siguiente:',
      '',
      ...lineas,
      '',
      `Total: $${total.toFixed(2)}`,
    ].join('\n')

    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-[1100] flex justify-end bg-black/50">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <p className="text-base font-bold text-navy">Tu carrito ({cantidadTotal})</p>
          <button onClick={cerrarCarrito} className="text-2xl leading-none text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="mt-10 text-center text-sm text-gray-500">Tu carrito está vacío.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((i) => (
                <div key={i.producto_id} className="flex gap-3">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-fondo-claro">
                    <Image
                      src={i.imagen_url || '/logo fuerza medica.jpg'}
                      alt={i.nombre}
                      width={64}
                      height={64}
                      className={i.imagen_url ? 'h-16 w-16 object-contain p-1' : 'h-11 w-11 rounded-full object-cover opacity-70'}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-navy">{i.nombre}</p>
                    <p className="mt-1 text-sm font-bold text-azul">${i.precio_venta.toFixed(2)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => actualizarCantidad(i.producto_id, i.cantidad - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-navy">{i.cantidad}</span>
                      <button
                        onClick={() => actualizarCantidad(i.producto_id, i.cantidad + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        +
                      </button>
                      <button
                        onClick={() => quitar(i.producto_id)}
                        className="ml-2 text-xs font-semibold text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">Total</span>
              <span className="text-lg font-extrabold text-navy">${total.toFixed(2)}</span>
            </div>
            <button
              onClick={comprarPorWhatsapp}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#1fb959]"
            >
              Comprar por WhatsApp
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
              Te llevamos al chat con nuestro equipo para concretar tu compra
            </p>
            <button
              onClick={vaciar}
              className="mt-3 w-full text-center text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
