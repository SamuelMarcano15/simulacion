"use client";

import React, { useState, useEffect } from "react";
import { Spinner, Button, addToast, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Header } from "@/components/Header";
import { ModelSelector, ModelType } from "@/components/ModelSelector";
import { CalculatorForm } from "@/components/CalculatorForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ProbabilityTable } from "@/components/ProbabilityTable";
import { ProbabilityCalculator } from "@/components/ProbabilityCalculator";
import {
  AssistantWindow,
  AssistantPosition,
} from "@/components/AssistantWindow";
import {
  QueueModelParams,
  QueueModelResults,
  CalculationError,
} from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  calculateMM1Infinite,
  calculateMM1Finite,
  calculateMMcInfinite,
  calculateMMcFinite,
} from "@/lib/queuingModels";
import { generatePdfReport, downloadPdf } from "@/lib/pdfGenerator";

// Helper para el título del PDF
const getModelTitle = (results: QueueModelResults): string => {
  const { c, N } = results.params;
  switch (results.modelType) {
    case "MM1":
      return "M/M/1 (Cola Infinita)";
    case "MM1N":
      return `M/M/1/${N} (Cola Finita)`;
    case "MMc":
      return `M/M/${c} (Cola Infinita)`;
    case "MMcN":
      return `M/M/${c}/${N} (Cola Finita)`;
    default:
      return "Resultados del Modelo";
  }
};

const formatNum = (num?: number, decimals = 4): string => {
  if (num === undefined || num === null || isNaN(num)) return "-";
  if (Math.abs(num) < 1e-6 && num !== 0)
    return num.toExponential(decimals > 0 ? decimals - 1 : 0);
  return num.toFixed(decimals);
};

export const QueuingView = () => {
  const [selectedModel, setSelectedModel] = useState<ModelType>("MM1");
  const [results, setResults] = useState<QueueModelResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [assistantStep, setAssistantStep] = useState(0);

  const handleModelChange = (newModel: ModelType) => {
    if (newModel === selectedModel) return;
    setSelectedModel(newModel);
    setResults(null);
    if (isAssistantActive && assistantStep > 1) setAssistantStep(1);
  };

  const handleCalculate = (params: QueueModelParams) => {
    setIsLoading(true);
    setResults(null);
    setTimeout(() => {
      try {
        let calculationResult: QueueModelResults | CalculationError;
        const { lambda, mu } = params;
        const c =
          selectedModel === "MMc" || selectedModel === "MMcN" ? params.c : 1;
        const N =
          selectedModel === "MM1N" || selectedModel === "MMcN"
            ? params.N
            : undefined;

        if (selectedModel === "MMc" || selectedModel === "MMcN") {
          if (!c || c <= 1)
            throw new Error("Para M/M/c, 'c' debe ser un entero > 1.");
        }
        if (selectedModel === "MM1N" || selectedModel === "MMcN") {
          if (N === undefined)
            throw new Error("N es requerido para modelos finitos.");
          if (c && N < c) throw new Error("N debe ser mayor o igual a c.");
        }

        switch (selectedModel) {
          case "MM1":
            calculationResult = calculateMM1Infinite(lambda, mu);
            break;
          case "MM1N":
            calculationResult = calculateMM1Finite(lambda, mu, N!);
            break;
          case "MMc":
            calculationResult = calculateMMcInfinite(lambda, mu, c!);
            break;
          case "MMcN":
            calculationResult = calculateMMcFinite(lambda, mu, c!, N!);
            break;
          default:
            throw new Error("Modelo no reconocido");
        }

        if ("message" in calculationResult) {
          addToast({
            title: "Error en el Cálculo",
            description: calculationResult.message,
            color: "danger",
          });
          setResults(null);
        } else {
          setResults(calculationResult);
          addToast({
            title: "Cálculo Exitoso",
            description: "Métricas generadas.",
            color: "success",
          });
        }
      } catch (error: any) {
        addToast({
          title: "Error Inesperado",
          description: error.message,
          color: "danger",
        });
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleGeneratePdf = async () => {
    if (!results) return;
    setIsGeneratingPdf(true);
    try {
      const pdfBytes = await generatePdfReport(results);
      const modelName = getModelTitle(results).replace(/[\s/()∞]/g, "");
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadPdf(pdfBytes, `Reporte_Colas_${modelName}_${timestamp}.pdf`);
      addToast({ title: "PDF Generado", color: "success" });
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo generar el PDF.",
        color: "danger",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // --- ASISTENTE ---
  const assistantSteps = [
    {
      title: "Paso 1: Elige el Modelo",
      targetId: "asistente-paso-1",
      position: "top-left" as AssistantPosition,
      content: <p>Elige entre M/M/1, M/M/1/N, etc.</p>,
    },
    {
      title: "Paso 2: Parámetros",
      targetId: "asistente-paso-2",
      position: "top-left" as AssistantPosition,
      content: <p>Ingresa λ (llegadas) y μ (servicio).</p>,
    },
    {
      title: "Paso 3: Resultados",
      targetId: "asistente-paso-3",
      position: "bottom-center" as AssistantPosition,
      content: <p>Analiza ρ, Ls, Lq, Ws, Wq.</p>,
    },
    {
      title: "Paso 4: Tabla Pn",
      targetId: "asistente-paso-4",
      position: "top-left" as AssistantPosition,
      content: <p>Distribución de probabilidad detallada.</p>,
    },
    {
      title: "Paso 5: Calculadora Pn",
      targetId: "asistente-paso-5",
      position: "top-left" as AssistantPosition,
      content: <p>Calcula probabilidades específicas.</p>,
    },
    {
      title: "Paso 6: Reporte",
      targetId: "asistente-paso-6",
      position: "center-left" as AssistantPosition,
      content: <p>Descarga tu reporte.</p>,
    },
  ];

  // Lógica de resaltado
  useEffect(() => {
    document
      .querySelectorAll(".asistente-highlight")
      .forEach((el) => el.classList.remove("asistente-highlight"));

    if (!isAssistantActive) return;

    const targetId = assistantSteps[assistantStep]?.targetId;
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.classList.add("asistente-highlight");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isAssistantActive, assistantStep, results]);

  // Avance automático
  useEffect(() => {
    if (isAssistantActive && results && assistantStep === 1)
      setAssistantStep(2);
  }, [results, isAssistantActive, assistantStep]);

  return (
    <div className="flex-1 relative">
      <Header />

      {/* Botón Asistente */}
      <div className="flex justify-end my-4 no-print">
        <Tooltip
          content="Presiona el botón para ayudarte con el proceso"
          color="foreground"
          placement="left"
        >
          <Button
            variant={isAssistantActive ? "solid" : "bordered"}
            className={
              isAssistantActive
                ? "bg-white text-unimar-secondary font-bold z-[9991] relative"
                : "border-unimar-primary text-unimar-primary hover:bg-unimar-primary hover:text-white"
            }
            onPress={() => {
              setIsAssistantActive(!isAssistantActive);
              setAssistantStep(0);
            }}
            startContent={
              <Icon
                icon={
                  isAssistantActive
                    ? "ph:chalkboard-teacher-fill"
                    : "ph:student-bold"
                }
              />
            }
          >
            {isAssistantActive ? "Salir Guía" : "Modo Guía"}
          </Button>
        </Tooltip>
      </div>

      <div className="mt-4 space-y-6">
        {/* CORRECCIÓN AQUÍ: Agregado ID y fondo blanco */}
        <div
          id="asistente-paso-1"
          className="bg-transparent rounded-xl p-2 transition-colors"
        >
          <ModelSelector
            selectedModel={selectedModel}
            setSelectedModel={handleModelChange}
          />
        </div>

        {/* CORRECCIÓN AQUÍ: Agregado ID y fondo blanco */}
        <div
          id="asistente-paso-2"
          className="bg-transparent rounded-xl p-2 transition-colors"
        >
          <CalculatorForm
            selectedModel={selectedModel}
            onSubmit={handleCalculate}
            isLoading={isLoading}
          />
        </div>

        {isLoading && (
          <div className="flex justify-center mt-8">
            <Spinner color="primary" size="lg" />
          </div>
        )}

        {results && !isLoading && (
          <>
            <div
              id="asistente-paso-3"
              className="bg-white rounded-xl p-2 transition-colors"
            >
              <ResultsDisplay results={results} />
            </div>
            <div
              id="asistente-paso-4"
              className="bg-white rounded-xl p-2 transition-colors"
            >
              <ProbabilityTable results={results} />
            </div>
            <div
              id="asistente-paso-5"
              className="bg-white rounded-xl p-2 transition-colors"
            >
              <ProbabilityCalculator probabilities={results.probabilities} />
            </div>

            <div
              id="asistente-paso-6"
              className="bg-trasparent rounded-xl p-2 transition-colors"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center gap-4 bg-white shadow-lg rounded-xl py-4"
              >
                <Button
                  variant="bordered"
                  color="primary"
                  onPress={handleGeneratePdf}
                  isLoading={isGeneratingPdf}
                  startContent={
                    !isGeneratingPdf ? <Icon icon="ph:file-pdf-bold" /> : null
                  }
                >
                  Generar PDF
                </Button>
                {/*<Button variant="bordered" color="secondary" onPress={() => window.print()} startContent={<Icon icon="ph:printer-bold" />}>Imprimir</Button>*/}
              </motion.div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isAssistantActive && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-[9990] no-print"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssistantActive(false)}
            />

            <AssistantWindow
              title={assistantSteps[assistantStep].title}
              content={assistantSteps[assistantStep].content}
              step={assistantStep}
              totalSteps={assistantSteps.length}
              onNext={() => {
                // Validar paso 1 (Parámetros) antes de avanzar
                if (assistantStep === 1 && !results) {
                  addToast({
                    title: "Acción Requerida",
                    description: "Calcula las métricas primero.",
                    color: "warning",
                  });
                  return;
                }

                if (assistantStep === assistantSteps.length - 1) {
                  setIsAssistantActive(false);
                } else {
                  setAssistantStep((s) => s + 1);
                }
              }}
              onPrev={() => setAssistantStep((s) => Math.max(s - 1, 0))}
              onSkip={() => setIsAssistantActive(false)}
              position={assistantSteps[assistantStep].position}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
