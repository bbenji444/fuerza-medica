'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { precioConDescuento, promocionAplicable, Promocion } from '@/utils/promociones'
import { descontarInventarioCarrito, restituirInventarioCarrito } from '@/utils/descontarInventarioCarrito'
import { generarPdfTicket } from '@/utils/generarPdfTicket'

const metodosPago = ['efectivo', 'tarjeta', 'transferencia']

type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  correo: string | null
  direccion: string | null
}

type Producto = {
  id: string
  codigo: string
  nombre: string
  precio_venta: number
  precio_mayoreo: number
  precio_costo?: number
  categoria_id?: string
}

type Configuracion = {
  id: string
  margen_ganancia: number
  iva_porcentaje: number
}

type Sucursal = {
  id: string
  nombre: string
}

type InventarioItem = {
  producto_id: string
  sucursal_id: string
  existencia: number
}

type Usuario = {
  id: string
  rol: string
  sucursal_id: string | null
} | null

type ItemCarrito = {
  id: string
  producto_id: string
  codigo: string
  nombre: string
  cantidad: number
  precio_unitario: number
  precio_costo: number
}

function generarIdLocal() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}

export default function VentaRapidaPanel({
  clientes,
  productos,
  sucursales,
  inventario,
  promociones,
  configuracion,
  usuario,
  onVentaRegistrada,
}: {
  clientes: Cliente[]
  productos: Producto[]
  sucursales: Sucursal[]
  inventario: InventarioItem[]
  promociones: Promocion[]
  configuracion: Configuracion
  usuario: Usuario
  onVentaRegistrada: () => void
}) {
  const supabase = createClient()
  const router = useRouter()

  const [sucursalId, setSucursalId] = useState(usuario?.sucursal_id || sucursales[0]?.id || '')
  const [metodoPago, setMetodoPago] = useState('efectivo')

  const [mostrarCliente, setMostrarCliente] = useState(false)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [modoNuevoCliente, setModoNuevoCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', correo: '', direccion: '' })

  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [mensajeEscaneo, setMensajeEscaneo] = useState('')
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmacion, setConfirmacion] = useState<{ folio: string; venta: any; items: ItemCarrito[] } | null>(null)
  const [ivaCalc, setIvaCalc] = useState(String(configuracion.iva_porcentaje))
  const [margenBulk, setMargenBulk] = useState('')
  const [margenPorItem, setMargenPorItem] = useState<Record<string, string>>({})
  const [disponibilidadOtras, setDisponibilidadOtras] = useState<Record<string, { sucursal_nombre: string; existencia: number }[]>>({})
  const guardandoRef = useRef(false)
  const inputProductoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputProductoRef.current?.focus()
  }, [])

  useEffect(() => {
    carrito.forEach((item) => {
      const existencia = existenciaProducto(item.producto_id)
      const faltaStock = existencia === undefined || existencia === 0 || item.cantidad > existencia
      if (!faltaStock || disponibilidadOtras[item.producto_id]) return

      supabase
        .rpc('disponibilidad_producto_otras_sucursales', { p_producto_id: item.producto_id, p_sucursal_actual: sucursalId })
        .then(({ data }) => {
          if (data) setDisponibilidadOtras((prev) => ({ ...prev, [item.producto_id]: data }))
        })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito, sucursalId])

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
      c.telefono?.toLowerCase().includes(busquedaCliente.toLowerCase())
  )

  const productosFiltrados = productos
    .filter(
      (p) =>
        p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(busquedaProducto.toLowerCase())
    )
    .slice(0, 50)

  function existenciaProducto(productoId: string) {
    return inventario.find((i) => i.producto_id === productoId && i.sucursal_id === sucursalId)?.existencia
  }

  function precioSugerido(p: Producto) {
    const promo = promocionAplicable(promociones, p.id, p.categoria_id)
    return { precio: precioConDescuento(p.precio_venta || 0, promo), promo }
  }

  function ivaDeLinea(precioUnitario: number, cantidad: number) {
    const iva = parseFloat(ivaCalc) || 0
    const subtotalLinea = precioUnitario * cantidad
    return subtotalLinea - subtotalLinea / (1 + iva / 100)
  }

  const total = carrito.reduce((sum, i) => sum + i.cantidad * i.precio_unitario, 0)
  const totalIva = carrito.reduce((sum, i) => sum + ivaDeLinea(i.precio_unitario, i.cantidad), 0)
  const hayExcesoStock = carrito.some((i) => {
    const existencia = existenciaProducto(i.producto_id)
    return existencia !== undefined && i.cantidad > existencia
  })

  function agregarProducto(p: Producto) {
    const existente = carrito.find((i) => i.producto_id === p.id)
    if (existente) {
      actualizarItem(existente.id, 'cantidad', existente.cantidad + 1)
    } else {
      const { precio } = precioSugerido(p)
      setCarrito((c) => [
        ...c,
        { id: generarIdLocal(), producto_id: p.id, codigo: p.codigo, nombre: p.nombre, cantidad: 1, precio_unitario: precio, precio_costo: p.precio_costo || 0 },
      ])
    }
    setBusquedaProducto('')
    inputProductoRef.current?.focus()
  }

  function precioDesdeCosto(costo: number, margen: number, iva: number) {
    const conGanancia = costo * (1 + margen / 100)
    return Math.round(conGanancia * (1 + iva / 100) * 100) / 100
  }

  // % de ganancia que YA se está aplicando hoy, calculado al revés desde el precio actual del renglón
  function margenActual(costo: number, precioActual: number, iva: number) {
    if (!costo) return 0
    const sinIva = precioActual / (1 + iva / 100)
    return Math.round((sinIva / costo - 1) * 1000) / 10
  }

  function margenMostrado(item: ItemCarrito) {
    const iva = parseFloat(ivaCalc) || 0
    return margenPorItem[item.id] ?? String(margenActual(item.precio_costo, item.precio_unitario, iva))
  }

  function cambiarMargenItem(item: ItemCarrito, valor: string) {
    setMargenPorItem((prev) => ({ ...prev, [item.id]: valor }))
    if (!item.precio_costo) return
    const iva = parseFloat(ivaCalc) || 0
    const margen = parseFloat(valor)
    if (isNaN(margen)) return
    actualizarItem(item.id, 'precio_unitario', precioDesdeCosto(item.precio_costo, margen, iva))
  }

  function cambiarIva(valor: string) {
    setIvaCalc(valor)
    const iva = parseFloat(valor) || 0
    setCarrito((c) =>
      c.map((i) => {
        if (!i.precio_costo) return i
        const margenTexto = margenPorItem[i.id]
        if (margenTexto === undefined) return i
        const margen = parseFloat(margenTexto) || 0
        return { ...i, precio_unitario: precioDesdeCosto(i.precio_costo, margen, iva) }
      })
    )
  }

  function aplicarCalculoATodos() {
    const iva = parseFloat(ivaCalc) || 0
    const margen = parseFloat(margenBulk) || 0
    setCarrito((c) =>
      c.map((i) => (i.precio_costo ? { ...i, precio_unitario: precioDesdeCosto(i.precio_costo, margen, iva) } : i))
    )
    setMargenPorItem((prev) => {
      const next = { ...prev }
      carrito.forEach((i) => { if (i.precio_costo) next[i.id] = margenBulk })
      return next
    })
  }

  function manejarEnterProducto(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const codigo = busquedaProducto.trim()
    if (!codigo) return

    const encontrado = productos.find((p) => p.codigo?.toLowerCase() === codigo.toLowerCase())

    if (encontrado) {
      agregarProducto(encontrado)
      setMensajeEscaneo('')
    } else {
      setMensajeEscaneo(`Producto no encontrado: "${codigo}"`)
      setBusquedaProducto('')
    }
  }

  function actualizarItem(id: string, campo: 'cantidad' | 'precio_unitario' | 'precio_costo', valor: number) {
    setCarrito((c) => c.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)))
  }

  function quitarItem(id: string) {
    setCarrito((c) => c.filter((i) => i.id !== id))
  }

  function reiniciarParaSiguienteVenta() {
    setCarrito([])
    setClienteSeleccionado(null)
    setBusquedaCliente('')
    setModoNuevoCliente(false)
    setNuevoCliente({ nombre: '', telefono: '', correo: '', direccion: '' })
    setMostrarCliente(false)
    setError('')
    inputProductoRef.current?.focus()
  }

  async function guardarVenta() {
    if (guardandoRef.current) return

    if (carrito.length === 0) {
      setError('Agrega al menos un producto')
      return
    }
    if (!sucursalId) {
      setError('Selecciona una sucursal')
      return
    }
    if (modoNuevoCliente && !nuevoCliente.nombre.trim()) {
      setError('El nombre del cliente es obligatorio')
      return
    }

    guardandoRef.current = true
    setGuardando(true)
    setError('')

    const errorStock = await descontarInventarioCarrito(
      supabase,
      sucursalId,
      carrito.map((i) => ({ producto_id: i.producto_id, nombre: i.nombre, cantidad: i.cantidad }))
    )

    if (errorStock) {
      setError(errorStock)
      guardandoRef.current = false
      setGuardando(false)
      return
    }

    let clienteId = clienteSeleccionado?.id || null

    if (!clienteId && modoNuevoCliente) {
      const { data, error: errCliente } = await supabase
        .from('clientes')
        .insert({
          nombre: nuevoCliente.nombre,
          telefono: nuevoCliente.telefono || null,
          correo: nuevoCliente.correo || null,
          direccion: nuevoCliente.direccion || null,
        })
        .select('id')
        .single()

      if (errCliente || !data) {
        await restituirInventarioCarrito(supabase, sucursalId, carrito.map((i) => ({ producto_id: i.producto_id, nombre: i.nombre, cantidad: i.cantidad })))
        setError('Error al crear cliente: ' + errCliente?.message)
        guardandoRef.current = false
        setGuardando(false)
        return
      }
      clienteId = data.id
    }

    const { data: venta, error: errVenta } = await supabase
      .from('ventas')
      .insert({
        cliente_id: clienteId,
        sucursal_id: sucursalId,
        usuario_id: usuario?.id,
        metodo_pago: metodoPago,
        total,
      })
      .select('id, folio, total, metodo_pago, creado_en, sucursales(nombre)')
      .single()

    if (errVenta || !venta) {
      await restituirInventarioCarrito(supabase, sucursalId, carrito.map((i) => ({ producto_id: i.producto_id, nombre: i.nombre, cantidad: i.cantidad })))
      setError('Error al crear venta: ' + errVenta?.message)
      guardandoRef.current = false
      setGuardando(false)
      return
    }

    const items = carrito.map((i) => ({
      venta_id: venta.id,
      producto_id: i.producto_id,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
    }))

    const { error: errItems } = await supabase.from('venta_items').insert(items)

    guardandoRef.current = false
    setGuardando(false)

    if (errItems) {
      await restituirInventarioCarrito(supabase, sucursalId, carrito.map((i) => ({ producto_id: i.producto_id, nombre: i.nombre, cantidad: i.cantidad })))
      await supabase.from('ventas').delete().eq('id', venta.id)
      setError('Error al guardar productos: ' + errItems.message)
      return
    }

    setConfirmacion({ folio: venta.folio, venta, items: carrito })
    reiniciarParaSiguienteVenta()
    router.refresh()
    onVentaRegistrada()
  }

  async function descargarTicketConfirmacion() {
    if (!confirmacion) return
    await generarPdfTicket(
      confirmacion.venta,
      confirmacion.items.map((i) => ({
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        subtotal: i.cantidad * i.precio_unitario,
        productos: { codigo: i.codigo, nombre: i.nombre },
      }))
    )
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
        <h2 style={{ color: '#0D1B3E', fontSize: '16px', fontWeight: 700 }}>Venta rápida</h2>
        {confirmacion && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#1A7A3E', fontSize: '13px', fontWeight: 600 }}>
              ✓ Venta {confirmacion.folio} registrada
            </span>
            <button
              onClick={descargarTicketConfirmacion}
              style={{ fontSize: '12px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Generar ticket
            </button>
            <button
              onClick={() => setConfirmacion(null)}
              style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: '#B81C1C', fontSize: '13px', marginBottom: '12px', backgroundColor: '#FDE8E8', padding: '10px', borderRadius: '6px' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <select
          value={sucursalId}
          onChange={(e) => setSucursalId(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}
          disabled={!!usuario?.sucursal_id}
        >
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>

        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}
        >
          {metodosPago.map((m) => (
            <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
          ))}
        </select>

        {!mostrarCliente && (
          <button
            onClick={() => setMostrarCliente(true)}
            style={{ fontSize: '13px', color: '#1A6DD4', background: 'none', border: '1px dashed #1A6DD4', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600 }}
          >
            {clienteSeleccionado ? `Cliente: ${clienteSeleccionado.nombre}` : '+ Agregar cliente (opcional)'}
          </button>
        )}
      </div>

      {mostrarCliente && (
        <div style={{ backgroundColor: '#F9FBFE', border: '1px solid #E0E8F5', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          {!modoNuevoCliente ? (
            <>
              <input
                type="text"
                placeholder="Buscar cliente por nombre o teléfono..."
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value)
                  setClienteSeleccionado(null)
                }}
                style={inputStyle}
              />
              {busquedaCliente && (
                <div style={{ maxHeight: '160px', overflowY: 'auto', marginTop: '8px', border: '1px solid #E0E8F5', borderRadius: '8px', backgroundColor: 'white' }}>
                  {clientesFiltrados.length === 0 && (
                    <p style={{ color: '#888', fontSize: '13px', padding: '12px' }}>Sin resultados</p>
                  )}
                  {clientesFiltrados.slice(0, 20).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setClienteSeleccionado(c)
                        setMostrarCliente(false)
                      }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderBottom: '1px solid #F0F4FB', cursor: 'pointer', background: 'white' }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0D1B3E' }}>{c.nombre}</span>
                      <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>{c.telefono}</span>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
                <button onClick={() => setModoNuevoCliente(true)} style={{ fontSize: '13px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  + Crear nuevo cliente
                </button>
                <button onClick={() => setMostrarCliente(false)} style={{ fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Cerrar
                </button>
                {clienteSeleccionado && (
                  <button
                    onClick={() => { setClienteSeleccionado(null); setMostrarCliente(false) }}
                    style={{ fontSize: '13px', color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Quitar cliente
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input placeholder="Nombre" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} style={inputStyle} />
                <input placeholder="Teléfono" value={nuevoCliente.telefono} onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} style={inputStyle} />
              </div>
              <button onClick={() => setModoNuevoCliente(false)} style={{ marginTop: '6px', fontSize: '13px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                ← Buscar cliente existente
              </button>
              <button onClick={() => setMostrarCliente(false)} style={{ marginLeft: '14px', fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>
                Listo
              </button>
            </>
          )}
        </div>
      )}

      <input
        ref={inputProductoRef}
        type="text"
        placeholder="Escanear o buscar producto por nombre o código..."
        value={busquedaProducto}
        onChange={(e) => {
          setBusquedaProducto(e.target.value)
          setMensajeEscaneo('')
        }}
        onKeyDown={manejarEnterProducto}
        style={{ ...inputStyle, fontSize: '16px', padding: '14px' }}
        autoFocus
      />

      {mensajeEscaneo && (
        <p style={{ color: '#B81C1C', fontSize: '12px', marginTop: '4px' }}>{mensajeEscaneo}</p>
      )}

      {busquedaProducto && (
        <div style={{ maxHeight: '180px', overflowY: 'auto', marginTop: '8px', border: '1px solid #E0E8F5', borderRadius: '8px' }}>
          {productosFiltrados.length === 0 && (
            <p style={{ color: '#888', fontSize: '13px', padding: '14px' }}>Sin resultados</p>
          )}
          {productosFiltrados.map((p) => {
            const existencia = existenciaProducto(p.id)
            const { precio, promo } = precioSugerido(p)
            return (
              <button
                key={p.id}
                onClick={() => agregarProducto(p)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left',
                  padding: '10px 14px', border: 'none', borderBottom: '1px solid #F0F4FB', cursor: 'pointer', backgroundColor: 'white',
                }}
              >
                <span style={{ fontSize: '13px', color: '#0D1B3E' }}>
                  {p.nombre}
                  <span style={{ fontSize: '11px', color: !existencia ? '#B81C1C' : '#888', marginLeft: '8px' }}>
                    {existencia === undefined ? '(sin registro de stock)' : `(${existencia} disponibles)`}
                  </span>
                  {promo && (
                    <span style={{ fontSize: '11px', marginLeft: '8px' }}>
                      <span style={{ color: '#888', textDecoration: 'line-through' }}>${p.precio_venta?.toFixed(2)}</span>
                      {' '}
                      <span style={{ color: '#1A7A3E', fontWeight: 600 }}>${precio.toFixed(2)}</span>
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '12px', color: '#1A6DD4', fontWeight: 600, flexShrink: 0 }}>+ Agregar</span>
              </button>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: '#888' }}>IVA %</label>
          <input type="number" step="0.1" value={ivaCalc} onChange={(e) => cambiarIva(e.target.value)} style={{ width: '60px', padding: '6px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '13px' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: '#888' }}>Ganancia % para todos</label>
          <input type="number" step="1" placeholder="ej. 70" value={margenBulk} onChange={(e) => setMargenBulk(e.target.value)} style={{ width: '70px', padding: '6px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '13px' }} />
          <button
            onClick={aplicarCalculoATodos}
            disabled={carrito.length === 0 || margenBulk === ''}
            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#1A6DD4', color: 'white', opacity: (carrito.length === 0 || margenBulk === '') ? 0.5 : 1 }}
          >
            Aplicar a todos
          </button>
        </div>
      </div>

      <div style={{ marginTop: '10px', backgroundColor: '#F4F7FC', borderRadius: '8px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E0E8F5' }}>
              <th style={thStyle}>Producto</th>
              <th style={thStyle}>Cantidad</th>
              <th style={thStyle}>Costo</th>
              <th style={thStyle}>% Ganancia</th>
              <th style={thStyle}>Precio</th>
              <th style={thStyle}>IVA</th>
              <th style={thStyle}>Subtotal</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {carrito.map((i) => {
              const existencia = existenciaProducto(i.producto_id)
              const excedeStock = existencia !== undefined && i.cantidad > existencia
              const faltaStock = existencia === undefined || existencia === 0 || excedeStock
              const otras = disponibilidadOtras[i.producto_id]?.filter((d) => d.existencia > 0)
              return (
                <tr key={i.id} style={{ borderBottom: '1px solid #E0E8F5' }}>
                  <td style={tdStyle}>
                    {i.nombre}
                    {excedeStock && (
                      <div style={{ fontSize: '11px', color: '#B81C1C', fontWeight: 600 }}>
                        Solo hay {existencia} en stock
                      </div>
                    )}
                    {faltaStock && otras && (
                      <div style={{ fontSize: '11px', color: otras.length > 0 ? '#1A6DD4' : '#888', marginTop: '2px' }}>
                        {otras.length > 0
                          ? `Disponible en: ${otras.map((d) => `${d.sucursal_nombre} (${d.existencia})`).join(', ')}`
                          : 'Sin stock en ninguna otra sucursal'}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number" min={1} value={i.cantidad}
                      onChange={(e) => actualizarItem(i.id, 'cantidad', parseFloat(e.target.value) || 0)}
                      style={{
                        width: '60px', padding: '6px', borderRadius: '6px',
                        border: excedeStock ? '1px solid #B81C1C' : '1px solid #E0E8F5',
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number" step="0.01" value={i.precio_costo}
                      onChange={(e) => actualizarItem(i.id, 'precio_costo', parseFloat(e.target.value) || 0)}
                      title="Costo del producto; si no está registrado en el catálogo, captúralo aquí para esta venta"
                      style={{ width: '70px', padding: '6px', border: '1px solid #E0E8F5', borderRadius: '6px' }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number" step="1" value={margenMostrado(i)}
                      onChange={(e) => cambiarMargenItem(i, e.target.value)}
                      title="% de ganancia sobre el costo; cambia el precio al instante"
                      style={{ width: '60px', padding: '6px', border: '1px solid #E0E8F5', borderRadius: '6px' }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number" step="0.01" value={i.precio_unitario}
                      onChange={(e) => actualizarItem(i.id, 'precio_unitario', parseFloat(e.target.value) || 0)}
                      style={{ width: '80px', padding: '6px', border: '1px solid #E0E8F5', borderRadius: '6px' }}
                    />
                  </td>
                  <td style={tdStyle}>${ivaDeLinea(i.precio_unitario, i.cantidad).toFixed(2)}</td>
                  <td style={tdStyle}>${(i.cantidad * i.precio_unitario).toFixed(2)}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => quitarItem(i.id)}
                      style={{ color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              )
            })}
            {carrito.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>
                  Escanea o busca el primer producto
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ textAlign: 'right', fontSize: '13px', color: '#888', marginTop: '12px' }}>
        IVA incluido: ${totalIva.toFixed(2)}
      </p>
      <p style={{ textAlign: 'right', fontSize: '20px', fontWeight: 700, color: '#0D1B3E' }}>
        Total: ${total.toFixed(2)}
      </p>

      {hayExcesoStock && (
        <p style={{ color: '#B81C1C', fontSize: '13px', marginTop: '8px' }}>
          Hay productos con cantidad mayor al stock disponible.
        </p>
      )}

      <button
        onClick={guardarVenta}
        disabled={guardando || hayExcesoStock || carrito.length === 0}
        style={{
          width: '100%', marginTop: '16px', padding: '14px', backgroundColor: '#1A6DD4', color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
          opacity: (guardando || hayExcesoStock || carrito.length === 0) ? 0.6 : 1,
        }}
      >
        {guardando ? 'Registrando...' : 'Registrar venta'}
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '14px' }
const labelStyle: React.CSSProperties = { fontSize: '12px', color: '#0D1B3E', fontWeight: 600, display: 'block', marginBottom: '4px', marginTop: '12px' }
const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: 600 }
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: '13px', color: '#333' }
