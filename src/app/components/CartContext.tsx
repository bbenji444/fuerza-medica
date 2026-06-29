'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ItemCarrito = {
  producto_id: string
  nombre: string
  precio_venta: number
  imagen_url: string | null
  cantidad: number
}

type CartContextType = {
  items: ItemCarrito[]
  abierto: boolean
  abrirCarrito: () => void
  cerrarCarrito: () => void
  agregar: (producto: { id: string; nombre: string; precio_venta: number; imagen_url: string | null }, cantidad?: number) => void
  quitar: (productoId: string) => void
  actualizarCantidad: (productoId: string, cantidad: number) => void
  vaciar: () => void
  total: number
  cantidadTotal: number
}

const CartContext = createContext<CartContextType | null>(null)

const CLAVE_LOCALSTORAGE = 'fm_carrito'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([])
  const [abierto, setAbierto] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_LOCALSTORAGE)
      if (guardado) setItems(JSON.parse(guardado))
    } catch {
      // localStorage no disponible o datos corruptos: empezar con carrito vacío
    }
    setListo(true)
  }, [])

  useEffect(() => {
    if (!listo) return
    localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(items))
  }, [items, listo])

  function agregar(producto: { id: string; nombre: string; precio_venta: number; imagen_url: string | null }, cantidad: number = 1) {
    setItems((actuales) => {
      const existente = actuales.find((i) => i.producto_id === producto.id)
      if (existente) {
        return actuales.map((i) => (i.producto_id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i))
      }
      return [
        ...actuales,
        { producto_id: producto.id, nombre: producto.nombre, precio_venta: producto.precio_venta, imagen_url: producto.imagen_url, cantidad },
      ]
    })
    setAbierto(true)
  }

  function quitar(productoId: string) {
    setItems((actuales) => actuales.filter((i) => i.producto_id !== productoId))
  }

  function actualizarCantidad(productoId: string, cantidad: number) {
    if (cantidad <= 0) {
      quitar(productoId)
      return
    }
    setItems((actuales) => actuales.map((i) => (i.producto_id === productoId ? { ...i, cantidad } : i)))
  }

  function vaciar() {
    setItems([])
  }

  const total = items.reduce((sum, i) => sum + i.precio_venta * i.cantidad, 0)
  const cantidadTotal = items.reduce((sum, i) => sum + i.cantidad, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        abierto,
        abrirCarrito: () => setAbierto(true),
        cerrarCarrito: () => setAbierto(false),
        agregar,
        quitar,
        actualizarCantidad,
        vaciar,
        total,
        cantidadTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
