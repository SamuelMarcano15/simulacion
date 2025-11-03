// components/ProbabilityCalculator.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardBody, CardHeader, Input, Select, SelectItem, Divider, type SharedSelection,  } from '@heroui/react';
import { motion } from 'framer-motion';
import { ProbabilityDistribution } from '@/lib/types';

interface ProbabilityCalculatorProps {
  probabilities: ProbabilityDistribution[];
}

// Definir el tipo aquí para que sea local
type Operator = 'eq' | 'lt' | 'gt' | 'lte' | 'gte';

const formatProb = (num: number): string => {
  return `${(num * 100).toFixed(4)}%`;
};

export const ProbabilityCalculator: React.FC<ProbabilityCalculatorProps> = ({ probabilities }) => {
  const [kStr, setKStr] = useState('');
  // Asegurarse de que el estado inicial sea del tipo correcto
  const [operator, setOperator] = useState<Operator>('eq');

  // Memoizamos el cálculo
  const calculatedProb = useMemo(() => {
    const k = parseInt(kStr, 10);
    if (isNaN(k) || k < 0 || probabilities.length === 0) {
      return null;
    }

    const maxN = probabilities[probabilities.length - 1].n;
    const isFinite = maxN < 99; // Asumir que <99 es finito (basado en el límite del bucle)

    // Helper para obtener P(n=k)
    const getPn = (n: number): number => {
      if (n < 0) return 0;
      return probabilities.find(p => p.n === n)?.pn || 0;
    }
    
    // Helper para obtener P(n<=k)
    const getCumulativePn = (n: number): number => {
      if (n < 0) return 0;
      // Si k es mayor que el máximo N calculado (en finito), la prob acumulada es 1
      if (isFinite && n >= maxN) return 1.0;
      
      // Si k es mayor que lo calculado (en infinito), buscar el último valor
      if (!isFinite && n >= probabilities.length) {
         return probabilities[probabilities.length - 1].cumulativePn;
      }
      
      // Buscar el valor exacto o el más cercano (para k grande en modelo infinito truncado)
      const found = probabilities.find(p => p.n === n);
      if (found) return found.cumulativePn;
      
      // Si no se encuentra (ej. k=101 en infinito), devolver el último
      return probabilities[probabilities.length - 1].cumulativePn;
    };
    
    let prob = 0;
    let symbol = '=';
    
    switch (operator) {
      case 'eq': // P(n = k)
        symbol = '=';
        prob = getPn(k);
        break;
      case 'lte': // P(n ≤ k)
        symbol = '≤';
        prob = getCumulativePn(k);
        break;
      case 'lt': // P(n < k) = P(n ≤ k-1)
        symbol = '<';
        prob = getCumulativePn(k - 1);
        break;
      case 'gte': // P(n ≥ k) = 1 - P(n ≤ k-1)
        symbol = '≥';
        prob = 1 - getCumulativePn(k - 1);
        break;
      case 'gt': // P(n > k) = 1 - P(n ≤ k)
        symbol = '>';
        prob = 1 - getCumulativePn(k);
        break;
    }
    
    // Asegurarse de que la probabilidad no sea un número negativo pequeño (ej. 1 - 1.000000001)
    if (prob < 0) prob = 0;

    return {
      text: `P(n ${symbol} ${k})`,
      value: prob
    };

  }, [kStr, operator, probabilities]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-8"
    >
      <Card className="shadow-lg border border-gray-200 card-print">
        <CardHeader className="card-header-print">
          <h2 className="text-xl font-semibold text-unimar-primary font-headings">
            Calculadora de Probabilidad Específica
          </h2>
        </CardHeader>
        <Divider />
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Select
              label="Probabilidad"
              placeholder="Selecciona un operador"
              selectedKeys={[operator]} 
              onSelectionChange={(keys: SharedSelection) => {
                if (keys === 'all') return;
                const selectedKey = keys.values().next().value;
                if (selectedKey) {
                  setOperator(selectedKey as Operator);
                }
              }}
              className="w-full md:w-1/3"
            >
              <SelectItem key="eq" textValue="eq">{'P(n = k)'}</SelectItem>
              <SelectItem key="lte" textValue="lte">{'P(n ≤ k)'}</SelectItem>
              <SelectItem key="lt" textValue="lt">{'P(n < k)'}</SelectItem>
              <SelectItem key="gte" textValue="gte">{'P(n ≥ k)'}</SelectItem>
              <SelectItem key="gt" textValue="gt">{'P(n > k)'}</SelectItem>
            </Select>

            <Input
              label="Valor (k)"
              placeholder="Ej: 3"
              type="number"
              min="0"
              step="1"
              value={kStr}
              onValueChange={setKStr}
              className="w-full md:w-1/3"
              startContent={<span className="text-gray-500">k =</span>}
            />

            <div className="flex-1 w-full md:w-1/3 mt-4 md:mt-0">
              <span className="text-sm text-gray-500">Resultado</span>
              {calculatedProb ? (
                  <p className="text-2xl font-bold text-unimar-secondary">
                    {calculatedProb.text} = {formatProb(calculatedProb.value)}
                  </p>
              ) : (
                <p className="text-lg text-gray-400">Ingrese un valor para k...</p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};