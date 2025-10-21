import {
  PDFDocument,
  rgb,
  StandardFonts,
  PDFFont,
  PageSizes,
  PDFPage,
} from "pdf-lib";
import { QueueModelResults, ProbabilityDistribution } from "@/lib/types"; // Asegúrate que la ruta sea correcta

// Helper para formatear números en el PDF
const formatNum = (num?: number, decimals = 4): string => {
  if (num === undefined || num === null || isNaN(num)) return "-";
  // Considerar notación científica para números muy pequeños si es necesario
  if (Math.abs(num) < 1e-6 && num !== 0) {
    return num.toExponential(decimals > 0 ? decimals - 1 : 0);
  }
  return num.toFixed(decimals);
};

// --- Colores UNIMAR (aproximados en RGB 0-1) ---
const unimarPrimary = rgb(0.043, 0.314, 0.549); // #0B508C
const unimarSecondary = rgb(0.235, 0.455, 0.651); // #3C74A6
const unimarTextDark = rgb(0.149, 0.149, 0.149); // #262626
const grayLight = rgb(0.9, 0.9, 0.9);
const grayMedium = rgb(0.5, 0.5, 0.5);

// --- Función Principal ---
export async function generatePdfReport(
  results: QueueModelResults
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // --- CORRECCIÓN: Declarar 'page' con 'let' para poder reasignarla ---
  let page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica, {
    subset: true,
  });
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold, {
    subset: true,
  });

  const fontSizeTitle = 20;
  const fontSizeHeader = 14;
  const fontSizeBody = 10;
  const fontSizeSmall = 8;
  const margin = 50;
  const contentWidth = width - 2 * margin;
  let y = height - margin - fontSizeTitle;

  // --- CORRECCIÓN: Modificar 'draw' para aceptar la página actual ---
  const draw = (
    text: string,
    xOffset: number,
    currentY: number,
    size: number,
    currentPage: PDFPage, // <-- Añadir parámetro para la página
    fontToUse: PDFFont = font,
    color: ReturnType<typeof rgb> = unimarTextDark
  ): number => {
    currentPage.drawText(text, {
      // <-- Usar currentPage
      x: margin + xOffset,
      y: currentY,
      font: fontToUse,
      size: size,
      color: color,
      lineHeight: size * 1.2,
    });
    return size * 1.2;
  };

  // --- Título ---
  y -= draw(
    "Reporte de Análisis de Línea de Espera",
    0,
    y,
    fontSizeTitle,
    page,
    fontBold,
    unimarPrimary
  ); // <-- Pasar 'page'
  y -= 15;

  // --- Parámetros Usados ---
  y -= draw(
    "Parámetros de Entrada",
    0,
    y,
    fontSizeHeader,
    page,
    fontBold,
    unimarSecondary
  ); // <-- Pasar 'page'
  y -= 5;
  const paramX = 10;
  const valueX = 180;
  y -= draw("Modelo:", paramX, y, fontSizeBody, page, fontBold); // <-- Pasar 'page'
  draw(
    `${results.modelType === "finite" ? `M/M/1/${results.params.N}` : "M/M/1"}`,
    valueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  ); // <-- Pasar 'page'
  y -= fontSizeBody * 1.2 + 3;

  y -= draw(
    "Tasa de Llegada (Lambda):",
    paramX,
    y,
    fontSizeBody,
    page,
    fontBold
  ); // <-- Pasar 'page'
  draw(
    `${results.params.lambda} (clientes/ud. tiempo)`,
    valueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  ); // <-- Pasar 'page'
  y -= fontSizeBody * 1.2 + 3;

  y -= draw("Tasa de Servicio (Mu):", paramX, y, fontSizeBody, page, fontBold); // <-- Pasar 'page'
  draw(
    `${results.params.mu} (clientes/ud. tiempo)`,
    valueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  ); // <-- Pasar 'page'
  y -= fontSizeBody * 1.2 + 3;

  if (results.modelType === "finite" && results.params.N) {
    y -= draw(
      "Capacidad Sistema (N):",
      paramX,
      y,
      fontSizeBody,
      page,
      fontBold
    ); // <-- Pasar 'page'
    draw(
      `${results.params.N}`,
      valueX,
      y + fontSizeBody * 1.2,
      fontSizeBody,
      page
    ); // <-- Pasar 'page'
    y -= fontSizeBody * 1.2 + 3;
  }
  y -= 15;

  // --- Métricas Calculadas ---
  y -= draw(
    "Métricas de Desempeño",
    0,
    y,
    fontSizeHeader,
    page,
    fontBold,
    unimarSecondary
  ); // <-- Pasar 'page'
  y -= 5;
  const metricX = 10;
  const metricValueX = 250;

  y -= draw(
    "Factor de Utilización (Rho):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  ); // <-- Pasar 'page'
  draw(
    formatNum(results.rho),
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  ); // <-- Pasar 'page'
  y -= fontSizeBody * 1.2 + 3;

  y -= draw(
    "Probabilidad Sistema Vacío (P0):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  ); // <-- Pasar 'page'
  draw(
    formatNum(results.p0, 5),
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  ); // <-- Pasar 'page'
  y -= fontSizeBody * 1.2 + 3;

  y -= draw(
    "Clientes Promedio en Sistema (Ls):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  ); // <-- Pasar 'page'
  draw(
    `${formatNum(results.ls)} clientes`,
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  ); // <-- Pasar 'page'
  y -= fontSizeBody * 1.2 + 3;

  y -= draw(
    "Clientes Promedio en Cola (Lq):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  ); // <-- Pasar 'page'
  draw(
    `${formatNum(results.lq)} clientes`,
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  ); // <-- Pasar 'page'
  y -= fontSizeBody * 1.2 + 3;

  y -= draw(
    "Tiempo Promedio en Sistema (Ws):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  ); // <-- Pasar 'page'
  draw(
    `${formatNum(results.ws)} uds. de tiempo`,
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  ); // <-- Pasar 'page'
  y -= fontSizeBody * 1.2 + 3;

  y -= draw(
    "Tiempo Promedio en Cola (Wq):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  ); // <-- Pasar 'page'
  draw(
    `${formatNum(results.wq)} uds. de tiempo`,
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  ); // <-- Pasar 'page'
  y -= fontSizeBody * 1.2 + 3;

  if (results.lambdaEff !== undefined) {
    y -= draw(
      "Tasa Efectiva de Llegada (Lambda_eff):",
      metricX,
      y,
      fontSizeBody,
      page,
      fontBold
    ); // <-- Pasar 'page'
    draw(
      `${formatNum(results.lambdaEff)} clientes/ud. tiempo`,
      metricValueX,
      y + fontSizeBody * 1.2,
      fontSizeBody,
      page
    ); // <-- Pasar 'page'
    y -= fontSizeBody * 1.2 + 3;
  }
  y -= 15;

  // --- Tabla de Probabilidades ---
  y -= draw(
    "Distribución de Probabilidad P(n)",
    0,
    y,
    fontSizeHeader,
    page,
    fontBold,
    unimarSecondary
  ); // <-- Pasar 'page'
  y -= 8;

  const tableTopY = y;
  const col1X = margin;
  const col2X = margin + 60;
  const col3X = margin + 180;
  const tableHeaderSize = fontSizeBody;
  const tableRowSize = fontSizeSmall;
  const rowHeight = tableRowSize * 1.4;
  const tableBottomMargin = margin + 30;

  // Dibujar encabezados una vez
  draw("n", col1X - margin, y, tableHeaderSize, page, fontBold); // <-- Pasar 'page'
  draw("P(n)", col2X - margin, y, tableHeaderSize, page, fontBold); // <-- Pasar 'page'
  y -= draw("P(acumulada)", col3X - margin, y, tableHeaderSize, page, fontBold); // <-- Pasar 'page'
  y -= 4;

  page.drawLine({
    // <-- Dibujar línea en la 'page' actual
    start: { x: margin, y: y },
    end: { x: width - margin, y: y },
    thickness: 1,
    color: unimarSecondary,
  });
  y -= 6;

  // Dibujar filas de la tabla
  results.probabilities.forEach((prob, index) => {
    // --- CORRECCIÓN PAGINACIÓN ---
    if (y < tableBottomMargin) {
      page = pdfDoc.addPage(PageSizes.A4); // Reasignar la variable 'page' externa
      y = height - margin; // Reasignar la variable 'y' externa
      // Opcional: Redibujar encabezados en la nueva página
      draw("n", col1X - margin, y, tableHeaderSize, page, fontBold);
      draw("P(n)", col2X - margin, y, tableHeaderSize, page, fontBold);
      y -= draw(
        "P(acumulada)",
        col3X - margin,
        y,
        tableHeaderSize,
        page,
        fontBold
      );
      y -= 4;
      page.drawLine({
        start: { x: margin, y: y },
        end: { x: width - margin, y: y },
        thickness: 1,
        color: unimarSecondary,
      });
      y -= 6;
    }

    const currentLineY = y;
    const bgColor = index % 2 === 0 ? grayLight : rgb(1, 1, 1); // Fondo alternado suave

    // Dibujar fondo de fila (opcional)
    page.drawRectangle({
      x: margin,
      y: y - rowHeight + 2, // Ajustar posición Y para el rectángulo
      width: contentWidth,
      height: rowHeight,
      color: bgColor,
      opacity: 0.3,
    });

    draw(`${prob.n}`, col1X - margin, currentLineY, tableRowSize, page);
    draw(
      formatNum(prob.pn, 5),
      col2X - margin,
      currentLineY,
      tableRowSize,
      page
    );
    draw(
      formatNum(prob.cumulativePn, 5),
      col3X - margin,
      currentLineY,
      tableRowSize,
      page
    );
    y -= rowHeight;
  });

  // --- Serializar ---
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Helper para descargar el archivo
export function downloadPdf(
  bytes: Uint8Array,
  filename: string = "reporte-colas.pdf"
) {
  // Alternative: Create a new ArrayBuffer from the Uint8Array's buffer slice
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
