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
  monto_efectivo?: number | null
  monto_tarjeta?: number | null
  monto_transferencia?: number | null
  monto_recibido_efectivo?: number | null
  cambio?: number | null
}

export async function generarPdfTicket(venta: VentaTicket, items: ItemTicket[]) {
  const esMixto = venta.metodo_pago === 'mixto'
  const tieneCambio = (venta.cambio || 0) > 0
  const lineasExtra = (esMixto ? 3 : 0) + (tieneCambio ? 2 : 0)
  const doc = new jsPDF({ unit: 'mm', format: [80, 165 + items.length * 6 + lineasExtra * 5] })

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

  let yPago = finalY + 14
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)

  if (esMixto) {
    if (venta.monto_efectivo) {
      doc.text(`Efectivo: $${venta.monto_efectivo.toFixed(2)}`, 75, yPago, { align: 'right' })
      yPago += 5
    }
    if (venta.monto_tarjeta) {
      doc.text(`Tarjeta: $${venta.monto_tarjeta.toFixed(2)}`, 75, yPago, { align: 'right' })
      yPago += 5
    }
    if (venta.monto_transferencia) {
      doc.text(`Transferencia: $${venta.monto_transferencia.toFixed(2)}`, 75, yPago, { align: 'right' })
      yPago += 5
    }
  }

  if (tieneCambio) {
    doc.text(`Recibido en efectivo: $${(venta.monto_recibido_efectivo || 0).toFixed(2)}`, 75, yPago, { align: 'right' })
    yPago += 5
    doc.setFontSize(9)
    doc.setTextColor(13, 27, 62)
    doc.text(`Cambio: $${(venta.cambio || 0).toFixed(2)}`, 75, yPago, { align: 'right' })
  }

  doc.save(`ticket-${venta.folio}.pdf`)
}
