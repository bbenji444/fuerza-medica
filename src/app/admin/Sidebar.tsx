'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const linksAdmin = [
  { href: '/admin', label: 'Inicio' },
  { href: '/admin/inventario', label: 'Inventario' },
  { href: '/admin/cotizaciones', label: 'Cotizaciones' },
  { href: '/admin/ventas', label: 'Ventas' },
  { href: '/admin/reportes', label: 'Reportes' },
  { href: '/admin/promociones', label: 'Promociones' },
  { href: '/admin/destacados', label: 'Más vendidos' },
  { href: '/admin/variantes', label: 'Variantes' },
  { href: '/admin/empleados', label: 'Empleados' },
]

const linksOperador = [
  { href: '/admin/inventario', label: 'Inventario' },
  { href: '/admin/cotizaciones', label: 'Cotizaciones' },
  { href: '/admin/ventas', label: 'Ventas' },
]

export default function Sidebar({ rol }: { rol: string }) {
  const links = rol === 'admin_general' ? linksAdmin : linksOperador
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [abierto, setAbierto] = useState(false)

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function cerrar() {
    setAbierto(false)
  }

  return (
    <>
      {/* Botón hamburguesa — solo visible en móvil vía CSS */}
      <button
        className="admin-menu-trigger"
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
      >
        ☰
      </button>

      {/* Sidebar (escritorio: fijo 220px / móvil: pantalla completa) */}
      <div
        className={`admin-sidebar ${abierto ? 'sidebar-open' : ''}`}
        style={{
          width: '220px',
          backgroundColor: '#0D1B3E',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Botón cerrar — solo visible en móvil vía CSS, pegado arriba a la derecha */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            className="admin-sidebar-close"
            onClick={cerrar}
            style={{
              display: 'none',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '10px',
              padding: '10px 16px',
              lineHeight: 1,
            }}
            aria-label="Cerrar menú"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Logo con degradado */}
        <div style={{
          position: 'relative',
          margin: '0 -16px',
          height: '140px',
          overflow: 'hidden',
        }}>
          <Image
            src="/logo fuerza medica.jpg"
            alt="Fuerza Médica"
            fill
            sizes="220px"
            style={{ objectFit: 'contain', padding: '12px' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
            background: 'linear-gradient(to bottom, transparent, #0D1B3E)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: '28%',
            background: 'linear-gradient(to right, #0D1B3E, transparent)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: 0, bottom: 0, right: 0, width: '28%',
            background: 'linear-gradient(to left, #0D1B3E, transparent)',
            pointerEvents: 'none',
          }} />
        </div>

        <div style={{ height: '20px' }} />

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {links.map((link) => {
            const activo = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={cerrar}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  textDecoration: 'none',
                  fontWeight: activo ? 700 : 500,
                  backgroundColor: activo ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: activo ? 'white' : '#A8C4F0',
                  borderLeft: activo ? '3px solid #1A6DD4' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={cerrarSesion}
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '15px',
            backgroundColor: 'transparent',
            color: '#A8C4F0',
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </>
  )
}
