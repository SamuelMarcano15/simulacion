"use client";

import React, { useState } from 'react';
import { Input, Button, Card, CardBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { QueueModelParams } from '@/lib/types'; // Importa el tipo

interface CalculatorFormProps {
  selectedModel: 'infinite' | 'finite';
  onSubmit: (params: QueueModelParams) => void;
  isLoading: boolean;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ selectedModel, onSubmit, isLoading }) => {
  const [lambdaStr, setLambdaStr] = useState('');
  const [muStr, setMuStr] = useState('');
  const [nStr, setNStr] = useState(''); // Capacidad N para modelo finito
  const [errors, setErrors] = useState<{ lambda?: string; mu?: string; n?: string }>({});

  const validateAndSubmit = () => {
    const newErrors: { lambda?: string; mu?: string; n?: string } = {};
    const lambda = parseFloat(lambdaStr);
    const mu = parseFloat(muStr);
    const N = parseInt(nStr, 10);

    if (isNaN(lambda) || lambda <= 0) {
      newErrors.lambda = 'λ debe ser un número positivo.';
    }
    if (isNaN(mu) || mu <= 0) {
      newErrors.mu = 'μ debe ser un número positivo.';
    }
    if (selectedModel === 'finite' && (isNaN(N) || N < 1 || !Number.isInteger(N))) {
      newErrors.n = 'N debe ser un entero positivo mayor o igual a 1.';
    }
    // Añadir validación ρ < 1 para modelo infinito *antes* de enviar
    if (selectedModel === 'infinite' && !isNaN(lambda) && !isNaN(mu) && lambda >= mu) {
         newErrors.lambda = 'Para cola infinita, λ debe ser menor que μ.';
    }


    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const params: QueueModelParams = { lambda, mu };
      if (selectedModel === 'finite') {
        params.N = N;
      }
      onSubmit(params);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
      <Card className="shadow-lg border border-gray-200">
        <CardBody className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-unimar-primary font-headings">Parámetros del Modelo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Tasa de Llegada (λ)"
              placeholder="Ej: 4 (clientes/hora)"
              variant="bordered"
              value={lambdaStr}
              onValueChange={setLambdaStr}
              isInvalid={!!errors.lambda}
              errorMessage={errors.lambda}
              type="number"
              min="0"
              step="any"
              startContent={<span className="text-gray-500">λ =</span>}
            />
            <Input
              label="Tasa de Servicio (μ)"
              placeholder="Ej: 6 (clientes/hora)"
              variant="bordered"
              value={muStr}
              onValueChange={setMuStr}
              isInvalid={!!errors.mu}
              errorMessage={errors.mu}
              type="number"
              min="0"
              step="any"
               startContent={<span className="text-gray-500">μ =</span>}
            />
            {selectedModel === 'finite' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Input
                  label="Capacidad del Sistema (N)"
                  placeholder="Ej: 5 (incluye servidor)"
                  variant="bordered"
                  value={nStr}
                  onValueChange={setNStr}
                  isInvalid={!!errors.n}
                  errorMessage={errors.n}
                  type="number"
                  min="1"
                  step="1"
                   startContent={<span className="text-gray-500">N =</span>}
                />
              </motion.div>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <Button
              color="primary" // Se mapeará al color primario de HeroUI/UNIMAR
              className="bg-unimar-primary hover:bg-unimar-secondary text-white font-bold"
              onPress={validateAndSubmit}
              isLoading={isLoading}
              startContent={!isLoading ? <Icon icon="ph:calculator-fill" /> : null}
            >
              {isLoading ? 'Calculando...' : 'Calcular Métricas'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};