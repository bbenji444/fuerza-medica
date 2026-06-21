import { createClient } from '@supabase/supabase-js'
import pkg from 'xlsx'
const { readFile, utils } = pkg
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const workbook = readFile('./migrate-data/Inventario_FuerzaMedica_Clasificado.xlsx')
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rows = utils.sheet_to_json(sheet)

console.log(`📦 Total de productos a migrar: ${rows.length}`)

async function migrate() {

  const { data: cats } = await supabase.from('categorias').select('id, nombre, categoria_padre')
  const catMap = {}
  cats.forEach(c => { catMap[c.nombre] = c.id })
  console.log(`✅ Categorías cargadas: ${cats.length}`)

  const { data: sucursales } = await supabase.from('sucursales').select('id, nombre')
  const sucCoacalco = sucursales.find(s => s.nombre.toLowerCase().includes('coacalco'))
  if (!sucCoacalco) { console.error('❌ Sucursal Coacalco no encontrada'); return }
  console.log(`✅ Sucursal encontrada: ${sucCoacalco.nombre}`)

  const productos = rows.map(row => {
    const limpiarPrecio = (val) => {
      if (!val) return 0
      return parseFloat(String(val).replace(/[$,]/g, '')) || 0
    }
    const categoria = String(row['Categoría'] || 'Sin Categoría').trim()
    const subcategoria = String(row['Subcategoría'] || '').trim()
    const categoriaId = catMap[subcategoria] || catMap[categoria] || catMap['Sin Categoría']
    return {
      codigo: String(row['Código'] || '').trim(),
      nombre: String(row['Producto'] || '').trim(),
      precio_costo: limpiarPrecio(row['P. Costo']),
      precio_venta: limpiarPrecio(row['P. Venta']),
      precio_mayoreo: limpiarPrecio(row['P. Mayoreo']),
      categoria_id: categoriaId,
      activo: true
    }
  }).filter(p => p.nombre)

  console.log(`📋 Productos preparados: ${productos.length}`)

  const BATCH = 50
  let insertados = 0
  let errores = 0

  for (let i = 0; i < productos.length; i += BATCH) {
    const lote = productos.slice(i, i + BATCH)
    const { data, error } = await supabase.from('productos').insert(lote).select('id, codigo')
    if (error) {
      console.error(`❌ Error en lote ${i}-${i+BATCH}:`, error.message)
      errores += lote.length
      continue
    }

    const inventario = data.map((prod, idx) => {
      const r = rows[i + idx]
      return {
        producto_id: prod.id,
        sucursal_id: sucCoacalco.id,
        existencia: parseFloat(String(r['Existencia'] || '0').replace(/[$,]/g, '')) || 0,
        inventario_minimo: parseInt(r['Inv. Mínimo'] || 0) || 0,
        inventario_maximo: parseInt(r['Inv. Máximo'] || 0) || 0,
      }
    })

    const { error: invError } = await supabase.from('inventario').insert(inventario)
    if (invError) console.error(`⚠️ Error inventario lote ${i}:`, invError.message)

    insertados += data.length
    console.log(`✅ Lote ${Math.floor(i/BATCH)+1}: ${insertados}/${productos.length} productos migrados`)
  }

  console.log(`\n🎉 Migración completa`)
  console.log(`✅ Insertados: ${insertados}`)
  console.log(`❌ Errores: ${errores}`)
}

migrate().catch(console.error)