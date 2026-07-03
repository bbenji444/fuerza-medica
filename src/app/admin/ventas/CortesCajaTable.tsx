'use client'

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

export default function CortesCajaTable({ cortes }: { cortes: CorteCaja[] }) {
  return (
    <div className="admin-table-scroll" style={{ borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', minWidth: '780px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F7FC', borderBottom: '1px solid #E0E8F5' }}>
              <th style={thStyle}>Sucursal</th>
              <th style={thStyle}>Apertura</th>
              <th style={thStyle}>Abrió</th>
              <th style={thStyle}>Fondo inicial</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Efectivo esperado</th>
              <th style={thStyle}>Efectivo contado</th>
              <th style={thStyle}>Diferencia</th>
              <th style={thStyle}>Cerró</th>
            </tr>
          </thead>
          <tbody>
            {cortes.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F0F4FB' }}>
                <td style={tdStyle}>{c.sucursales?.nombre || '—'}</td>
                <td style={tdStyle}>{new Date(c.abierto_en).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td style={tdStyle}>{c.usuario_apertura?.nombre || '—'}</td>
                <td style={tdStyle}>${c.fondo_inicial.toFixed(2)}</td>
                <td style={tdStyle}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                    backgroundColor: c.estado === 'abierto' ? '#E8F7EE' : '#F0F4FB',
                    color: c.estado === 'abierto' ? '#1A7A3E' : '#888',
                  }}>
                    {c.estado === 'abierto' ? 'Abierta' : 'Cerrada'}
                  </span>
                </td>
                <td style={tdStyle}>{c.efectivo_esperado != null ? `$${c.efectivo_esperado.toFixed(2)}` : '—'}</td>
                <td style={tdStyle}>{c.efectivo_contado != null ? `$${c.efectivo_contado.toFixed(2)}` : '—'}</td>
                <td style={tdStyle}>
                  {c.diferencia != null ? (
                    <span style={{ fontWeight: 700, color: c.diferencia === 0 ? '#1A7A3E' : c.diferencia > 0 ? '#1A6DD4' : '#B81C1C' }}>
                      {c.diferencia > 0 ? '+' : ''}${c.diferencia.toFixed(2)}
                    </span>
                  ) : '—'}
                </td>
                <td style={tdStyle}>{c.usuario_cierre?.nombre || '—'}</td>
              </tr>
            ))}
            {cortes.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: '#888', padding: '24px' }}>
                  No hay cortes de caja registrados
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
