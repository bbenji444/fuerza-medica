'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import NuevaCotizacionModal from './NuevaCotizacionModal'
import { generarPdfCotizacion } from '@/utils/generarPdfCotizacion'
import { generarPdfTicket } from '@/utils/generarPdfTicket'
import { descontarInventarioCarrito, restituirInventarioCarrito } from '@/utils/descontarInventarioCarrito'

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

type PromocionItem = {
  producto_id: string | null
  categoria_id: string | null
  tipo: string
  valor: number
  activa: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
}

const metodosPago = ['efectivo', 'tarjeta', 'transferencia']

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

type Cotizacion = {
  id: string
  estado: string
  total: number
  creado_en: string
  cliente_id: string
  sucursal_id: string
  clientes: { nombre: string; telefono: string | null; correo: string | null; direccion: string | null } | null
  sucursales: { nombre: string } | null
}

const estados = ['borrador', 'enviada', 'aceptada', 'cancelada']

const estadoColores: Record<string, { bg: string; color: string }> = {
  borrador: { bg: '#F0F4FB', color: '#888' },
  enviada: { bg: '#E3EEFD', color: '#1A6DD4' },
  aceptada: { bg: '#E8F7EE', color: '#1A7A3E' },
  cancelada: { bg: '#FDE8E8', color: '#B81C1C' },
}

export default function CotizacionesTable({
  cotizaciones,
  clientes,
  productos,
  sucursales,
  inventario,
  promociones,
  usuario,
}: {
  cotizaciones: Cotizacion[]
  clientes: Cliente[]
  productos: Producto[]
  sucursales: Sucursal[]
  inventario: InventarioItem[]
  promociones: PromocionItem[]
  usuario: Usuario
}) {
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [exportando, setExportando] = useState<string | null>(null)
  const [borrando, setBorrando] = useState<string | null>(null)
  const [convirtiendo, setConvirtiendo] = useState<string | null>(null)
  const [cotizacionAConvertir, setCotizacionAConvertir] = useState<Cotizacion | null>(null)
  const [metodoPagoConversion, setMetodoPagoConversion] = useState('efectivo')
  const router = useRouter()
  const supabase = createClient()

  const filtradas = cotizaciones
    .filter((c) => c.clientes?.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .filter((c) => (estadoFiltro ? c.estado === estadoFiltro : true))

  async function exportarPdf(cotizacion: Cotizacion) {
    setExportando(cotizacion.id)

    const { data: items, error } = await supabase
      .from('cotizacion_items')
      .select('cantidad, precio_unitario, subtotal, productos(codigo, nombre)')
      .eq('cotizacion_id', cotizacion.id)

    setExportando(null)

    if (error) {
      alert('Error al obtener los productos de la cotización: ' + error.message)
      return
    }

    await generarPdfCotizacion(cotizacion, (items || []) as any)
  }

  async function borrarCotizacion(cotizacion: Cotizacion) {
    if (!confirm(`¿Eliminar la cotización de ${cotizacion.clientes?.nombre || 'este cliente'}? Esta acción no se puede deshacer.`)) return

    setBorrando(cotizacion.id)

    const { error: errItems } = await supabase
      .from('cotizacion_items')
      .delete()
      .eq('cotizacion_id', cotizacion.id)

    if (errItems) {
      setBorrando(null)
      alert('Error al eliminar los productos de la cotización: ' + errItems.message)
      return
    }

    const { error: errCotizacion } = await supabase
      .from('cotizaciones')
      .delete()
      .eq('id', cotizacion.id)

    setBorrando(null)

    if (errCotizacion) {
      alert('Error al eliminar la cotización: ' + errCotizacion.message)
      return
    }

    router.refresh()
  }

  function iniciarConversion(cotizacion: Cotizacion) {
    setMetodoPagoConversion('efectivo')
    setCotizacionAConvertir(cotizacion)
  }

  async function confirmarConversion() {
    const cotizacion = cotizacionAConvertir
    if (!cotizacion) return

    setCotizacionAConvertir(null)
    setConvirtiendo(cotizacion.id)

    const { data: items, error: errItems } = await supabase
      .from('cotizacion_items')
      .select('producto_id, cantidad, precio_unitario, productos(codigo, nombre)')
      .eq('cotizacion_id', cotizacion.id)

    if (errItems || !items || items.length === 0) {
      setConvirtiendo(null)
      alert('Error al obtener los productos de la cotización: ' + (errItems?.message || 'no tiene productos'))
      return
    }

    const itemsParaStock = items.map((i) => ({
      producto_id: i.producto_id,
      nombre: (i.productos as unknown as { nombre: string } | null)?.nombre || 'producto',
      cantidad: i.cantidad,
    }))

    const errorStock = await descontarInventarioCarrito(supabase, cotizacion.sucursal_id, itemsParaStock)

    if (errorStock) {
      setConvirtiendo(null)
      alert(errorStock)
      return
    }

    const { data: venta, error: errVenta } = await supabase
      .from('ventas')
      .insert({
        cliente_id: cotizacion.cliente_id,
        sucursal_id: cotizacion.sucursal_id,
        usuario_id: usuario?.id,
        metodo_pago: metodoPagoConversion,
        total: cotizacion.total,
        cotizacion_id: cotizacion.id,
      })
      .select('id, folio, total, metodo_pago, creado_en, sucursales(nombre)')
      .single()

    if (errVenta || !venta) {
      await restituirInventarioCarrito(supabase, cotizacion.sucursal_id, itemsParaStock)
      setConvirtiendo(null)
      alert('Error al crear la venta: ' + errVenta?.message)
      return
    }

    const ventaItems = items.map((i) => ({
      venta_id: venta.id,
      producto_id: i.producto_id,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
    }))

    const { error: errVentaItems } = await supabase.from('venta_items').insert(ventaItems)

    setConvirtiendo(null)

    if (errVentaItems) {
      await restituirInventarioCarrito(supabase, cotizacion.sucursal_id, itemsParaStock)
      await supabase.from('ventas').delete().eq('id', venta.id)
      alert('Error al copiar los productos a la venta: ' + errVentaItems.message)
      router.refresh()
      return
    }

    await generarPdfTicket(
      venta as any,
      items.map((i) => ({
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        subtotal: i.cantidad * i.precio_unitario,
        productos: i.productos,
      })) as any
    )

    router.refresh()
  }

  function cerrarModal() {
    setMostrarNueva(false)
    setEditandoId(null)
  }

  function cotizacionGuardada() {
    setMostrarNueva(false)
    setEditandoId(null)
    router.refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            flex: '1', minWidth: '220px', maxWidth: '380px', padding: '10px 14px',
            border: '1px solid #E0E8F5', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white'
          }}
        />

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          style={{
            padding: '10px 14px', border: '1px solid #E0E8F5', borderRadius: '8px',
            fontSize: '14px', backgroundColor: 'white', minWidth: '180px'
          }}
        >
          <option value="">Todos los estados</option>
          {estados.map((e) => (
            <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>

        <button
          onClick={() => setMostrarNueva(true)}
          style={{
            marginLeft: 'auto', padding: '10px 18px', borderRadius: '8px', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#1A6DD4', color: 'white',
          }}
        >
          + Nueva cotización
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F7FC', borderBottom: '1px solid #E0E8F5' }}>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>Sucursal</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((c) => {
              const colores = estadoColores[c.estado] || estadoColores.borrador
              return (
                <tr
                  key={c.id}
                  onClick={() => setEditandoId(c.id)}
                  style={{ borderBottom: '1px solid #F0F4FB', cursor: 'pointer' }}
                >
                  <td style={tdStyle}>{c.clientes?.nombre || '—'}</td>
                  <td style={tdStyle}>{c.sucursales?.nombre || '—'}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: '11px', padding: '3px 10px', borderRadius: '999px',
                      backgroundColor: colores.bg, color: colores.color,
                    }}>
                      {c.estado}
                    </span>
                  </td>
                  <td style={tdStyle}>${c.total?.toFixed(2)}</td>
                  <td style={tdStyle}>{new Date(c.creado_en).toLocaleDateString('es-MX')}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          exportarPdf(c)
                        }}
                        disabled={exportando === c.id}
                        style={{ fontSize: '12px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {exportando === c.id ? 'Generando...' : 'Exportar PDF'}
                      </button>
                      {c.estado === 'aceptada' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            iniciarConversion(c)
                          }}
                          disabled={convirtiendo === c.id}
                          style={{ fontSize: '12px', color: '#1A7A3E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {convirtiendo === c.id ? 'Convirtiendo...' : 'Convertir en venta'}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          borrarCotizacion(c)
                        }}
                        disabled={borrando === c.id}
                        style={{ fontSize: '12px', color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {borrando === c.id ? 'Borrando...' : 'Borrar'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#888', padding: '24px' }}>
                  No hay cotizaciones que coincidan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(mostrarNueva || editandoId) && (
        <NuevaCotizacionModal
          cotizacionId={editandoId || undefined}
          clientes={clientes}
          productos={productos}
          sucursales={sucursales}
          inventario={inventario}
          promociones={promociones}
          usuario={usuario}
          onCerrar={cerrarModal}
          onGuardada={cotizacionGuardada}
        />
      )}

      {cotizacionAConvertir && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '360px' }}>
            <h2 style={{ color: '#0D1B3E', fontSize: '18px', marginBottom: '4px' }}>
              Convertir en venta
            </h2>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
              {cotizacionAConvertir.clientes?.nombre || 'Cliente'} — ${cotizacionAConvertir.total?.toFixed(2)}
            </p>

            <label style={{ fontSize: '12px', color: '#0D1B3E', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Método de pago
            </label>
            <select
              value={metodoPagoConversion}
              onChange={(e) => setMetodoPagoConversion(e.target.value)}
              style={{ width: '100%', padding: '9px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '14px', marginBottom: '4px' }}
            >
              {metodosPago.map((m) => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setCotizacionAConvertir(null)}
                style={{ flex: 1, padding: '12px', backgroundColor: '#F0F4FB', color: '#888', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarConversion}
                style={{ flex: 1, padding: '12px', backgroundColor: '#1A6DD4', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Generar venta y ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: 600 }
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#333' }

