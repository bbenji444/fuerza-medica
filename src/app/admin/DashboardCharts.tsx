'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type ComparativoSucursal = {
  nombre: string
  total: number
}

type ProductoVendido = {
  nombre: string
  cantidad: number
}

function truncarNombre(nombre: string, maxLargo = 26) {
  return nombre.length > maxLargo ? `${nombre.slice(0, maxLargo).trim()}...` : nombre
}

export default function DashboardCharts({
  comparativoSucursales,
  topProductos,
}: {
  comparativoSucursales: ComparativoSucursal[]
  topProductos: ProductoVendido[]
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <p style={{ color: '#0D1B3E', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
          Ventas por sucursal (este mes)
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={comparativoSucursales}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FB" />
            <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#888' }} />
            <YAxis tick={{ fontSize: 12, fill: '#888' }} />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Bar dataKey="total" fill="#1A6DD4" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <p style={{ color: '#0D1B3E', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
          Top 5 productos más vendidos (este mes)
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topProductos} layout="vertical" margin={{ left: 16, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FB" />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#888' }} allowDecimals={false} />
            <YAxis
              dataKey="nombre"
              type="category"
              width={190}
              interval={0}
              tickFormatter={(nombre: string) => truncarNombre(nombre)}
              tick={{ fontSize: 11, fill: '#333' }}
            />
            <Tooltip labelFormatter={(nombre) => String(nombre)} formatter={(value) => [value, 'Cantidad']} />
            <Bar dataKey="cantidad" fill="#0D1B3E" radius={[0, 6, 6, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
