// components/CalculatorForm.tsx
"use client";

import React, { useState } from "react";
import { Input, Button, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { QueueModelParams } from "@/lib/types";
import { ModelType } from "./ModelSelector"; // Importar el tipo de 4 modelos

interface CalculatorFormProps {
  selectedModel: ModelType; // <-- MODIFICADO
  onSubmit: (params: QueueModelParams) => void;
  isLoading: boolean;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  selectedModel,
  onSubmit,
  isLoading,
}) => {
  const [lambdaStr, setLambdaStr] = useState("");
  const [muStr, setMuStr] = useState("");
  const [cStr, setCStr] = useState(""); // Estado para 'c'
  const [nStr, setNStr] = useState(""); // Estado para 'N'

  const [errors, setErrors] = useState<{
    lambda?: string;
    mu?: string;
    c?: string;
    n?: string;
  }>({});

  // --- NUEVAS CONDICIONES PARA VISIBILIDAD ---
  const showC_Input = selectedModel === "MMc" || selectedModel === "MMcN";
  const showN_Input = selectedModel === "MM1N" || selectedModel === "MMcN";

  const validateAndSubmit = () => {
    const newErrors: { lambda?: string; mu?: string; c?: string; n?: string } =
      {};
    const lambda = parseFloat(lambdaStr);
    const mu = parseFloat(muStr);
    const c = parseInt(cStr, 10);
    const N = parseInt(nStr, 10);

    if (isNaN(lambda) || lambda <= 0)
      newErrors.lambda = "λ debe ser un número positivo.";
    if (isNaN(mu) || mu <= 0) newErrors.mu = "μ debe ser un número positivo.";

    let c_val = 1; // Por defecto para M/M/1
    if (showC_Input) {
      if (isNaN(c) || c <= 1 || !Number.isInteger(c)) {
        newErrors.c = "c debe ser un entero > 1.";
      } else {
        c_val = c; // Usar el valor 'c' validado
      }
    }

    if (showN_Input) {
      if (isNaN(N) || !Number.isInteger(N)) {
        newErrors.n = "N debe ser un número entero.";
      } else if (N < c_val) {
        newErrors.n = `N debe ser mayor o igual a c (N ≥ ${c_val}).`;
      }
    }

    if (!showN_Input && !isNaN(lambda) && !isNaN(mu) && !isNaN(c_val)) {
      // Colas infinitas
      if (lambda >= c_val * mu) {
        newErrors.lambda = `Sistema inestable (λ ≥ c*μ). λ debe ser < ${
          c_val * mu
        }.`;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const params: QueueModelParams = { lambda, mu };
      if (showC_Input) params.c = c;
      if (showN_Input) params.N = N;
      onSubmit(params);
    }
  };

  const handleClear = () => {
    setLambdaStr("");
    setMuStr("");
    setCStr("");
    setNStr("");
    setErrors({});
  };

  const handleNewCalculation = () => {
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="shadow-lg border border-gray-200 relative">
        <Button
          color="default"
          variant="flat"
          size="sm"
          className="absolute top-6 right-6 z-10"
          onPress={handleNewCalculation}
          startContent={<Icon icon="ph:arrow-clockwise-light" />}
          isDisabled={isLoading}
        >
          Nuevo Cálculo
        </Button>

        <CardBody className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-unimar-primary font-headings">
            Parámetros del Modelo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              startContent={<span className="text-gray-500"> =</span>}
            />
            <Input
              label="Tasa de Servicio (μ) (por servidor)" // Texto actualizado
              placeholder="Ej: 5 (clientes/hora)"
              variant="bordered"
              value={muStr}
              onValueChange={setMuStr}
              isInvalid={!!errors.mu}
              errorMessage={errors.mu}
              type="number"
              min="0"
              step="any"
              startContent={<span className="text-gray-500"> =</span>}
            />

            {/* Input Condicional para 'c' */}
            <AnimatePresence>
              {showC_Input && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0, margin: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Input
                    label="Servidores (c)"
                    placeholder="Ej: 4"
                    variant="bordered"
                    value={cStr}
                    onValueChange={setCStr}
                    isInvalid={!!errors.c}
                    errorMessage={errors.c}
                    type="number"
                    min="2"
                    step="1"
                    startContent={<span className="text-gray-500">=</span>}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Condicional para 'N' */}
            <AnimatePresence>
              {showN_Input && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0, margin: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Input
                    label="Capacidad Sistema (N)"
                    placeholder="Ej: 20 (c <= N)"
                    variant="bordered"
                    value={nStr}
                    onValueChange={setNStr}
                    isInvalid={!!errors.n}
                    errorMessage={errors.n}
                    type="number"
                    min="1"
                    step="1"
                    startContent={<span className="text-gray-500"> =</span>}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-end items-center mt-6 gap-2">
            <Button
              color="danger"
              onPress={handleClear}
              startContent={<Icon icon="ph:trash-simple-light" />}
              isDisabled={isLoading}
            >
              Limpiar
            </Button>
            <Button
              color="primary"
              className="bg-unimar-primary hover:bg-unimar-secondary text-white font-bold"
              onPress={validateAndSubmit}
              isLoading={isLoading}
              startContent={
                !isLoading ? <Icon icon="ph:calculator-fill" /> : null
              }
            >
              {isLoading ? "Calculando..." : "Calcular Métricas"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
