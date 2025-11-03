// components/ResultsDisplay.tsx
import React from 'react';
import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { motion } from 'framer-motion';
import { QueueModelResults } from '@/lib/types';

interface ResultsDisplayProps {
  results: QueueModelResults | null;
}

const formatNumber = (num?: number, decimals = 4): string => {
  if (num === undefined || num === null || isNaN(num)) return '-';
  return num.toFixed(decimals);
};

// Helper para título del modelo
const getModelTitle = (results: QueueModelResults): string => {
  const { c, N } = results.params;
  switch (results.modelType) {
    case 'MM1': return 'M/M/1 (Cola Infinita)';
    case 'MM1N': return `M/M/1/${N} (Cola Finita)`;
    case 'MMc': return `M/M/${c} (Cola Infinita)`;
    case 'MMcN': return `M/M/${c}/${N} (Cola Finita)`;
    default: return 'Resultados del Modelo';
  }
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  if (!results) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-8"
    >
      <Card className="shadow-lg border border-gray-200 card-print">
        <CardHeader className="card-header-print">
           <h2 className="text-xl font-semibold text-unimar-primary font-headings">
             Resultados del Modelo: {getModelTitle(results)}
           </h2>
         </CardHeader>
         <Divider />
         <CardBody className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 card-body-print">
            <ResultItem label="Utilización por Servidor (ρ)" value={formatNumber(results.rho)} symbol="ρ" unit="(λ/cμ)"/>
            <ResultItem label="Prob. Sistema Vacío (P₀)" value={formatNumber(results.p0, 5)} symbol="P₀" />
            <ResultItem label="Clientes en Sistema (Ls)" value={formatNumber(results.ls)} symbol="Ls" unit="clientes"/>
            <ResultItem label="Clientes en Cola (Lq)" value={formatNumber(results.lq)} symbol="Lq" unit="clientes"/>
            <ResultItem label="Tiempo en Sistema (Ws)" value={formatNumber(results.ws)} symbol="Ws" unit="uds. tiempo"/>
            <ResultItem label="Tiempo en Cola (Wq)" value={formatNumber(results.wq)} symbol="Wq" unit="uds. tiempo"/>
           
           {/* --- MODIFICACIÓN AQUÍ --- */}
           {results.cBarra !== undefined && (
             <ResultItem 
                label="Servidores Inactivos (c-barra)" // <-- Texto cambiado
                value={formatNumber(results.cBarra, 4)} 
                symbol="c-barra" // <-- Símbolo cambiado
                unit="servidores"
              />
           )}
           
           {(results.modelType === 'MM1N' || results.modelType === 'MMcN') && (
             <>
                <ResultItem 
                  label="Tasa Efectiva Llegada (λeff)" 
                  value={formatNumber(results.lambdaEff)} 
                  symbol="λeff" 
                  unit="clientes/ud. tiempo" 
                />
                <ResultItem 
                  label="Tasa de Llegada Perdida (λp)" 
                  value={formatNumber(results.lambdaPerdida)} 
                  symbol="λp" 
                  unit="clientes/ud. tiempo" 
                />
             </>
           )}
         </CardBody>
      </Card>
    </motion.div>
  );
};

// Componente pequeño para mostrar cada métrica
interface ResultItemProps {
    label: string;
    value: string;
    symbol: string;
    unit?: string;
}

const ResultItem: React.FC<ResultItemProps> = ({ label, value, symbol, unit }) => (
    <div className="flex flex-col result-item-print">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-2xl font-bold text-unimar-secondary">
             {symbol} = {value} {unit && <span className="text-base font-normal text-gray-600">{unit}</span>}
        </span>
    </div>
);