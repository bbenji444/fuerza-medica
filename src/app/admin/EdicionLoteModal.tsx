'use client'

import { useState } from 'react'

export type ModoLote = 'fijar' | 'porcentaje' | 'monto' | 'llenar_referencia'

const etiquetasModo: Record<ModoLote, string> = {
  fijar: 'Fijar valor',
  porcentaje: 'Ajustar % (+/-)',
  monto: 'Ajustar monto (+/-)',
  llenar_referencia: 'Llenar stock',
}

export type CampoLoteDef = {
  key: string
  label: string
  tipo: 'numero' | 'select' | 'booleano'
  opciones?: { value: string; label: string }[]
  prefijo?: string
  /** Modos numéricos disponibles para este campo. Por defecto: fijar/porcentaje/monto. */
  modos?: ModoLote[]
  /** Para el modo 'llenar_referencia': de qué otro campo del mismo registro copiar el valor (ej. inventario_maximo). */
  campoReferencia?: string
  /** Etiqueta del modo 'llenar_referencia' para este campo (ej. "Llenar al máximo"). */
  etiquetaReferencia?: string
  /** Tabla a la que pertenece este campo, cuando un mismo listado combina varias tablas (ej. productos + inventario). Informativo para el caller. */
  tabla?: string
  /** Qué propiedad de ItemLote usar como id de fila al aplicar este campo (por defecto 'id'). */
  idCampo?: string
}

export type ItemLote = {
  id: string
  nombre: string
  [idAlterno: string]: string | undefined
}

export type FilaCalculada = { id: string; valor: number | string | boolean }

export default function EdicionLoteModal({
  items,
  campos,
  obtenerValorActual,
  aplicando,
  onAplicar,
  onCerrar,
  campoInicial,
  modoInicial,
}: {
  items: ItemLote[]
  campos: CampoLoteDef[]
  obtenerValorActual: (itemId: string, campoKey: string) => number | string | boolean
  aplicando: boolean
  onAplicar: (campoKey: string, filas: FilaCalculada[]) => void
  onCerrar: () => void
  campoInicial?: string
  modoInicial?: ModoLote
}) {
  const [campo, setCampo] = useState(campoInicial || '')
  const [modo, setModo] = useState<ModoLote>(modoInicial || 'fijar')
  const [valorTexto, setValorTexto] = useState('')

  const campoDef = campos.find((c) => c.key === campo)
  const modosDisponibles = campoDef?.modos || (['fijar', 'porcentaje', 'monto'] as ModoLote[])
  const requiereValor = campoDef?.tipo === 'numero' && modo !== 'llenar_referencia'

  function calcularNuevoNumero(itemId: string, actual: number): number {
    if (modo === 'llenar_referencia' && campoDef?.campoReferencia) {
      return Number(obtenerValorActual(itemId, campoDef.campoReferencia)) || actual
    }
    const v = parseFloat(valorTexto)
    if (isNaN(v)) return actual
    if (modo === 'fijar') return v
    if (modo === 'porcentaje') return actual * (1 + v / 100)
    return actual + v
  }

  function idFila(it: ItemLote): string {
    const campoId = campoDef?.idCampo
    return (campoId ? it[campoId] : undefined) || it.id
  }

  function construirFilas(): FilaCalculada[] {
    if (!campoDef) return []
    if (campoDef.tipo === 'booleano') {
      return items.map((it) => ({ id: idFila(it), valor: valorTexto === 'true' }))
    }
    if (campoDef.tipo === 'select') {
      return items.map((it) => ({ id: idFila(it), valor: valorTexto || (null as unknown as string) }))
    }
    return items.map((it) => {
      const actual = Number(obtenerValorActual(it.id, campo)) || 0
      const nuevo = Math.max(0, Number(calcularNuevoNumero(it.id, actual).toFixed(2)))
      return { id: idFila(it), valor: nuevo }
    })
  }

  const hayValor = campo !== '' && (!requiereValor || valorTexto !== '')

  const preview = hayValor
    ? items.slice(0, 5).map((it) => {
        const actual = obtenerValorActual(it.id, campo)
        const esEtiqueta = campoDef?.tipo === 'select' || campoDef?.tipo === 'booleano'
        let nuevoMostrado: string
        if (esEtiqueta) {
          nuevoMostrado = campoDef?.opciones?.find((o) => o.value === valorTexto)?.label || valorTexto
        } else {
          const actualNum = Number(actual) || 0
          nuevoMostrado = `${campoDef?.prefijo || ''}${Math.max(0, calcularNuevoNumero(it.id, actualNum)).toFixed(2)}`
        }
        const actualMostrado = esEtiqueta
          ? (campoDef?.opciones?.find((o) => o.value === String(actual))?.label || String(actual ?? '—'))
          : `${campoDef?.prefijo || ''}${(Number(actual) || 0).toFixed(2)}`
        return { nombre: it.nombre, actualMostrado, nuevoMostrado }
      })
    : []

  function aplicar() {
    if (!hayValor) return
    if (!confirm(`¿Aplicar este cambio a ${items.length} producto${items.length === 1 ? '' : 's'}? Esta acción no se puede deshacer.`)) return
    onAplicar(campo, construirFilas())
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', padding: '28px',
        width: '480px', maxHeight: '88vh', overflowY: 'auto',
      }}>
        <h2 style={{ color: '#0D1B3E', fontSize: '18px', marginBottom: '4px' }}>
          Editar en lote
        </h2>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
          {items.length} seleccionado{items.length === 1 ? '' : 's'}
        </p>

        <label style={labelStyle}>Campo a editar</label>
        <select
          value={campo}
          onChange={(e) => {
            setCampo(e.target.value)
            setModo('fijar')
            setValorTexto('')
          }}
          style={inputStyle}
        >
          <option value="">Elegir campo...</option>
          {campos.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>

        {(campoDef?.tipo === 'select' || campoDef?.tipo === 'booleano') && (
          <>
            <label style={labelStyle}>Nuevo valor</label>
            <select value={valorTexto} onChange={(e) => setValorTexto(e.target.value)} style={inputStyle}>
              <option value="">Elegir...</option>
              {campoDef.opciones?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </>
        )}

        {campoDef?.tipo === 'numero' && (
          <>
            <label style={labelStyle}>Modo</label>
            <select value={modo} onChange={(e) => setModo(e.target.value as ModoLote)} style={inputStyle}>
              {modosDisponibles.map((m) => (
                <option key={m} value={m}>
                  {m === 'llenar_referencia' ? (campoDef.etiquetaReferencia || etiquetasModo[m]) : etiquetasModo[m]}
                </option>
              ))}
            </select>

            {requiereValor && (
              <>
                <label style={labelStyle}>Valor</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={modo === 'fijar' ? 'Nuevo valor' : 'Ej. 10 o -10'}
                  value={valorTexto}
                  onChange={(e) => setValorTexto(e.target.value)}
                  style={inputStyle}
                />
              </>
            )}
          </>
        )}

        {preview.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', color: '#888', fontWeight: 600, marginBottom: '8px' }}>
              Vista previa
            </p>
            <div style={{ backgroundColor: '#F4F7FC', borderRadius: '8px', overflow: 'hidden' }}>
              {preview.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                    borderBottom: idx < preview.length - 1 ? '1px solid #E0E8F5' : 'none', fontSize: '12px',
                  }}
                >
                  <span style={{ color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.nombre}
                  </span>
                  <span style={{ color: '#888', marginLeft: '8px' }}>{p.actualMostrado}</span>
                  <span style={{ color: '#1A6DD4', marginLeft: '8px', fontWeight: 600 }}>→ {p.nuevoMostrado}</span>
                </div>
              ))}
            </div>
            {items.length > 5 && (
              <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                y {items.length - 5} más...
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onCerrar} style={btnSecundario}>Cancelar</button>
          <button onClick={aplicar} disabled={!hayValor || aplicando} style={{ ...btnPrimario, opacity: !hayValor ? 0.5 : 1 }}>
            {aplicando ? 'Aplicando...' : `Aplicar a ${items.length}`}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '14px', marginBottom: '4px' }
const labelStyle: React.CSSProperties = { fontSize: '12px', color: '#0D1B3E', fontWeight: 600, display: 'block', marginBottom: '4px', marginTop: '12px' }
const btnSecundario: React.CSSProperties = { flex: 1, padding: '12px', backgroundColor: '#F0F4FB', color: '#888', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }
const btnPrimario: React.CSSProperties = { flex: 1, padding: '12px', backgroundColor: '#1A6DD4', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }
