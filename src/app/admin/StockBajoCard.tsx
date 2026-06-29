'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const INTERVALO_MS = 60_000

type FilaSucursal = { id: string; nombre: string; count: number }

export default function StockBajoCard({
  initialPorSucursal,
  sucursales,
}: {
  initialPorSucursal: FilaSucursal[]
  sucursales: { id: string; nombre: string }[]
}) {
  const [porSucursal, setPorSucursal] = useState<FilaSucursal[]>(initialPorSucursal)
  const [actualizando, setActualizando] = useState(false)

  async function refrescar() {
    setActualizando(true)
    const supabase = createClient()

    let todas: { producto_id: string; existencia: number; inventario_maximo: number; sucursal_id: string }[] = []
    let desde = 0
    const LOTE = 2000

    while (true) {
      const { data, error } = await supabase
        .from('inventario')
        .select('producto_id, existencia, inventario_maximo, sucursal_id')
        .range(desde, desde + LOTE - 1)
      if (error || !data || data.length === 0) break
      todas = todas.concat(data)
      if (data.length < LOTE) break
      desde += LOTE
    }

    setPorSucursal(
      sucursales.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        count: todas.filter(
          (i) => i.sucursal_id === s.id && i.existencia <= i.inventario_maximo / 3
        ).length,
      }))
    )
    setActualizando(false)
  }

  useEffect(() => {
    const id = setInterval(refrescar, INTERVALO_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = porSucursal.reduce((s, r) => s + r.count, 0)

  return (
    <div style={{
      backgroundColor: 'white', padding: '20px 24px', borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative',
    }}>
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '12px' }}>Stock bajo por sucursal</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {porSucursal.map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#444' }}>{s.nombre}</span>
            <span style={{
              fontSize: '16px', fontWeight: 700,
              color: s.count > 0 ? '#C0392B' : '#1A7A3E',
              minWidth: '28px', textAlign: 'right',
            }}>
              {s.count}
            </span>
          </div>
        ))}
      </div>

      {porSucursal.length > 1 && (
        <div style={{
          marginTop: '10px', paddingTop: '10px',
          borderTop: '1px solid #F0F4FB',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '12px', color: '#aaa' }}>Total</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: total > 0 ? '#C0392B' : '#1A7A3E' }}>
            {total}
          </span>
        </div>
      )}

      {actualizando && (
        <span style={{
          position: 'absolute', top: '10px', right: '12px',
          fontSize: '10px', color: '#aaa', fontWeight: 500,
        }}>
          actualizando…
        </span>
      )}
    </div>
  )
}
