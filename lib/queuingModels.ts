// lib/queuingModels.ts
import { QueueModelParams, QueueModelResults, CalculationError, ProbabilityDistribution } from '@/lib/types/index';

// --- FUNCIÓN HELPER ---
/**
 * Calcula el factorial de un número.
 * @param n Número entero no negativo.
 */
function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN; // Manejo de no enteros o negativos
  if (n === 0 || n === 1) return 1;
  
  // Usar un caché para factoriales grandes puede ser útil, pero para esto es suficiente
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
    if (result === Infinity) break; // Evitar overflow si 'n' es demasiado grande
  }
  return result;
}

// ---
// --- MODELO M/M/1 (INFINITO) ---
// ---
export function calculateMM1Infinite(lambda: number, mu: number): QueueModelResults | CalculationError {
  if (lambda <= 0 || mu <= 0) {
    return { message: 'Las tasas de llegada (λ) y servicio (μ) deben ser positivas.' };
  }
  if (lambda >= mu) {
    return {
      message: 'El sistema es inestable (λ ≥ μ). La tasa de llegada debe ser menor que la tasa de servicio.'
    };
  }

  const rho = lambda / mu; // ρ para M/M/1
  const p0 = 1 - rho;
  const ls = rho / (1 - rho);
  const lq = (rho * rho) / (1 - rho);
  const ws = ls / lambda;
  const wq = lq / lambda;
  const cBarra = 1 - rho; // Para c=1, c̄ = c - (λ/μ) = 1 - ρ

  const probabilities: ProbabilityDistribution[] = [];
  let cumulativeP = 0;
  let n = 0;
  let pn = p0;

  // Lógica de parada mejorada: continuar mientras pn sea significativo O no hayamos cubierto el promedio
  while ((pn > 1e-7 || n <= (ls + 5)) && n < 100) { 
    cumulativeP += pn;
    const currentCumulative = Math.min(cumulativeP, 1.0);
    probabilities.push({ n, pn, cumulativePn: currentCumulative });
    n++;
    pn = p0 * Math.pow(rho, n);
  }
  // Asegurar que la última probabilidad acumulada sea 1.0
  if (probabilities.length > 0 && probabilities[probabilities.length - 1].cumulativePn < 1.0) {
       probabilities[probabilities.length - 1].cumulativePn = 1.0;
  }

  const results: QueueModelResults = {
    rho: rho, // ρ = λ/μ
    p0, ls, lq, ws, wq,
    cBarra,
    lambdaPerdida: 0,
    probabilities,
    modelType: 'MM1',
    params: { lambda, mu, c: 1 }
  };
  return results;
}

// ---
// --- MODELO M/M/1/N (FINITO) ---
// ---
export function calculateMM1Finite(lambda: number, mu: number, N: number): QueueModelResults | CalculationError {
  if (lambda <= 0 || mu <= 0) {
    return { message: 'Las tasas de llegada (λ) y servicio (μ) deben ser positivas.' };
  }
  if (N < 1 || !Number.isInteger(N)) {
     return { message: 'La capacidad del sistema (N) debe ser un entero positivo mayor o igual a 1.' };
  }

  const rho = lambda / mu; // ρ = λ/μ
  let p0: number;

  if (rho === 1) {
    p0 = 1 / (N + 1);
  } else {
    p0 = (1 - rho) / (1 - Math.pow(rho, N + 1));
  }

  const probabilities: ProbabilityDistribution[] = [];
  let cumulativeP = 0;
  let pn_N = 0;
  let tempLs = 0; // Usado para calcular Ls mientras se itera

  for (let n = 0; n <= N; n++) {
    let pn: number;
    if (rho === 1) {
      pn = p0; // Es 1 / (N+1) para todos
    } else {
      pn = p0 * Math.pow(rho, n);
    }
    
    cumulativeP += pn;
    // Forzar el 1.0 exacto en el último elemento
    const currentCumulative = (n === N) ? 1.0 : cumulativeP;
    probabilities.push({ n, pn, cumulativePn: currentCumulative });
    
    if (n === N) pn_N = pn;
    tempLs += n * pn; // Ls = Σ(n * Pn)
  }
  
  const ls = tempLs;
  const lambdaEff = lambda * (1 - pn_N);
  const lambdaPerdida = lambda - lambdaEff;
  const cBarra = p0; // Para c=1, c̄ = (c-n)Pn = (1-0)P0 = P0
  
  // (Ls - Lq) = λ_eff / μ  => Lq = Ls - (λ_eff / μ)
  const lq_raw = ls - (lambdaEff / mu);
  const lq = lq_raw < 0 ? 0 : lq_raw; // Prevenir negativos por redondeo

  const safe_ws = lambdaEff === 0 ? 0 : ls / lambdaEff;
  const safe_wq = lambdaEff === 0 ? 0 : lq / lambdaEff;

  const results: QueueModelResults = {
    rho: rho, // ρ = λ/μ
    p0, ls, lq,
    ws: safe_ws, wq: safe_wq,
    cBarra,
    lambdaEff, lambdaPerdida,
    probabilities,
    modelType: 'MM1N',
    params: { lambda, mu, c: 1, N }
  };
  return results;
}

// ---
// --- NUEVO: MODELO M/M/c (INFINITO) ---
// ---
export function calculateMMcInfinite(lambda: number, mu: number, c: number): QueueModelResults | CalculationError {
  if (lambda <= 0 || mu <= 0 || c <= 0 || !Number.isInteger(c)) {
    return { message: 'λ, μ, y c deben ser números positivos, y c debe ser un entero.' };
  }
  
  const rho_util = lambda / (c * mu); // Factor de utilización (ρ) [cite: 348]
  if (rho_util >= 1) {
    return { message: 'El sistema es inestable (λ ≥ c*μ). Las llegadas superan la capacidad total de servicio.' };
  }
  
  const rho_intensidad = lambda / mu; // Intensidad de tráfico (ρ = λ/μ)
  let p0_sum_part1 = 0;
  for (let n = 0; n < c; n++) {
    p0_sum_part1 += Math.pow(rho_intensidad, n) / factorial(n); 
  }
  const p0_sum_part2 = (Math.pow(rho_intensidad, c) / factorial(c)) * (1 / (1 - rho_util)); 
  const p0 = 1 / (p0_sum_part1 + p0_sum_part2); 

  const lq = (p0 * Math.pow(rho_intensidad, c) * rho_util) / (factorial(c) * Math.pow(1 - rho_util, 2)); 
  const ls = lq + rho_intensidad; 
  const wq = lq / lambda; 
  const ws = wq + (1 / mu); 
  
  let cBarra_sum = 0;
  const probabilities: ProbabilityDistribution[] = [];
  let cumulativeP = 0;

  for (let n = 0; n < c; n++) {
    const pn = (Math.pow(rho_intensidad, n) / factorial(n)) * p0; 
    cumulativeP += pn;
    probabilities.push({ n, pn, cumulativePn: cumulativeP });
    cBarra_sum += (c - n) * pn; // c̄ = Σ(c-n)Pn de n=0 a c-1
  }
  
  const cBarra = cBarra_sum;

  // Continuar calculando probabilidades para n >= c
  for (let n = c; n < 100; n++) { // Límite de 100 iteraciones
    const pn = (Math.pow(rho_intensidad, n) / (factorial(c) * Math.pow(c, n - c))) * p0;
    cumulativeP += pn;
    const currentCumulative = Math.min(cumulativeP, 1.0);
    probabilities.push({ n, pn, cumulativePn: currentCumulative });
    
    if (pn < 1e-7 && n > ls + 5) break; // Detener si la prob. es muy baja Y hemos pasado Ls
  }
  if (probabilities.length > 0 && probabilities[probabilities.length - 1].cumulativePn < 1.0) {
       probabilities[probabilities.length - 1].cumulativePn = 1.0;
  }

  const results: QueueModelResults = {
    rho: rho_util, // ρ = λ/(c*μ)
    p0, ls, lq, ws, wq,
    cBarra,
    lambdaPerdida: 0,
    probabilities,
    modelType: 'MMc',
    params: { lambda, mu, c }
  };
  return results;
}

// ---
// --- NUEVO: MODELO M/M/c/N (FINITO) ---
// ---
export function calculateMMcFinite(lambda: number, mu: number, c: number, N: number): QueueModelResults | CalculationError {
  if (lambda <= 0 || mu <= 0 || c <= 0 || !Number.isInteger(c)) {
    return { message: 'λ, μ, y c deben ser números positivos, y c debe ser un entero.' };
  }
  if (N < c || !Number.isInteger(N)) {
    return { message: `N debe ser un entero y al menos tan grande como c (N ≥ ${c}).` };
  }

  const rho_intensidad = lambda / mu; // ρ = λ/μ
  const rho_util = rho_intensidad / c; // ρ/c

  let p0_sum_part1 = 0;
  for (let n = 0; n < c; n++) {
    p0_sum_part1 += Math.pow(rho_intensidad, n) / factorial(n); 
  }
  
  let p0_sum_part2 = 0;
 const p0_factor_part2 = Math.pow(rho_intensidad, c) / factorial(c); 
  if (rho_util === 1) {
    p0_sum_part2 = p0_factor_part2 * (N - c + 1); 
  } else {
    p0_sum_part2 = p0_factor_part2 * ( (1 - Math.pow(rho_util, N - c + 1)) / (1 - rho_util) ); 
  }
  const p0 = 1 / (p0_sum_part1 + p0_sum_part2); 

  const probabilities: ProbabilityDistribution[] = [];
  let cumulativeP = 0;
  let pn_N = 0;
  let tempLs = 0;
  let cBarra_sum = 0;

  for (let n = 0; n <= N; n++) {
    let pn: number;
    if (n < c) {
      pn = (Math.pow(rho_intensidad, n) / factorial(n)) * p0; 
    } else { // n >= c
      pn = (Math.pow(rho_intensidad, n) / (factorial(c) * Math.pow(c, n - c))) * p0;
    }
    
    cumulativeP += pn;
    const currentCumulative = (n === N) ? 1.0 : cumulativeP;
    probabilities.push({ n, pn, cumulativePn: currentCumulative });
    
    if (n === N) pn_N = pn;
    tempLs += n * pn; // Ls = Σ(n * Pn)
    
    if (n < c) { // La suma es de 0 a c-1
      cBarra_sum += (c - n) * pn; // c̄ = Σ(c-n)Pn [cite: 401, 402]
    }
  }
  
  const ls = tempLs;
  const cBarra = cBarra_sum; // c̄
  const lambdaEff = lambda * (1 - pn_N); 
  const lambdaPerdida = lambda - lambdaEff;
  
  const lq_raw = ls - (lambdaEff / mu); // Lq = Ls - (λ_eff / μ)
  const lq = lq_raw < 0 ? 0 : lq_raw;

  const safe_ws = lambdaEff === 0 ? 0 : ls / lambdaEff;
  const safe_wq = lambdaEff === 0 ? 0 : lq / lambdaEff;

  const results: QueueModelResults = {
    rho: rho_util, // ρ = λ/(c*μ)
    p0, ls, lq,
    ws: safe_ws, wq: safe_wq,
    cBarra,
    lambdaEff, lambdaPerdida,
    probabilities,
    modelType: 'MMcN',
    params: { lambda, mu, c, N }
  };
  return results; // <-- CORRECCIÓN: Asegurar que este return exista
}