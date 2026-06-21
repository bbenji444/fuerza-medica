'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Producto = {
  id: string
  codigo: string
  nombre: string
  precio_costo?: number
}

type Configuracion = {
  id: string
  margen_ganancia: number
  iva_porcentaje: number
}

export default function CalculadoraPrecio({
  configuracion,
  productos,
  esAdmin,
}: {
  configuracion: Configuracion
  productos: Producto[]
  esAdmin: boolean
}) {
  const supabase = createClient()
  const router = useRouter()

  const [costoTexto, setCostoTexto] = useState('')
  const [margenTexto, setMargenTexto] = useState(String(configuracion.margen_ganancia))
  const [ivaTexto, setIvaTexto] = useState(String(configuracion.iva_porcentaje))
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const productosFiltrados = busquedaProducto
    ? productos
        .filter(
          (p) =>
            p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
            p.codigo?.toLowerCase().includes(busquedaProducto.toLowerCase())
        )
        .slice(0, 20)
    : []

  const costo = parseFloat(costoTexto) || 0
  const margen = parseFloat(margenTexto) || 0
  const iva = parseFloat(ivaTexto) || 0

  const montoGanancia = costo * (margen / 100)
  const subtotal = costo + montoGanancia
  const montoIva = subtotal * (iva / 100)
  const precioFinal = subtotal + montoIva

  function elegirProducto(p: Producto) {
    setCostoTexto(String(p.precio_costo ?? ''))
    setBusquedaProducto('')
  }

  async function guardarComoDefault() {
    if (!configuracion.id) {
      setMensaje('Error: falta correr add-tabla-configuracion.sql en Supabase')
      return
    }

    setGuardando(true)
    setMensaje('')

    const { data: actualizadas, error } = await supabase
      .from('configuracion')
      .update({ margen_ganancia: margen, iva_porcentaje: iva })
      .eq('id', configuracion.id)
      .select('id')

    setGuardando(false)

    if (error) {
      setMensaje('Error al guardar: ' + error.message)
      return
    }

    if (!actualizadas || actualizadas.length === 0) {
      setMensaje('No se pudo guardar (revisa permisos o que la tabla exista)')
      return
    }

    setMensaje('Guardado como nuevo default')
    router.refresh()
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <h3 style={{ color: '#0D1B3E', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
        Calculadora de precio
      </h3>
      <p style={{ color: '#888', fontSize: '12px', marginBottom: '16px' }}>
        Uso interno: calcula el precio sugerido a partir del costo, tu margen de ganancia e IVA. No modifica el precio guardado del producto.
      </p>

      <label style={labelStyle}>Producto (opcional, para tomar su costo)</label>
      <input
        type="text"
        placeholder="Buscar producto..."
        value={busquedaProducto}
        onChange={(e) => setBusquedaProducto(e.target.value)}
        style={inputStyle}
      />
      {productosFiltrados.length > 0 && (
        <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '8px', border: '1px solid #E0E8F5', borderRadius: '8px' }}>
          {productosFiltrados.map((p) => (
            <button
              key={p.id}
              onClick={() => elegirProducto(p)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderBottom: '1px solid #F0F4FB', cursor: 'pointer', background: 'white' }}
            >
              <span style={{ fontSize: '13px', color: '#0D1B3E' }}>{p.nombre}</span>
              <span style={{ fontSize: '11px', color: '#888', marginLeft: '8px' }}>Costo: ${(p.precio_costo ?? 0).toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Costo ($)</label>
          <input type="number" step="0.01" value={costoTexto} onChange={(e) => setCostoTexto(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Ganancia (%)</label>
          <input type="number" step="1" value={margenTexto} onChange={(e) => setMargenTexto(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>IVA (%)</label>
          <input type="number" step="0.1" value={ivaTexto} onChange={(e) => setIvaTexto(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ backgroundColor: '#F4F7FC', borderRadius: '8px', padding: '14px', marginTop: '12px' }}>
        <FilaDesglose label="Costo" valor={costo} />
        <FilaDesglose label={`+ Ganancia (${margen || 0}%)`} valor={montoGanancia} />
        <FilaDesglose label="Subtotal" valor={subtotal} negrita />
        <FilaDesglose label={`+ IVA (${iva || 0}%)`} valor={montoIva} />
        <div style={{ borderTop: '1px solid #E0E8F5', marginTop: '6px', paddingTop: '6px' }}>
          <FilaDesglose label="Precio final sugerido" valor={precioFinal} negrita grande />
        </div>
      </div>

      {esAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
          <button
            onClick={guardarComoDefault}
            disabled={guardando}
            style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#1A6DD4', color: 'white' }}
          >
            {guardando ? 'Guardando...' : `Guardar ${margenTexto}% / ${ivaTexto}% como default`}
          </button>
          {mensaje && <span style={{ fontSize: '12px', color: mensaje.startsWith('Error') ? '#B81C1C' : '#1A7A3E' }}>{mensaje}</span>}
        </div>
      )}
    </div>
  )
}

function FilaDesglose({ label, valor, negrita, grande }: { label: string; valor: number; negrita?: boolean; grande?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span style={{ fontSize: grande ? '14px' : '13px', color: '#333', fontWeight: negrita ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: grande ? '16px' : '13px', color: grande ? '#0D1B3E' : '#333', fontWeight: negrita ? 700 : 400 }}>
        ${valor.toFixed(2)}
      </span>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '14px', marginBottom: '8px' }
const labelStyle: React.CSSProperties = { fontSize: '12px', color: '#0D1B3E', fontWeight: 600, display: 'block', marginBottom: '4px' }
