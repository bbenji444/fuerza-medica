'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Destacado = {
  id: string
  posicion: number
  producto_id: string
  productos: { codigo: string; nombre: string; precio_venta: number; imagen_url: string | null } | null
}

type Producto = {
  id: string
  codigo: string
  nombre: string
  precio_venta: number
}

export default function DestacadosTable({
  destacados,
  productos,
}: {
  destacados: Destacado[]
  productos: Producto[]
}) {
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const idsYaDestacados = new Set(destacados.map((d) => d.producto_id))

  const sugerencias = busqueda
    ? productos
        .filter((p) => !idsYaDestacados.has(p.id))
        .filter(
          (p) =>
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
        )
        .slice(0, 15)
    : []

  async function agregar(producto: Producto) {
    setGuardando(producto.id)

    const siguientePosicion = destacados.length > 0 ? Math.max(...destacados.map((d) => d.posicion)) + 1 : 0

    const { error } = await supabase
      .from('productos_destacados')
      .insert({ producto_id: producto.id, posicion: siguientePosicion })

    setGuardando(null)

    if (error) {
      alert('Error al agregar: ' + error.message)
      return
    }

    setBusqueda('')
    router.refresh()
  }

  async function quitar(id: string) {
    setGuardando(id)

    const { error } = await supabase.from('productos_destacados').delete().eq('id', id)

    setGuardando(null)

    if (error) {
      alert('Error al quitar: ' + error.message)
      return
    }

    router.refresh()
  }

  async function moverPosicion(destacado: Destacado, direccion: -1 | 1) {
    const ordenados = [...destacados].sort((a, b) => a.posicion - b.posicion)
    const idx = ordenados.findIndex((d) => d.id === destacado.id)
    const idxVecino = idx + direccion
    if (idxVecino < 0 || idxVecino >= ordenados.length) return

    const vecino = ordenados[idxVecino]
    setGuardando(destacado.id)

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('productos_destacados').update({ posicion: vecino.posicion }).eq('id', destacado.id),
      supabase.from('productos_destacados').update({ posicion: destacado.posicion }).eq('id', vecino.id),
    ])

    setGuardando(null)

    if (e1 || e2) {
      alert('Error al reordenar: ' + (e1?.message || e2?.message))
      return
    }

    router.refresh()
  }

  const ordenados = [...destacados].sort((a, b) => a.posicion - b.posicion)

  return (
    <div>
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '420px' }}>
        <input
          type="text"
          placeholder="Buscar producto para agregar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', border: '1px solid #E0E8F5', borderRadius: '8px',
            fontSize: '14px', backgroundColor: 'white',
          }}
        />
        {sugerencias.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
            backgroundColor: 'white', border: '1px solid #E0E8F5', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '280px', overflowY: 'auto', zIndex: 10,
          }}>
            {sugerencias.map((p) => (
              <button
                key={p.id}
                onClick={() => agregar(p)}
                disabled={guardando === p.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', width: '100%', textAlign: 'left',
                  padding: '10px 14px', border: 'none', borderBottom: '1px solid #F0F4FB', cursor: 'pointer', backgroundColor: 'white',
                }}
              >
                <span style={{ fontSize: '13px', color: '#0D1B3E' }}>{p.nombre}</span>
                <span style={{ fontSize: '12px', color: '#1A6DD4', fontWeight: 600 }}>+ Agregar</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F7FC', borderBottom: '1px solid #E0E8F5' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Producto</th>
              <th style={thStyle}>Precio</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((d, idx) => (
              <tr key={d.id} style={{ borderBottom: '1px solid #F0F4FB' }}>
                <td style={tdStyle}>{idx + 1}</td>
                <td style={tdStyle}>{d.productos?.nombre || 'â€”'}</td>
                <td style={tdStyle}>${d.productos?.precio_venta?.toFixed(2)}</td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => moverPosicion(d, -1)}
                      disabled={idx === 0 || guardando === d.id}
                      style={{ fontSize: '12px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      â†‘
                    </button>
                    <button
                      onClick={() => moverPosicion(d, 1)}
                      disabled={idx === ordenados.length - 1 || guardando === d.id}
                      style={{ fontSize: '12px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      â†“
                    </button>
                    <button
                      onClick={() => quitar(d.id)}
                      disabled={guardando === d.id}
                      style={{ fontSize: '12px', color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Quitar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {ordenados.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#888', padding: '24px' }}>
                  Sin productos destacados. BÃºscalos arriba para agregarlos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: 600 }
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#333' }

