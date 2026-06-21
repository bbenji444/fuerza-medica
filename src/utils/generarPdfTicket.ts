import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { obtenerLogoPdf } from './logoPdf'

type ItemTicket = {
  cantidad: number
  precio_unitario: number
  subtotal: number
  productos: { codigo: string; nombre: string } | null
}

type VentaTicket = {
  folio: string
  total: number
  metodo_pago: string
  creado_en: string
  sucursales: { nombre: string } | null
}

export async function generarPdfTicket(venta: VentaTicket, items: ItemTicket[]) {
  const doc = new jsPDF({ unit: 'mm', format: [80, 165 + items.length * 6] })

  let y = 6

  const logo = await obtenerLogoPdf()
  if (logo) {
    doc.addImage(logo, 'JPEG', 33, y, 14, 14.7)
    y += 18
  }

  doc.setFontSize(13)
  doc.setTextColor(13, 27, 62)
  doc.text('Fuerza Médica', 40, y, { align: 'center' })
  y += 6

  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(venta.sucursales?.nombre || '', 40, y, { align: 'center' })
  y += 6

  doc.setTextColor(20, 20, 20)
  doc.text(`Folio: ${venta.folio}`, 5, y)
  y += 5
  doc.text(`Fecha: ${new Date(venta.creado_en).toLocaleString('es-MX')}`, 5, y)
  y += 5
  doc.text(`Método de pago: ${venta.metodo_pago}`, 5, y)
  y += 6

  autoTable(doc, {
    startY: y,
    margin: { left: 5, right: 5 },
    head: [['Producto', 'Cant.', 'Precio', 'Subt.']],
    body: items.map((i) => [
      i.productos?.nombre || '—',
      String(i.cantidad),
      `$${i.precio_unitario.toFixed(2)}`,
      `$${i.subtotal.toFixed(2)}`,
    ]),
    headStyles: { fillColor: [13, 27, 62], fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 1.5 },
    theme: 'grid',
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y

  doc.setFontSize(11)
  doc.setTextColor(13, 27, 62)
  doc.text(`Total: $${venta.total.toFixed(2)}`, 75, finalY + 8, { align: 'right' })

  doc.save(`ticket-${venta.folio}.pdf`)
}
