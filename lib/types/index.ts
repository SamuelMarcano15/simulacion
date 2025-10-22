// lib/types/index.ts

/**
 * Parámetros de entrada para los modelos de colas M/M/1.
 */
export interface QueueModelParams {
  lambda: number; // Tasa media de llegada (λ) - clientes por unidad de tiempo
  mu: number;     // Tasa media de servicio (μ) - clientes por unidad de tiempo por servidor
  N?: number;    // Capacidad máxima del sistema (cola + servicio). Requerido para el modelo finito.
}

/**
 * Resultados calculados para los modelos de colas M/M/1.
 */
export interface QueueModelResults {
  rho: number;         // Factor de utilización del servidor (ρ = λ / μ) [cite: 167]
  p0: number;          // Probabilidad de que el sistema esté vacío (P₀) [cite: 147, 193]
  ls: number;          // Número promedio de clientes en el sistema (Ls) [cite: 157, 203]
  lq: number;          // Número promedio de clientes en la cola (Lq) [cite: 160, 214]
  ws: number;          // Tiempo promedio de un cliente en el sistema (Ws) [cite: 160, 214]
  wq: number;          // Tiempo promedio de un cliente en la cola (Wq) [cite: 160, 214]
  lambdaEff?: number;  // Tasa efectiva de llegada (λ_ef), solo para modelo finito [cite: 210]
  lambdaPerdida?: number;
  probabilities: ProbabilityDistribution[]; // Distribución de probabilidad Pn [cite: 14, 150, 195]
  modelType: 'infinite' | 'finite'; // Para identificar el modelo calculado
  params: QueueModelParams; // Guarda los parámetros usados para el cálculo
}

/**
 * Representa una fila en la tabla de distribución de probabilidad.
 */
export interface ProbabilityDistribution {
  n: number;           // Número de clientes en el sistema (n)
  pn: number;          // Probabilidad absoluta P(n) [cite: 150, 195]
  cumulativePn: number;// Probabilidad acumulada Σ P(i) desde i=0 hasta n [cite: 178]
}

/**
 * Objeto para representar errores durante el cálculo.
 */
export type CalculationError = {
  message: string;
};