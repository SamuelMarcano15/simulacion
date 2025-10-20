import React from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { motion } from 'framer-motion';
import { QueueModelResults } from '@/lib/types'; // Importa el tipo

interface ProbabilityTableProps {
  results: QueueModelResults | null;
}

const formatProb = (num?: number): string => {
  if (num === undefined || num === null || isNaN(num)) return '-';
  if (num < 0.00001 && num > 0) return '< 0.00001';
  return num.toFixed(5);
};

export const ProbabilityTable: React.FC<ProbabilityTableProps> = ({ results }) => {
  if (!results || results.probabilities.length === 0) {
    return null;
  }

  // Limitar el número de filas mostradas para el modelo infinito
  const displayProbabilities = results.modelType === 'infinite'
     ? results.probabilities.filter(p => p.pn >= 0.00001 || p.n <= 10) // Muestra al menos 11 filas o hasta que Pn sea pequeño
     : results.probabilities;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="mt-8"
    >
        <Card className="shadow-lg border border-gray-200 card-print">
             <CardHeader className="card-header-print">
                <h2 className="text-xl font-semibold text-unimar-primary font-headings">
                Distribución de Probabilidad P(n)
                </h2>
            </CardHeader>
            <Divider />
            <CardBody className="card-body-print">
              <Table aria-label="Tabla de distribución de probabilidad">
                <TableHeader>
                  <TableColumn className="text-unimar-primary">Clientes (n)</TableColumn>
                  <TableColumn className="text-unimar-primary">Prob. Absoluta P(n)</TableColumn>
                  <TableColumn className="text-unimar-primary">Prob. Acumulada ΣP(i)</TableColumn>
                </TableHeader>
                <TableBody items={displayProbabilities}>
                  {(item) => (
                    <TableRow key={item.n}>
                      <TableCell>{item.n}</TableCell>
                      <TableCell>{formatProb(item.pn)}</TableCell>
                      <TableCell>{formatProb(item.cumulativePn)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
               {results.modelType === 'infinite' && results.probabilities.length > displayProbabilities.length && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                        Se omiten filas donde P(n) {'<'} 0.00001.
                    </p>
               )}
            </CardBody>
        </Card>
    </motion.div>
  );
};