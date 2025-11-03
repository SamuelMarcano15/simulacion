// lib/pdfGenerator.ts
import {
  PDFDocument,
  rgb,
  StandardFonts,
  PDFFont,
  PageSizes,
  PDFPage,
} from "pdf-lib";
import { QueueModelResults } from "@/lib/types";

// Helper para formatear números en el PDF
const formatNum = (num?: number, decimals = 4): string => {
  if (num === undefined || num === null || isNaN(num)) return "-";
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

// Helper para título del modelo
const getModelTitle = (results: QueueModelResults): string => {
  const { c, N } = results.params;
  switch (results.modelType) {
    case "MM1":
      return "M/M/1 (Cola Infinita)";
    case "MM1N":
      return `M/M/1/${N} (Cola Finita)`;
    case "MMc":
      return `M/M/${c} (Cola Infinita)`;
    case "MMcN":
      return `M/M/${c}/${N} (Cola Finita)`;
    default:
      return "Resultados del Modelo";
  }
};

// --- Función Principal ---
export async function generatePdfReport(
  results: QueueModelResults
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
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

  const draw = (
    text: string,
    xOffset: number,
    currentY: number,
    size: number,
    currentPage: PDFPage,
    fontToUse: PDFFont = font,
    color: ReturnType<typeof rgb> = unimarTextDark
  ): number => {
    currentPage.drawText(text, {
      x: margin + xOffset,
      y: currentY,
      font: fontToUse,
      size: size,
      color: color,
      lineHeight: size * 1.2,
    });
    return size * 1.2;
  };

  // Objeto de Interpretaciones
  const interpretations = {
    rho: `Significa que, en promedio, cada servidor está ocupado el ${formatNum(
      (results.rho ?? 0) * 100,
      2
    )}% del tiempo.`,
    p0: `Hay un ${formatNum(
      (results.p0 ?? 0) * 100,
      2
    )}% de probabilidad de que el sistema esté completamente vacío (sin clientes).`,
    ls: `Indica que, en cualquier momento, se espera encontrar un promedio de ${formatNum(
      results.ls,
      4
    )} clientes en el sistema (esperando en cola + siendo atendidos).`,
    lq: `Indica que, en cualquier momento, se espera encontrar un promedio de ${formatNum(
      results.lq,
      4
    )} clientes esperando en la cola.`,
    ws: `Un cliente (desde que llega hasta que se va) pasa un promedio de ${formatNum(
      results.ws,
      4
    )} unidades de tiempo en el sistema.`,
    wq: `Un cliente pasa un promedio de ${formatNum(
      results.wq,
      4
    )} unidades de tiempo solo esperando en la cola.`,
    cBarra: `En promedio, ${formatNum(results.cBarra, 4)} de los ${
      results.params.c || 1
    } servidores están inactivos (libres).`,
    lambdaEff: `De los ${
      results.params.lambda
    } clientes que llegan por unidad de tiempo, solo ${formatNum(
      results.lambdaEff,
      4
    )} logran entrar al sistema.`,
    lambdaPerdida: `En promedio, ${formatNum(
      results.lambdaPerdida,
      4
    )} clientes por unidad de tiempo son rechazados porque el sistema está lleno (N=${
      results.params.N
    }).`,
  };

  // --- Título ---
  y -= draw(
    `Reporte de Análisis: ${getModelTitle(results)}`,
    0,
    y,
    fontSizeTitle,
    page,
    fontBold,
    unimarPrimary
  );
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
  );
  y -= 5;
  const paramX = 10;
  const valueX = 220;

  y -= draw(
    "Tasa de Llegada (Lambda):",
    paramX,
    y,
    fontSizeBody,
    page,
    fontBold
  );
  draw(
    `${results.params.lambda} (clientes/ud. tiempo)`,
    valueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  );
  y -= fontSizeBody * 1.2 + 3;

  y -= draw(
    "Tasa de Servicio (Mu por Servidor):",
    paramX,
    y,
    fontSizeBody,
    page,
    fontBold
  );
  draw(
    `${results.params.mu} (clientes/ud. tiempo)`,
    valueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  );
  y -= fontSizeBody * 1.2 + 3;

  if (results.params.c && results.params.c > 1) {
    y -= draw(
      "Número de Servidores (c):",
      paramX,
      y,
      fontSizeBody,
      page,
      fontBold
    );
    draw(
      `${results.params.c}`,
      valueX,
      y + fontSizeBody * 1.2,
      fontSizeBody,
      page
    );
    y -= fontSizeBody * 1.2 + 3;
  }
  if (results.params.N) {
    y -= draw(
      "Capacidad Sistema (N):",
      paramX,
      y,
      fontSizeBody,
      page,
      fontBold
    );
    draw(
      `${results.params.N}`,
      valueX,
      y + fontSizeBody * 1.2,
      fontSizeBody,
      page
    );
    y -= fontSizeBody * 1.2 + 3;
  }
  y -= 15;

  // --- Métricas Calculadas (CON INTERPRETACIONES) ---
  y -= draw(
    "Métricas de Desempeño",
    0,
    y,
    fontSizeHeader,
    page,
    fontBold,
    unimarSecondary
  );
  y -= 5;
  const metricX = 10;
  const metricValueX = 270;
  const interpretationX = 15;
  const metricSpacing = 3;
  const interpretationSpacing = 8;

  // Rho
  y -= draw(
    "Utilización por Servidor (Rho):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  );
  draw(
    formatNum(results.rho),
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  );
  y -= fontSizeBody * 1.2 + metricSpacing;
  y -= draw(
    interpretations.rho,
    interpretationX,
    y,
    fontSizeSmall,
    page,
    font,
    grayMedium
  );
  y -= interpretationSpacing;

  // P0
  y -= draw(
    "Probabilidad Sistema Vacío (P0):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  );
  draw(
    formatNum(results.p0, 5),
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  );
  y -= fontSizeBody * 1.2 + metricSpacing;
  y -= draw(
    interpretations.p0,
    interpretationX,
    y,
    fontSizeSmall,
    page,
    font,
    grayMedium
  );
  y -= interpretationSpacing;

  // Ls
  y -= draw(
    "Clientes Promedio en Sistema (Ls):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  );
  draw(
    `${formatNum(results.ls)} clientes`,
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  );
  y -= fontSizeBody * 1.2 + metricSpacing;
  y -= draw(
    interpretations.ls,
    interpretationX,
    y,
    fontSizeSmall,
    page,
    font,
    grayMedium
  );
  y -= interpretationSpacing;

  // Lq
  y -= draw(
    "Clientes Promedio en Cola (Lq):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  );
  draw(
    `${formatNum(results.lq)} clientes`,
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  );
  y -= fontSizeBody * 1.2 + metricSpacing;
  y -= draw(
    interpretations.lq,
    interpretationX,
    y,
    fontSizeSmall,
    page,
    font,
    grayMedium
  );
  y -= interpretationSpacing;

  // Ws
  y -= draw(
    "Tiempo Promedio en Sistema (Ws):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  );
  draw(
    `${formatNum(results.ws)} uds. de tiempo`,
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  );
  y -= fontSizeBody * 1.2 + metricSpacing;
  y -= draw(
    interpretations.ws,
    interpretationX,
    y,
    fontSizeSmall,
    page,
    font,
    grayMedium
  );
  y -= interpretationSpacing;

  // Wq
  y -= draw(
    "Tiempo Promedio en Cola (Wq):",
    metricX,
    y,
    fontSizeBody,
    page,
    fontBold
  );
  draw(
    `${formatNum(results.wq)} uds. de tiempo`,
    metricValueX,
    y + fontSizeBody * 1.2,
    fontSizeBody,
    page
  );
  y -= fontSizeBody * 1.2 + metricSpacing;
  y -= draw(
    interpretations.wq,
    interpretationX,
    y,
    fontSizeSmall,
    page,
    font,
    grayMedium
  );
  y -= interpretationSpacing;

  // --- MODIFICACIÓN: cBarra (Servidores Inactivos) ---
  if (results.cBarra !== undefined) {
    // Reemplazar 'c̄' por 'c-barra'
    y -= draw(
      "Servidores Inactivos Promedio (c-barra):",
      metricX,
      y,
      fontSizeBody,
      page,
      fontBold
    );
    draw(
      `${formatNum(results.cBarra, 4)} servidores`,
      metricValueX,
      y + fontSizeBody * 1.2,
      fontSizeBody,
      page
    );
    y -= fontSizeBody * 1.2 + metricSpacing;
    y -= draw(
      interpretations.cBarra,
      interpretationX,
      y,
      fontSizeSmall,
      page,
      font,
      grayMedium
    );
    y -= interpretationSpacing;
  }
  // --- FIN MODIFICACIÓN ---

  // Métricas Finitas
  if (results.modelType === "MM1N" || results.modelType === "MMcN") {
    // LambdaEff
    y -= draw(
      "Tasa Efectiva de Llegada (Lambda_eff):",
      metricX,
      y,
      fontSizeBody,
      page,
      fontBold
    );
    draw(
      `${formatNum(results.lambdaEff)} clientes/ud. tiempo`,
      metricValueX,
      y + fontSizeBody * 1.2,
      fontSizeBody,
      page
    );
    y -= fontSizeBody * 1.2 + metricSpacing;
    y -= draw(
      interpretations.lambdaEff,
      interpretationX,
      y,
      fontSizeSmall,
      page,
      font,
      grayMedium
    );
    y -= interpretationSpacing;

    // LambdaPerdida
    y -= draw(
      "Tasa de Llegada Perdida (Lambda_p):",
      metricX,
      y,
      fontSizeBody,
      page,
      fontBold
    );
    draw(
      `${formatNum(results.lambdaPerdida)} clientes/ud. tiempo`,
      metricValueX,
      y + fontSizeBody * 1.2,
      fontSizeBody,
      page
    );
    y -= fontSizeBody * 1.2 + metricSpacing;
    y -= draw(
      interpretations.lambdaPerdida,
      interpretationX,
      y,
      fontSizeSmall,
      page,
      font,
      grayMedium
    );
    y -= interpretationSpacing;
  }
  y -= 15;

  // --- Tabla de Probabilidades (Lógica de paginación sin cambios) ---
  y -= draw(
    "Distribución de Probabilidad P(n)",
    0,
    y,
    fontSizeHeader,
    page,
    fontBold,
    unimarSecondary
  );
  y -= 8;

  // --- INICIO DE CAMBIOS ---

  // 1. Definir offsets de columna (relativos al margen) para mejor espaciado
  const col1_offset = 10;
  const col2_offset = 120;
  const col3_offset = 240;

  // 2. Aumentar tamaño de fuente y altura de fila
  const tableHeaderSize = fontSizeBody; // 10pt
  const tableRowSize = fontSizeBody; // 10pt (era fontSizeSmall)
  const rowHeight = tableRowSize * 1.8; // Más alto (era 1.4)
  const tableBottomMargin = margin + 30;

  // --- Función auxiliar para dibujar el encabezado (para reutilizar en paginación) ---
  const drawTableHeader = (currentPage: PDFPage, currentY: number): number => {
    const headerBaselineY = currentY;
    const headerHeight = rowHeight * 1.1; // Encabezado un poco más alto
    const headerBottomY = headerBaselineY - tableHeaderSize - 4;

    // 3. Dibujar fondo sólido para el encabezado
    currentPage.drawRectangle({
      x: margin,
      y: headerBottomY,
      width: contentWidth,
      height: headerHeight,
      color: unimarSecondary,
    });

    // 4. Dibujar texto del encabezado (blanco)
    const headerTextColor = rgb(1, 1, 1);

    // --- CAMBIO AQUÍ ---
    // El texto estaba 4.1 puntos por encima del centro.
    // Lo bajamos 4 puntos para centrarlo.
    const ajuste_vertical = 4;

    draw(
      "n",
      col1_offset,
      headerBaselineY - ajuste_vertical, // Aplicar ajuste
      tableHeaderSize,
      currentPage,
      fontBold,
      headerTextColor
    );
    draw(
      "P(n)",
      col2_offset,
      headerBaselineY - ajuste_vertical, // Aplicar ajuste
      tableHeaderSize,
      currentPage,
      fontBold,
      headerTextColor
    );
    draw(
      "P(acumulada)",
      col3_offset,
      headerBaselineY - ajuste_vertical, // Aplicar ajuste
      tableHeaderSize,
      currentPage,
      fontBold,
      headerTextColor
    );

    return headerBaselineY - headerBottomY + 8; // Retornar el espacio total ocupado
  }; // Dibujar el primer encabezado
  y -= drawTableHeader(page, y);
  // --- Dibujar Filas de la Tabla ---
  results.probabilities.forEach((prob, index) => {
    // Lógica de paginación (ahora usa la función auxiliar)
    if (y < tableBottomMargin) {
      page = pdfDoc.addPage(PageSizes.A4);
      y = height - margin;
      y -= drawTableHeader(page, y);
    }

    // 5. Calcular centrado vertical del texto

    // --- CAMBIO AQUÍ ---
    // El cálculo original (y - 4) estaba 3 puntos por encima del centro.
    // Restamos 3 para que coincida con el centro (y - 7).
    const textBaselineY = y - (rowHeight - tableRowSize) / 2 - 3; // Ajustado

    // 6. Dibujar rectángulo de fondo (sin opacidad)
    const bgColor = index % 2 === 0 ? grayLight : rgb(1, 1, 1);
    page.drawRectangle({
      x: margin,
      y: y - rowHeight + tableRowSize * 0.2, // Ajuste ligero para la base de la fila
      width: contentWidth,
      height: rowHeight,
      color: bgColor,
      // Se quitó opacity: 0.3
    });

    // Dibujar texto de la fila (centrado)
    draw(`${prob.n}`, col1_offset, textBaselineY, tableRowSize, page);
    draw(formatNum(prob.pn, 5), col2_offset, textBaselineY, tableRowSize, page);
    draw(
      formatNum(prob.cumulativePn, 5),
      col3_offset,
      textBaselineY,
      tableRowSize,
      page
    );

    y -= rowHeight; // Moverse a la siguiente fila
  });

  // --- FIN DE CAMBIOS ---

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// --- downloadPdf (sin cambios) ---
export function downloadPdf(
  bytes: Uint8Array,
  filename: string = "reporte-colas.pdf"
) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
