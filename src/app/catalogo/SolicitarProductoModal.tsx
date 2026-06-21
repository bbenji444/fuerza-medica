'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Producto = {
  id: string
  nombre: string
}

type Sucursal = {
  id: string
  nombre: string
}

export default function SolicitarProductoModal({
  producto,
  sucursales,
  onCerrar,
}: {
  producto: Producto
  sucursales: Sucursal[]
  onCerrar: () => void
}) {
  const supabase = createClient()

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [sucursalId, setSucursalId] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  async function enviarSolicitud(e: React.FormEvent) {
    e.preventDefault()

    if (!nombre.trim() || !telefono.trim()) {
      setError('Nombre y teléfono son obligatorios')
      return
    }

    setEnviando(true)
    setError('')

    const { error: errInsert } = await supabase.from('solicitudes_web').insert({
      nombre_cliente: nombre,
      telefono,
      correo: correo || null,
      mensaje: mensaje || null,
      producto_id: producto.id,
      sucursal_id: sucursalId || null,
      estado: 'pendiente',
    })

    setEnviando(false)

    if (errInsert) {
      setError('No se pudo enviar tu solicitud. Intenta de nuevo en unos minutos.')
      return
    }

    setEnviado(true)
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
        {enviado ? (
          <div className="text-center">
            <span className="text-4xl">✅</span>
            <p className="mt-4 text-lg font-bold text-navy">¡Solicitud enviada!</p>
            <p className="mt-2 text-sm text-gray-600">
              Nos pondremos en contacto contigo pronto sobre <strong>{producto.nombre}</strong>.
            </p>
            <button
              onClick={onCerrar}
              className="mt-6 w-full rounded-full bg-azul px-5 py-3 text-sm font-bold text-white transition hover:bg-azul/90"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={enviarSolicitud}>
            <p className="text-lg font-bold text-navy">Solicitar producto</p>
            <p className="mt-1 text-sm text-gray-600">{producto.nombre}</p>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <label className="mt-5 block text-xs font-bold text-navy">Nombre *</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-azul focus:outline-none"
              required
            />

            <label className="mt-3 block text-xs font-bold text-navy">Teléfono *</label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-azul focus:outline-none"
              required
            />

            <label className="mt-3 block text-xs font-bold text-navy">Correo (opcional)</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-azul focus:outline-none"
            />

            <label className="mt-3 block text-xs font-bold text-navy">Sucursal de preferencia</label>
            <select
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-azul focus:outline-none"
            >
              <option value="">Cualquiera</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>

            <label className="mt-3 block text-xs font-bold text-navy">Comentarios (opcional)</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-azul focus:outline-none"
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCerrar}
                className="flex-1 rounded-full border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 rounded-full bg-azul px-5 py-3 text-sm font-bold text-white transition hover:bg-azul/90 disabled:opacity-60"
              >
                {enviando ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
