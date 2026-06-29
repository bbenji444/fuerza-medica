'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Producto = {
  id: string
  codigo: string
  nombre: string
  precio_venta: number
  precio_costo: number
  precio_mayoreo: number
  variante_grupo_id: string | null
  variante_nombre: string | null
  variante_orden: number
}

type ItemEdicion = {
  productoId: string
  nombre: string
  etiqueta: string
  orden: number
  precio_venta: number
  precio_costo: number
  precio_mayoreo: number
}

export default function VariantesManager({ productos }: { productos: Producto[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [grupoEditando, setGrupoEditando] = useState<{ id: string; items: ItemEdicion[] } | null>(null)
  const [guardando, setGuardando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const grupos = new Map<string, Producto[]>()
  for (const p of productos) {
    if (!p.variante_grupo_id) continue
    if (!grupos.has(p.variante_grupo_id)) grupos.set(p.variante_grupo_id, [])
    grupos.get(p.variante_grupo_id)!.push(p)
  }
  const listaGrupos = Array.from(grupos.entries()).map(([id, items]) => ({
    id,
    items: [...items].sort((a, b) => a.variante_orden - b.variante_orden),
  }))

  const idsEnEdicion = new Set(grupoEditando?.items.map((i) => i.productoId) || [])
  const sugerencias = busqueda
    ? productos
        .filter((p) => !idsEnEdicion.has(p.id))
        .filter(
          (p) =>
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
        )
        .slice(0, 10)
    : []

  function nuevoGrupo() {
    setGrupoEditando({ id: crypto.randomUUID(), items: [] })
  }

  function editarGrupo(grupo: { id: string; items: Producto[] }) {
    setGrupoEditando({
      id: grupo.id,
      items: grupo.items.map((p) => ({
        productoId: p.id,
        nombre: p.nombre,
        etiqueta: p.variante_nombre || '',
        orden: p.variante_orden,
        precio_venta: p.precio_venta,
        precio_costo: p.precio_costo,
        precio_mayoreo: p.precio_mayoreo,
      })),
    })
  }

  function agregarAlGrupo(p: Producto) {
    if (!grupoEditando) return
    setGrupoEditando({
      ...grupoEditando,
      items: [
        ...grupoEditando.items,
        {
          productoId: p.id,
          nombre: p.nombre,
          etiqueta: '',
          orden: grupoEditando.items.length,
          precio_venta: p.precio_venta,
          precio_costo: p.precio_costo,
          precio_mayoreo: p.precio_mayoreo,
        },
      ],
    })
    setBusqueda('')
  }

  function quitarDelGrupo(productoId: string) {
    if (!grupoEditando) return
    setGrupoEditando({ ...grupoEditando, items: grupoEditando.items.filter((i) => i.productoId !== productoId) })
  }

  function actualizarItem(productoId: string, campo: keyof ItemEdicion, valor: string) {
    if (!grupoEditando) return
    setGrupoEditando({
      ...grupoEditando,
      items: grupoEditando.items.map((i) => {
        if (i.productoId !== productoId) return i
        const esNumero = ['orden', 'precio_venta', 'precio_costo', 'precio_mayoreo'].includes(campo)
        return { ...i, [campo]: esNumero ? (parseFloat(valor) || 0) : valor }
      }),
    })
  }

  async function guardarGrupo() {
    if (!grupoEditando) return
    setGuardando(true)

    const idsOriginales = grupos.get(grupoEditando.id)?.map((p) => p.id) || []
    const idsActuales = grupoEditando.items.map((i) => i.productoId)
    const idsQuitados = idsOriginales.filter((id) => !idsActuales.includes(id))
    const disolver = grupoEditando.items.length < 2

    const actualizaciones = disolver
      ? [...idsActuales, ...idsQuitados].map((id) =>
          supabase.from('productos').update({ variante_grupo_id: null, variante_nombre: null, variante_orden: 0 }).eq('id', id)
        )
      : [
          ...grupoEditando.items.map((i) =>
            supabase
              .from('productos')
              .update({
                variante_grupo_id: grupoEditando.id,
                variante_nombre: i.etiqueta.trim() || null,
                variante_orden: i.orden,
                precio_venta: i.precio_venta,
                precio_costo: i.precio_costo,
                precio_mayoreo: i.precio_mayoreo,
              })
              .eq('id', i.productoId)
          ),
          ...idsQuitados.map((id) =>
            supabase.from('productos').update({ variante_grupo_id: null, variante_nombre: null, variante_orden: 0 }).eq('id', id)
          ),
        ]

    const resultados = await Promise.all(actualizaciones)
    setGuardando(false)

    const error = resultados.find((r) => r.error)?.error
    if (error) {
      alert('Error al guardar: ' + error.message)
      return
    }

    setGrupoEditando(null)
    router.refresh()
  }

  async function eliminarGrupo(grupo: { id: string; items: Producto[] }) {
    if (!confirm(`¿Quitar la agrupación de variantes de "${grupo.items[0]?.nombre}"? Cada producto seguirá existiendo por separado.`)) return
    setGuardando(true)
    const resultados = await Promise.all(
      grupo.items.map((p) =>
        supabase.from('productos').update({ variante_grupo_id: null, variante_nombre: null, variante_orden: 0 }).eq('id', p.id)
      )
    )
    setGuardando(false)
    const error = resultados.find((r) => r.error)?.error
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    router.refresh()
  }

  const inputNum: React.CSSProperties = {
    width: '90px', padding: '6px 8px', border: '1px solid #E0E8F5',
    borderRadius: '6px', fontSize: '12px', textAlign: 'right',
  }

  return (
    <div>
      {!grupoEditando && (
        <button
          onClick={nuevoGrupo}
          style={{
            marginBottom: '20px', padding: '10px 18px', borderRadius: '8px', border: 'none',
            backgroundColor: '#1A6DD4', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Nuevo grupo de variantes
        </button>
      )}

      {grupoEditando && (
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#0D1B3E', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
            {grupos.has(grupoEditando.id) ? 'Editar grupo de variantes' : 'Nuevo grupo de variantes'}
          </p>
          <p style={{ color: '#888', fontSize: '12px', marginBottom: '16px' }}>
            Busca y agrega los productos que son la misma cosa en distinto tamaño/color. Ponle una etiqueta corta a cada uno
            (ej. &quot;Grande&quot;, &quot;Rojo&quot;) y ajusta los precios si es necesario.
          </p>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Buscar producto para agregar al grupo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #E0E8F5', borderRadius: '8px', fontSize: '14px' }}
            />
            {sugerencias.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                backgroundColor: 'white', border: '1px solid #E0E8F5', borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '240px', overflowY: 'auto', zIndex: 10,
              }}>
                {sugerencias.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => agregarAlGrupo(p)}
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

          {grupoEditando.items.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px', padding: '16px 0' }}>Aún no agregas productos a este grupo.</p>
          ) : (
            <div style={{ marginBottom: '16px', overflowX: 'auto' }}>
              {/* Encabezados */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 60px 90px 90px 90px 52px', gap: '8px', padding: '6px 0', borderBottom: '2px solid #E0E8F5' }}>
                {['Producto', 'Etiqueta', 'Orden', 'P. Venta', 'P. Costo', 'P. Mayoreo', ''].map((h) => (
                  <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                ))}
              </div>
              {grupoEditando.items.map((i) => (
                <div key={i.productoId} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 60px 90px 90px 90px 52px', gap: '8px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F4FB' }}>
                  <span style={{ fontSize: '13px', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={i.nombre}>{i.nombre}</span>
                  <input
                    type="text"
                    placeholder="Grande, Rojo…"
                    value={i.etiqueta}
                    onChange={(e) => actualizarItem(i.productoId, 'etiqueta', e.target.value)}
                    style={{ padding: '6px 8px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <input
                    type="number"
                    title="Orden (menor aparece primero)"
                    value={i.orden}
                    onChange={(e) => actualizarItem(i.productoId, 'orden', e.target.value)}
                    style={{ ...inputNum, width: '52px' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={i.precio_venta || ''}
                    onChange={(e) => actualizarItem(i.productoId, 'precio_venta', e.target.value)}
                    style={inputNum}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={i.precio_costo || ''}
                    onChange={(e) => actualizarItem(i.productoId, 'precio_costo', e.target.value)}
                    style={inputNum}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={i.precio_mayoreo || ''}
                    onChange={(e) => actualizarItem(i.productoId, 'precio_mayoreo', e.target.value)}
                    style={inputNum}
                  />
                  <button
                    onClick={() => quitarDelGrupo(i.productoId)}
                    style={{ fontSize: '12px', color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textAlign: 'center' }}
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setGrupoEditando(null)}
              style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', backgroundColor: '#F0F4FB', color: '#888', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={guardarGrupo}
              disabled={guardando}
              style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', backgroundColor: '#1A6DD4', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: guardando ? 0.6 : 1 }}
            >
              {guardando ? 'Guardando...' : 'Guardar grupo'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {listaGrupos.length === 0 && !grupoEditando && (
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            Aún no hay grupos de variantes creados.
          </div>
        )}
        {listaGrupos.map((grupo) => (
          <div key={grupo.id} style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #F0F4FB' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#0D1B3E' }}>{grupo.items.length} variantes</p>
              <div style={{ display: 'flex', gap: '14px' }}>
                <button
                  onClick={() => editarGrupo(grupo)}
                  style={{ fontSize: '12px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminarGrupo(grupo)}
                  style={{ fontSize: '12px', color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Desagrupar
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 90px', gap: '8px', padding: '8px 18px', borderBottom: '1px solid #F0F4FB' }}>
                {['Producto / Etiqueta', 'P. Venta', 'P. Costo', 'P. Mayoreo'].map((h) => (
                  <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                ))}
              </div>
              {grupo.items.map((p) => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 90px', gap: '8px', padding: '10px 18px', borderBottom: '1px solid #F8FAFD', fontSize: '13px', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#333' }}>{p.nombre}</div>
                    <div style={{ color: '#1A6DD4', fontWeight: 600, fontSize: '12px' }}>{p.variante_nombre || '(sin etiqueta)'}</div>
                  </div>
                  <span style={{ color: '#1A7A3E', fontWeight: 600 }}>${p.precio_venta?.toFixed(2)}</span>
                  <span style={{ color: '#888' }}>{p.precio_costo > 0 ? `$${p.precio_costo.toFixed(2)}` : '—'}</span>
                  <span style={{ color: '#888' }}>{p.precio_mayoreo > 0 ? `$${p.precio_mayoreo.toFixed(2)}` : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
