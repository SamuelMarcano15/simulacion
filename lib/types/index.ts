// lib/types/index.ts

// --- TIPOS EXISTENTES (COLAS) ---
export interface QueueModelParams {
  lambda: number;
  mu: number;
  c?: number;
  N?: number;
}

export interface QueueModelResults {
  rho: number;
  p0: number;
  ls: number;
  lq: number;
  ws: number;
  wq: number;
  c_idle?: number;
  c_busy?: number;
  lambdaEff?: number;
  lambdaPerdida?: number;
  probabilities: ProbabilityDistribution[];
  modelType: 'MM1' | 'MM1N' | 'MMc' | 'MMcN';
  params: QueueModelParams;
}

export interface ProbabilityDistribution {
  n: number;
  pn: number;
  cumulativePn: number;
}

export type CalculationError = {
  message: string;
};

// --- TIPOS EXISTENTES (MONTECARLO) ---
export type DistributionType = 'POISSON' | 'EXPONENTIAL';

export interface MonteCarloParams {
  distribution: DistributionType;
  lambda: number;
  nVariables: number;
  nObservations: number;
}

export interface SimulationRow {
  observationIndex: number;
  randomValues: number[];
  simulatedValues: number[];
}

export interface MonteCarloStats {
  mean: number[];
  stdDev: number[];
  min: number[];
  max: number[];
}

export interface MonteCarloResults {
  params: MonteCarloParams;
  data: SimulationRow[];
  statistics: MonteCarloStats;
}

// --- NUEVOS TIPOS: SIMULADOR DE RESTAURANTE (PROYECTO FINAL) ---

export interface RestaurantConfig {
  tableCount: number;      // Cantidad de mesas (4-20)
  queueLimit?: number;     // Límite de cola (opcional, null = infinito)
  arrivalLambda: number;   // Tasa de llegada (Clientes/hora)
  serviceMu: number;       // Tasa de servicio (Clientes/hora por mesa)
  simulationSpeed: number; // Multiplicador de velocidad (x1, x2, x5...)
}

export type TableStatus = 'FREE' | 'OCCUPIED' | 'DIRTY';
export type CustomerStatus = 'WAITING' | 'EATING' | 'LEAVING' | 'LOST';

export interface TableEntity {
  id: number;
  status: TableStatus;
  currentCustomerId?: number; // ID del cliente sentado (si hay)
  remainingTime: number;      // Tiempo restante para liberarse/limpiarse
}

export interface CustomerEntity {
  id: number;
  status: CustomerStatus;
  arrivalTime: number;     // Minuto en que llegó
  seatTime?: number;       // Minuto en que se sentó
  leaveTime?: number;      // Minuto en que salió
}

export interface SimulationStats {
  totalCustomers: number;
  customersServed: number;
  customersLost: number;
  avgWaitTime: number;     // Tiempo promedio en cola
  avgSystemTime: number;   // Tiempo promedio total
  utilization: number;     // % de uso de mesas
  activeTablesAvg: number; // Promedio de mesas ocupadas
}

export interface RestaurantState {
  currentTime: number;     // Tiempo actual de simulación (minutos)
  tables: TableEntity[];
  queue: CustomerEntity[]; // Clientes esperando
  activeCustomers: CustomerEntity[]; // Clientes comiendo
  stats: SimulationStats;
  isRunning: boolean;
  isPaused: boolean;
}