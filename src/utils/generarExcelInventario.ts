import * as XLSX from 'xlsx'

type FilaInventario = {
  codigo: string
  nombre: string
  existencia: number
  inventario_minimo: number
  inventario_maximo: number
}

function descargarExcel(filas: FilaInventario[], nombreHoja: string, nombreArchivo: string) {
  const datos = filas.map((f) => ({
    'Código': f.codigo,
    'Producto': f.nombre,
    'Existencia': f.existencia,
    'Mínimo': f.inventario_minimo,
    'Máximo': f.inventario_maximo,
  }))

  const hoja = XLSX.utils.json_to_sheet(datos)
  hoja['!cols'] = [{ wch: 16 }, { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 10 }]

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja)
  XLSX.writeFile(libro, nombreArchivo)
}

export function generarExcelStockBajo(sucursalNombre: string, filas: FilaInventario[]) {
  descargarExcel(filas, 'Stock bajo', `stock-bajo-${sucursalNombre.replace(/\s+/g, '-').toLowerCase()}.xlsx`)
}

export function generarExcelInventarioCompleto(sucursalNombre: string, filas: FilaInventario[]) {
  descargarExcel(filas, 'Inventario', `inventario-${sucursalNombre.replace(/\s+/g, '-').toLowerCase()}.xlsx`)
}
