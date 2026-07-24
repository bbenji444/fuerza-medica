import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import WhatsAppFloatingButton from '../components/WhatsAppFloatingButton'
import CatalogoClient from './CatalogoClient'
import { ordenarSucursales } from '../components/sucursalesInfo'
import { fetchTodasLasFilas } from '@/utils/fetchTodasLasFilas'

export default async function CatalogoPage() {
  const supabase = await createClient()

  const [productos, { data: categorias }, { data: sucursalesData }] = await Promise.all([
    fetchTodasLasFilas<{
      id: string
      codigo: string
      nombre: string
      precio_venta: number
      categoria_id: string | null
      imagen_url: string | null
      imagen_url_hover: string | null
      variante_grupo_id: string | null
      variante_orden: number
    }>(
      supabase,
      'productos',
      'id, codigo, nombre, precio_venta, categoria_id, imagen_url, imagen_url_hover, variante_grupo_id, variante_orden',
      (query) => query.eq('activo', true).order('nombre')
    ),
    supabase.from('categorias').select('id, nombre, categoria_padre').order('nombre'),
    supabase.from('sucursales').select('id, nombre, direccion, telefono').eq('activa', true).order('creado_en'),
  ])

  const sucursales = ordenarSucursales(sucursalesData || [])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-fondo-claro">
        <Suspense>
          <CatalogoClient
            productos={productos}
            categorias={categorias || []}
          />
        </Suspense>
      </main>
      <SiteFooter sucursales={sucursales} />
      <WhatsAppFloatingButton />
    </div>
  )
}
