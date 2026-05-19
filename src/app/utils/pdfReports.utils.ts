// src/app/utils/pdfReports.utils.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Colores de la marca Sabor & Gestión (Añadimos el tipado estricto)
const BRAND_COLOR: [number, number, number] = [75, 46, 45]; // #4B2E2D (Café Oscuro)
const ACCENT_COLOR: [number, number, number] = [217, 108, 74]; // #D96C4A (Naranja/Óxido)
const LIGHT_BG: [number, number, number] = [252, 228, 214]; // #FCE4D6 (Durazno Claro)

export const generarReporteProfesional = (
  tituloReporte: string,
  columnas: string[],
  datos: any[][],
  totales?: string
) => {
  const doc = new jsPDF();
  const fechaActual = new Date().toLocaleDateString();
  const horaActual = new Date().toLocaleTimeString();

  // 1. Cabecera del PDF
  doc.setFillColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.rect(0, 0, 210, 30, 'F'); // Rectángulo superior (Ancho A4 es 210)

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SABOR & GESTIÓN', 105, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte Administrativo Oficial', 105, 22, { align: 'center' });

  // 2. Título y Fecha
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(tituloReporte, 14, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha de emisión: ${fechaActual} a las ${horaActual}`, 14, 48);

  // 3. Generar la Tabla con AutoTable
  autoTable(doc, {
    startY: 55,
    head: [columnas],
    body: datos,
    theme: 'grid',
    headStyles: {
      fillColor: ACCENT_COLOR, // Fondo Naranja de la marca
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 10,
      textColor: [50, 50, 50],
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: LIGHT_BG // Intercalado con durazno claro
    },
    margin: { top: 55, bottom: 20 }
  });

  // 4. Agregar Totales (Si existen) al final de la tabla
  if (totales) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
    doc.text(totales, 196, finalY, { align: 'right' }); // Alineado a la derecha
  }

  // 5. Pie de página
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} - Generado por el Sistema Sabor & Gestión`,
      105,
      285,
      { align: 'center' }
    );
  }

  // 6. Descargar
  doc.save(`Reporte_${tituloReporte.replace(/ /g, '_')}_${fechaActual}.pdf`);
};