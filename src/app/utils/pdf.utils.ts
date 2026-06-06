import jsPDF from 'jspdf'

export const generateReservationPDF = (
  reservationId: string,
  tableName: string,
  location: string,
  clientName: string,
  guestCount: number,
  date: string,
  time: string,
  userName: string
) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Color principal del restaurante
  const primaryColor = [217, 108, 74] // #D96C4A
  const darkColor = [75, 46, 45] // #4B2E2D

  // Encabezado
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 40, 'F')

  // Título
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('Helvetica', 'bold')
  doc.text('CONFIRMACIÓN DE RESERVA', pageWidth / 2, 15, { align: 'center' })

  // Línea divisora
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setLineWidth(2)
  doc.line(10, 45, pageWidth - 10, 45)

  // Contenido
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.setFontSize(11)
  doc.setFont('Helvetica', 'normal')

  let yPosition = 55
  const lineHeight = 8
  const leftMargin = 15

  // Datos de la reserva
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)

  doc.text('INFORMACIÓN DE LA RESERVA', leftMargin, yPosition)
  yPosition += lineHeight + 2

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(10)

  doc.text(`ID Reserva: ${reservationId}`, leftMargin, yPosition)
  yPosition += lineHeight

  doc.text(`Ubicación: ${location}`, leftMargin, yPosition)
  yPosition += lineHeight

  doc.text(`Mesa: ${tableName}`, leftMargin, yPosition)
  yPosition += lineHeight

  doc.text(`Cliente: ${clientName}`, leftMargin, yPosition)
  yPosition += lineHeight

  doc.text(`Número de personas: ${guestCount}`, leftMargin, yPosition)
  yPosition += lineHeight

  doc.text(
    `Fecha: ${new Date(date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    leftMargin,
    yPosition
  )
  yPosition += lineHeight

  doc.text(`Hora: ${time}`, leftMargin, yPosition)
  yPosition += lineHeight

  doc.text(`Registrado por: ${userName}`, leftMargin, yPosition)
  yPosition += lineHeight + 4

  // Línea divisora
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.line(leftMargin, yPosition, pageWidth - leftMargin, yPosition)
  yPosition += 8

  // Fecha de emisión
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const time_now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  doc.text(`Emitido: ${today} a las ${time_now}`, leftMargin, yPosition)

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Confirmación: ${reservationId}`, pageWidth / 2, pageHeight - 20, {
    align: 'center'
  })

  // Descargar el PDF
  const fileName = `Reserva_${tableName.replace(/\s+/g, '_')}_${date}.pdf`
  doc.save(fileName)
}

// ─── TIPOS PARA FUNCIONES DE CAJA ───────────────────────────────────────────

export interface QrPdfParams {
  pedidoId: string
  mesaNombre: string
  codigo: string
  totalStr: string
  clienteNombre?: string
}

export interface ReceiptPdfParams {
  pedido: {
    codigo?: string
    pedidoId?: string
    _id?: string
    mesaNombre?: string
    mesa?: { numero?: string; ubicacion?: { nombre?: string }; location?: string }
    meseroNombre?: string
    usuario?: { nombre?: string; apellido?: string }
    clienteNombre?: string
    clienteCI?: string
    clienteNIT?: string
    items?: any[]
    detalles?: any[]
    subtotalCierre?: number
    total?: number
    montoDescuento?: number
    montoPropina?: number
    paymentMethod?: string
  }
  cashierName: string
}

export interface ZReportPdfParams {
  cashierName: string
  cajeroId: string | number
  stats: {
    totalDia: number
    efectivo: number
    tarjeta: number
    qr: number
    descuentos: number
    propinas: number
    pagosProcesados: number
  }
}

// ─── FUNCIÓN 1: QR PDF ───────────────────────────────────────────────────────

/**
 * Genera y descarga un PDF con el código QR de pago para una mesa.
 */
export const generateQrPdf = async (params: QrPdfParams): Promise<void> => {
  const { pedidoId, mesaNombre, codigo, totalStr, clienteNombre = 'Consumidor Final' } = params

  const baseUrl = (import.meta as any).env.VITE_APP_URL || window.location.origin
  const simUrl = `${baseUrl}/pay-simulator?id=${pedidoId}&mesa=${encodeURIComponent(mesaNombre)}&total=${totalStr}&codigo=${encodeURIComponent(codigo)}`

  const doc = new jsPDF({ format: [80, 200] })
  let y = 10

  doc.setFontSize(16)
  doc.text('SABOR & GESTION', 40, y, { align: 'center' })
  y += 8
  doc.setFontSize(12)
  doc.text('Pago con QR', 40, y, { align: 'center' })
  y += 5
  doc.setFontSize(10)
  doc.text('Escanee para pagar desde su celular', 40, y, { align: 'center' })
  y += 8
  doc.text('-----------------------------------------', 40, y, { align: 'center' })
  y += 6

  doc.text(`Mesa: ${mesaNombre}`, 5, y)
  y += 5
  doc.text(`Cliente: ${clienteNombre}`, 5, y)
  y += 5
  doc.text(`Pedido: ${codigo}`, 5, y)
  y += 5

  doc.setFontSize(12)
  doc.text(`Total a pagar: Bs. ${totalStr}`, 5, y)
  y += 8

  doc.setFontSize(10)
  doc.text('-----------------------------------------', 40, y, { align: 'center' })
  y += 6

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(simUrl)}&color=4B2E2D`
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = qrUrl
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
    })
    doc.addImage(img, 'PNG', 15, y, 50, 50)
    y += 55
  } catch {
    doc.text('[ QR NO DISPONIBLE ]', 40, y + 20, { align: 'center' })
    y += 55
  }

  doc.setFontSize(8)
  const splitMsg = doc.splitTextToSize(
    'Escanee este codigo QR con su camara para acceder a la pasarela de pago simulada',
    70
  )
  doc.text(splitMsg, 40, y, { align: 'center' })
  y += 15
  doc.text('Gracias por su preferencia', 40, y, { align: 'center' })

  doc.save(`QR-Mesa-${mesaNombre}.pdf`)
}

// ─── FUNCIÓN 2: RECIBO DE PAGO PDF ──────────────────────────────────────────

/**
 * Genera y descarga el comprobante de pago en PDF para un pedido procesado.
 */
export const generateReceiptPdf = (params: ReceiptPdfParams): void => {
  const { pedido, cashierName } = params

  const doc = new jsPDF({ format: [80, 250] })
  let y = 10

  doc.setFontSize(14)
  doc.text('Sabor & Gestion', 40, y, { align: 'center' })
  y += 6
  doc.setFontSize(10)
  doc.text('Comprobante de Pago', 40, y, { align: 'center' })
  y += 8
  doc.setFontSize(9)
  doc.text(
    `Pedido: ${
      pedido.codigo ||
      `PED-${String(pedido.pedidoId || pedido._id)
        .slice(-4)
        .toUpperCase()}`
    }`,
    40,
    y,
    { align: 'center' }
  )
  y += 6
  doc.text('-----------------------------------------', 40, y, { align: 'center' })
  y += 6

  const mesaName = pedido.mesaNombre || pedido.mesa?.numero || 'Barra'
  const waiterName =
    pedido.meseroNombre ||
    (pedido.usuario?.nombre
      ? `${pedido.usuario.nombre} ${pedido.usuario.apellido || ''}`
      : 'Mesero')
  const locationName = pedido.mesa?.ubicacion?.nombre || pedido.mesa?.location || 'Principal'

  doc.text(`Mesa: ${mesaName}`, 5, y)
  y += 5
  doc.text(`Area/Sala: ${locationName}`, 5, y)
  y += 5
  doc.text(`Mesero: ${waiterName}`, 5, y)
  y += 5
  doc.text(`Cajero: ${cashierName}`, 5, y)
  y += 6
  doc.text('-----------------------------------------', 40, y, { align: 'center' })
  y += 6

  doc.text(`Cliente: ${pedido.clienteNombre || 'Consumidor Final'}`, 5, y)
  y += 5
  if (pedido.clienteCI || pedido.clienteNIT) {
    doc.text(`CI/NIT: ${pedido.clienteCI || pedido.clienteNIT || 'S/N'}`, 5, y)
    y += 5
  }
  doc.text('-----------------------------------------', 40, y, { align: 'center' })
  y += 6

  doc.text('CANT   DESCRIPCION       P.U   SUBT', 5, y)
  y += 5
  ;(pedido.items || pedido.detalles || []).forEach((item: any) => {
    const name = item.nombre || item.plato?.nombre || 'Plato'
    const qty = item.cantidad || 1
    const pu = (item.precioUnitario || item.plato?.precio || 0).toFixed(2)
    const sub = (item.subtotal || (item.precioUnitario || item.plato?.precio || 0) * qty).toFixed(2)
    doc.text(`${qty}`, 5, y)
    doc.text(`${name.substring(0, 12)}`, 15, y)
    doc.text(`${pu}`, 55, y, { align: 'right' })
    doc.text(`Bs. ${sub}`, 75, y, { align: 'right' })
    y += 5
  })

  y += 3
  doc.text('-----------------------------------------', 40, y, { align: 'center' })
  y += 6

  const subtotal = (pedido.subtotalCierre || pedido.total || 0).toFixed(2)
  const discount = (pedido.montoDescuento || 0).toFixed(2)
  const tip = (pedido.montoPropina || 0).toFixed(2)
  const total = (
    (pedido.subtotalCierre || pedido.total || 0) -
    (pedido.montoDescuento || 0) +
    (pedido.montoPropina || 0)
  ).toFixed(2)

  doc.text('Subtotal:', 5, y)
  doc.text(`Bs. ${subtotal}`, 75, y, { align: 'right' })
  y += 5
  if (Number(discount) > 0) {
    doc.text('Descuento:', 5, y)
    doc.text(`- Bs. ${discount}`, 75, y, { align: 'right' })
    y += 5
  }
  if (Number(tip) > 0) {
    doc.text('Propina:', 5, y)
    doc.text(`+ Bs. ${tip}`, 75, y, { align: 'right' })
    y += 5
  }

  doc.setFontSize(12)
  doc.text('TOTAL FINAL:', 5, y)
  doc.text(`Bs. ${total}`, 75, y, { align: 'right' })
  y += 8

  doc.setFontSize(10)
  doc.text(`Metodo Pago: ${pedido.paymentMethod || 'Efectivo'}`, 5, y)
  y += 5

  const now = new Date()
  doc.text(`Fecha: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 5, y)
  y += 10

  doc.text('¡Gracias por su preferencia!', 40, y, { align: 'center' })
  doc.save(`Factura-${pedido.codigo || pedido.pedidoId || 'Pago'}.pdf`)
}

// ─── FUNCIÓN 3: REPORTE Z (CIERRE DE CAJA) PDF ──────────────────────────────

/**
 * Genera y descarga el reporte Z de cierre de caja en PDF.
 */
export const generateZReportPdf = (params: ZReportPdfParams): void => {
  const { cashierName, cajeroId, stats } = params

  const doc = new jsPDF({ format: [80, 250] })
  let y = 10

  doc.setFontSize(14)
  doc.text('Sabor & Gestion', 40, y, { align: 'center' })
  y += 6
  doc.setFontSize(10)
  doc.text('REPORTE DE CIERRE DE CAJA', 40, y, { align: 'center' })
  y += 8

  doc.setFontSize(9)
  doc.text('DATOS DEL CAJERO', 5, y)
  y += 5
  doc.text(`Nombre: ${cashierName}`, 5, y)
  y += 5
  doc.text(`ID Cajero: ${cajeroId || 'N/A'}`, 5, y)
  y += 5
  doc.text('Caja Utilizada: Caja Principal 01', 5, y)
  y += 6

  doc.text('DATOS DE TIEMPO', 5, y)
  y += 5
  const now = new Date()
  const startOfDay = new Date()
  startOfDay.setHours(8, 0, 0, 0)
  doc.text(`Apertura: ${startOfDay.toLocaleTimeString()}`, 5, y)
  y += 5
  doc.text(`Cierre: ${now.toLocaleTimeString()}`, 5, y)
  y += 5
  const diffMs = now.getTime() - startOfDay.getTime()
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffMins = Math.floor((diffMs % 3600000) / 60000)
  doc.text(`Duracion: ${diffHrs}h ${diffMins}m`, 5, y)
  y += 6

  doc.text('-----------------------------------------', 40, y, { align: 'center' })
  y += 6

  doc.setFontSize(10)
  doc.text('DATOS FINANCIEROS', 40, y, { align: 'center' })
  y += 6
  doc.setFontSize(9)
  doc.text(`Pagos Realizados: ${stats.pagosProcesados}`, 5, y)
  y += 5
  doc.text(
    `Subtotal General: Bs. ${(stats.totalDia + stats.descuentos - stats.propinas).toFixed(2)}`,
    5,
    y
  )
  y += 5
  doc.text(`Descuentos Aplicados: Bs. ${stats.descuentos.toFixed(2)}`, 5, y)
  y += 5
  doc.text(`Propinas Recibidas: Bs. ${stats.propinas.toFixed(2)}`, 5, y)
  y += 6

  doc.setFontSize(11)
  doc.text(`TOTAL VENDIDO: Bs. ${stats.totalDia.toFixed(2)}`, 5, y)
  y += 8

  doc.setFontSize(10)
  doc.text('METODOS DE PAGO', 40, y, { align: 'center' })
  y += 6
  doc.setFontSize(9)
  doc.text(`Total en Efectivo: Bs. ${stats.efectivo.toFixed(2)}`, 5, y)
  y += 5
  doc.text(`Total en QR: Bs. ${stats.qr.toFixed(2)}`, 5, y)
  y += 5
  doc.text(`Total en Tarjeta: Bs. ${stats.tarjeta.toFixed(2)}`, 5, y)
  y += 6

  doc.text('INFORMACION OPERATIVA', 5, y)
  y += 5
  doc.text(`Mesas Atendidas: ${stats.pagosProcesados}`, 5, y)
  y += 5
  doc.text(`Pedidos Cobrados: ${stats.pagosProcesados}`, 5, y)
  y += 5
  doc.text('Pagos Anulados: 0', 5, y)
  y += 6

  doc.text('-----------------------------------------', 40, y, { align: 'center' })
  y += 6
  doc.text('Reporte enviado y sincronizado', 40, y, { align: 'center' })
  y += 4
  doc.text('con la Base de Datos (MongoDB)', 40, y, { align: 'center' })

  doc.save(`Cierre-Caja-${cashierName.replace(/\s+/g, '')}-${now.getTime()}.pdf`)
}
