import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import SiteHeader from '../../components/SiteHeader'
import SiteFooter from '../../components/SiteFooter'
import WhatsAppFloatingButton from '../../components/WhatsAppFloatingButton'
import ProductoDetalleClient from './ProductoDetalleClient'
import { ordenarSucursales } from '../../components/sucursalesInfo'

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: producto }, { data: categorias }, { data: sucursalesData }, { data: disponibilidadData }] = await Promise.all([
    supabase
      .from('productos')
      .select('id, codigo, nombre, precio_venta, categoria_id, imagen_url, imagen_url_hover, descripcion, variante_grupo_id, variante_nombre, variante_orden')
      .eq('id', id)
      .eq('activo', true)
      .maybeSingle(),
    supabase.from('categorias').select('id, nombre, categoria_padre'),
    supabase.from('sucursales').select('id, nombre, direccion, telefono').eq('activa', true).order('creado_en'),
    supabase.rpc('disponibilidad_producto_publica', { p_producto_id: id }),
  ])

  if (!producto) notFound()

  const { data: variantesData } = producto.variante_grupo_id
    ? await supabase
        .from('productos')
        .select('id, variante_nombre, variante_orden, precio_venta')
        .eq('variante_grupo_id', producto.variante_grupo_id)
        .eq('activo', true)
        .order('variante_orden')
    : { data: null }
  const variantes = variantesData || []

  const sucursales = ordenarSucursales(sucursalesData || [])

  const disponibilidad = ordenarSucursales(
    ((disponibilidadData || []) as unknown as { sucursal_nombre: string; existencia: number }[]).map((d) => ({
      nombre: d.sucursal_nombre,
      existencia: d.existencia,
    }))
  )
  const totalDisponible = disponibilidad.reduce((sum, d) => sum + d.existencia, 0)

  const categoria = categorias?.find((c) => c.id === producto.categoria_id) || null
  const categoriaPadre = categoria?.categoria_padre ? categorias?.find((c) => c.id === categoria.categoria_padre) || null : null
  const nombreCategoria = categoriaPadre ? `${categoriaPadre.nombre} / ${categoria?.nombre}` : categoria?.nombre || null

  const primeraPalabra = producto.nombre.split(' ')[0]
  type Similar = {
    id: string
    nombre: string
    precio_venta: number
    imagen_url: string | null
    imagen_url_hover: string | null
    variante_grupo_id: string | null
    variante_orden: number
  }
  const [{ data: porCategoria }, { data: porNombre }] = await Promise.all([
    producto.categoria_id
      ? supabase
          .from('productos')
          .select('id, nombre, precio_venta, imagen_url, imagen_url_hover, variante_grupo_id, variante_orden')
          .eq('activo', true)
          .eq('categoria_id', producto.categoria_id)
          .neq('id', producto.id)
          .limit(12)
      : Promise.resolve({ data: [] as Similar[] }),
    supabase
      .from('productos')
      .select('id, nombre, precio_venta, imagen_url, imagen_url_hover, variante_grupo_id, variante_orden')
      .eq('activo', true)
      .ilike('nombre', `%${primeraPalabra}%`)
      .neq('id', producto.id)
      .limit(12),
  ])

  const similaresMap = new Map<string, Similar>()
  ;[...((porCategoria || []) as Similar[]), ...((porNombre || []) as Similar[])]
    // Las variantes de tamaño/color del producto actual no son "similares" — ya están en su selector.
    .filter((p) => !producto.variante_grupo_id || p.variante_grupo_id !== producto.variante_grupo_id)
    .forEach((p) => similaresMap.set(p.id, p))

  // Si un producto similar tiene sus propias variantes, mostrar solo una tarjeta por grupo.
  const representanteSimilarPorGrupo = new Map<string, Similar>()
  for (const p of similaresMap.values()) {
    if (!p.variante_grupo_id) continue
    const actual = representanteSimilarPorGrupo.get(p.variante_grupo_id)
    if (!actual || p.variante_orden < actual.variante_orden) representanteSimilarPorGrupo.set(p.variante_grupo_id, p)
  }
  const similares = Array.from(similaresMap.values())
    .filter((p) => !p.variante_grupo_id || representanteSimilarPorGrupo.get(p.variante_grupo_id)?.id === p.id)
    .slice(0, 8)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-fondo-claro">
        <ProductoDetalleClient
          producto={producto}
          nombreCategoria={nombreCategoria}
          disponibilidad={disponibilidad}
          totalDisponible={totalDisponible}
          variantes={variantes}
          similares={similares}
        />
      </main>
      <SiteFooter sucursales={sucursales} />
      <WhatsAppFloatingButton />
    </div>
  )
}
