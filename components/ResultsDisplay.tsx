import React from 'react';
import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { motion } from 'framer-motion';
import { QueueModelResults } from '@/lib/types'; // Importa el tipo

interface ResultsDisplayProps {
  results: QueueModelResults | null;
}

// Helper para formatear números
const formatNumber = (num?: number, decimals = 4): string => {
  if (num === undefined || num === null || isNaN(num)) return '-';
  return num.toFixed(decimals);
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  if (!results) {
    return null; // No mostrar nada si no hay resultados
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
             Resultados del Modelo ({results.modelType === 'finite' ? `M/M/1/${results.params.N}` : 'M/M/1'})
           </h2>
         </CardHeader>
         <Divider />
         <CardBody className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 card-body-print">
            <ResultItem label="Factor de Utilización (ρ)" value={formatNumber(results.rho)} symbol="ρ" />
            <ResultItem label="Prob. Sistema Vacío (P₀)" value={formatNumber(results.p0)} symbol="P₀" />
            <ResultItem label="Clientes en Sistema (Ls)" value={formatNumber(results.ls)} symbol="Ls" unit="clientes"/>
            <ResultItem label="Clientes en Cola (Lq)" value={formatNumber(results.lq)} symbol="Lq" unit="clientes"/>
            <ResultItem label="Tiempo en Sistema (Ws)" value={formatNumber(results.ws)} symbol="Ws" unit="uds. tiempo"/>
            <ResultItem label="Tiempo en Cola (Wq)" value={formatNumber(results.wq)} symbol="Wq" unit="uds. tiempo"/>
           {results.lambdaEff !== undefined && (
              <ResultItem label="Tasa Efectiva Llegada (λeff)" value={formatNumber(results.lambdaEff)} symbol="λeff" unit="clientes/ud. tiempo" />
           )}
           {/* Puedes añadir más si es necesario */}
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