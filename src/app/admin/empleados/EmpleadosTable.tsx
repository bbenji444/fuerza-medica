'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Sucursal = {
  id: string
  nombre: string
}

type Empleado = {
  id: string
  nombre: string
  email: string
  rol: string
  sucursal_id: string | null
  activo: boolean
  creado_en: string
  sucursales: { nombre: string } | null
}

const formVacio = {
  nombre: '',
  email: '',
  password: '',
  rol: 'operador',
  sucursal_id: '',
}

export default function EmpleadosTable({
  empleados,
  sucursales,
}: {
  empleados: Empleado[]
  sucursales: Sucursal[]
}) {
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVacio)
  const [reseteandoId, setReseteandoId] = useState<string | null>(null)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const filtrados = empleados.filter(
    (e) =>
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  function abrirNuevo() {
    setForm(formVacio)
    setEditandoId(null)
    setError('')
    setMostrarForm(true)
  }

  function abrirEdicion(e: Empleado) {
    setForm({
      nombre: e.nombre,
      email: e.email,
      password: '',
      rol: e.rol,
      sucursal_id: e.sucursal_id || '',
    })
    setEditandoId(e.id)
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
    if (form.rol !== 'admin_general' && !form.sucursal_id) {
      setError('Selecciona una sucursal')
      return
    }
    if (!editandoId) {
      if (!form.email.trim()) {
        setError('El correo es obligatorio')
        return
      }
      if (!form.password || form.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        return
      }
    }

    setGuardando(true)
    setError('')

    const url = editandoId ? `/api/empleados/${editandoId}` : '/api/empleados'
    const res = await fetch(url, {
      method: editandoId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    setGuardando(false)

    if (!res.ok) {
      setError(data.error || 'Error al guardar')
      return
    }

    cerrarForm()
    router.refresh()
  }

  async function cambiarEstado(e: Empleado) {
    const accion = e.activo ? 'desactivar' : 'activar'
    if (!confirm(`¿${e.activo ? 'Desactivar' : 'Activar'} el acceso de ${e.nombre}?`)) return

    setCambiandoEstadoId(e.id)
    const res = await fetch(`/api/empleados/${e.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion }),
    })
    const data = await res.json()
    setCambiandoEstadoId(null)

    if (!res.ok) {
      alert(data.error || 'Error al cambiar el estado')
      return
    }

    router.refresh()
  }

  async function resetearPassword() {
    if (!reseteandoId) return
    if (!nuevaPassword || nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setGuardando(true)
    setError('')

    const res = await fetch(`/api/empleados/${reseteandoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'resetear_password', password: nuevaPassword }),
    })
    const data = await res.json()

    setGuardando(false)

    if (!res.ok) {
      setError(data.error || 'Error al resetear contraseña')
      return
    }

    setReseteandoId(null)
    setNuevaPassword('')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            flex: '1', minWidth: '220px', maxWidth: '380px', padding: '10px 14px',
            border: '1px solid #E0E8F5', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white'
          }}
        />

        <button
          onClick={abrirNuevo}
          style={{
            marginLeft: 'auto', padding: '10px 18px', borderRadius: '8px', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#1A6DD4', color: 'white',
          }}
        >
          + Nuevo empleado
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F7FC', borderBottom: '1px solid #E0E8F5' }}>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Correo</th>
              <th style={thStyle}>Sucursal</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #F0F4FB' }}>
                <td style={tdStyle}>{e.nombre}</td>
                <td style={tdStyle}>{e.email}</td>
                <td style={tdStyle}>{e.sucursales?.nombre || '—'}</td>
                <td style={tdStyle}>{e.rol === 'admin_general' ? 'Admin general' : 'Operador'}</td>
                <td style={tdStyle}>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '999px',
                    backgroundColor: e.activo ? '#E8F7EE' : '#FDE8E8',
                    color: e.activo ? '#1A7A3E' : '#B81C1C'
                  }}>
                    {e.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => abrirEdicion(e)} style={linkBtn('#1A6DD4')}>Editar</button>
                    <button onClick={() => { setReseteandoId(e.id); setNuevaPassword(''); setError('') }} style={linkBtn('#1A6DD4')}>
                      Resetear contraseña
                    </button>
                    <button
                      onClick={() => cambiarEstado(e)}
                      disabled={cambiandoEstadoId === e.id}
                      style={linkBtn(e.activo ? '#B81C1C' : '#1A7A3E')}
                    >
                      {cambiandoEstadoId === e.id ? 'Aplicando...' : e.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#888', padding: '24px' }}>
                  No hay empleados que coincidan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ color: '#0D1B3E', fontSize: '18px', marginBottom: '20px' }}>
              {editandoId ? 'Editar empleado' : 'Nuevo empleado'}
            </h2>

            {error && <p style={errorStyle}>{error}</p>}

            <label style={labelStyle}>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={inputStyle} />

            <label style={labelStyle}>Correo (usuario para iniciar sesión)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
              disabled={!!editandoId}
            />

            {!editandoId && (
              <>
                <label style={labelStyle}>Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={inputStyle}
                />
              </>
            )}

            <label style={labelStyle}>Rol</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} style={inputStyle}>
              <option value="operador">Operador</option>
              <option value="admin_general">Admin general</option>
            </select>

            {form.rol !== 'admin_general' && (
              <>
                <label style={labelStyle}>Sucursal</label>
                <select value={form.sucursal_id} onChange={(e) => setForm({ ...form, sucursal_id: e.target.value })} style={inputStyle}>
                  <option value="">Elegir sucursal...</option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={cerrarForm} style={btnSecundario}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} style={btnPrimario}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reseteandoId && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, width: '360px' }}>
            <h2 style={{ color: '#0D1B3E', fontSize: '18px', marginBottom: '20px' }}>
              Resetear contraseña
            </h2>

            {error && <p style={errorStyle}>{error}</p>}

            <label style={labelStyle}>Nueva contraseña</label>
            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              style={inputStyle}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => { setReseteandoId(null); setError('') }} style={btnSecundario}>Cancelar</button>
              <button onClick={resetearPassword} disabled={guardando} style={btnPrimario}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function linkBtn(color: string): React.CSSProperties {
  return { fontSize: '12px', color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }
}

const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: 600 }
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#333' }
const labelStyle: React.CSSProperties = { fontSize: '12px', color: '#0D1B3E', fontWeight: 600, display: 'block', marginBottom: '4px', marginTop: '12px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '14px', marginBottom: '4px' }
const btnSecundario: React.CSSProperties = { flex: 1, padding: '12px', backgroundColor: '#F0F4FB', color: '#888', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }
const btnPrimario: React.CSSProperties = { flex: 1, padding: '12px', backgroundColor: '#1A6DD4', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }
const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '380px', maxHeight: '88vh', overflowY: 'auto' }
const errorStyle: React.CSSProperties = { color: '#B81C1C', fontSize: '13px', marginBottom: '12px', backgroundColor: '#FDE8E8', padding: '10px', borderRadius: '6px' }

