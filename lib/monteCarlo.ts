// lib/monteCarlo.ts
import { MonteCarloParams, MonteCarloResults, SimulationRow, MonteCarloStats } from "@/lib/types";

/**
 * Genera una variable aleatoria con distribución Exponencial.
 * Método: Transformada Inversa.
 * Fórmula: X = -ln(1 - U) / λ
 */
function generateExponential(lambda: number): { value: number; u: number } {
  const u = Math.random();
  // Evitamos ln(0) si u es exactamente 1 (caso extremo)
  const safeU = u === 1 ? 0.99999999 : u; 
  const value = -Math.log(1 - safeU) / lambda;
  return { value, u: safeU };
}

/**
 * Genera una variable aleatoria con distribución Poisson.
 * Método: Algoritmo de productos (Knuth) para generar eventos discretos.
 */
function generatePoisson(lambda: number): { value: number; u: number } {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  // En Poisson se pueden consumir múltiples aleatorios para un solo valor.
  // Para propósitos educativos/tablas, reportamos el último U utilizado o el producto principal.
  // Aquí reportaremos el primer U para simplificar la visualización en tabla, 
  // aunque internamente se usen varios.
  let firstU = -1; 

  do {
    k++;
    const u = Math.random();
    if (firstU === -1) firstU = u;
    p = p * u;
  } while (p > L);

  return { value: k - 1, u: firstU };
}

export function runMonteCarloSimulation(params: MonteCarloParams): MonteCarloResults {
  const { distribution, lambda, nVariables, nObservations } = params;
  
  const data: SimulationRow[] = [];
  
  // Arrays para acumular sumas y calcular estadísticas posteriormente
  // Indices corresponden a cada variable (0 para Var 1, 1 para Var 2, etc.)
  const sums = new Array(nVariables).fill(0);
  const sqSums = new Array(nVariables).fill(0);
  const mins = new Array(nVariables).fill(Number.MAX_VALUE);
  const maxs = new Array(nVariables).fill(Number.MIN_VALUE);

  for (let i = 0; i < nObservations; i++) {
    const rowRandoms: number[] = [];
    const rowSimulated: number[] = [];

    for (let j = 0; j < nVariables; j++) {
      let result;
      if (distribution === 'EXPONENTIAL') {
        result = generateExponential(lambda);
      } else {
        result = generatePoisson(lambda);
      }

      rowRandoms.push(result.u);
      rowSimulated.push(result.value);

      // Actualizar acumuladores estadísticos
      const val = result.value;
      sums[j] += val;
      sqSums[j] += val * val;
      if (val < mins[j]) mins[j] = val;
      if (val > maxs[j]) maxs[j] = val;
    }

    data.push({
      observationIndex: i + 1,
      randomValues: rowRandoms,
      simulatedValues: rowSimulated
    });
  }

  // Calcular estadísticas finales
  const means = sums.map(s => s / nObservations);
  const stdDevs = sqSums.map((sq, idx) => {
    // Varianza = E[X^2] - (E[X])^2
    const variance = (sq / nObservations) - (means[idx] * means[idx]);
    return Math.sqrt(variance > 0 ? variance : 0);
  });

  return {
    params,
    data,
    statistics: {
      mean: means,
      stdDev: stdDevs,
      min: mins,
      max: maxs
    }
  };
}