'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { generarPdfReporteVentas } from '@/utils/generarPdfReporteVentas'

type ProductoVendido = {
  codigo: string
  nombre: string
  fecha: string
  cantidad: number
  total: number
}

type ComparativoSucursal = {
  nombre: string
  total: number
}

type VentaDetallada = {
  id: string
  folio: string
  total: number
  metodo_pago: string
  creado_en: string
  clientes: { nombre: string } | null
  sucursales: { nombre: string } | null
  venta_items: {
    cantidad: number
    precio_unitario: number
    subtotal: number
    productos: { codigo: string; nombre: string } | null
  }[]
}

const periodos = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
]

const paletaSucursales = ['#1A6DD4', '#1A7A3E', '#B8860B', '#7A3EB8', '#B8463E']

function formatoFecha(fecha: string) {
  if (!fecha) return '—'
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatoFechaHora(fechaIso: string) {
  return new Date(fechaIso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ReportesView({
  periodo,
  desde,
  hasta,
  totalPeriodo,
  numeroVentas,
  productosVendidos,
  comparativoSucursales,
  ventasDetalladas,
}: {
  periodo: string
  desde: string
  hasta: string
  totalPeriodo: number
  numeroVentas: number
  productosVendidos: ProductoVendido[]
  comparativoSucursales: ComparativoSucursal[]
  ventasDetalladas: VentaDetallada[]
}) {
  const [generando, setGenerando] = useState(false)
  const [desdeInput, setDesdeInput] = useState(desde)
  const [hastaInput, setHastaInput] = useState(hasta)
  const [vista, setVista] = useState<'productos' | 'ventas'>('ventas')
  const router = useRouter()

  const cantidadProductosVendidos = productosVendidos.reduce((sum, p) => sum + p.cantidad, 0)

  const colorPorSucursal = new Map<string, string>()
  function colorDe(nombreSucursal: string) {
    if (!colorPorSucursal.has(nombreSucursal)) {
      colorPorSucursal.set(nombreSucursal, paletaSucursales[colorPorSucursal.size % paletaSucursales.length])
    }
    return colorPorSucursal.get(nombreSucursal)!
  }

  async function descargarPdf() {
    setGenerando(true)
    await generarPdfReporteVentas(periodo || `${desde} a ${hasta}`, totalPeriodo, numeroVentas, productosVendidos)
    setGenerando(false)
  }

  function aplicarRango() {
    router.push(`/admin/reportes?desde=${desdeInput}&hasta=${hastaInput}`)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {periodos.map((p) => (
          <Link
            key={p.value}
            href={`/admin/reportes?periodo=${p.value}`}
            style={{
              padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              textDecoration: 'none',
              backgroundColor: periodo === p.value ? '#1A6DD4' : 'white',
              color: periodo === p.value ? 'white' : '#0D1B3E',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            {p.label}
          </Link>
        ))}

        <button
          onClick={descargarPdf}
          disabled={generando}
          style={{
            marginLeft: 'auto', padding: '10px 18px', borderRadius: '8px', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#1A7A3E', color: 'white',
          }}
        >
          {generando ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>

      <div style={{
        display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center',
        padding: '14px 16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <span style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>O elige un rango de fechas:</span>
        <input
          type="date"
          value={desdeInput}
          onChange={(e) => setDesdeInput(e.target.value)}
          style={dateInputStyle}
        />
        <span style={{ color: '#888' }}>a</span>
        <input
          type="date"
          value={hastaInput}
          onChange={(e) => setHastaInput(e.target.value)}
          style={dateInputStyle}
        />
        <button
          onClick={aplicarRango}
          style={{
            padding: '9px 16px', borderRadius: '8px', border: 'none', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer', backgroundColor: '#1A6DD4', color: 'white',
          }}
        >
          Ver
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Total vendido</p>
          <p style={{ color: '#0D1B3E', fontSize: '24px', fontWeight: 700 }}>${totalPeriodo.toFixed(2)}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Número de ventas</p>
          <p style={{ color: '#0D1B3E', fontSize: '24px', fontWeight: 700 }}>{numeroVentas}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Cantidad de productos</p>
          <p style={{ color: '#0D1B3E', fontSize: '24px', fontWeight: 700 }}>{cantidadProductosVendidos}</p>
        </div>
      </div>

      {comparativoSucursales.length > 1 && (
        <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E0E8F5' }}>
            <p style={{ color: '#0D1B3E', fontSize: '14px', fontWeight: 600 }}>Por sucursal</p>
          </div>
          {comparativoSucursales.map((s) => (
            <div key={s.nombre} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #F0F4FB', fontSize: '13px' }}>
              <span style={{ color: '#333' }}>{s.nombre}</span>
              <span style={{ color: '#0D1B3E', fontWeight: 600 }}>${s.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        <button
          onClick={() => setVista('ventas')}
          style={{
            padding: '9px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            backgroundColor: vista === 'ventas' ? '#0D1B3E' : 'white', color: vista === 'ventas' ? 'white' : '#0D1B3E',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          Por venta (qué se vendió junto)
        </button>
        <button
          onClick={() => setVista('productos')}
          style={{
            padding: '9px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            backgroundColor: vista === 'productos' ? '#0D1B3E' : 'white', color: vista === 'productos' ? 'white' : '#0D1B3E',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          Por producto
        </button>
      </div>

      {vista === 'ventas' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ventasDetalladas.length === 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              No hay ventas en este periodo
            </div>
          )}
          {ventasDetalladas.map((v) => {
            const nombreSucursal = v.sucursales?.nombre || 'Sin sucursal'
            const color = colorDe(nombreSucursal)
            return (
              <div
                key={v.id}
                style={{
                  backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  borderLeft: `5px solid ${color}`, overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '14px 18px', borderBottom: '1px solid #F0F4FB' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0D1B3E' }}>{v.folio}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>{formatoFechaHora(v.creado_en)}</span>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', backgroundColor: color, color: 'white', fontWeight: 600 }}>
                      {nombreSucursal}
                    </span>
                    <span style={{ fontSize: '12px', color: '#333' }}>
                      Cliente: <strong>{v.clientes?.nombre || 'Sin registrar'}</strong>
                    </span>
                    <span style={{ fontSize: '12px', color: '#333', textTransform: 'capitalize' }}>{v.metodo_pago}</span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0D1B3E' }}>${v.total.toFixed(2)}</span>
                </div>
                <div>
                  {v.venta_items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', justifyContent: 'space-between', padding: '8px 18px',
                        borderBottom: idx < v.venta_items.length - 1 ? '1px solid #F8FAFD' : 'none', fontSize: '13px',
                      }}
                    >
                      <span style={{ color: '#333' }}>
                        {item.productos?.nombre || 'Producto eliminado'}
                        <span style={{ color: '#888', marginLeft: '8px' }}>x{item.cantidad}</span>
                      </span>
                      <span style={{ color: '#0D1B3E', fontWeight: 600 }}>${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F7FC', borderBottom: '1px solid #E0E8F5' }}>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Código</th>
                <th style={thStyle}>Producto</th>
                <th style={thStyle}>Cantidad</th>
                <th style={thStyle}>Total</th>
              </tr>
            </thead>
            <tbody>
              {productosVendidos.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F0F4FB' }}>
                  <td style={tdStyle}>{formatoFecha(p.fecha)}</td>
                  <td style={tdStyle}>{p.codigo || '—'}</td>
                  <td style={tdStyle}>{p.nombre}</td>
                  <td style={tdStyle}>{p.cantidad}</td>
                  <td style={tdStyle}>${p.total.toFixed(2)}</td>
                </tr>
              ))}
              {productosVendidos.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#888', padding: '24px' }}>
                    No hay ventas en este periodo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: 600 }
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#333' }
const dateInputStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '13px' }
