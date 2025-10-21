"use client";

import React, { useState } from "react";
import { Input, Button, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { QueueModelParams } from "@/lib/types";

interface CalculatorFormProps {
  selectedModel: "infinite" | "finite";
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
  const [nStr, setNStr] = useState("");
  const [errors, setErrors] = useState<{
    lambda?: string;
    mu?: string;
    n?: string;
  }>({});

  const validateAndSubmit = () => {
    // ... (lógica de validación igual que antes)
    const newErrors: { lambda?: string; mu?: string; n?: string } = {};
    const lambda = parseFloat(lambdaStr);
    const mu = parseFloat(muStr);
    const N = parseInt(nStr, 10);

    if (isNaN(lambda) || lambda <= 0) {
      newErrors.lambda = "λ debe ser un número positivo.";
    }
    if (isNaN(mu) || mu <= 0) {
      newErrors.mu = "μ debe ser un número positivo.";
    }
    if (
      selectedModel === "finite" &&
      (isNaN(N) || N < 1 || !Number.isInteger(N))
    ) {
      newErrors.n = "N debe ser un entero positivo mayor o igual a 1.";
    }
    if (
      selectedModel === "infinite" &&
      !isNaN(lambda) &&
      !isNaN(mu) &&
      lambda >= mu
    ) {
      newErrors.lambda = "Para cola infinita, λ debe ser menor que μ.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const params: QueueModelParams = { lambda, mu };
      if (selectedModel === "finite") {
        params.N = N;
      }
      onSubmit(params);
    }
  };

  const handleClear = () => {
    setLambdaStr("");
    setMuStr("");
    setNStr("");
    setErrors({});
  };

  // --- NUEVA FUNCIÓN ---
  // Esta función recarga la página completa.
  const handleNewCalculation = () => {
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {/* --- TARJETA MODIFICADA --- */}
      {/* Añadimos 'relative' para que el botón absoluto se posicione correctamente */}
      <Card className="shadow-lg border border-gray-200 relative">
        {/* --- NUEVO BOTÓN DE RECARGA --- */}
        <Button
          color="default" // Color neutro
          variant="flat" // Estilo sutil
          size="sm" // Tamaño pequeño
          className="absolute top-6 right-6 z-10" // Posicionamiento
          onPress={handleNewCalculation}
          startContent={<Icon icon="ph:arrow-clockwise-light" />} // Icono de recarga
          isDisabled={isLoading} // Deshabilitado si está calculando
        >
          Nuevo Cálculo
        </Button>

        <CardBody className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-unimar-primary font-headings">
            Parámetros del Modelo
          </h2>

          {/* ... (Inputs de λ, μ, y N igual que antes) ... */}
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
              startContent={<span className="text-gray-500"> =</span>}
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
              startContent={<span className="text-gray-500"> =</span>}
            />
            {selectedModel === "finite" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
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
                  startContent={<span className="text-gray-500"> =</span>}
                />
              </motion.div>
            )}
          </div>

          {/* ... (Botones inferiores "Limpiar" y "Calcular" igual que antes) ... */}
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
