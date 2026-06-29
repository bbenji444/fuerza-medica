import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PALABRAS_TAMANO = [
  ['EXTRA GRANDE', 3], ['EXTRAGRANDE', 3],
  ['EXTRA CHICA', -1], ['EXTRA CHICO', -1],
  ['GRANDE', 2],
  ['MEDIANA', 1], ['MEDIANO', 1],
  ['CHICA', 0], ['CHICO', 0],
  ['PEQUEÑA', 0], ['PEQUEÑO', 0],
]

const PALABRAS_COLOR = [
  'ROJO', 'ROJA', 'AZUL', 'NEGRO', 'NEGRA', 'BLANCO', 'BLANCA', 'VERDE',
  'AMARILLO', 'AMARILLA', 'GRIS', 'MORADO', 'MORADA', 'NARANJA', 'ROSA', 'BEIGE', 'CAFE', 'CAFÉ',
]

const EXCLUIR_BASE = ['TUBO VACUTAINER BD'] // colores = distinto aditivo químico, no es "el mismo producto"

function capitalizar(palabra) {
  return palabra
    .split(' ')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

function detectarVariante(nombreOriginal) {
  const nombre = nombreOriginal.toUpperCase()
  for (const [palabra, orden] of PALABRAS_TAMANO) {
    const re = new RegExp(`\\b${palabra}\\b`)
    if (re.test(nombre)) {
      const base = nombre.replace(re, ' ').replace(/\s+/g, ' ').trim()
      return { base, etiqueta: capitalizar(palabra), orden, tipo: 'tamaño' }
    }
  }
  for (const palabra of PALABRAS_COLOR) {
    const re = new RegExp(`\\b${palabra}\\b`)
    if (re.test(nombre)) {
      const base = nombre.replace(re, ' ').replace(/\s+/g, ' ').trim()
      return { base, etiqueta: capitalizar(palabra), orden: 0, tipo: 'color' }
    }
  }
  return null
}

const { data: productos, error } = await supabase
  .from('productos')
  .select('id, nombre, categoria_id, precio_venta, activo')
  .eq('activo', true)

if (error) { console.error(error); process.exit(1) }

const grupos = new Map()
for (const p of productos) {
  const det = detectarVariante(p.nombre)
  if (!det) continue
  if (EXCLUIR_BASE.includes(det.base)) continue
  const clave = `${p.categoria_id || 'sin-cat'}::${det.base}`
  if (!grupos.has(clave)) grupos.set(clave, [])
  grupos.get(clave).push({ ...p, ...det })
}

function precioRatioOk(items, tipo) {
  const precios = items.map((i) => i.precio_venta)
  const ratio = Math.max(...precios) / Math.min(...precios)
  return ratio <= (tipo === 'color' ? 1.5 : 2.5)
}

function etiquetasUnicas(items) {
  const set = new Set(items.map((i) => i.etiqueta))
  return set.size === items.length
}

const gruposAutomaticos = Array.from(grupos.values()).filter(
  (items) =>
    items.length >= 2 &&
    items[0].base.split(' ').length >= 2 &&
    etiquetasUnicas(items) &&
    precioRatioOk(items, items[0].tipo)
)

// Caso manual: "BOTA NEUMATICA WALKER" — typos reales en los datos (CHIICA, MEDWAY vs MEDWEY,
// falta "BAJA" en 2 de los 4) impiden que el detector automático los una con seguridad.
// Verificado a mano que son el mismo producto en 4 tamaños.
const GRUPOS_MANUALES = [
  {
    nombre: 'BOTA NEUMATICA WALKER',
    items: [
      { id: '272d53fe-b15b-4473-bf15-ed335b56bc7a', etiqueta: 'Extra chica', orden: -1 },
      { id: '2d59870f-403d-430d-9b56-d1a7e989ec63', etiqueta: 'Chica', orden: 0 },
      { id: '6066a7f6-f71a-4579-a1d6-853303261340', etiqueta: 'Mediana', orden: 1 },
      { id: '0c293bcd-ea10-4278-ae1f-2824fbcc4eab', etiqueta: 'Grande', orden: 2 },
    ],
  },
]

console.log(`Grupos automáticos a aplicar: ${gruposAutomaticos.length}`)
console.log(`Grupos manuales a aplicar: ${GRUPOS_MANUALES.length}`)

let totalProductos = 0
const actualizaciones = []

for (const items of gruposAutomaticos) {
  const grupoId = crypto.randomUUID()
  for (const it of items) {
    actualizaciones.push(
      supabase.from('productos').update({ variante_grupo_id: grupoId, variante_nombre: it.etiqueta, variante_orden: it.orden }).eq('id', it.id)
    )
    totalProductos++
  }
}

for (const grupo of GRUPOS_MANUALES) {
  const grupoId = crypto.randomUUID()
  for (const it of grupo.items) {
    actualizaciones.push(
      supabase.from('productos').update({ variante_grupo_id: grupoId, variante_nombre: it.etiqueta, variante_orden: it.orden }).eq('id', it.id)
    )
    totalProductos++
  }
}

console.log(`Aplicando ${totalProductos} actualizaciones...`)
const resultados = await Promise.all(actualizaciones)
const errores = resultados.filter((r) => r.error)

if (errores.length > 0) {
  console.error(`❌ ${errores.length} errores:`)
  errores.forEach((e) => console.error(e.error.message))
  process.exit(1)
}

console.log(`✅ Listo. ${totalProductos} productos agrupados en ${gruposAutomaticos.length + GRUPOS_MANUALES.length} grupos de variantes.`)
