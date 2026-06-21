import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type ItemStockBajo = {
  codigo: string
  nombre: string
  existencia: number
  inventario_minimo: number
  inventario_maximo: number
}

export function generarPdfStockBajo(sucursalNombre: string, items: ItemStockBajo[]) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setTextColor(13, 27, 62)
  doc.text('Fuerza Médica', 14, 18)

  doc.setFontSize(11)
  doc.setTextColor(120, 120, 120)
  doc.text(`Reporte de stock bajo — ${sucursalNombre}`, 14, 26)

  doc.setFontSize(10)
  doc.setTextColor(20, 20, 20)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 14, 34)
  doc.text(`Total de productos con stock bajo: ${items.length}`, 14, 40)

  autoTable(doc, {
    startY: 48,
    head: [['Código', 'Producto', 'Existencia', 'Mínimo', 'Máximo']],
    body: items.map((i) => [
      i.codigo || '—',
      i.nombre,
      String(i.existencia),
      String(i.inventario_minimo),
      String(i.inventario_maximo),
    ]),
    headStyles: { fillColor: [13, 27, 62] },
    styles: { fontSize: 9 },
  })

  doc.save(`stock-bajo-${sucursalNombre.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
