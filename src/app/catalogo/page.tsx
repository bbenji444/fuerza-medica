import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import CatalogoClient from './CatalogoClient'

export default async function CatalogoPage() {
  const supabase = await createClient()

  const [{ data: productos }, { data: categorias }, { data: sucursales }] = await Promise.all([
    supabase
      .from('productos')
      .select('id, codigo, nombre, precio_venta, categoria_id, imagen_url')
      .eq('activo', true)
      .order('nombre')
      .range(0, 1999),
    supabase.from('categorias').select('id, nombre, categoria_padre').order('nombre'),
    supabase.from('sucursales').select('id, nombre, direccion, telefono').eq('activa', true).order('creado_en'),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-fondo-claro">
        <Suspense>
          <CatalogoClient
            productos={productos || []}
            categorias={categorias || []}
            sucursales={sucursales || []}
          />
        </Suspense>
      </main>
      <SiteFooter sucursales={sucursales || []} />
    </div>
  )
}
