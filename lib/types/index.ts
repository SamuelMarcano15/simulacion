// lib/types/index.ts

/**
 * Parámetros de entrada para los modelos de colas.
 */
export interface QueueModelParams {
  lambda: number; // Tasa media de llegada (λ)
  mu: number;     // Tasa media de servicio (μ) por servidor
  c?: number;    // --- NUEVO: Número de servidores (c) ---
  N?: number;    // Capacidad máxima del sistema (cola + servicio).
}

/**
 * Resultados calculados para los modelos de colas.
 */
export interface QueueModelResults {
  rho: number;         // Factor de utilización del servidor (ρ = λ / (c*μ))
  p0: number;          // Probabilidad de que el sistema esté vacío (P₀)
  ls: number;          // Número promedio de clientes en el sistema (Ls)
  lq: number;          // Número promedio de clientes en la cola (Lq)
  ws: number;          // Tiempo promedio de un cliente en el sistema (Ws)
  wq: number;          // Tiempo promedio de un cliente en la cola (Wq)
  cBarra?: number;     // --- NUEVO: Número promedio de servidores inactivos (c̄) ---
  lambdaEff?: number;  // Tasa efectiva de llegada (λ_ef)
  lambdaPerdida?: number; // Clientes perdidos por unidad de tiempo
  probabilities: ProbabilityDistribution[]; // Distribución de probabilidad Pn
  modelType: 'MM1' | 'MM1N' | 'MMc' | 'MMcN'; // --- MODIFICADO: 4 Tipos de modelo ---
  params: QueueModelParams; // Guarda los parámetros usados para el cálculo
}

/**
 * Representa una fila en la tabla de distribución de probabilidad.
 */
export interface ProbabilityDistribution {
  n: number;           // Número de clientes en el sistema (n)
  pn: number;          // Probabilidad absoluta P(n)
  cumulativePn: number;// Probabilidad acumulada Σ P(i) desde i=0 hasta n
}

/**
 * Objeto para representar errores durante el cálculo.
 */
export type CalculationError = {
  message: string;
};