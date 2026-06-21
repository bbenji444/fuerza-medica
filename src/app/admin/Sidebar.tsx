'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const linksAdmin = [
  { href: '/admin', label: 'Inicio' },
  { href: '/admin/inventario', label: 'Inventario' },
  { href: '/admin/cotizaciones', label: 'Cotizaciones' },
  { href: '/admin/ventas', label: 'Ventas' },
  { href: '/admin/reportes', label: 'Reportes' },
  { href: '/admin/promociones', label: 'Promociones' },
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

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{
  width: '220px',
  backgroundColor: '#0D1B3E',
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  position: 'sticky',
  top: 0
}}>
        
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '8px',
        marginBottom: '32px',
        display: 'inline-block',
        alignSelf: 'center',
      }}>
        <Image
          src="/logo fuerza medica.jpg"
          alt="Fuerza Médica"
          width={140}
          height={147}
          style={{ width: '140px', height: 'auto', display: 'block' }}
        />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {links.map((link) => {
          const activo = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                textDecoration: 'none',
                backgroundColor: activo ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activo ? 'white' : '#A8C4F0',
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
          padding: '10px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          backgroundColor: 'transparent',
          color: '#A8C4F0',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer'
        }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}