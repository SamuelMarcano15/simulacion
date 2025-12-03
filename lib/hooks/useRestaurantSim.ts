// lib/hooks/useRestaurantSim.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RestaurantConfig, 
  RestaurantState, 
  TableEntity, 
  CustomerEntity, 
  SimulationStats 
} from '@/lib/types';

// --- HELPERS MATEMÁTICOS ---

/**
 * Genera un tiempo aleatorio basado en una distribución Exponencial.
 * Útil para tiempos entre llegadas (Poisson) y tiempos de servicio.
 * @param rate Tasa media (lambda o mu)
 * @returns Tiempo aleatorio
 */
const getExponentialTime = (rate: number): number => {
  if (rate <= 0) return Infinity;
  const u = Math.random();
  return -Math.log(1 - u) / rate;
};

// --- CONSTANTES DE SIMULACIÓN ---
const TICK_RATE = 100; 
const CLEANING_TIME = 2; 
export const useRestaurantSim = (config: RestaurantConfig) => {
  const [state, setState] = useState<RestaurantState>({
    currentTime: 0,
    tables: [],
    queue: [],
    activeCustomers: [],
    stats: {
      totalCustomers: 0,
      customersServed: 0,
      customersLost: 0,
      avgWaitTime: 0,
      avgSystemTime: 0,
      utilization: 0,
      activeTablesAvg: 0
    },
    isRunning: false,
    isPaused: false
  });

  // Referencias para lógica interna (evitan re-renders innecesarios en el loop)
  const stateRef = useRef(state);
  const configRef = useRef(config);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const nextArrivalRef = useRef<number>(0);
  
  // Acumuladores estadísticos internos
  const statsAccRef = useRef({
    totalWaitTime: 0,
    totalSystemTime: 0,
    areaUnderTablesCurve: 0, // Para calcular promedio de mesas ocupadas (Ls en servicio)
    lastTimeRecorded: 0
  });

  // Sincronizar refs con props/state
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { stateRef.current = state; }, [state]);

  // --- INICIALIZACIÓN ---
  const initializeTables = useCallback(() => {
    const tables: TableEntity[] = Array.from({ length: config.tableCount }, (_, i) => ({
      id: i + 1,
      status: 'FREE',
      remainingTime: 0
    }));
    return tables;
  }, [config.tableCount]);

  const resetSimulation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Calcular primer llegada
    const firstArrival = getExponentialTime(config.arrivalLambda / 60); // Lambda en clientes/minuto

    const initialState: RestaurantState = {
      currentTime: 0,
      tables: initializeTables(),
      queue: [],
      activeCustomers: [],
      stats: {
        totalCustomers: 0,
        customersServed: 0,
        customersLost: 0,
        avgWaitTime: 0,
        avgSystemTime: 0,
        utilization: 0,
        activeTablesAvg: 0
      },
      isRunning: false,
      isPaused: false
    };

    nextArrivalRef.current = firstArrival;
    statsAccRef.current = { totalWaitTime: 0, totalSystemTime: 0, areaUnderTablesCurve: 0, lastTimeRecorded: 0 };
    
    setState(initialState);
    stateRef.current = initialState;
  }, [config.arrivalLambda, initializeTables]);

  // --- MOTOR DE SIMULACIÓN (TICK) ---
  const tick = useCallback(() => {
    if (stateRef.current.isPaused) return;

    const currentState = { ...stateRef.current };
    const currentConfig = configRef.current;
    
    // 1. Avanzar Tiempo
    // simSpeed: 1 = tiempo real (muy lento), 60 = 1 seg real es 1 min simulado
    const dtReal = TICK_RATE / 1000; // segundos reales pasados
    const dtSim = (dtReal * currentConfig.simulationSpeed) / 60; // Minutos simulados avanzados
    
    currentState.currentTime += dtSim;

    // --- ESTADÍSTICAS EN TIEMPO REAL ---
    // Calcular área bajo la curva para mesas ocupadas (Integral de ocupación dt)
    const occupiedCount = currentState.tables.filter(t => t.status === 'OCCUPIED').length;
    statsAccRef.current.areaUnderTablesCurve += occupiedCount * dtSim;

    // 2. Generar Llegadas (Proceso de Poisson)
    if (currentState.currentTime >= nextArrivalRef.current) {
      const newCustomer: CustomerEntity = {
        id: currentState.stats.totalCustomers + 1,
        status: 'WAITING',
        arrivalTime: currentState.currentTime
      };

      currentState.stats.totalCustomers++;

      // Verificar capacidad de cola (N)
      const currentSystemSize = currentState.queue.length + currentState.activeCustomers.length;
      // Si N está definido y alcanzamos el límite (Mesas + Cola)
      const limit = currentConfig.queueLimit 
        ? currentConfig.tableCount + currentConfig.queueLimit 
        : Infinity;

      if (currentSystemSize >= limit) {
        // Rechazar cliente (Lambda perdida)
        newCustomer.status = 'LOST';
        currentState.stats.customersLost++;
      } else {
        // Aceptar a la cola
        currentState.queue.push(newCustomer);
      }

      // Programar próxima llegada
      const nextTime = getExponentialTime(currentConfig.arrivalLambda / 60); // Convertir a tasa por minuto
      nextArrivalRef.current = currentState.currentTime + nextTime;
    }

    // 3. Procesar Mesas (Servicio y Limpieza)
    currentState.tables = currentState.tables.map(table => {
      if (table.status === 'FREE') return table;

      let newTable = { ...table };
      newTable.remainingTime -= dtSim;

      if (newTable.remainingTime <= 0) {
        if (newTable.status === 'OCCUPIED') {
          // Fin de Servicio -> Pasar a Sucia/Limpieza
          newTable.status = 'DIRTY';
          newTable.remainingTime = CLEANING_TIME; // Tiempo fijo de limpieza
          
          // Registrar salida del cliente
          const customer = currentState.activeCustomers.find(c => c.id === newTable.currentCustomerId);
          if (customer) {
            customer.status = 'LEAVING';
            customer.leaveTime = currentState.currentTime;
            
            // Actualizar Stats de tiempo en sistema
            const timeInSystem = customer.leaveTime - customer.arrivalTime;
            statsAccRef.current.totalSystemTime += timeInSystem;
            currentState.stats.customersServed++;
          }
          
          // Limpiar referencia
          newTable.currentCustomerId = undefined;
          
        } else if (newTable.status === 'DIRTY') {
          // Fin de Limpieza -> Mesa Libre
          newTable.status = 'FREE';
          newTable.remainingTime = 0;
        }
      }
      return newTable;
    });

    // Limpiar clientes que ya salieron del array activo
    currentState.activeCustomers = currentState.activeCustomers.filter(c => c.status !== 'LEAVING');

    // 4. Asignar Mesas (Cola -> Mesa)
    const freeTables = currentState.tables.filter(t => t.status === 'FREE');
    
    while (currentState.queue.length > 0 && freeTables.length > 0) {
      const table = freeTables.shift(); // Tomar primera mesa libre
      const customer = currentState.queue.shift(); // Tomar primer cliente (FIFO)

      if (table && customer) {
        // Asignar
        customer.status = 'EATING';
        customer.seatTime = currentState.currentTime;
        
        // Stats de espera
        const waitTime = customer.seatTime - customer.arrivalTime;
        statsAccRef.current.totalWaitTime += waitTime;

        // Configurar Mesa
        const serviceTime = getExponentialTime(currentConfig.serviceMu / 60); // minutos
        
        // Buscamos la mesa en el array principal para actualizarla
        const tableIndex = currentState.tables.findIndex(t => t.id === table.id);
        if (tableIndex !== -1) {
          currentState.tables[tableIndex] = {
            ...currentState.tables[tableIndex],
            status: 'OCCUPIED',
            currentCustomerId: customer.id,
            remainingTime: serviceTime
          };
        }
        
        currentState.activeCustomers.push(customer);
      }
    }

    // 5. Actualizar Métricas Finales
    if (currentState.stats.customersServed > 0) {
      currentState.stats.avgSystemTime = statsAccRef.current.totalSystemTime / currentState.stats.customersServed;
      currentState.stats.avgWaitTime = statsAccRef.current.totalWaitTime / currentState.stats.customersServed;
    }
    
    if (currentState.currentTime > 0) {
        // Utilización promedio = (Area bajo curva de mesas ocupadas) / (Tiempo total * Total Mesas)
        currentState.stats.activeTablesAvg = statsAccRef.current.areaUnderTablesCurve / currentState.currentTime;
        currentState.stats.utilization = currentState.stats.activeTablesAvg / currentConfig.tableCount;
    }

    setState(currentState);
  }, []); // Dependencias vacías, usa refs

  // --- CONTROLES ---
  const start = () => {
    if (!state.isRunning) {
        // Si es la primera vez o reset
        if(state.currentTime === 0) resetSimulation();
        
        setState(prev => ({ ...prev, isRunning: true, isPaused: false }));
        timerRef.current = setInterval(tick, TICK_RATE);
    } else if (state.isPaused) {
        setState(prev => ({ ...prev, isPaused: false }));
    }
  };

  const pause = () => {
    setState(prev => ({ ...prev, isPaused: true }));
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState(prev => ({ ...prev, isRunning: false, isPaused: false }));
  };

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    state,
    start,
    pause,
    stop,
    reset: resetSimulation
  };
};