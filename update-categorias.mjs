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

console.log(`📦 Productos a actualizar: ${rows.length}`)

async function updateCategorias() {
  // 1. Traer todas las categorías de Supabase
  const { data: cats } = await supabase
    .from('categorias')
    .select('id, nombre, categoria_padre')

  const catMap = {}
  cats.forEach(c => { catMap[c.nombre.trim().toLowerCase()] = c.id })
  console.log(`✅ Categorías cargadas: ${cats.length}`)

  let actualizados = 0
  let sinCategoria = 0
  let errores = 0

  for (const row of rows) {
    const codigo = String(row['Código'] || '').trim()
    const categoria = String(row['Categoría'] || '').trim()
    const subcategoria = String(row['Subcategoría'] || '').trim()

    if (!codigo) continue

    // Buscar ID: primero subcategoría, luego categoría principal, luego Sin Categoría
    const categoriaId =
      catMap[subcategoria.toLowerCase()] ||
      catMap[categoria.toLowerCase()] ||
      catMap['sin categoría']

    if (!categoriaId) {
      sinCategoria++
      continue
    }

    const { error } = await supabase
      .from('productos')
      .update({ categoria_id: categoriaId })
      .eq('codigo', codigo)

    if (error) {
      console.error(`❌ Error en ${codigo}:`, error.message)
      errores++
    } else {
      actualizados++
    }

    if (actualizados % 100 === 0) {
      console.log(`⏳ ${actualizados}/${rows.length} actualizados...`)
    }
  }

  console.log(`\n🎉 Actualización completa`)
  console.log(`✅ Actualizados: ${actualizados}`)
  console.log(`⚠️  Sin categoría encontrada: ${sinCategoria}`)
  console.log(`❌ Errores: ${errores}`)
}

updateCategorias().catch(console.error)