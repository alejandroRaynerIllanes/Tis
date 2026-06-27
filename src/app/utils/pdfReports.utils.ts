// src/app/utils/pdfReports.utils.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BRAND_COLOR: [number, number, number] = [75, 46, 45]
const ACCENT_COLOR: [number, number, number] = [217, 108, 74]
const LIGHT_BG: [number, number, number] = [252, 228, 214]

export const generarReporteProfesional = (
  tituloReporte: string,
  columnas: string[],
  datos: any[][],
  totales?: string
) => {
  const doc = new jsPDF()
  const fechaActual = new Date().toLocaleDateString()
  const horaActual = new Date().toLocaleTimeString()

  doc.setFillColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2])
  doc.rect(0, 0, 210, 30, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('SABOR & GESTIÓN', 105, 15, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte Administrativo Oficial', 105, 22, { align: 'center' })

  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2])
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(tituloReporte, 14, 42)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Generado el: ${fechaActual} a las ${horaActual}`, 14, 48)

  autoTable(doc, {
    startY: 55,
    head: [columnas],
    body: datos,
    theme: 'grid',
    headStyles: {
      fillColor: ACCENT_COLOR,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { fontSize: 10, textColor: [50, 50, 50], valign: 'middle' },
    alternateRowStyles: { fillColor: LIGHT_BG },
    margin: { top: 55, bottom: 30 } // Aumentamos margen inferior para los totales
  })

  // CORRECCIÓN TOTALES: Multi-línea sin romper jsPDF
  if (totales) {
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2])
    
    const lineas = totales.split('\n')
    lineas.forEach((linea, index) => {
      // Dibujamos línea por línea hacia abajo
      doc.text(linea, 196, finalY + (index * 6), { align: 'right' })
    })
  }

  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Página ${i} de ${pageCount} - Generado por Sabor & Gestión`, 105, 285, {
      align: 'center'
    })
  }

  doc.save(`Reporte_${tituloReporte.replace(/ /g, '_')}.pdf`)
}