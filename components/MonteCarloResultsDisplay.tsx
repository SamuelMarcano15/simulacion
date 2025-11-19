// components/MonteCarloResultsDisplay.tsx
import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { motion } from 'framer-motion';
import { MonteCarloResults } from '@/lib/types';

interface MonteCarloResultsDisplayProps {
  results: MonteCarloResults;
}

const formatNum = (num: number, decimals = 4) => num.toFixed(decimals);

export const MonteCarloResultsDisplay: React.FC<MonteCarloResultsDisplayProps> = ({ results }) => {
  if (!results) return null;

  const { statistics, data, params } = results;
  const displayedData = data.slice(0, 100);

  const columns = useMemo(() => {
    const cols = [
      { key: 'obs', label: 'OBS #' },
    ];
    for (let i = 0; i < params.nVariables; i++) {
      cols.push({
        key: `var-${i}`,
        label: `VAR ${i + 1} (Aleatorio / Valor)`
      });
    }
    return cols;
  }, [params.nVariables]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 mt-6"
    >
      {/* 1. Tarjetas de Estadísticas */}
      <div id="montecarlo-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-xl p-2 transition-colors">
        {statistics.mean.map((mean, idx) => (
          <Card key={`stat-${idx}`} className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
              <p className="text-tiny uppercase font-bold text-gray-500">Variable {idx + 1}</p>
              <h4 className="font-bold text-large text-unimar-primary">Media: {formatNum(mean)}</h4>
            </CardHeader>
            <CardBody className="overflow-visible py-2">
              <div className="text-small text-gray-600">
                <div className="flex justify-between"><span>Desv. Est:</span> <span>{formatNum(statistics.stdDev[idx])}</span></div>
                <div className="flex justify-between"><span>Mínimo:</span> <span>{formatNum(statistics.min[idx])}</span></div>
                <div className="flex justify-between"><span>Máximo:</span> <span>{formatNum(statistics.max[idx])}</span></div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* 2. Tabla de Datos Simulados */}
      <Card id="montecarlo-table" className="shadow-lg border border-gray-200 bg-white rounded-xl transition-colors">
        <CardHeader className="bg-gray-50 border-b border-gray-100">
            <h3 className="text-lg font-bold text-unimar-secondary font-headings">
                Base de Datos Simulada ({params.distribution})
            </h3>
        </CardHeader>
        <CardBody>
            <Table aria-label="Tabla de Simulación Montecarlo" isStriped removeWrapper>
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.key} className="text-center">
                            {column.label}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={displayedData}>
                    {(row) => (
                        <TableRow key={row.observationIndex}>
                            {(columnKey) => {
                                if (columnKey === 'obs') {
                                    return <TableCell>{row.observationIndex}</TableCell>;
                                }
                                const varIndex = parseInt(columnKey.toString().split('-')[1]);
                                const val = row.simulatedValues[varIndex];
                                const rand = row.randomValues[varIndex];

                                return (
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-gray-400">R: {formatNum(rand)}</span>
                                            {/* AQUI ESTA EL CAMBIO: Agregamos "V:" */}
                                            <span className="font-medium text-unimar-textDark">V: {formatNum(val)}</span>
                                        </div>
                                    </TableCell>
                                );
                            }}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {data.length > 100 && (
                <div className="text-center text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
                    Mostrando las primeras 100 observaciones de {data.length}. Para ver todas, por favor genere el reporte PDF.
                </div>
            )}
        </CardBody>
      </Card>
    </motion.div>
  );
};