import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { obtenerLogoPdf } from './logoPdf'

type ItemPdf = {
  cantidad: number
  precio_unitario: number
  subtotal: number
  productos: { codigo: string; nombre: string } | null
}

type CotizacionPdf = {
  id: string
  estado: string
  total: number
  creado_en: string
  clientes: { nombre: string; telefono: string | null; correo: string | null; direccion: string | null } | null
  sucursales: { nombre: string } | null
}

export async function generarPdfCotizacion(cotizacion: CotizacionPdf, items: ItemPdf[]) {
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
  doc.text(`Cotización #${cotizacion.id.slice(0, 8).toUpperCase()}`, 40, 26)

  doc.setFontSize(10)
  doc.setTextColor(20, 20, 20)
  doc.text(`Sucursal: ${cotizacion.sucursales?.nombre || '—'}`, 14, 40)
  doc.text(`Fecha: ${new Date(cotizacion.creado_en).toLocaleDateString('es-MX')}`, 14, 46)
  doc.text(`Estado: ${cotizacion.estado}`, 14, 52)

  doc.text(`Cliente: ${cotizacion.clientes?.nombre || '—'}`, 110, 40)
  doc.text(`Teléfono: ${cotizacion.clientes?.telefono || '—'}`, 110, 46)
  doc.text(`Correo: ${cotizacion.clientes?.correo || '—'}`, 110, 52)

  autoTable(doc, {
    startY: 62,
    head: [['Código', 'Producto', 'Cantidad', 'Precio unitario', 'Subtotal']],
    body: items.map((i) => [
      i.productos?.codigo || '—',
      i.productos?.nombre || '—',
      String(i.cantidad),
      `$${i.precio_unitario.toFixed(2)}`,
      `$${i.subtotal.toFixed(2)}`,
    ]),
    headStyles: { fillColor: [13, 27, 62] },
    styles: { fontSize: 9 },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 70

  doc.setFontSize(13)
  doc.setTextColor(13, 27, 62)
  doc.text(`Total: $${cotizacion.total.toFixed(2)}`, 150, finalY + 14)

  doc.save(`cotizacion-${cotizacion.id.slice(0, 8)}.pdf`)
}
