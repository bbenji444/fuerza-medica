import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import WhatsAppFloatingButton from '../components/WhatsAppFloatingButton'
import CatalogoClient from './CatalogoClient'
import { ordenarSucursales } from '../components/sucursalesInfo'

export default async function CatalogoPage() {
  const supabase = await createClient()

  const [{ data: productos }, { data: categorias }, { data: sucursalesData }] = await Promise.all([
    supabase
      .from('productos')
      .select('id, codigo, nombre, precio_venta, categoria_id, imagen_url, imagen_url_hover, variante_grupo_id, variante_orden')
      .eq('activo', true)
      .order('nombre')
      .range(0, 1999),
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
            productos={productos || []}
            categorias={categorias || []}
          />
        </Suspense>
      </main>
      <SiteFooter sucursales={sucursales} />
      <WhatsAppFloatingButton />
    </div>
  )
}
