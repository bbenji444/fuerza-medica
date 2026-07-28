'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { generarPdfStockBajo } from '@/utils/generarPdfStockBajo'
import { generarExcelStockBajo, generarExcelInventarioCompleto } from '@/utils/generarExcelInventario'
import EdicionLoteModal, { CampoLoteDef, FilaCalculada } from '../EdicionLoteModal'
import { aplicarEdicionLote } from '@/utils/aplicarEdicionLote'

type Producto = {
  id: string
  codigo: string
  nombre: string
  categoria_id: string | null
  categorias: { nombre: string } | null
  precio_costo: number
  precio_venta: number
  precio_mayoreo: number
  activo: boolean
  imagen_url?: string | null
  imagen_url_hover?: string | null
  imagenes?: string[] | null
  descripcion?: string | null
}

type Inventario = {
  id: string
  existencia: number
  inventario_minimo: number
  inventario_maximo: number
  productos: Producto | null
}

type Sucursal = {
  id: string
  nombre: string
}

type Categoria = {
  id: string
  nombre: string
  categoria_padre: string | null
}

function esStockBajo(i: Inventario) {
  return i.existencia <= i.inventario_maximo / 3
}

const formNuevoVacio = {
  codigo: '',
  nombre: '',
  categoria_id: '',
  precio_costo: '',
  precio_venta: '',
  precio_mayoreo: '',
  existencia: '0',
  inventario_minimo: '0',
  inventario_maximo: '0',
}

function numerosDePagina(actual: number, total: number): (number | '...')[] {
  const ventana = 1
  const paginas: (number | '...')[] = []
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || (n >= actual - ventana && n <= actual + ventana)) {
      paginas.push(n)
    } else if (paginas[paginas.length - 1] !== '...') {
      paginas.push('...')
    }
  }
  return paginas
}

export default function InventarioTable({
  inventario,
  sucursales,
  sucursalActiva,
  categorias,
  esAdmin,
}: {
  inventario: Inventario[]
  sucursales: Sucursal[]
  sucursalActiva: string
  categorias: Categoria[]
  esAdmin: boolean
}) {
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState('')
  const [estadoStockFiltro, setEstadoStockFiltro] = useState('')
  const [orden, setOrden] = useState<'az' | 'za'>('az')
  const [editando, setEditando] = useState<Inventario | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [mostrarLote, setMostrarLote] = useState(false)
  const [loteInicial, setLoteInicial] = useState<{ campo?: string; modo?: 'fijar' | 'porcentaje' | 'monto' | 'llenar_referencia' }>({})
  const [aplicandoLote, setAplicandoLote] = useState(false)
  const [mostrarAgregar, setMostrarAgregar] = useState(false)
  const [nuevoProducto, setNuevoProducto] = useState(formNuevoVacio)
  const [agregando, setAgregando] = useState(false)
  const [errorAgregar, setErrorAgregar] = useState('')
  const [borrandoId, setBorrandoId] = useState<string | null>(null)
  const [imagenPara, setImagenPara] = useState<Inventario | null>(null)
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null)
  const [previewImagen, setPreviewImagen] = useState<string>('')
  const [archivoImagenHover, setArchivoImagenHover] = useState<File | null>(null)
  const [previewImagenHover, setPreviewImagenHover] = useState<string>('')
  const [imagenesGaleria, setImagenesGaleria] = useState<string[]>([])
  const [archivosGaleriaNuevos, setArchivosGaleriaNuevos] = useState<File[]>([])
  const [previewsGaleriaNuevos, setPreviewsGaleriaNuevos] = useState<string[]>([])
  const [descripcionImagen, setDescripcionImagen] = useState('')
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [errorImagen, setErrorImagen] = useState('')
  const [mostrarMargen, setMostrarMargen] = useState(false)
  const [margenPct, setMargenPct] = useState(70)
  const [categoriaMargen, setCategoriaMargen] = useState('')
  const [aplicandoMargen, setAplicandoMargen] = useState(false)
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 100
  const [mostrarCategorias, setMostrarCategorias] = useState(false)
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<string | null>(null)
  const [formCategoria, setFormCategoria] = useState({ nombre: '', categoria_padre: '' })
  const [guardandoCategoria, setGuardandoCategoria] = useState(false)
  const [borrandoCategoriaId, setBorrandoCategoriaId] = useState<string | null>(null)
  const [errorCategoria, setErrorCategoria] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const camposLote: CampoLoteDef[] = [
    {
      key: 'categoria_id', label: 'Categoría', tipo: 'select', tabla: 'productos', idCampo: 'productoId',
      opciones: categorias.map((c) => ({ value: c.id, label: `${c.categoria_padre ? '— ' : ''}${c.nombre}` })),
    },
    { key: 'precio_venta', label: 'P. Venta', tipo: 'numero', prefijo: '$', tabla: 'productos', idCampo: 'productoId' },
    { key: 'precio_costo', label: 'P. Costo', tipo: 'numero', prefijo: '$', tabla: 'productos', idCampo: 'productoId' },
    { key: 'precio_mayoreo', label: 'P. Mayoreo', tipo: 'numero', prefijo: '$', tabla: 'productos', idCampo: 'productoId' },
    {
      key: 'existencia', label: 'Existencia', tipo: 'numero', tabla: 'inventario',
      modos: ['fijar', 'llenar_referencia', 'monto'],
      campoReferencia: 'inventario_maximo',
      etiquetaReferencia: 'Llenar stock (al máximo)',
    },
    { key: 'inventario_minimo', label: 'Mínimo', tipo: 'numero', tabla: 'inventario' },
    { key: 'inventario_maximo', label: 'Máximo', tipo: 'numero', tabla: 'inventario' },
  ]

  function abrirLote(campo?: string, modo?: 'fijar' | 'porcentaje' | 'monto' | 'llenar_referencia') {
    setLoteInicial({ campo, modo })
    setMostrarLote(true)
  }

  const categoriasPrincipales = categorias.filter(c => !c.categoria_padre)
  const subcategoriasDisponibles = categorias.filter(c => c.categoria_padre === categoriaFiltro)
  const idsParaFiltrar = categoriaFiltro
    ? [categoriaFiltro, ...categorias.filter(c => c.categoria_padre === categoriaFiltro).map(c => c.id)]
    : []

  const filtrados = inventario
    .filter(i =>
      i.productos?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.productos?.codigo?.toLowerCase().includes(busqueda.toLowerCase())
    )
    .filter(i => {
      if (subcategoriaFiltro) return i.productos?.categoria_id === subcategoriaFiltro
      if (categoriaFiltro) return idsParaFiltrar.includes(i.productos?.categoria_id || '')
      return true
    })
    .filter(i => {
      if (!estadoStockFiltro) return true
      return estadoStockFiltro === 'bajo' ? esStockBajo(i) : !esStockBajo(i)
    })
    .sort((a, b) =>
      orden === 'az'
        ? (a.productos?.nombre || '').localeCompare(b.productos?.nombre || '')
        : (b.productos?.nombre || '').localeCompare(a.productos?.nombre || '')
    )

  useEffect(() => {
    setPagina(1)
  }, [busqueda, categoriaFiltro, subcategoriaFiltro, estadoStockFiltro, orden, sucursalActiva])

  const productosBajo = inventario.filter(esStockBajo)

  function descargarReportePdf() {
    const sucursalNombre = sucursales.find((s) => s.id === sucursalActiva)?.nombre || ''
    generarPdfStockBajo(
      sucursalNombre,
      productosBajo.map((i) => ({
        codigo: i.productos?.codigo || '',
        nombre: i.productos?.nombre || '',
        existencia: i.existencia,
        inventario_minimo: i.inventario_minimo,
        inventario_maximo: i.inventario_maximo,
      }))
    )
  }

  function descargarExcelStockBajo() {
    const sucursalNombre = sucursales.find((s) => s.id === sucursalActiva)?.nombre || ''
    generarExcelStockBajo(
      sucursalNombre,
      productosBajo.map((i) => ({
        codigo: i.productos?.codigo || '',
        nombre: i.productos?.nombre || '',
        existencia: i.existencia,
        inventario_minimo: i.inventario_minimo,
        inventario_maximo: i.inventario_maximo,
      }))
    )
  }

  function descargarExcelCompleto() {
    const sucursalNombre = sucursales.find((s) => s.id === sucursalActiva)?.nombre || ''
    generarExcelInventarioCompleto(
      sucursalNombre,
      inventario.map((i) => ({
        codigo: i.productos?.codigo || '',
        nombre: i.productos?.nombre || '',
        existencia: i.existencia,
        inventario_minimo: i.inventario_minimo,
        inventario_maximo: i.inventario_maximo,
      }))
    )
  }

  function abrirCategorias() {
    setCategoriaEditandoId(null)
    setFormCategoria({ nombre: '', categoria_padre: '' })
    setErrorCategoria('')
    setMostrarCategorias(true)
  }

  function cerrarModalCategorias() {
    setMostrarCategorias(false)
    setCategoriaEditandoId(null)
    setFormCategoria({ nombre: '', categoria_padre: '' })
    setErrorCategoria('')
  }

  function abrirEditarCategoria(cat: Categoria) {
    setCategoriaEditandoId(cat.id)
    setFormCategoria({ nombre: cat.nombre, categoria_padre: cat.categoria_padre || '' })
    setErrorCategoria('')
  }

  function cancelarEdicionCategoria() {
    setCategoriaEditandoId(null)
    setFormCategoria({ nombre: '', categoria_padre: '' })
    setErrorCategoria('')
  }

  async function guardarCategoria() {
    const nombre = formCategoria.nombre.trim()
    if (!nombre) {
      setErrorCategoria('El nombre es obligatorio.')
      return
    }

    const categoriaPadre = formCategoria.categoria_padre || null

    if (categoriaPadre === categoriaEditandoId) {
      setErrorCategoria('Una categoría no puede ser su propia categoría padre.')
      return
    }

    if (categoriaPadre) {
      const padre = categorias.find((c) => c.id === categoriaPadre)
      if (padre?.categoria_padre) {
        setErrorCategoria('No se permiten sub-subcategorías: elige una categoría principal como padre.')
        return
      }
    }

    if (categoriaEditandoId && categoriaPadre && categorias.some((c) => c.categoria_padre === categoriaEditandoId)) {
      setErrorCategoria('Esta categoría tiene subcategorías propias: no puede convertirse en subcategoría de otra.')
      return
    }

    const duplicada = categorias.find(
      (c) =>
        c.id !== categoriaEditandoId &&
        c.nombre.toLowerCase().trim() === nombre.toLowerCase() &&
        (c.categoria_padre || null) === categoriaPadre
    )
    if (duplicada) {
      setErrorCategoria('Ya existe una categoría con este nombre en el mismo nivel.')
      return
    }

    setGuardandoCategoria(true)
    setErrorCategoria('')

    const { error } = categoriaEditandoId
      ? await supabase.from('categorias').update({ nombre, categoria_padre: categoriaPadre }).eq('id', categoriaEditandoId)
      : await supabase.from('categorias').insert({ nombre, categoria_padre: categoriaPadre })

    setGuardandoCategoria(false)

    if (error) {
      setErrorCategoria('Error al guardar: ' + error.message)
      return
    }

    setCategoriaEditandoId(null)
    setFormCategoria({ nombre: '', categoria_padre: '' })
    router.refresh()
  }

  async function borrarCategoria(cat: Categoria) {
    if (categorias.some((c) => c.categoria_padre === cat.id)) {
      alert('No se puede eliminar: esta categoría tiene subcategorías. Bórralas o reasígnalas primero.')
      return
    }

    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"? Esta acción no se puede deshacer.`)) return

    setBorrandoCategoriaId(cat.id)

    const [{ count: enProductos }, { count: enPromociones }] = await Promise.all([
      supabase.from('productos').select('*', { count: 'exact', head: true }).eq('categoria_id', cat.id),
      supabase.from('promociones').select('*', { count: 'exact', head: true }).eq('categoria_id', cat.id),
    ])

    if ((enProductos || 0) > 0 || (enPromociones || 0) > 0) {
      setBorrandoCategoriaId(null)
      alert('No se puede eliminar: hay productos o promociones que usan esta categoría. Reasígnalos primero.')
      return
    }

    const { error } = await supabase.from('categorias').delete().eq('id', cat.id)

    setBorrandoCategoriaId(null)

    if (error) {
      alert('Error al eliminar la categoría: ' + error.message)
      return
    }

    router.refresh()
  }

  function cambiarSucursal(id: string) {
    setCategoriaFiltro('')
    setSubcategoriaFiltro('')
    router.push(`/admin/inventario?sucursal=${id}`)
  }

  function cambiarCategoria(id: string) {
    setCategoriaFiltro(id)
    setSubcategoriaFiltro('')
  }

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA)
  const todosSeleccionados = filtrados.length > 0 && filtrados.every((i) => seleccionados.has(i.id))

  function toggleTodos() {
    if (todosSeleccionados) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(filtrados.map((i) => i.id)))
    }
  }

  function toggleUno(id: string) {
    const nuevo = new Set(seleccionados)
    if (nuevo.has(id)) nuevo.delete(id)
    else nuevo.add(id)
    setSeleccionados(nuevo)
  }

  async function manejarAplicarLote(campo: string, filas: FilaCalculada[]) {
    const def = camposLote.find((c) => c.key === campo)
    const tabla = def?.tabla || 'inventario'

    setAplicandoLote(true)
    const error = await aplicarEdicionLote(supabase, tabla, campo, filas)
    setAplicandoLote(false)

    if (error) {
      alert('Error al aplicar cambios en lote: ' + error)
      return
    }

    setSeleccionados(new Set())
    setMostrarLote(false)
    router.refresh()
  }

  async function aplicarMargen() {
    const idsCategoria = categoriaMargen
      ? [categoriaMargen, ...categorias.filter(c => c.categoria_padre === categoriaMargen).map(c => c.id)]
      : []

    const objetivos = inventario.filter(i => {
      const costo = i.productos?.precio_costo ?? 0
      if (costo <= 0) return false
      if (categoriaMargen) return idsCategoria.includes(i.productos?.categoria_id || '')
      return true
    })

    if (objetivos.length === 0) {
      alert('No hay productos con precio de costo en la selección.')
      return
    }

    if (!confirm(`Se actualizará el precio de venta de ${objetivos.length} producto(s) aplicando ${margenPct}% de ganancia sobre el costo. ¿Continuar?`)) return

    setAplicandoMargen(true)

    const LOTE = 50
    let errores = 0
    for (let i = 0; i < objetivos.length; i += LOTE) {
      const trozo = objetivos.slice(i, i + LOTE)
      const resultados = await Promise.allSettled(
        trozo.map(inv => {
          const nuevoPrecio = parseFloat(((inv.productos!.precio_costo) * (1 + margenPct / 100)).toFixed(2))
          return supabase.from('productos').update({ precio_venta: nuevoPrecio }).eq('id', inv.productos!.id)
        })
      )
      errores += resultados.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error)).length
    }

    setAplicandoMargen(false)
    setMostrarMargen(false)
    if (errores > 0) alert(`Se completó con ${errores} error(es). Verifica los precios.`)
    router.refresh()
  }

  async function guardarCambios(e: React.FormEvent) {
    e.preventDefault()
    if (!editando || !editando.productos) return
    setGuardando(true)

    const { error: errorInventario } = await supabase
      .from('inventario')
      .update({
        existencia: editando.existencia,
        inventario_minimo: editando.inventario_minimo,
        inventario_maximo: editando.inventario_maximo,
      })
      .eq('id', editando.id)

    const { error: errorProducto } = await supabase
      .from('productos')
      .update({
        codigo: editando.productos.codigo,
        nombre: editando.productos.nombre,
        categoria_id: editando.productos.categoria_id,
        precio_costo: editando.productos.precio_costo,
        precio_venta: editando.productos.precio_venta,
        precio_mayoreo: editando.productos.precio_mayoreo,
        activo: editando.productos.activo,
      })
      .eq('id', editando.productos.id)

    setGuardando(false)

    if (errorInventario || errorProducto) {
      alert('Error al guardar: ' + (errorInventario?.message || errorProducto?.message))
      return
    }

    setEditando(null)
    router.refresh()
  }

  function actualizarProductoEditando(cambios: Partial<Producto>) {
    if (!editando || !editando.productos) return
    setEditando({ ...editando, productos: { ...editando.productos, ...cambios } })
  }

  function abrirAgregar() {
    setNuevoProducto(formNuevoVacio)
    setErrorAgregar('')
    setMostrarAgregar(true)
  }

  async function agregarProducto() {
    if (!nuevoProducto.nombre.trim()) {
      setErrorAgregar('El nombre es obligatorio')
      return
    }

    setAgregando(true)
    setErrorAgregar('')

    const { data: productoCreado, error: errorProducto } = await supabase
      .from('productos')
      .insert({
        codigo: nuevoProducto.codigo || null,
        nombre: nuevoProducto.nombre,
        categoria_id: nuevoProducto.categoria_id || null,
        precio_costo: parseFloat(nuevoProducto.precio_costo) || 0,
        precio_venta: parseFloat(nuevoProducto.precio_venta) || 0,
        precio_mayoreo: parseFloat(nuevoProducto.precio_mayoreo) || 0,
        activo: true,
      })
      .select('id')
      .single()

    if (errorProducto || !productoCreado) {
      setAgregando(false)
      setErrorAgregar('Error al crear producto: ' + errorProducto?.message)
      return
    }

    const filasInventario = sucursales.map((s) => ({
      producto_id: productoCreado.id,
      sucursal_id: s.id,
      existencia: s.id === sucursalActiva ? parseInt(nuevoProducto.existencia) || 0 : 0,
      inventario_minimo: parseInt(nuevoProducto.inventario_minimo) || 0,
      inventario_maximo: parseInt(nuevoProducto.inventario_maximo) || 0,
    }))

    const { error: errorInventario } = await supabase.from('inventario').insert(filasInventario)

    setAgregando(false)

    if (errorInventario) {
      await supabase.from('productos').delete().eq('id', productoCreado.id)
      setErrorAgregar('Error al crear inventario: ' + errorInventario.message)
      return
    }

    setMostrarAgregar(false)
    router.refresh()
  }

  async function borrarProducto(i: Inventario) {
    const productoId = i.productos?.id
    if (!productoId) return

    if (!confirm(`¿Eliminar "${i.productos?.nombre}" del catálogo? Se quitará de las 3 sucursales. Esta acción no se puede deshacer.`)) return

    setBorrandoId(productoId)

    const [{ count: enCotizaciones }, { count: enVentas }, { count: enPromociones }] = await Promise.all([
      supabase.from('cotizacion_items').select('*', { count: 'exact', head: true }).eq('producto_id', productoId),
      supabase.from('venta_items').select('*', { count: 'exact', head: true }).eq('producto_id', productoId),
      supabase.from('promociones').select('*', { count: 'exact', head: true }).eq('producto_id', productoId),
    ])

    if ((enCotizaciones || 0) > 0 || (enVentas || 0) > 0 || (enPromociones || 0) > 0) {
      setBorrandoId(null)
      alert('No se puede eliminar: este producto tiene cotizaciones, ventas o promociones asociadas.')
      return
    }

    const { error: errorInventario } = await supabase.from('inventario').delete().eq('producto_id', productoId)

    if (errorInventario) {
      setBorrandoId(null)
      alert('Error al eliminar el inventario del producto: ' + errorInventario.message)
      return
    }

    const { error: errorProducto } = await supabase.from('productos').delete().eq('id', productoId)

    setBorrandoId(null)

    if (errorProducto) {
      alert('Error al eliminar el producto: ' + errorProducto.message)
      return
    }

    router.refresh()
  }

  function abrirImagen(i: Inventario) {
    setImagenPara(i)
    setArchivoImagen(null)
    setPreviewImagen('')
    setArchivoImagenHover(null)
    setPreviewImagenHover('')
    setImagenesGaleria(i.productos?.imagenes || [])
    setArchivosGaleriaNuevos([])
    setPreviewsGaleriaNuevos([])
    setDescripcionImagen(i.productos?.descripcion || '')
    setErrorImagen('')
  }

  function elegirArchivoImagen(archivo: File | undefined) {
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) {
      setErrorImagen('Selecciona un archivo de imagen')
      return
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setErrorImagen('La imagen no debe pesar más de 5MB')
      return
    }
    setErrorImagen('')
    setArchivoImagen(archivo)
    setPreviewImagen(URL.createObjectURL(archivo))
  }

  function elegirArchivoImagenHover(archivo: File | undefined) {
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) {
      setErrorImagen('Selecciona un archivo de imagen')
      return
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setErrorImagen('La imagen no debe pesar más de 5MB')
      return
    }
    setErrorImagen('')
    setArchivoImagenHover(archivo)
    setPreviewImagenHover(URL.createObjectURL(archivo))
  }

  function elegirArchivosGaleria(archivos: FileList | null) {
    if (!archivos) return
    const espacioDisponible = 6 - imagenesGaleria.length - archivosGaleriaNuevos.length
    if (espacioDisponible <= 0) {
      setErrorImagen('Ya tienes 6 fotos en la galería. Quita alguna para agregar otra.')
      return
    }
    const candidatos = Array.from(archivos)
    const validos = candidatos.filter((a) => a.type.startsWith('image/') && a.size <= 5 * 1024 * 1024).slice(0, espacioDisponible)

    if (validos.length < candidatos.length) {
      setErrorImagen('Algunas imágenes se omitieron (deben ser imágenes de máx. 5MB, y máximo 6 en total).')
    } else {
      setErrorImagen('')
    }

    setArchivosGaleriaNuevos((prev) => [...prev, ...validos])
    setPreviewsGaleriaNuevos((prev) => [...prev, ...validos.map((a) => URL.createObjectURL(a))])
  }

  function quitarImagenGaleriaExistente(idx: number) {
    setImagenesGaleria((prev) => prev.filter((_, i) => i !== idx))
  }

  function quitarArchivoGaleriaNuevo(idx: number) {
    setArchivosGaleriaNuevos((prev) => prev.filter((_, i) => i !== idx))
    setPreviewsGaleriaNuevos((prev) => prev.filter((_, i) => i !== idx))
  }

  async function subirImagenAStorage(archivo: File, sufijo: string, productoId: string) {
    const extension = archivo.name.split('.').pop() || 'jpg'
    const ruta = `${productoId}${sufijo}.${extension}`

    const { error: errorSubida } = await supabase.storage
      .from('productos')
      .upload(ruta, archivo, { upsert: true })

    if (errorSubida) throw new Error('Error al subir la imagen: ' + errorSubida.message)

    const { data: urlData } = supabase.storage.from('productos').getPublicUrl(ruta)
    return `${urlData.publicUrl}?t=${Date.now()}`
  }

  async function guardarImagen() {
    if (!imagenPara?.productos) return
    const productoId = imagenPara.productos.id

    setSubiendoImagen(true)
    setErrorImagen('')

    const cambios: { imagen_url?: string; imagen_url_hover?: string; imagenes: string[]; descripcion: string | null } = {
      imagenes: imagenesGaleria,
      descripcion: descripcionImagen.trim() || null,
    }

    try {
      if (archivoImagen) cambios.imagen_url = await subirImagenAStorage(archivoImagen, '', productoId)
      if (archivoImagenHover) cambios.imagen_url_hover = await subirImagenAStorage(archivoImagenHover, '-hover', productoId)
      if (archivosGaleriaNuevos.length > 0) {
        const urlsNuevas = await Promise.all(
          archivosGaleriaNuevos.map((archivo, idx) => subirImagenAStorage(archivo, `-galeria-${Date.now()}-${idx}`, productoId))
        )
        cambios.imagenes = [...imagenesGaleria, ...urlsNuevas].slice(0, 6)
      }
    } catch (err) {
      setSubiendoImagen(false)
      setErrorImagen(err instanceof Error ? err.message : 'Error al subir la imagen')
      return
    }

    const { error: errorUpdate } = await supabase
      .from('productos')
      .update(cambios)
      .eq('id', productoId)

    setSubiendoImagen(false)

    if (errorUpdate) {
      setErrorImagen('Error al guardar los cambios: ' + errorUpdate.message)
      return
    }

    setImagenPara(null)
    router.refresh()
  }

  async function quitarImagen() {
    if (!imagenPara?.productos) return
    setSubiendoImagen(true)

    const { error } = await supabase
      .from('productos')
      .update({ imagen_url: null })
      .eq('id', imagenPara.productos.id)

    setSubiendoImagen(false)

    if (error) {
      setErrorImagen('Error al quitar la imagen: ' + error.message)
      return
    }

    setImagenPara(null)
    router.refresh()
  }

  async function quitarImagenHover() {
    if (!imagenPara?.productos) return
    setSubiendoImagen(true)

    const { error } = await supabase
      .from('productos')
      .update({ imagen_url_hover: null })
      .eq('id', imagenPara.productos.id)

    setSubiendoImagen(false)

    if (error) {
      setErrorImagen('Error al quitar la imagen: ' + error.message)
      return
    }

    setImagenPara(null)
    router.refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {esAdmin && sucursales.map((s) => (
          <button
            key={s.id}
            onClick={() => cambiarSucursal(s.id)}
            style={{
              padding: '10px 18px', borderRadius: '8px', border: 'none',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              backgroundColor: s.id === sucursalActiva ? '#1A6DD4' : 'white',
              color: s.id === sucursalActiva ? 'white' : '#0D1B3E',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            {s.nombre}
          </button>
        ))}

        {esAdmin && (
          <button
            onClick={abrirAgregar}
            style={{
              marginLeft: 'auto', padding: '10px 18px', borderRadius: '8px', border: 'none',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#1A7A3E', color: 'white',
            }}
          >
            + Agregar producto
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{
          fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px',
          backgroundColor: productosBajo.length > 0 ? '#FDE8E8' : '#E8F7EE',
          color: productosBajo.length > 0 ? '#B81C1C' : '#1A7A3E',
        }}>
          {productosBajo.length} producto{productosBajo.length === 1 ? '' : 's'} con stock bajo
        </span>

        <button
          onClick={descargarReportePdf}
          disabled={productosBajo.length === 0}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: productosBajo.length === 0 ? 'default' : 'pointer',
            backgroundColor: '#1A6DD4', color: 'white', opacity: productosBajo.length === 0 ? 0.5 : 1,
          }}
        >
          Reporte PDF (stock bajo)
        </button>

        <button
          onClick={descargarExcelStockBajo}
          disabled={productosBajo.length === 0}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: productosBajo.length === 0 ? 'default' : 'pointer',
            backgroundColor: '#1A7A3E', color: 'white', opacity: productosBajo.length === 0 ? 0.5 : 1,
          }}
        >
          Excel (stock bajo)
        </button>

        <button
          onClick={descargarExcelCompleto}
          disabled={inventario.length === 0}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            backgroundColor: 'white', color: '#0D1B3E', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          Excel (inventario completo)
        </button>

        {esAdmin && (
          <button
            onClick={() => setMostrarMargen(true)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              backgroundColor: '#0D1B3E', color: 'white',
            }}
          >
            % Ganancia en lote
          </button>
        )}

        {esAdmin && (
          <button
            onClick={abrirCategorias}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              backgroundColor: 'white', color: '#0D1B3E', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            Categorías
          </button>
        )}
      </div>

      {/* ── Modal: gestión de categorías ── */}
      {mostrarCategorias && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <h2 style={{ color: '#0D1B3E', fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>
              Gestionar categorías
            </h2>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '18px' }}>
              Crea, edita o borra categorías y subcategorías del catálogo.
            </p>

            {errorCategoria && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#FDE8E8', color: '#B81C1C', fontSize: '13px', marginBottom: '14px' }}>
                {errorCategoria}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', backgroundColor: '#F4F8FF', borderRadius: '8px', marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#0D1B3E' }}>
                Nombre
                <input
                  type="text"
                  value={formCategoria.nombre}
                  onChange={(e) => setFormCategoria((f) => ({ ...f, nombre: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '14px' }}
                />
              </label>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#0D1B3E' }}>
                Categoría padre (opcional)
                <select
                  value={formCategoria.categoria_padre}
                  onChange={(e) => setFormCategoria((f) => ({ ...f, categoria_padre: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '13px' }}
                >
                  <option value="">Ninguna (categoría principal)</option>
                  {categorias.filter((c) => !c.categoria_padre && c.id !== categoriaEditandoId).map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                {categoriaEditandoId && (
                  <button
                    onClick={cancelarEdicionCategoria}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#F0F4FB', color: '#888', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancelar edición
                  </button>
                )}
                <button
                  onClick={guardarCategoria}
                  disabled={guardandoCategoria}
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#1A6DD4', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: guardandoCategoria ? 0.6 : 1 }}
                >
                  {guardandoCategoria ? 'Guardando...' : categoriaEditandoId ? 'Guardar cambios' : '+ Agregar categoría'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {categorias.filter((c) => !c.categoria_padre).length === 0 && (
                <p style={{ fontSize: '13px', color: '#888' }}>No hay categorías todavía.</p>
              )}
              {categorias.filter((c) => !c.categoria_padre).map((principal) => (
                <div key={principal.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', borderBottom: '1px solid #F0F4FB' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0D1B3E' }}>{principal.nombre}</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => abrirEditarCategoria(principal)} style={{ fontSize: '12px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Editar
                      </button>
                      <button
                        onClick={() => borrarCategoria(principal)}
                        disabled={borrandoCategoriaId === principal.id}
                        style={{ fontSize: '12px', color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {borrandoCategoriaId === principal.id ? 'Borrando...' : 'Borrar'}
                      </button>
                    </div>
                  </div>
                  {categorias.filter((sub) => sub.categoria_padre === principal.id).map((sub) => (
                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px 8px 20px', borderBottom: '1px solid #F0F4FB' }}>
                      <span style={{ fontSize: '13px', color: '#333' }}>— {sub.nombre}</span>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => abrirEditarCategoria(sub)} style={{ fontSize: '12px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                          Editar
                        </button>
                        <button
                          onClick={() => borrarCategoria(sub)}
                          disabled={borrandoCategoriaId === sub.id}
                          style={{ fontSize: '12px', color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {borrandoCategoriaId === sub.id ? 'Borrando...' : 'Borrar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={cerrarModalCategorias}
              style={{ marginTop: '20px', width: '100%', padding: '11px', borderRadius: '8px', border: 'none', backgroundColor: '#F0F4FB', color: '#888', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: ajuste de precio por margen de ganancia ── */}
      {mostrarMargen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <h2 style={{ color: '#0D1B3E', fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>
              Ajustar precio de venta por % de ganancia
            </h2>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '22px' }}>
              El nuevo precio de venta se calcula como: <strong>Costo × (1 + %)</strong>. Solo se actualizan productos que tienen precio de costo registrado.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#0D1B3E' }}>
                Margen de ganancia (%)
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={margenPct}
                    onChange={e => setMargenPct(parseFloat(e.target.value) || 0)}
                    style={{ width: '110px', padding: '10px 12px', border: '1px solid #E0E8F5', borderRadius: '8px', fontSize: '16px', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '13px', color: '#888' }}>
                    Ej. con costo $100 → precio de venta <strong style={{ color: '#1A7A3E' }}>${(100 * (1 + margenPct / 100)).toFixed(2)}</strong>
                  </span>
                </div>
              </label>

              <label style={{ fontSize: '13px', fontWeight: 600, color: '#0D1B3E' }}>
                Aplicar a
                <select
                  value={categoriaMargen}
                  onChange={e => setCategoriaMargen(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px 12px', border: '1px solid #E0E8F5', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="">Todo el inventario</option>
                  {categorias.filter(c => !c.categoria_padre).map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                  {categorias.filter(c => c.categoria_padre).map(c => (
                    <option key={c.id} value={c.id}>— {c.nombre}</option>
                  ))}
                </select>
              </label>

              {(() => {
                const idsCategoria = categoriaMargen
                  ? [categoriaMargen, ...categorias.filter(c => c.categoria_padre === categoriaMargen).map(c => c.id)]
                  : []
                const cuenta = inventario.filter(i => {
                  const costo = i.productos?.precio_costo ?? 0
                  if (costo <= 0) return false
                  if (categoriaMargen) return idsCategoria.includes(i.productos?.categoria_id || '')
                  return true
                }).length
                return (
                  <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: cuenta > 0 ? '#E8F7EE' : '#FDE8E8' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: cuenta > 0 ? '#1A7A3E' : '#B81C1C' }}>
                      {cuenta > 0
                        ? `${cuenta} producto${cuenta === 1 ? '' : 's'} se actualizarán`
                        : 'Ningún producto con costo en esta categoría'}
                    </span>
                    {inventario.filter(i => !(i.productos?.precio_costo ?? 0)).length > 0 && (
                      <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                        Los que no tienen costo registrado se omiten.
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button
                onClick={() => setMostrarMargen(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', backgroundColor: '#F0F4FB', color: '#888', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={aplicarMargen}
                disabled={aplicandoMargen}
                style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', backgroundColor: '#1A6DD4', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: aplicandoMargen ? 0.6 : 1 }}
              >
                {aplicandoMargen ? 'Aplicando...' : 'Aplicar precios'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            flex: '1', minWidth: '220px', maxWidth: '380px', padding: '10px 14px',
            border: '1px solid #E0E8F5', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white'
          }}
        />

        <select
          value={categoriaFiltro}
          onChange={(e) => cambiarCategoria(e.target.value)}
          style={{
            padding: '10px 14px', border: '1px solid #E0E8F5', borderRadius: '8px',
            fontSize: '14px', backgroundColor: 'white', minWidth: '200px'
          }}
        >
          <option value="">Todas las categorías</option>
          {categoriasPrincipales.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        {categoriaFiltro && subcategoriasDisponibles.length > 0 && (
          <select
            value={subcategoriaFiltro}
            onChange={(e) => setSubcategoriaFiltro(e.target.value)}
            style={{
              padding: '10px 14px', border: '1px solid #E0E8F5', borderRadius: '8px',
              fontSize: '14px', backgroundColor: 'white', minWidth: '200px'
            }}
          >
            <option value="">Todas las subcategorías</option>
            {subcategoriasDisponibles.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        )}

        <select
          value={estadoStockFiltro}
          onChange={(e) => setEstadoStockFiltro(e.target.value)}
          style={{
            padding: '10px 14px', border: '1px solid #E0E8F5', borderRadius: '8px',
            fontSize: '14px', backgroundColor: 'white', minWidth: '160px'
          }}
        >
          <option value="">Todos los stocks</option>
          <option value="bajo">Stock bajo</option>
          <option value="ok">OK</option>
        </select>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setOrden('az')}
            style={{
              padding: '10px 14px', borderRadius: '8px', border: 'none', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
              backgroundColor: orden === 'az' ? '#1A6DD4' : 'white',
              color: orden === 'az' ? 'white' : '#0D1B3E',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            A-Z
          </button>
          <button
            onClick={() => setOrden('za')}
            style={{
              padding: '10px 14px', borderRadius: '8px', border: 'none', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
              backgroundColor: orden === 'za' ? '#1A6DD4' : 'white',
              color: orden === 'za' ? 'white' : '#0D1B3E',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            Z-A
          </button>
        </div>
      </div>

      {esAdmin && seleccionados.size > 0 && (
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px',
          padding: '14px 16px', backgroundColor: '#EAF2FE', borderRadius: '8px', flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0D1B3E' }}>
            {seleccionados.size} de {filtrados.length} seleccionado{seleccionados.size === 1 ? '' : 's'}
          </span>

          <button
            onClick={() => abrirLote('existencia', 'llenar_referencia')}
            style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#1A7A3E', color: 'white' }}
          >
            Llenar stock
          </button>
          <button
            onClick={() => abrirLote()}
            style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#1A6DD4', color: 'white' }}
          >
            Editar en lote
          </button>
          <button
            onClick={() => setSeleccionados(new Set())}
            style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', backgroundColor: 'white', color: '#888' }}
          >
            Cancelar selección
          </button>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '10px', overflowX: 'auto', overflowY: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1080px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F7FC', borderBottom: '1px solid #E0E8F5' }}>
              {esAdmin && (
                <th style={thStyle}>
                  <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos} />
                </th>
              )}
              <th style={thStyle}>Código</th>
              <th style={thStyle}>Producto</th>
              <th style={thStyle}>Categoría</th>
              <th style={thStyle}>P. Venta</th>
              {esAdmin && <th style={thStyle}>P. Costo</th>}
              {esAdmin && <th style={thStyle}>% Ganancia</th>}
              <th style={thStyle}>Existencia</th>
              <th style={thStyle}>Mínimo</th>
              <th style={thStyle}>Máximo</th>
              <th style={thStyle}>Stock</th>
              {esAdmin && <th style={thStyle}></th>}
            </tr>
          </thead>
          <tbody>
            {visibles.map((i) => {
              const bajo = esStockBajo(i)
              return (
                <tr key={i.id} style={{ borderBottom: '1px solid #F0F4FB' }}>
                  {esAdmin && (
                    <td style={tdStyle}>
                      <input type="checkbox" checked={seleccionados.has(i.id)} onChange={() => toggleUno(i.id)} />
                    </td>
                  )}
                  <td style={tdStyle}>{i.productos?.codigo}</td>
                  <td style={tdStyle}>{i.productos?.nombre}</td>
                  <td style={tdStyle}>{i.productos?.categorias?.nombre || '—'}</td>
                  <td style={tdStyle}>${i.productos?.precio_venta?.toFixed(2)}</td>
                  {esAdmin && <td style={tdStyle}>${i.productos?.precio_costo?.toFixed(2)}</td>}
                  {esAdmin && (
                    <td style={tdStyle}>
                      {(i.productos?.precio_costo ?? 0) > 0
                        ? (() => {
                            const ganancia = ((i.productos!.precio_venta - i.productos!.precio_costo) / i.productos!.precio_costo) * 100
                            return (
                              <span style={{
                                fontSize: '12px', padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap',
                                backgroundColor: ganancia >= 0 ? '#E8F7EE' : '#FDE8E8',
                                color: ganancia >= 0 ? '#1A7A3E' : '#B81C1C',
                              }}>
                                {ganancia >= 0 ? '+' : ''}{ganancia.toFixed(1)}%
                              </span>
                            )
                          })()
                        : <span style={{ color: '#888' }}>—</span>
                      }
                    </td>
                  )}
                  <td style={{ ...tdStyle, fontWeight: 600, color: bajo ? '#C0392B' : '#333' }}>
                    {i.existencia}
                  </td>
                  <td style={tdStyle}>{i.inventario_minimo}</td>
                  <td style={tdStyle}>{i.inventario_maximo}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontSize: '11px', padding: '3px 10px', borderRadius: '999px',
                      backgroundColor: bajo ? '#FDE8E8' : '#E8F7EE',
                      color: bajo ? '#B81C1C' : '#1A7A3E', whiteSpace: 'nowrap',
                    }}>
                      {bajo ? 'Stock bajo' : 'OK'}
                    </span>
                  </td>
                  {esAdmin && (
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => setEditando(i)}
                          style={{ fontSize: '12px', color: '#1A6DD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => abrirImagen(i)}
                          style={{ fontSize: '12px', color: '#1A7A3E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {i.productos?.imagen_url ? 'Cambiar imagen' : '+ Imagen'}
                        </button>
                        <button
                          onClick={() => borrarProducto(i)}
                          disabled={borrandoId === i.productos?.id}
                          style={{ fontSize: '12px', color: '#B81C1C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {borrandoId === i.productos?.id ? 'Borrando...' : 'Borrar'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtrados.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
            Mostrando {visibles.length === 0 ? 0 : (paginaSegura - 1) * POR_PAGINA + 1}-{(paginaSegura - 1) * POR_PAGINA + visibles.length} de {filtrados.length} resultados
          </p>
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPagina(paginaSegura - 1)}
                disabled={paginaSegura === 1}
                style={{
                  padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #ddd',
                  background: '#fff', color: paginaSegura === 1 ? '#ccc' : '#0D1B3E',
                  cursor: paginaSegura === 1 ? 'default' : 'pointer',
                }}
              >
                ‹ Anterior
              </button>
              {numerosDePagina(paginaSegura, totalPaginas).map((n, idx) =>
                n === '...' ? (
                  <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#888', fontSize: '13px' }}>…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPagina(n as number)}
                    style={{
                      padding: '6px 11px', fontSize: '13px', borderRadius: '6px',
                      border: n === paginaSegura ? '1px solid #1A6DD4' : '1px solid #ddd',
                      background: n === paginaSegura ? '#1A6DD4' : '#fff',
                      color: n === paginaSegura ? '#fff' : '#0D1B3E',
                      fontWeight: n === paginaSegura ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                onClick={() => setPagina(paginaSegura + 1)}
                disabled={paginaSegura === totalPaginas}
                style={{
                  padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #ddd',
                  background: '#fff', color: paginaSegura === totalPaginas ? '#ccc' : '#0D1B3E',
                  cursor: paginaSegura === totalPaginas ? 'default' : 'pointer',
                }}
              >
                Siguiente ›
              </button>
            </div>
          )}
        </div>
      )}

      {editando && editando.productos && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <form onSubmit={guardarCambios} style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '420px',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ color: '#0D1B3E', fontSize: '18px', marginBottom: '4px' }}>
              Editar producto e inventario
            </h2>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
              {editando.productos.nombre}
            </p>

            <label style={labelStyle}>Código</label>
            <input
              value={editando.productos.codigo || ''}
              onChange={(e) => actualizarProductoEditando({ codigo: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Nombre</label>
            <input
              value={editando.productos.nombre || ''}
              onChange={(e) => actualizarProductoEditando({ nombre: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Categoría</label>
            <select
              value={editando.productos.categoria_id || ''}
              onChange={(e) => actualizarProductoEditando({ categoria_id: e.target.value })}
              style={inputStyle}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoria_padre ? '— ' : ''}{c.nombre}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>P. Costo</label>
                <input
                  type="number" step="0.01"
                  value={editando.productos.precio_costo || 0}
                  onChange={(e) => actualizarProductoEditando({ precio_costo: parseFloat(e.target.value) })}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>P. Venta</label>
                <input
                  type="number" step="0.01"
                  value={editando.productos.precio_venta || 0}
                  onChange={(e) => actualizarProductoEditando({ precio_venta: parseFloat(e.target.value) })}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>P. Mayoreo</label>
                <input
                  type="number" step="0.01"
                  value={editando.productos.precio_mayoreo || 0}
                  onChange={(e) => actualizarProductoEditando({ precio_mayoreo: parseFloat(e.target.value) })}
                  style={inputStyle}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E0E8F5', margin: '16px 0' }} />

            <label style={labelStyle}>Existencia actual</label>
            <input
              type="number"
              value={editando.existencia}
              onChange={(e) => setEditando({ ...editando, existencia: parseFloat(e.target.value) })}
              style={inputStyle}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Inventario mínimo</label>
                <input
                  type="number"
                  value={editando.inventario_minimo}
                  onChange={(e) => setEditando({ ...editando, inventario_minimo: parseInt(e.target.value) })}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Inventario máximo</label>
                <input
                  type="number"
                  value={editando.inventario_maximo}
                  onChange={(e) => setEditando({ ...editando, inventario_maximo: parseInt(e.target.value) })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setEditando(null)}
                style={{ flex: 1, padding: '12px', backgroundColor: '#F0F4FB', color: '#888', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                style={{ flex: 1, padding: '12px', backgroundColor: '#1A6DD4', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {mostrarAgregar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '420px',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ color: '#0D1B3E', fontSize: '18px', marginBottom: '4px' }}>
              Agregar producto
            </h2>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
              Se agrega a las 3 sucursales. La existencia inicial solo aplica a {sucursales.find((s) => s.id === sucursalActiva)?.nombre || 'esta sucursal'}; las demás empiezan en 0.
            </p>

            {errorAgregar && (
              <p style={{ color: '#B81C1C', fontSize: '13px', marginBottom: '12px', backgroundColor: '#FDE8E8', padding: '10px', borderRadius: '6px' }}>
                {errorAgregar}
              </p>
            )}

            <label style={labelStyle}>Código</label>
            <input
              value={nuevoProducto.codigo}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, codigo: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Nombre</label>
            <input
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
              style={inputStyle}
            />

            <label style={labelStyle}>Categoría</label>
            <select
              value={nuevoProducto.categoria_id}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria_id: e.target.value })}
              style={inputStyle}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoria_padre ? '— ' : ''}{c.nombre}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>P. Costo</label>
                <input
                  type="number" step="0.01"
                  value={nuevoProducto.precio_costo}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_costo: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>P. Venta</label>
                <input
                  type="number" step="0.01"
                  value={nuevoProducto.precio_venta}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_venta: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>P. Mayoreo</label>
                <input
                  type="number" step="0.01"
                  value={nuevoProducto.precio_mayoreo}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_mayoreo: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E0E8F5', margin: '16px 0' }} />

            <label style={labelStyle}>Existencia inicial</label>
            <input
              type="number"
              value={nuevoProducto.existencia}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, existencia: e.target.value })}
              style={inputStyle}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Inventario mínimo</label>
                <input
                  type="number"
                  value={nuevoProducto.inventario_minimo}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, inventario_minimo: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Inventario máximo</label>
                <input
                  type="number"
                  value={nuevoProducto.inventario_maximo}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, inventario_maximo: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setMostrarAgregar(false)}
                style={{ flex: 1, padding: '12px', backgroundColor: '#F0F4FB', color: '#888', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={agregarProducto}
                disabled={agregando}
                style={{ flex: 1, padding: '12px', backgroundColor: '#1A6DD4', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                {agregando ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {imagenPara && imagenPara.productos && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '420px', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ color: '#0D1B3E', fontSize: '18px', marginBottom: '4px' }}>
              Imagen y descripción del producto
            </h2>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
              {imagenPara.productos.nombre}
            </p>

            {errorImagen && (
              <p style={{ color: '#B81C1C', fontSize: '13px', marginBottom: '12px', backgroundColor: '#FDE8E8', padding: '10px', borderRadius: '6px' }}>
                {errorImagen}
              </p>
            )}

            <p style={{ color: '#0D1B3E', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Imagen principal
            </p>
            <div style={{
              width: '100%', height: '180px', borderRadius: '8px', backgroundColor: '#F4F7FC',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '10px',
              border: '1px solid #E0E8F5',
            }}>
              {previewImagen || imagenPara.productos.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImagen || imagenPara.productos.imagen_url || ''}
                  alt={imagenPara.productos.nombre}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ color: '#888', fontSize: '13px' }}>Sin imagen</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => elegirArchivoImagen(e.target.files?.[0])}
                style={{ fontSize: '13px', flex: 1 }}
              />
              {imagenPara.productos.imagen_url && (
                <button
                  type="button"
                  onClick={quitarImagen}
                  disabled={subiendoImagen}
                  style={{ padding: '6px 12px', backgroundColor: '#FDE8E8', color: '#B81C1C', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Quitar
                </button>
              )}
            </div>

            <p style={{ color: '#0D1B3E', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Imagen al pasar el mouse (opcional)
            </p>
            <p style={{ color: '#888', fontSize: '12px', marginBottom: '6px' }}>
              Se muestra en el catálogo público cuando el cliente pasa el cursor sobre la imagen principal.
            </p>
            <div style={{
              width: '100%', height: '180px', borderRadius: '8px', backgroundColor: '#F4F7FC',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '10px',
              border: '1px solid #E0E8F5',
            }}>
              {previewImagenHover || imagenPara.productos.imagen_url_hover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImagenHover || imagenPara.productos.imagen_url_hover || ''}
                  alt={imagenPara.productos.nombre}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ color: '#888', fontSize: '13px' }}>Sin imagen</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => elegirArchivoImagenHover(e.target.files?.[0])}
                style={{ fontSize: '13px', flex: 1 }}
              />
              {imagenPara.productos.imagen_url_hover && (
                <button
                  type="button"
                  onClick={quitarImagenHover}
                  disabled={subiendoImagen}
                  style={{ padding: '6px 12px', backgroundColor: '#FDE8E8', color: '#B81C1C', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Quitar
                </button>
              )}
            </div>

            <p style={{ color: '#0D1B3E', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Galería de fotos ({imagenesGaleria.length + archivosGaleriaNuevos.length}/6)
            </p>
            <p style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
              Se muestran como miniaturas seleccionables en la página del producto (con efecto de lupa en la imagen grande).
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {imagenesGaleria.map((url, idx) => (
                <div key={url + idx} style={{ position: 'relative', width: '72px', height: '72px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px', border: '1px solid #E0E8F5', backgroundColor: '#F4F7FC' }}
                  />
                  <button
                    type="button"
                    onClick={() => quitarImagenGaleriaExistente(idx)}
                    disabled={subiendoImagen}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%',
                      backgroundColor: '#B81C1C', color: 'white', border: '2px solid white', fontSize: '11px', lineHeight: '1',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    aria-label="Quitar foto"
                  >
                    ×
                  </button>
                </div>
              ))}
              {previewsGaleriaNuevos.map((url, idx) => (
                <div key={url + idx} style={{ position: 'relative', width: '72px', height: '72px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto nueva ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px', border: '2px solid #1A6DD4', backgroundColor: '#F4F7FC' }}
                  />
                  <button
                    type="button"
                    onClick={() => quitarArchivoGaleriaNuevo(idx)}
                    disabled={subiendoImagen}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%',
                      backgroundColor: '#B81C1C', color: 'white', border: '2px solid white', fontSize: '11px', lineHeight: '1',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    aria-label="Quitar foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {imagenesGaleria.length + archivosGaleriaNuevos.length < 6 && (
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => elegirArchivosGaleria(e.target.files)}
                style={{ fontSize: '13px', marginBottom: '20px', display: 'block' }}
              />
            )}

            <p style={{ color: '#0D1B3E', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Descripción del producto
            </p>
            <textarea
              value={descripcionImagen}
              onChange={(e) => setDescripcionImagen(e.target.value)}
              placeholder="Breve descripción que verá el cliente en la página del producto..."
              rows={4}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0E8F5', fontSize: '13px', resize: 'vertical', marginBottom: '4px' }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setImagenPara(null)}
                style={{ flex: 1, padding: '12px', backgroundColor: '#F0F4FB', color: '#888', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarImagen}
                disabled={subiendoImagen}
                style={{ flex: 1, padding: '12px', backgroundColor: '#1A6DD4', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: subiendoImagen ? 0.6 : 1 }}
              >
                {subiendoImagen ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarLote && (
        <EdicionLoteModal
          items={inventario
            .filter((i) => seleccionados.has(i.id))
            .map((i) => ({ id: i.id, nombre: i.productos?.nombre || '', productoId: i.productos?.id || '' }))}
          campos={camposLote}
          campoInicial={loteInicial.campo}
          modoInicial={loteInicial.modo}
          obtenerValorActual={(itemId, campo) => {
            const i = inventario.find((x) => x.id === itemId)
            if (!i) return 0
            if (campo in i) return (i as unknown as Record<string, number>)[campo] ?? 0
            return (i.productos as unknown as Record<string, number | string | boolean>)?.[campo] ?? ''
          }}
          aplicando={aplicandoLote}
          onAplicar={manejarAplicarLote}
          onCerrar={() => setMostrarLote(false)}
        />
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: 600, whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#333' }
const labelStyle: React.CSSProperties = { fontSize: '12px', color: '#0D1B3E', fontWeight: 600, display: 'block', marginBottom: '4px', marginTop: '12px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px', border: '1px solid #E0E8F5', borderRadius: '6px', fontSize: '14px', marginBottom: '4px' }
