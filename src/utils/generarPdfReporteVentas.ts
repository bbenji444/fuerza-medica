import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { obtenerLogoPdf } from './logoPdf'

type ProductoVendido = {
  codigo: string
  nombre: string
  fecha: string
  cantidad: number
  total: number
}

const etiquetasPeriodo: Record<string, string> = {
  hoy: 'Hoy',
  semana: 'Esta semana',
  mes: 'Este mes',
}

export async function generarPdfReporteVentas(
  periodo: string,
  totalPeriodo: number,
  numeroVentas: number,
  productosVendidos: ProductoVendido[]
) {
  const doc = new jsPDF()

  const logo = await obtenerLogoPdf()
  if (logo) {
    doc.addImage(logo, 'JPEG', 14, 8, 20, 21)
  }

  doc.setFontSize(18)
  doc.setTextColor(13, 27, 62)
  doc.text('Fuerza Médica', 40, 18)

  doc.setFontSize(11)
  doc.setTextColor(120, 120, 120)
  doc.text(`Reporte de ventas — ${etiquetasPeriodo[periodo] || periodo}`, 40, 26)

  doc.setFontSize(10)
  doc.setTextColor(20, 20, 20)
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, 14, 40)
  doc.text(`Total vendido: $${totalPeriodo.toFixed(2)}`, 14, 46)
  doc.text(`Número de ventas: ${numeroVentas}`, 14, 52)

  autoTable(doc, {
    startY: 62,
    head: [['Fecha', 'Código', 'Producto', 'Cantidad', 'Total']],
    body: productosVendidos.map((p) => [
      p.fecha ? new Date(`${p.fecha}T00:00:00`).toLocaleDateString('es-MX') : '—',
      p.codigo || '—',
      p.nombre,
      String(p.cantidad),
      `$${p.total.toFixed(2)}`,
    ]),
    headStyles: { fillColor: [13, 27, 62] },
    styles: { fontSize: 9 },
  })

  doc.save(`reporte-ventas-${periodo}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
