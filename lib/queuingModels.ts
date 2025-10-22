// lib/queuingModels.ts

// Correct the import path if your alias '@' doesn't point correctly.
// If 'types' is directly inside 'lib', use './types'.
import { QueueModelParams, QueueModelResults, CalculationError, ProbabilityDistribution } from '@/lib/types/index';

/**
 * Calcula las métricas para un modelo de cola M/M/1 con capacidad infinita.
 * Referencias: PDF "Tema 3", secciones 15.5.1
 * @param lambda Tasa media de llegada (λ)
 * @param mu Tasa media de servicio (μ)
 * @returns Un objeto QueueModelResults o un CalculationError.
 */
export function calculateMM1Infinite(lambda: number, mu: number): QueueModelResults | CalculationError {
  // --- Validaciones ---
  if (lambda <= 0 || mu <= 0) {
    return { message: 'Las tasas de llegada (λ) y servicio (μ) deben ser positivas.' };
  }
  if (lambda >= mu) {
    // Error TS(2353) fixed: Removed 'cite' property
    return {
      message: 'El sistema es inestable (λ ≥ μ). La tasa de llegada debe ser menor que la tasa de servicio para colas infinitas.'
    };
  }

  // --- Cálculos ---
  const rho = lambda / mu; // Factor de utilización
  const p0 = 1 - rho;      // Probabilidad de sistema vacío
  const ls = rho / (1 - rho); // Clientes promedio en el sistema
  const lq = (rho * rho) / (1 - rho); // Clientes promedio en la cola
  const ws = ls / lambda;     // Tiempo promedio en el sistema
  const wq = lq / lambda;     // Tiempo promedio en la cola

  // --- Distribución de Probabilidad Pn ---
  const probabilities: ProbabilityDistribution[] = [];
  let cumulativeP = 0;
  let n = 0;
  let pn = p0;

  while (pn > 0.000001 && n < 100) { // Limit iterations for safety
    cumulativeP += pn;
    // Cap cumulative probability at 1.0
    const currentCumulative = Math.min(cumulativeP, 1.0);
    probabilities.push({
      n: n,
      pn: pn,
      cumulativePn: currentCumulative,
    });
    n++;
    pn = p0 * Math.pow(rho, n); // Pn = (1 - ρ) * ρ^n
  }
   // Ensure the very last entry shows 1.0 cumulative probability if loop ended early
  if (probabilities.length > 0 && probabilities[probabilities.length - 1].cumulativePn < 1.0 && n === 100) {
       probabilities[probabilities.length - 1].cumulativePn = 1.0;
  } else if (probabilities.length > 0 && n < 100) {
       // If loop finished naturally because pn got small, ensure last entry is 1.0
       probabilities[probabilities.length - 1].cumulativePn = 1.0;
  }


  const results: QueueModelResults = {
    rho,
    p0,
    ls,
    lq,
    ws,
    wq,
    lambdaPerdida: 0,
    probabilities,
    modelType: 'infinite',
    params: { lambda, mu }
  };

  return results;
}

/**
 * Calcula las métricas para un modelo de cola M/M/1/N con capacidad finita N.
 * Referencias: PDF "Tema 3", secciones 15.5.2
 * @param lambda Tasa media de llegada (λ)
 * @param mu Tasa media de servicio (μ)
 * @param N Capacidad máxima del sistema (cola + servicio)
 * @returns Un objeto QueueModelResults o un CalculationError.
 */
// Fixed: Removed 'default' export for consistency
export function calculateMM1Finite(lambda: number, mu: number, N: number): QueueModelResults | CalculationError {
  // --- Validaciones ---
  if (lambda <= 0 || mu <= 0) {
    return { message: 'Las tasas de llegada (λ) y servicio (μ) deben ser positivas.' };
  }
  if (N < 1 || !Number.isInteger(N)) {
      return { message: 'La capacidad del sistema (N) debe ser un entero positivo mayor o igual a 1.' };
  }

  // --- Cálculos ---
  const rho = lambda / mu;
  let p0: number;

  // Calcular P₀
  if (rho === 1) {
    p0 = 1 / (N + 1);
  } else {
    p0 = (1 - rho) / (1 - Math.pow(rho, N + 1));
  }

  // --- Distribución de Probabilidad Pn ---
  const probabilities: ProbabilityDistribution[] = [];
  let cumulativeP = 0;
  let pn_N = 0; // Guardar P(N) para calcular lambdaEff
  for (let n = 0; n <= N; n++) {
    let pn: number;
    if (rho === 1) {
      pn = 1 / (N + 1);
    } else {
      // Use p0 calculated earlier for consistency and potentially better precision
      pn = p0 * Math.pow(rho, n);
    }
    cumulativeP += pn;
    // Corregir posible error de redondeo en la última probabilidad acumulada
    const currentCumulative = (n === N) ? 1.0 : cumulativeP;
    probabilities.push({
      n: n,
      pn: pn,
      cumulativePn: currentCumulative,
    });
    if (n === N) {
      pn_N = pn;
    }
  }

  // --- Métricas de Desempeño ---
  let ls: number; // Clientes promedio en el sistema
  if (rho === 1) {
    ls = N / 2;
  } else {
    ls = (rho * (1 - (N + 1) * Math.pow(rho, N) + N * Math.pow(rho, N + 1))) / ((1 - rho) * (1 - Math.pow(rho, N + 1)));
  }

  const lambdaEff = lambda * (1 - pn_N); // Tasa efectiva de llegada
  // Ensure Lq is not negative due to floating point inaccuracies, especially when lambdaEff is very close to lambda
  const lq_raw = ls - (lambdaEff / mu);
  const lq = lq_raw < 0 ? 0 : lq_raw; // Clientes promedio en la cola shouldn't be negative

  const lambdaPerdida = lambda - lambdaEff;

   // Manejo de división por cero si lambdaEff es 0 (ocurre si lambda es 0)
   const safe_ws = lambdaEff === 0 ? 0 : ls / lambdaEff; // Tiempo promedio en el sistema
   const safe_wq = lambdaEff === 0 ? 0 : lq / lambdaEff; // Tiempo promedio en la cola


  const results: QueueModelResults = {
    rho,
    p0,
    ls,
    lq,
    ws: safe_ws,
    wq: safe_wq,
    lambdaEff,
    lambdaPerdida,
    probabilities,
    modelType: 'finite',
    params: { lambda, mu, N }
  };

  return results;
}

// Error TS(1184) & TS(2366) fixed: Removed extra closing brace '}' that was here