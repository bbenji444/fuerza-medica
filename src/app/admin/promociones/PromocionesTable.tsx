'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Producto = {
  id: string
  codigo: string
  nombre: string
}

type Categoria = {
  id: string
  nombre: string
  categoria_padre: string | null
}

type Promocion = {
  id: string
  nombre: string
  tipo: string
  valor: number
  producto_id: string | null
  categoria_id: string | null
  activa: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
  creado_en: string
  productos: { nombre: string } | null
  categorias: { nombre: string } | null
}

const tipos = [
  { value: 'porcentaje', label: '% de descuento' },
  { value: 'precio_fijo', label: 'Monto fijo de descuento' },
  { value: 'precio_especial', label: 'Precio especial' },
]

const formVacio = {
  nombre: '',
  tipo: 'porcentaje',
  valor: '',
  alcance: 'producto' as 'producto' | 'categoria',
  producto_id: '',
  categoria_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  activa: true,
}

function estadoPromocion(p: Promocion): 'activa' | 'inactiva' | 'programada' | 'expirada' {
  if (!p.activa) return 'inactiva'
  const hoy = new Date().toISOString().slice(0, 10)
  if (p.fecha_inicio && hoy < p.fecha_inicio) return 'programada'
  if (p.fecha_fin && hoy > p.fecha_fin) return 'expirada'
  return 'activa'
}

const estadoColores: Record<string, { bg: string; color: string; label: string }> = {
  activa: { bg: '#E8F7EE', color: '#1A7A3E', label: 'Vigente' },
  inactiva: { bg: '#F0F4FB', color: '#888', label: 'Inactiva' },
  programada: { bg: '#E3EEFD', color: '#1A6DD4', label: 'Programada' },
  expirada: { bg: '#FDE8E8', color: '#B81C1C', label: 'Expirada' },
}

export default function PromocionesTable({
  promociones,
  productos,
  categorias,
}: {
  promociones: Promocion[]
  productos: Producto[]
  categorias: Categoria[]
}) {
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVacio)
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [borrando, setBorrando] = useState<string | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const filtradas = promociones.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  const productosFiltrados = productos
    .filter((p) => p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) || p.codigo?.toLowerCase().includes(busquedaProducto.toLowerCase()))
    .slice(0, 30)

  function abrirNueva() {
    setForm(formVacio)
    setBusquedaProducto('')
    setEditandoId(null)
    setError('')
    setMostrarForm(true)
  }

  function abrirEdicion(p: Promocion) {
    setForm({
      nombre: p.nombre,
      tipo: p.tipo,
      valor: String(p.valor),
      alcance: p.categoria_id ? 'categoria' : 'producto',
      producto_id: p.producto_id || '',
      categoria_id: p.categoria_id || '',
      fecha_inicio: p.fecha_inicio || '',
      fecha_fin: p.fecha_fin || '',
      activa: p.activa,
    })
    setBusquedaProducto('')
    setEditandoId(p.id)
    setError('')
    setMostrarForm(true)
  }

  function cerrarForm() {
    setMostrarForm(false)
    setEditandoId(null)
  }

  async function guardar() {
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    const valor = parseFloat(form.valor)
    if (isNaN(valor) || valor <= 0) {
      setError('El valor debe ser un número mayor a 0')
      return
    }
    if (form.alcance === 'producto' && !form.producto_id) {
      setError('Selecciona un producto')
      return
    }
    if (form.alcance === 'categoria' && !form.categoria_id) {
      setError('Selecciona una categoría')
      return
    }

    setGuardando(true)
    setError('')

    const payload = {
      nombre: form.nombre,
      tipo: form.tipo,
      valor,
      producto_id: form.alcance === 'producto' ? form.producto_id : null,
      categoria_id: form.alcance === 'categoria' ? form.categoria_id : null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
      activa: form.activa,
    }

    const { error: errGuardar } = editandoId
      ? await supabase.from('promociones').update(payload).eq('id', editandoId)
      : await supabase.from('promociones').insert(payload)

    setGuardando(false)

    if (errGuardar) {
      setError('Error al guardar: ' + errGuardar.message)
      return
    }

    cerrarForm()
    router.refresh()
  }

  async function borrar(p: Promocion) {
    if (!confirm(`¿Eliminar la promoción "${p.nombre}"?`)) return

    setBorrando(p.id)
    const { error: errBorrar } = await supabase.from('promociones').delete().eq('id', p.id)
    setBorrando(null)

    if (errBorrar) {
      alert('Error al eliminar: ' + errBorrar.message)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar promoción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            flex: '1', minWidth: '220px', maxWidth: '380px', padding: '10px 14px',
            border: '1px solid #E0E8F5', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white'
          }}
        />

        <button
          onClick={abrirNueva}
          style={{
            marginLeft: 'auto', padding: '10px 18px', borderRadius: '8px', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#1A6DD4', color: 'white',
          }}
        >
          + Nueva promoción
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F7FC', borderBottom: '1px solid #E0E8F5' }}>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Valor</th>
              <th style={thStyle}>Aplica a</th>
              <th style={thStyle}>Vigencia</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((p) => {
              const estado = estadoPromocion(p)
              const colores = estadoColores[estado]
              const tipoLabel = tipos.find((t) => t.value === p.tipo)?.label || p.tipo
              const valorMostrado = p.tipo === 'porcentaje' ? `${p.valor}%` : `$${p.valor.toFixed(2)}`
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #F0F4FB' }}>
                  <td style={tdStyle}>{p.nombre}</td>
                  <td style={tdStyle}>{tipoLabel}</td>
                  <td style={tdStyle}>{valorMostrado}</td>
                  <td style={tdStyle}>{p.productos?.nombre || p.categorias?.nombre || '—'}</td>
                  <td style={tdStyle}>
                    {p.fecha_inicio || p.fecha_fin
                      ? `${p.fecha_inicio || '—'} a ${p.fecha_fin || '—'}`
                      : 'Sin vigencia'}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: '11px', padding: '3px 10px', borderRadius: '999px',
                      backgroundColor: colores.bg, color: colores.color,
                    }}>
                      {colores.label}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => abrirEdicion(p)}
                        style={{ fontSize: '12px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => borrar(p)}
                        disabled={borrando === p.id}
                        style={{ fontSize: '12px', color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {borrando === p.id ? 'Borrando...' : 'Borrar'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#888', padding: '24px' }}>
                  No hay promociones que coincidan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '28px',
            width: '420px', maxHeight: '88vh', overflowY: 'auto',
          }}>
            <h2 style={{ color: '#0D1B3E', fontSize: '18px', marginBottom: '20px' }}>
              {editandoId ? 'Editar promoción' : 'Nueva promoción'}
            </h2>

            {error && (
              <p style={{ color: '#B81C1C', fontSize: '13px', marginBottom: '12px', backgroundColor: '#FDE8E8', padding: '10px', borderRadius: '6px' }}>
                {error}
              </p>
            )}

            <label style={labelStyle}>Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              style={inputStyle}
              placeholder="Ej. Descuento ortopedia blanda"
            />

            <label style={labelStyle}>Tipo</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
              {tipos.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <label style={labelStyle}>
              {form.tipo === 'porcentaje' ? 'Porcentaje (%)' : form.tipo === 'precio_fijo' ? 'Monto a descontar ($)' : 'Precio especial ($)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Aplica a</label>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  checked={form.alcance === 'producto'}
                  onChange={() => setForm({ ...form, alcance: 'producto' })}
                />
                Producto específico
              </label>
              <label style={{ fontSize: '13px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  checked={form.alcance === 'categoria'}
                  onChange={() => setForm({ ...form, alcance: 'categoria' })}
                />
                Categoría completa
              </label>
            </div>

            {form.alcance === 'producto' ? (
              <>
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  style={inputStyle}
                />
                <select
                  value={form.producto_id}
                  onChange={(e) => setForm({ ...form, producto_id: e.target.value })}
                  style={inputStyle}
                  size={5}
                >
                  {productosFiltrados.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </>
            ) : (
              <select
                value={form.categoria_id}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                style={inputStyle}
              >
                <option value="">Elegir categoría...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.categoria_padre ? '— ' : ''}{c.nombre}</option>
                ))}
              </select>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Desde (opcional)</label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Hasta (opcional)</label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={form.activa}
                onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              />
              Promoción activa
            </label>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={cerrarForm} style={btnSecundario}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} style={btnPrimario}>
                {guardando ? 'Guardando...' : 'Guardar'}
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
const labelStyle: React.CSSProperties = { fontSize: '12px', color: '#0D1B3E', fontWeight: 600, display: 'block', marginBottom: '4px', marginTop: '12px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '14px', marginBottom: '4px' }
const btnSecundario: React.CSSProperties = { flex: 1, padding: '12px', backgroundColor: '#F0F4FB', color: '#888', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }
const btnPrimario: React.CSSProperties = { flex: 1, padding: '12px', backgroundColor: '#1A6DD4', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }

