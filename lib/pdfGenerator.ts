// lib/pdfGenerator.ts
import {
  PDFDocument,
  rgb,
  StandardFonts,
  PDFFont,
  PageSizes,
  PDFPage,
} from "pdf-lib";
import {
  QueueModelResults,
  MonteCarloResults,
  RestaurantState,
  RestaurantConfig,
} from "@/lib/types";

// --- Tipos Locales para el Reporte de Restaurante ---
export interface RestaurantReportData {
  state: RestaurantState;
  config: RestaurantConfig;
}

// --- Configuración de Estilos ---
const colors = {
  primary: rgb(0.043, 0.314, 0.549), // #0B508C
  secondary: rgb(0.235, 0.455, 0.651), // #3C74A6
  textDark: rgb(0.149, 0.149, 0.149), // #262626
  grayLight: rgb(0.9, 0.9, 0.9),
  grayMedium: rgb(0.5, 0.5, 0.5),
  white: rgb(1, 1, 1),
  red: rgb(0.8, 0.2, 0.2), // Para alertas (ej. clientes perdidos)
};

const layout = {
  margin: 50,
  fontSizeTitle: 20,
  fontSizeHeader: 14,
  fontSizeBody: 10,
  fontSizeSmall: 8,
};

// --- Helpers ---
const formatNum = (num?: number, decimals = 4): string => {
  if (num === undefined || num === null || isNaN(num)) return "-";
  if (Math.abs(num) < 1e-6 && num !== 0) {
    return num.toExponential(decimals > 0 ? decimals - 1 : 0);
  }
  return num.toFixed(decimals);
};

const drawText = (
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color = colors.textDark
) => {
  // Sanear texto
  const safeText = text
    .replace(/λ/g, "Lambda")
    .replace(/μ/g, "Mu")
    .replace(/ρ/g, "Rho")
    .replace(/σ/g, "Sigma")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=");

  page.drawText(safeText, { x, y, size, font, color });
  return size * 1.2;
};

// --- Type Guards ---
function isQueueResults(
  results: any
): results is QueueModelResults {
  return (results as QueueModelResults).modelType !== undefined;
}

function isRestaurantReport(
  results: any
): results is RestaurantReportData {
  return (
    (results as RestaurantReportData).state !== undefined &&
    (results as RestaurantReportData).config !== undefined
  );
}

// --- Función Principal ---
export async function generatePdfReport(
  results: QueueModelResults | MonteCarloResults | RestaurantReportData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage(PageSizes.A4);
  let { width, height } = page.getSize();
  let currentY = height - layout.margin;

  // --- Router de Reportes ---
  if (isQueueResults(results)) {
    await drawQueueReport(pdfDoc, page, results, font, fontBold, currentY);
  } else if (isRestaurantReport(results)) {
    await drawRestaurantReport(pdfDoc, page, results, font, fontBold, currentY);
  } else {
    // Asumimos MonteCarlo si no es los anteriores (por eliminación)
    await drawMonteCarloReport(
      pdfDoc,
      page,
      results as MonteCarloResults,
      font,
      fontBold,
      currentY
    );
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// ==========================================
// REPORTE: TEORÍA DE COLAS
// ==========================================
async function drawQueueReport(
  doc: PDFDocument,
  page: PDFPage,
  results: QueueModelResults,
  font: PDFFont,
  fontBold: PDFFont,
  startY: number
) {
  let y = startY;
  const { width } = page.getSize();
  const contentWidth = width - 2 * layout.margin;

  // Título
  const modelName = getQueueModelTitle(results);
  y -= drawText(
    page,
    `Reporte de Analisis: ${modelName}`,
    layout.margin,
    y,
    layout.fontSizeTitle,
    fontBold,
    colors.primary
  );
  y -= 20;

  // Parámetros
  y -= drawText(
    page,
    "Parametros de Entrada",
    layout.margin,
    y,
    layout.fontSizeHeader,
    fontBold,
    colors.secondary
  );
  y -= 10;

  const paramX = layout.margin + 10;
  const valueX = layout.margin + 220;

  const drawParam = (label: string, value: string) => {
    drawText(page, label, paramX, y, layout.fontSizeBody, fontBold);
    drawText(page, value, valueX, y, layout.fontSizeBody, font);
    y -= 15;
  };

  drawParam(
    "Tasa de Llegada (Lambda):",
    `${results.params.lambda} clientes/tiempo`
  );
  drawParam(
    "Tasa de Servicio (Mu):",
    `${results.params.mu} clientes/tiempo`
  );
  if (results.params.c && results.params.c > 1) {
    drawParam("Servidores (c):", `${results.params.c}`);
  }
  if (results.params.N) {
    drawParam("Capacidad (N):", `${results.params.N}`);
  }
  y -= 20;

  // Métricas
  y -= drawText(
    page,
    "Metricas de Desempeno",
    layout.margin,
    y,
    layout.fontSizeHeader,
    fontBold,
    colors.secondary
  );
  y -= 10;

  const drawMetric = (label: string, value: string, note?: string) => {
    drawText(page, label, paramX, y, layout.fontSizeBody, fontBold);
    drawText(page, value, valueX + 50, y, layout.fontSizeBody, font);
    y -= 15;
    if (note) {
      drawText(
        page,
        note,
        paramX + 5,
        y,
        layout.fontSizeSmall,
        font,
        colors.grayMedium
      );
      y -= 12;
    }
    y -= 5;
  };

  drawMetric(
    "Utilizacion (Rho):",
    `${formatNum(results.rho * 100, 2)}%`,
    "Porcentaje de ocupacion del sistema."
  );
  drawMetric(
    "Prob. Sistema Vacio (P0):",
    `${formatNum(results.p0 * 100, 2)}%`,
    "Probabilidad de encontrar 0 clientes."
  );
  drawMetric(
    "Clientes en Sistema (Ls):",
    `${formatNum(results.ls)}`,
    "Promedio de clientes (cola + servicio)."
  );
  drawMetric(
    "Clientes en Cola (Lq):",
    `${formatNum(results.lq)}`,
    "Promedio de clientes esperando."
  );
  drawMetric(
    "Tiempo en Sistema (Ws):",
    `${formatNum(results.ws)}`,
    "Tiempo total promedio de un cliente."
  );
  drawMetric(
    "Tiempo en Cola (Wq):",
    `${formatNum(results.wq)}`,
    "Tiempo de espera promedio."
  );

  y -= 20;

  // Tabla de Probabilidades
  y -= drawText(
    page,
    "Distribucion de Probabilidad P(n)",
    layout.margin,
    y,
    layout.fontSizeHeader,
    fontBold,
    colors.secondary
  );
  y -= 15;

  const col1 = layout.margin + 10;
  const col2 = layout.margin + 120;
  const col3 = layout.margin + 240;
  const rowH = 20;

  // Fondo Header
  page.drawRectangle({
    x: layout.margin,
    y: y - 5,
    width: contentWidth,
    height: rowH,
    color: colors.secondary,
  });

  drawText(page, "n", col1, y, layout.fontSizeBody, fontBold, colors.white);
  drawText(page, "P(n)", col2, y, layout.fontSizeBody, fontBold, colors.white);
  drawText(
    page,
    "P(acum)",
    col3,
    y,
    layout.fontSizeBody,
    fontBold,
    colors.white
  );
  y -= rowH;

  // Filas
  for (let i = 0; i < results.probabilities.length; i++) {
    const p = results.probabilities[i];
    if (y < layout.margin + rowH) {
      page = doc.addPage(PageSizes.A4);
      y = doc.getPage(doc.getPageCount() - 1).getSize().height - layout.margin;
    }

    if (i % 2 === 0) {
      page.drawRectangle({
        x: layout.margin,
        y: y - 5,
        width: contentWidth,
        height: rowH,
        color: colors.grayLight,
      });
    }

    drawText(page, `${p.n}`, col1, y, layout.fontSizeBody, font);
    drawText(page, formatNum(p.pn, 5), col2, y, layout.fontSizeBody, font);
    drawText(
      page,
      formatNum(p.cumulativePn, 5),
      col3,
      y,
      layout.fontSizeBody,
      font
    );
    y -= rowH;
  }
}

// ==========================================
// REPORTE: MONTECARLO
// ==========================================
async function drawMonteCarloReport(
  doc: PDFDocument,
  page: PDFPage,
  results: MonteCarloResults,
  font: PDFFont,
  fontBold: PDFFont,
  startY: number
) {
  let y = startY;
  const { width, height } = page.getSize();
  const contentWidth = width - 2 * layout.margin;

  // Título
  y -= drawText(
    page,
    `Simulacion Montecarlo: ${results.params.distribution}`,
    layout.margin,
    y,
    layout.fontSizeTitle,
    fontBold,
    colors.primary
  );
  y -= 20;

  // Parámetros
  y -= drawText(
    page,
    "Configuracion",
    layout.margin,
    y,
    layout.fontSizeHeader,
    fontBold,
    colors.secondary
  );
  y -= 10;

  const paramLabelX = layout.margin + 10;
  const paramValX = layout.margin + 150;

  drawText(page, "Distribucion:", paramLabelX, y, layout.fontSizeBody, fontBold);
  drawText(
    page,
    results.params.distribution,
    paramValX,
    y,
    layout.fontSizeBody,
    font
  );
  y -= 15;
  drawText(page, "Tasa (Lambda):", paramLabelX, y, layout.fontSizeBody, fontBold);
  drawText(
    page,
    `${results.params.lambda}`,
    paramValX,
    y,
    layout.fontSizeBody,
    font
  );
  y -= 15;
  drawText(page, "Variables:", paramLabelX, y, layout.fontSizeBody, fontBold);
  drawText(
    page,
    `${results.params.nVariables}`,
    paramValX,
    y,
    layout.fontSizeBody,
    font
  );
  y -= 15;
  drawText(
    page,
    "Observaciones:",
    paramLabelX,
    y,
    layout.fontSizeBody,
    fontBold
  );
  drawText(
    page,
    `${results.params.nObservations}`,
    paramValX,
    y,
    layout.fontSizeBody,
    font
  );
  y -= 25;

  // Estadísticas
  y -= drawText(
    page,
    "Estadisticas Generales",
    layout.margin,
    y,
    layout.fontSizeHeader,
    fontBold,
    colors.secondary
  );
  y -= 15;

  const statsHeaderH = 20;
  const statsRowH = 18;
  const colVar = layout.margin + 10;
  const colMean = layout.margin + 100;
  const colStd = layout.margin + 200;
  const colMin = layout.margin + 300;
  const colMax = layout.margin + 400;

  page.drawRectangle({
    x: layout.margin,
    y: y - 5,
    width: contentWidth,
    height: statsHeaderH,
    color: colors.secondary,
  });

  drawText(page, "Variable", colVar, y, layout.fontSizeBody, fontBold, colors.white);
  drawText(page, "Media", colMean, y, layout.fontSizeBody, fontBold, colors.white);
  drawText(page, "Desv. Est.", colStd, y, layout.fontSizeBody, fontBold, colors.white);
  drawText(page, "Min", colMin, y, layout.fontSizeBody, fontBold, colors.white);
  drawText(page, "Max", colMax, y, layout.fontSizeBody, fontBold, colors.white);
  y -= statsHeaderH;

  for (let i = 0; i < results.params.nVariables; i++) {
    if (i % 2 === 0) {
      page.drawRectangle({
        x: layout.margin,
        y: y - 5,
        width: contentWidth,
        height: statsRowH,
        color: colors.grayLight,
      });
    }
    drawText(page, `Var ${i + 1}`, colVar, y, layout.fontSizeBody, font);
    drawText(
      page,
      formatNum(results.statistics.mean[i]),
      colMean,
      y,
      layout.fontSizeBody,
      font
    );
    drawText(
      page,
      formatNum(results.statistics.stdDev[i]),
      colStd,
      y,
      layout.fontSizeBody,
      font
    );
    drawText(
      page,
      formatNum(results.statistics.min[i]),
      colMin,
      y,
      layout.fontSizeBody,
      font
    );
    drawText(
      page,
      formatNum(results.statistics.max[i]),
      colMax,
      y,
      layout.fontSizeBody,
      font
    );
    y -= statsRowH;
  }
  y -= 25;

  // Tabla de Datos
  const maxRows = 1000;
  const dataToShow = results.data.slice(0, maxRows);

  y -= drawText(
    page,
    `Detalle de Simulacion (Primeras ${dataToShow.length} obs.)`,
    layout.margin,
    y,
    layout.fontSizeHeader,
    fontBold,
    colors.secondary
  );
  y -= 15;

  const obsColWidth = 50;
  const remainingWidth = contentWidth - obsColWidth;
  const varColWidth = remainingWidth / results.params.nVariables;
  const fontSizeTable = results.params.nVariables > 5 ? 6 : 8;
  const rowHeight = fontSizeTable * 2.5;

  const drawDataHeader = (p: PDFPage, currentY: number) => {
    p.drawRectangle({
      x: layout.margin,
      y: currentY - 5,
      width: contentWidth,
      height: rowHeight,
      color: colors.secondary,
    });

    drawText(
      p,
      "Obs #",
      layout.margin + 5,
      currentY,
      fontSizeTable,
      fontBold,
      colors.white
    );

    for (let i = 0; i < results.params.nVariables; i++) {
      const x = layout.margin + obsColWidth + i * varColWidth;
      drawText(
        p,
        `Var ${i + 1} (R / V)`,
        x + 5,
        currentY,
        fontSizeTable,
        fontBold,
        colors.white
      );
    }
    return currentY - rowHeight;
  };

  y = drawDataHeader(page, y);

  for (let i = 0; i < dataToShow.length; i++) {
    const row = dataToShow[i];

    if (y < layout.margin + rowHeight) {
      page = doc.addPage(PageSizes.A4);
      y = height - layout.margin;
      y = drawDataHeader(page, y);
    }

    if (i % 2 === 0) {
      page.drawRectangle({
        x: layout.margin,
        y: y - 5,
        width: contentWidth,
        height: rowHeight,
        color: colors.grayLight,
      });
    }

    drawText(
      page,
      `${row.observationIndex}`,
      layout.margin + 5,
      y,
      fontSizeTable,
      font
    );

    for (let j = 0; j < results.params.nVariables; j++) {
      const x = layout.margin + obsColWidth + j * varColWidth;
      const text = `R:${formatNum(row.randomValues[j], 3)} / V:${formatNum(
        row.simulatedValues[j],
        2
      )}`;
      drawText(page, text, x + 5, y, fontSizeTable, font);
    }

    y -= rowHeight;
  }
}

// ==========================================
// REPORTE: RESTAURANTE (PROYECTO FINAL)
// ==========================================
async function drawRestaurantReport(
  doc: PDFDocument,
  page: PDFPage,
  data: RestaurantReportData,
  font: PDFFont,
  fontBold: PDFFont,
  startY: number
) {
  let y = startY;
  const { state, config } = data;
  const { stats } = state;

  // 1. Título
  y -= drawText(
    page,
    "Reporte: Simulacion de Restaurante (Drone View)",
    layout.margin,
    y,
    layout.fontSizeTitle,
    fontBold,
    colors.primary
  );
  y -= 20;

  // 2. Configuración
  y -= drawText(
    page,
    "Parametros de la Simulacion",
    layout.margin,
    y,
    layout.fontSizeHeader,
    fontBold,
    colors.secondary
  );
  y -= 15;

  const paramLabelX = layout.margin + 10;
  const paramValX = layout.margin + 200;

  const drawRow = (label: string, value: string) => {
    drawText(page, label, paramLabelX, y, layout.fontSizeBody, fontBold);
    drawText(page, value, paramValX, y, layout.fontSizeBody, font);
    y -= 18;
  };

  drawRow("Mesas (Servidores):", `${config.tableCount}`);
  drawRow(
    "Limite de Cola (N):",
    config.queueLimit ? `${config.queueLimit}` : "Infinito"
  );
  drawRow(
    "Tasa de Llegada (Lambda):",
    `${config.arrivalLambda} clientes/hora`
  );
  drawRow("Tasa de Servicio (Mu):", `${config.serviceMu} clientes/hora`);
  drawRow("Tiempo Simulado Total:", `${state.currentTime.toFixed(2)} minutos`);
  y -= 25;

  // 3. Resultados Generales con Interpretación
  y -= drawText(
    page,
    "Metricas de Desempeno e Interpretacion",
    layout.margin,
    y,
    layout.fontSizeHeader,
    fontBold,
    colors.secondary
  );
  y -= 15;

  // Helper para métrica con interpretación
  const drawMetricWithInterpretation = (
    label: string,
    value: string,
    interpretation: string,
    valueColor = colors.textDark
  ) => {
    // Línea Principal
    drawText(page, label, paramLabelX, y, layout.fontSizeBody, fontBold);
    drawText(page, value, paramValX, y, layout.fontSizeBody, font, valueColor);
    y -= 12;
    // Línea de Interpretación (cursiva simulada o gris)
    drawText(
      page,
      `Interp: ${interpretation}`,
      paramLabelX + 10, // Pequeña indentación
      y,
      layout.fontSizeSmall,
      font, // Fuente normal
      colors.grayMedium
    );
    y -= 20; // Espacio extra entre bloques
  };

  drawMetricWithInterpretation(
    "Total Clientes Generados:",
    `${stats.totalCustomers}`,
    "Demanda total recibida durante el periodo simulado."
  );

  drawMetricWithInterpretation(
    "Clientes Atendidos:",
    `${stats.customersServed}`,
    "Flujo de salida real (Throughput) del sistema."
  );

  // Clientes Perdidos
  drawMetricWithInterpretation(
    "Clientes Perdidos:",
    `${stats.customersLost} (${formatNum(
      (stats.customersLost / (stats.totalCustomers || 1)) * 100,
      1
    )}%)`,
    "Demanda insatisfecha por falta de capacidad (Cola llena).",
    stats.customersLost > 0 ? colors.red : colors.textDark
  );

  drawMetricWithInterpretation(
    "Tiempo Prom. en Sistema:",
    `${formatNum(stats.avgSystemTime, 2)} min`,
    "Tiempo total del ciclo (Espera + Servicio) por cliente."
  );

  drawMetricWithInterpretation(
    "Tiempo Prom. en Cola:",
    `${formatNum(stats.avgWaitTime, 2)} min`,
    "Tiempo muerto promedio que espera un cliente antes de ser atendido."
  );

  drawMetricWithInterpretation(
    "Utilizacion Promedio:",
    `${formatNum(stats.utilization * 100, 2)}%`,
    "Porcentaje del tiempo que los servidores (mesas) estuvieron productivos."
  );

  drawMetricWithInterpretation(
    "Mesas Ocupadas Prom.:",
    `${formatNum(stats.activeTablesAvg, 2)}`,
    "Numero promedio de mesas con clientes en cualquier momento."
  );

  const idleServers = config.tableCount - stats.activeTablesAvg;
  drawMetricWithInterpretation(
    "Mesas Inactivas Prom.:",
    `${formatNum(idleServers, 2)}`,
    "Capacidad ociosa promedio del restaurante."
  );

  y -= 10;

  // 4. Nota Final
  drawText(
    page,
    "Nota: Datos generados mediante simulacion estocastica de eventos discretos.",
    layout.margin,
    y,
    layout.fontSizeSmall,
    font,
    colors.grayMedium
  );
}

// --- Utilidades ---
function getQueueModelTitle(results: QueueModelResults): string {
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
      return "Resultados";
  }
}

export function downloadPdf(
  bytes: Uint8Array,
  filename: string = "reporte.pdf"
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