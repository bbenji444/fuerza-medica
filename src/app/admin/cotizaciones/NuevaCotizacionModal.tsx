'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { precioConDescuento, promocionAplicable, Promocion } from '@/utils/promociones'

const estados = ['borrador', 'enviada', 'aceptada', 'cancelada']

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
  categoria_id?: string
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
}

function generarIdLocal() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}

export default function NuevaCotizacionModal({
  cotizacionId,
  clientes,
  productos,
  sucursales,
  inventario,
  promociones,
  usuario,
  onCerrar,
  onGuardada,
}: {
  cotizacionId?: string
  clientes: Cliente[]
  productos: Producto[]
  sucursales: Sucursal[]
  inventario: InventarioItem[]
  promociones: Promocion[]
  usuario: Usuario
  onCerrar: () => void
  onGuardada: () => void
}) {
  const supabase = createClient()
  const router = useRouter()
  const esEdicion = !!cotizacionId

  const [paso, setPaso] = useState<1 | 2>(esEdicion ? 2 : 1)
  const [cargando, setCargando] = useState(esEdicion)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [modoNuevoCliente, setModoNuevoCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', correo: '', direccion: '' })
  const [editandoClienteId, setEditandoClienteId] = useState<string | null>(null)
  const [formClienteEdit, setFormClienteEdit] = useState({ nombre: '', telefono: '', correo: '', direccion: '' })

  const [sucursalId, setSucursalId] = useState(
    usuario?.sucursal_id
    || sucursales.find((s) => s.nombre.toLowerCase().includes('coacalco'))?.id
    || sucursales[0]?.id
    || ''
  )
  const [estado, setEstado] = useState('borrador')
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [mensajeEscaneo, setMensajeEscaneo] = useState('')
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const guardandoRef = useRef(false)
  const inputProductoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!cargando && paso === 2) {
      inputProductoRef.current?.focus()
    }
  }, [cargando, paso])

  useEffect(() => {
    if (!cotizacionId) return

    async function cargarCotizacion() {
      setCargando(true)

      const { data: cotizacion } = await supabase
        .from('cotizaciones')
        .select('estado, sucursal_id, clientes(id, nombre, telefono, correo, direccion)')
        .eq('id', cotizacionId)
        .single()

      const { data: items } = await supabase
        .from('cotizacion_items')
        .select('producto_id, cantidad, precio_unitario, productos(codigo, nombre)')
        .eq('cotizacion_id', cotizacionId)

      if (cotizacion) {
        const cliente = cotizacion.clientes as unknown as Cliente | null
        setEstado(cotizacion.estado)
        setSucursalId(cotizacion.sucursal_id)
        setClienteSeleccionado(cliente)
      }

      if (items) {
        setCarrito(
          (items as unknown as { producto_id: string; cantidad: number; precio_unitario: number; productos: { codigo: string; nombre: string } | null }[]).map((i) => ({
            id: generarIdLocal(),
            producto_id: i.producto_id,
            codigo: i.productos?.codigo || '',
            nombre: i.productos?.nombre || '',
            cantidad: i.cantidad,
            precio_unitario: i.precio_unitario,
          }))
        )
      }

      setCargando(false)
    }

    cargarCotizacion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cotizacionId])

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

  const total = carrito.reduce((sum, i) => sum + i.cantidad * i.precio_unitario, 0)

  function irAProductos() {
    if (!clienteSeleccionado && !modoNuevoCliente) {
      setError('Selecciona un cliente o crea uno nuevo')
      return
    }
    if (modoNuevoCliente && !nuevoCliente.nombre.trim()) {
      setError('El nombre del cliente es obligatorio')
      return
    }
    setError('')
    setPaso(2)
  }

  function agregarProducto(p: Producto) {
    const existente = carrito.find((i) => i.producto_id === p.id)
    if (existente) {
      actualizarItem(existente.id, 'cantidad', existente.cantidad + 1)
      return
    }
    const { precio } = precioSugerido(p)
    setCarrito([
      ...carrito,
      { id: generarIdLocal(), producto_id: p.id, codigo: p.codigo, nombre: p.nombre, cantidad: 1, precio_unitario: precio },
    ])
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
    }

    setBusquedaProducto('')
  }

  function actualizarItem(id: string, campo: 'cantidad' | 'precio_unitario', valor: number) {
    setCarrito(carrito.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)))
  }

  function quitarItem(id: string) {
    setCarrito(carrito.filter((i) => i.id !== id))
  }

  function iniciarEdicionCliente(c: Cliente) {
    setEditandoClienteId(c.id)
    setFormClienteEdit({
      nombre: c.nombre,
      telefono: c.telefono || '',
      correo: c.correo || '',
      direccion: c.direccion || '',
    })
  }

  async function guardarEdicionCliente() {
    if (!editandoClienteId) return

    const { error: errEdit } = await supabase
      .from('clientes')
      .update({
        nombre: formClienteEdit.nombre,
        telefono: formClienteEdit.telefono || null,
        correo: formClienteEdit.correo || null,
        direccion: formClienteEdit.direccion || null,
      })
      .eq('id', editandoClienteId)

    if (errEdit) {
      setError('Error al editar cliente: ' + errEdit.message)
      return
    }

    if (clienteSeleccionado?.id === editandoClienteId) {
      setClienteSeleccionado({ id: editandoClienteId, ...formClienteEdit })
    }

    setEditandoClienteId(null)
    setError('')
    router.refresh()
  }

  async function borrarCliente(id: string) {
    if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return

    const { error: errBorrar } = await supabase.from('clientes').delete().eq('id', id)

    if (errBorrar) {
      setError(
        errBorrar.code === '23503'
          ? 'No se puede eliminar: este cliente tiene cotizaciones asociadas.'
          : 'Error al eliminar cliente: ' + errBorrar.message
      )
      return
    }

    if (clienteSeleccionado?.id === id) setClienteSeleccionado(null)
    setError('')
    router.refresh()
  }

  async function guardarCotizacion() {
    if (guardandoRef.current) return

    if (carrito.length === 0) {
      setError('Agrega al menos un producto')
      return
    }
    if (!sucursalId) {
      setError('Selecciona una sucursal')
      return
    }

    guardandoRef.current = true
    setGuardando(true)
    setError('')

    let clienteId = clienteSeleccionado?.id

    if (!clienteId) {
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
        setError('Error al crear cliente: ' + errCliente?.message)
        guardandoRef.current = false
      setGuardando(false)
        return
      }
      clienteId = data.id
    }

    if (esEdicion) {
      const { data: actualizadas, error: errUpdate } = await supabase
        .from('cotizaciones')
        .update({ cliente_id: clienteId, sucursal_id: sucursalId, estado, total })
        .eq('id', cotizacionId)
        .select('id')

      if (errUpdate) {
        setError('Error al actualizar cotización: ' + errUpdate.message)
        guardandoRef.current = false
        setGuardando(false)
        return
      }

      if (!actualizadas || actualizadas.length === 0) {
        setError('No se pudo actualizar la cotización: la base de datos no permitió el cambio (revisa la política RLS de UPDATE en "cotizaciones").')
        guardandoRef.current = false
        setGuardando(false)
        return
      }

      const { data: itemsExistentes } = await supabase
        .from('cotizacion_items')
        .select('id')
        .eq('cotizacion_id', cotizacionId)

      const { data: itemsBorrados, error: errDelete } = await supabase
        .from('cotizacion_items')
        .delete()
        .eq('cotizacion_id', cotizacionId)
        .select('id')

      if (errDelete) {
        setError('Error al actualizar productos: ' + errDelete.message)
        guardandoRef.current = false
        setGuardando(false)
        return
      }

      if ((itemsExistentes?.length || 0) > 0 && (itemsBorrados?.length || 0) === 0) {
        setError('No se pudieron eliminar los productos anteriores: la base de datos no permitió el cambio (revisa la política RLS de DELETE en "cotizacion_items"). No se guardó nada para evitar duplicar productos.')
        guardandoRef.current = false
        setGuardando(false)
        return
      }

      const items = carrito.map((i) => ({
        cotizacion_id: cotizacionId,
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
      }))

      const { error: errItems } = await supabase.from('cotizacion_items').insert(items)

      guardandoRef.current = false
      setGuardando(false)

      if (errItems) {
        setError('Error al guardar productos: ' + errItems.message)
        return
      }

      onGuardada()
      return
    }

    const { data: cotizacion, error: errCotizacion } = await supabase
      .from('cotizaciones')
      .insert({
        cliente_id: clienteId,
        sucursal_id: sucursalId,
        usuario_id: usuario?.id,
        estado: 'borrador',
        total,
      })
      .select('id')
      .single()

    if (errCotizacion || !cotizacion) {
      setError('Error al crear cotización: ' + errCotizacion?.message)
      guardandoRef.current = false
      setGuardando(false)
      return
    }

    const items = carrito.map((i) => ({
      cotizacion_id: cotizacion.id,
      producto_id: i.producto_id,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
    }))

    const { error: errItems } = await supabase.from('cotizacion_items').insert(items)

    setGuardando(false)

    if (errItems) {
      setError('Error al guardar productos: ' + errItems.message)
      return
    }

    onGuardada()
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
    >
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', padding: '28px',
        width: '640px', maxHeight: '88vh', overflowY: 'auto',
      }}>
        <h2 style={{ color: '#0D1B3E', fontSize: '18px', marginBottom: '4px' }}>
          {esEdicion ? 'Editar cotización' : 'Nueva cotización'}
        </h2>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
          Paso {paso} de 2 — {paso === 1 ? 'Cliente' : 'Productos'}
        </p>

        {error && (
          <p style={{ color: '#B81C1C', fontSize: '13px', marginBottom: '12px', backgroundColor: '#FDE8E8', padding: '10px', borderRadius: '6px' }}>
            {error}
          </p>
        )}

        {cargando && (
          <p style={{ color: '#888', fontSize: '13px', padding: '20px 0' }}>Cargando cotización...</p>
        )}

        {!cargando && paso === 1 && (
          <div>
            {clienteSeleccionado && (
              <p style={{ color: '#1A7A3E', fontSize: '13px', marginBottom: '8px' }}>
                Cliente seleccionado: <strong>{clienteSeleccionado.nombre}</strong>
              </p>
            )}
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

                <div style={{ maxHeight: '260px', overflowY: 'auto', marginTop: '8px', border: '1px solid #E0E8F5', borderRadius: '8px' }}>
                  {clientesFiltrados.length === 0 && (
                    <p style={{ color: '#888', fontSize: '13px', padding: '14px' }}>Sin resultados</p>
                  )}
                  {clientesFiltrados.slice(0, 30).map((c) =>
                    editandoClienteId === c.id ? (
                      <div key={c.id} style={{ padding: '12px 14px', borderBottom: '1px solid #F0F4FB', backgroundColor: '#F9FBFE' }}>
                        <input
                          placeholder="Nombre"
                          value={formClienteEdit.nombre}
                          onChange={(e) => setFormClienteEdit({ ...formClienteEdit, nombre: e.target.value })}
                          style={inputStyle}
                        />
                        <input
                          placeholder="Teléfono"
                          value={formClienteEdit.telefono}
                          onChange={(e) => setFormClienteEdit({ ...formClienteEdit, telefono: e.target.value })}
                          style={inputStyle}
                        />
                        <input
                          placeholder="Correo"
                          value={formClienteEdit.correo}
                          onChange={(e) => setFormClienteEdit({ ...formClienteEdit, correo: e.target.value })}
                          style={inputStyle}
                        />
                        <input
                          placeholder="Dirección"
                          value={formClienteEdit.direccion}
                          onChange={(e) => setFormClienteEdit({ ...formClienteEdit, direccion: e.target.value })}
                          style={inputStyle}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button onClick={() => setEditandoClienteId(null)} style={{ ...btnSecundario, padding: '8px', fontSize: '12px' }}>
                            Cancelar
                          </button>
                          <button onClick={guardarEdicionCliente} style={{ ...btnPrimario, padding: '8px', fontSize: '12px' }}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          borderBottom: '1px solid #F0F4FB',
                          backgroundColor: clienteSeleccionado?.id === c.id ? '#EAF2FE' : 'white',
                        }}
                      >
                        <button
                          onClick={() => setClienteSeleccionado(c)}
                          style={{
                            flex: 1, display: 'block', textAlign: 'left', padding: '10px 14px',
                            border: 'none', background: 'none', cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0D1B3E' }}>{c.nombre}</span>
                          <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>{c.telefono}</span>
                        </button>
                        <div style={{ display: 'flex', gap: '4px', paddingRight: '10px' }}>
                          <button
                            onClick={() => iniciarEdicionCliente(c)}
                            title="Editar cliente"
                            style={{ fontSize: '12px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => borrarCliente(c.id)}
                            title="Eliminar cliente"
                            style={{ fontSize: '12px', color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <button
                  onClick={() => setModoNuevoCliente(true)}
                  style={{ marginTop: '12px', fontSize: '13px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  + Crear nuevo cliente
                </button>
              </>
            ) : (
              <>
                <label style={labelStyle}>Nombre</label>
                <input
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                  style={inputStyle}
                />
                <label style={labelStyle}>Teléfono</label>
                <input
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                  style={inputStyle}
                />
                <label style={labelStyle}>Correo</label>
                <input
                  value={nuevoCliente.correo}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, correo: e.target.value })}
                  style={inputStyle}
                />
                <label style={labelStyle}>Dirección</label>
                <input
                  value={nuevoCliente.direccion}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                  style={inputStyle}
                />

                <button
                  onClick={() => setModoNuevoCliente(false)}
                  style={{ marginTop: '8px', fontSize: '13px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  ← Buscar cliente existente
                </button>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={onCerrar} style={btnSecundario}>Cancelar</button>
              <button onClick={irAProductos} style={btnPrimario}>Siguiente</button>
            </div>
          </div>
        )}

        {!cargando && paso === 2 && (
          <div>
            <label style={labelStyle}>Sucursal</label>
            <select
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              style={inputStyle}
              disabled={!!usuario?.sucursal_id}
            >
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>

            {esEdicion && (
              <>
                <label style={labelStyle}>Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  style={inputStyle}
                >
                  {estados.map((e) => (
                    <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                  ))}
                </select>
              </>
            )}

            <input
              ref={inputProductoRef}
              type="text"
              placeholder="Buscar o escanear código de producto..."
              value={busquedaProducto}
              onChange={(e) => {
                setBusquedaProducto(e.target.value)
                setMensajeEscaneo('')
              }}
              onKeyDown={manejarEnterProducto}
              style={{ ...inputStyle, marginTop: '12px' }}
            />

            {mensajeEscaneo && (
              <p style={{ color: '#B81C1C', fontSize: '12px', marginTop: '4px', marginBottom: '4px' }}>
                {mensajeEscaneo}
              </p>
            )}

            {busquedaProducto && (
              <div style={{ maxHeight: '160px', overflowY: 'auto', marginTop: '8px', border: '1px solid #E0E8F5', borderRadius: '8px' }}>
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

            <div style={{ marginTop: '16px', backgroundColor: '#F4F7FC', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E0E8F5' }}>
                    <th style={thStyle}>Producto</th>
                    <th style={thStyle}>Cantidad</th>
                    <th style={thStyle}>Precio</th>
                    <th style={thStyle}>Subtotal</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((i) => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #E0E8F5' }}>
                      <td style={tdStyle}>{i.nombre}</td>
                      <td style={tdStyle}>
                        <input
                          type="number" min={1} value={i.cantidad}
                          onChange={(e) => actualizarItem(i.id, 'cantidad', parseFloat(e.target.value) || 0)}
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
                  ))}
                  {carrito.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>
                        Aún no agregas productos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p style={{ textAlign: 'right', fontSize: '16px', fontWeight: 700, color: '#0D1B3E', marginTop: '12px' }}>
              Total: ${total.toFixed(2)}
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setPaso(1)} style={btnSecundario}>Atrás</button>
              <button onClick={guardarCotizacion} disabled={guardando} style={btnPrimario}>
                {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar cotización'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '14px', marginBottom: '4px' }
const labelStyle: React.CSSProperties = { fontSize: '12px', color: '#0D1B3E', fontWeight: 600, display: 'block', marginBottom: '4px', marginTop: '12px' }
const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: 600 }
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: '13px', color: '#333' }
const btnSecundario: React.CSSProperties = { flex: 1, padding: '12px', backgroundColor: '#F0F4FB', color: '#888', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }
const btnPrimario: React.CSSProperties = { flex: 1, padding: '12px', backgroundColor: '#1A6DD4', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }
