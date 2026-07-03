'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import VentaRapidaPanel from './VentaRapidaPanel'
import CalculadoraPrecio from './CalculadoraPrecio'
import CortesCajaTable from './CortesCajaTable'
import { generarPdfTicket } from '@/utils/generarPdfTicket'
import { Promocion } from '@/utils/promociones'
import { restituirInventarioCarrito } from '@/utils/descontarInventarioCarrito'

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

type Venta = {
  id: string
  folio: string
  total: number
  metodo_pago: string
  creado_en: string
  sucursal_id: string
  clientes: { nombre: string } | null
  sucursales: { nombre: string } | null
  monto_efectivo?: number | null
  monto_tarjeta?: number | null
  monto_transferencia?: number | null
  monto_recibido_efectivo?: number | null
  cambio?: number | null
}

type CorteCaja = {
  id: string
  sucursal_id: string
  fondo_inicial: number
  abierto_en: string
  estado: string
  efectivo_esperado: number | null
  efectivo_contado: number | null
  diferencia: number | null
  cerrado_en: string | null
  sucursales: { nombre: string } | null
  usuario_apertura: { nombre: string } | null
  usuario_cierre: { nombre: string } | null
}

export default function VentasTable({
  ventas,
  clientes,
  productos,
  sucursales,
  inventario,
  promociones,
  configuracion,
  cortesCaja,
  esAdmin,
  usuario,
}: {
  ventas: Venta[]
  clientes: Cliente[]
  productos: Producto[]
  sucursales: Sucursal[]
  inventario: InventarioItem[]
  promociones: Promocion[]
  configuracion: Configuracion
  cortesCaja: CorteCaja[]
  esAdmin: boolean
  usuario: Usuario
}) {
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false)
  const [mostrarCortes, setMostrarCortes] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [generando, setGenerando] = useState<string | null>(null)
  const [borrando, setBorrando] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const filtradas = ventas.filter((v) => {
    const textoOk =
      v.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.clientes?.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
    if (!textoOk) return false
    const fecha = new Date(v.creado_en)
    if (fechaDesde) {
      const desde = new Date(fechaDesde)
      desde.setHours(0, 0, 0, 0)
      if (fecha < desde) return false
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      if (fecha > hasta) return false
    }
    return true
  })

  async function generarTicket(venta: Venta) {
    setGenerando(venta.id)

    const { data: items, error } = await supabase
      .from('venta_items')
      .select('cantidad, precio_unitario, subtotal, productos(codigo, nombre)')
      .eq('venta_id', venta.id)

    setGenerando(null)

    if (error) {
      alert('Error al obtener los productos de la venta: ' + error.message)
      return
    }

    await generarPdfTicket(venta, (items || []) as any)
  }

  async function borrarVenta(venta: Venta) {
    if (!confirm(`¿Eliminar la venta ${venta.folio}? Esta acción no se puede deshacer. El stock vendido se devolverá al inventario.`)) return

    setBorrando(venta.id)

    const { data: itemsBorrados, error: errItems } = await supabase
      .from('venta_items')
      .delete()
      .eq('venta_id', venta.id)
      .select('producto_id, cantidad')

    if (errItems) {
      setBorrando(null)
      alert('Error al eliminar los productos de la venta: ' + errItems.message)
      return
    }

    if (itemsBorrados && itemsBorrados.length > 0) {
      await restituirInventarioCarrito(
        supabase,
        venta.sucursal_id,
        itemsBorrados.map((i) => ({ producto_id: i.producto_id, nombre: '', cantidad: i.cantidad }))
      )
    }

    const { error: errVenta } = await supabase
      .from('ventas')
      .delete()
      .eq('id', venta.id)

    setBorrando(null)

    if (errVenta) {
      alert('Error al eliminar la venta: ' + errVenta.message)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <VentaRapidaPanel
        clientes={clientes}
        productos={productos}
        sucursales={sucursales}
        inventario={inventario}
        promociones={promociones}
        configuracion={configuracion}
        usuario={usuario}
        esAdmin={esAdmin}
        onVentaRegistrada={() => router.refresh()}
      />

      <div style={{ marginTop: '24px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
          style={{
            padding: '10px 18px', borderRadius: '8px', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            backgroundColor: mostrarHistorial ? '#0D1B3E' : 'white', color: mostrarHistorial ? 'white' : '#0D1B3E',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          {mostrarHistorial ? '▾' : '▸'} Historial ({ventas.length})
        </button>

        <button
          onClick={() => setMostrarCortes(!mostrarCortes)}
          style={{
            padding: '10px 18px', borderRadius: '8px', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            backgroundColor: mostrarCortes ? '#0D1B3E' : 'white', color: mostrarCortes ? 'white' : '#0D1B3E',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          {mostrarCortes ? '▾' : '▸'} Cortes de caja ({cortesCaja.length})
        </button>

        {esAdmin && (
          <button
            onClick={() => setMostrarCalculadora(!mostrarCalculadora)}
            style={{
              padding: '10px 18px', borderRadius: '8px', border: 'none',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              backgroundColor: mostrarCalculadora ? '#0D1B3E' : 'white', color: mostrarCalculadora ? 'white' : '#0D1B3E',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            {mostrarCalculadora ? '▾' : '▸'} Calculadora de precio
          </button>
        )}
      </div>

      {esAdmin && mostrarCalculadora && (
        <div style={{ marginBottom: '20px' }}>
          <CalculadoraPrecio configuracion={configuracion} productos={productos} esAdmin={esAdmin} />
        </div>
      )}

      {mostrarCortes && (
        <div style={{ marginBottom: '20px' }}>
          <CortesCajaTable cortes={cortesCaja} />
        </div>
      )}

      {mostrarHistorial && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar por folio o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                flex: '1', minWidth: '180px', maxWidth: '300px', padding: '10px 14px',
                border: '1px solid #E0E8F5', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', color: '#888', whiteSpace: 'nowrap' }}>Del</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                style={{ padding: '9px 12px', border: '1px solid #E0E8F5', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white' }}
              />
              <label style={{ fontSize: '13px', color: '#888', whiteSpace: 'nowrap' }}>al</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                style={{ padding: '9px 12px', border: '1px solid #E0E8F5', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white' }}
              />
              {(fechaDesde || fechaHasta) && (
                <button
                  onClick={() => { setFechaDesde(''); setFechaHasta('') }}
                  style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Limpiar ✕
                </button>
              )}
            </div>
            <span style={{ fontSize: '13px', color: '#888' }}>
              {filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="admin-table-scroll" style={{ borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', minWidth: '600px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F4F7FC', borderBottom: '1px solid #E0E8F5' }}>
                  <th style={thStyle}>Folio</th>
                  <th style={thStyle}>Cliente</th>
                  <th style={thStyle}>Sucursal</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Método de pago</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #F0F4FB' }}>
                    <td style={tdStyle}>{v.folio}</td>
                    <td style={tdStyle}>{v.clientes?.nombre || '—'}</td>
                    <td style={tdStyle}>{v.sucursales?.nombre || '—'}</td>
                    <td style={tdStyle}>${v.total?.toFixed(2)}</td>
                    <td style={tdStyle}>
                      <span
                        style={{ textTransform: 'capitalize' }}
                        title={
                          v.metodo_pago === 'mixto'
                            ? [
                                v.monto_efectivo ? `Efectivo $${v.monto_efectivo.toFixed(2)}` : '',
                                v.monto_tarjeta ? `Tarjeta $${v.monto_tarjeta.toFixed(2)}` : '',
                                v.monto_transferencia ? `Transferencia $${v.monto_transferencia.toFixed(2)}` : '',
                              ].filter(Boolean).join(' + ')
                            : undefined
                        }
                      >
                        {v.metodo_pago}
                      </span>
                      {(v.cambio || 0) > 0 && (
                        <div style={{ fontSize: '11px', color: '#888' }}>Cambio: ${v.cambio!.toFixed(2)}</div>
                      )}
                    </td>
                    <td style={tdStyle}>{new Date(v.creado_en).toLocaleDateString('es-MX')}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => generarTicket(v)}
                          disabled={generando === v.id}
                          style={{ fontSize: '12px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {generando === v.id ? 'Generando...' : 'Generar ticket'}
                        </button>
                        {esAdmin && (
                          <button
                            onClick={() => borrarVenta(v)}
                            disabled={borrando === v.id}
                            style={{ fontSize: '12px', color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {borrando === v.id ? 'Borrando...' : 'Borrar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtradas.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#888', padding: '24px' }}>
                      No hay ventas que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: 600 }
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#333' }
