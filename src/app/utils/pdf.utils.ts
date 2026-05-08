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