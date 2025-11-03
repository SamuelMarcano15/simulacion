"use client"; // Necesario para useState y handlers

import React, { useState, useEffect } from "react";
import { Spinner, Button, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Header } from "@/components/Header";
import { ModelSelector, ModelType } from "@/components/ModelSelector"; // <-- MODIFICADO
import { CalculatorForm } from "@/components/CalculatorForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ProbabilityTable } from "@/components/ProbabilityTable";
import { ProbabilityCalculator } from "@/components/ProbabilityCalculator"; // <-- NUEVO
import {
  QueueModelParams,
  QueueModelResults,
  CalculationError,
} from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  calculateMM1Infinite,
  calculateMM1Finite,
  calculateMMcInfinite, // <-- NUEVO
  calculateMMcFinite, // <-- NUEVO
} from "@/lib/queuingModels";
import { generatePdfReport, downloadPdf } from "@/lib/pdfGenerator";
import {
  AssistantWindow,
  AssistantPosition,
} from "@/components/AssistantWindow";

const formatNum = (num?: number, decimals = 4): string => {
  if (num === undefined || num === null || isNaN(num)) return "-";
  if (Math.abs(num) < 1e-6 && num !== 0) {
    return num.toExponential(decimals > 0 ? decimals - 1 : 0);
  }
  return num.toFixed(decimals);
};

const renderMath = (
  texString: string,
  displayMode = false
): { __html: string } => {
  try {
    return {
      __html: katex.renderToString(texString, {
        throwOnError: false,
        displayMode: displayMode,
      }),
    };
  } catch (e) {
    console.error(e);
    return { __html: texString };
  }
};

// Helper para el título del PDF (movido afuera para ser usado por el PDF handler)
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

export default function Home() {
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
    if (isAssistantActive && assistantStep > 1) {
      setAssistantStep(1);
    }
  };

  const handleCalculate = (params: QueueModelParams) => {
    setIsLoading(true);
    setResults(null);
    setTimeout(() => {
      try {
        let calculationResult: QueueModelResults | CalculationError;

        // Determinar qué función llamar
        const { lambda, mu } = params;
        // Asignar 'c' y 'N' basado en el modelo seleccionado
        const c =
          selectedModel === "MMc" || selectedModel === "MMcN" ? params.c : 1;
        const N =
          selectedModel === "MM1N" || selectedModel === "MMcN"
            ? params.N
            : undefined;

        // Validar 'c' y 'N' aquí para asegurar que los params estén completos
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
            calculationResult = calculateMM1Finite(lambda, mu, N!); // Sabemos que N está definido
            break;
          case "MMc":
            calculationResult = calculateMMcInfinite(lambda, mu, c!); // Sabemos que c está definido
            break;
          case "MMcN":
            calculationResult = calculateMMcFinite(lambda, mu, c!, N!); // Sabemos que c y N están definidos
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
        console.error("Error inesperado:", error);
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
    if (!results) {
      addToast({
        title: "Sin Resultados",
        description: "Calcula las métricas primero.",
        color: "warning",
      });
      return;
    }
    setIsGeneratingPdf(true);
    addToast({ title: "Generando PDF...", color: "warning" });
    try {
      const pdfBytes = await generatePdfReport(results);
      const modelName = getModelTitle(results).replace(/[\s/()∞]/g, ""); // Limpiar nombre
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadPdf(pdfBytes, `Reporte_Colas_${modelName}_${timestamp}.pdf`);
      addToast({ title: "PDF Generado", color: "success" });
    } catch (error) {
      console.error("Error generando PDF:", error);
      addToast({
        title: "Error",
        description: "No se pudo generar el PDF.",
        color: "danger",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!results) {
      addToast({
        title: "Sin Resultados",
        description: "Calcula las métricas primero.",
        color: "warning",
      });
      return;
    }
    window.print();
  };

  // --- LÓGICA Y GUIÓN DEL ASISTENTE (ACTUALIZADO) ---
  const assistantSteps: {
    title: string;
    targetId: string;
    content: React.ReactNode;
    position: AssistantPosition;
  }[] = [
    // Paso 0
    {
      title: "Paso 1: Elige el Modelo",
      targetId: "asistente-paso-1",
      position: "bottom-right",
      content: (
        <p>
          ¡Hola! Elige el modelo a resolver:
          <br />• <strong>M/M/1</strong>: 1 servidor, cola infinita.
          <br />• <strong>M/M/1/N</strong>: 1 servidor, cola finita (límite N).
          <br />• <strong>M/M/c</strong>: Varios servidores (c), cola infinita.
          <br />• <strong>M/M/c/N</strong>: Varios servidores (c), cola finita
          (límite N).
        </p>
      ),
    },
    // Paso 1
    {
      title: "Paso 2: Ingresa los Parámetros",
      targetId: "asistente-paso-2",
      position: "top-left",
      content: (
        <p>
          Ingresa las tasas medias (en la misma unidad de tiempo):
          <br />• <strong>Tasa de Llegada (λ)</strong>: Clientes que llegan.
          <br />• <strong>Tasa de Servicio (μ)</strong>: Capacidad de *un solo*
          servidor.
          {/* Mostrar condicionalmente 'c' y 'N' */}
          {(selectedModel === "MMc" || selectedModel === "MMcN") && (
            <>
              <br />• <strong>Servidores (c)</strong>: Número total de
              servidores (ej. 4).
            </>
          )}
          {(selectedModel === "MM1N" || selectedModel === "MMcN") && (
            <>
              <br />• <strong>Capacidad (N)</strong>: Límite total del sistema
              (ej. 20).
            </>
          )}
          <br />• Presiona <strong>Calcular Métricas</strong> para continuar.
        </p>
      ),
    },
    // Paso 2 (Post-cálculo)
    {
      title: "Paso 3: ¡Resultados del Modelo!",
      targetId: "asistente-paso-3",
      position: "bottom-center",
      content: (
        <p>
          {" "}
          ¡Genial! Aquí están tus métricas clave. Te explicaré las más
          importantes:{" "}
        </p>
      ),
    },
    // Paso 3 (Explicación Rho y P0)
    {
      title: "Análisis: ρ y P₀",
      targetId: "asistente-paso-3",
      position: "bottom-center",
      content: (
        <div>
          <p className="mb-2">
            <strong>Utilización por Servidor (ρ):</strong>
            <br />• <strong>Fórmula:</strong>{" "}
            <span
              dangerouslySetInnerHTML={renderMath(
                selectedModel === "MM1" || selectedModel === "MM1N"
                  ? "\\rho = \\lambda / \\mu"
                  : "\\rho = \\lambda / (c \\cdot \\mu)"
              )}
            />
            <br />• <strong>Tu resultado ({formatNum(results?.rho)}):</strong>{" "}
            Cada servidor está ocupado un{" "}
            {formatNum((results?.rho ?? 0) * 100, 2)}% del tiempo.
          </p>
          <p>
            <strong>Prob. Sistema Vacío (P₀):</strong>
            <br />• <strong>Fórmula:</strong> Se calcula usando una sumatoria
            (es la base para los demás cálculos).
            <br />• <strong>
              Tu resultado ({formatNum(results?.p0, 5)}):
            </strong>{" "}
            Hay un {formatNum((results?.p0 ?? 0) * 100, 2)}% de probabilidad de
            que esté vacío.
          </p>
        </div>
      ),
    },
    // Paso 4 (Explicación Ls y Lq)
    {
      title: "Análisis: Ls y Lq",
      targetId: "asistente-paso-3",
      position: "bottom-center",
      content: (
        <div>
          <p className="mb-2">
            <strong>Clientes en Sistema (Ls):</strong>
            <br />• <strong>Significado:</strong> El número *promedio* de
            clientes en el sistema (en cola + en servicio).
            <br />• <strong>Tu resultado ({formatNum(results?.ls)}):</strong> En
            promedio, hay {formatNum(results?.ls)} clientes en el sistema.
          </p>
          <p>
            <strong>Clientes en Cola (Lq):</strong>
            <br />• <strong>Significado:</strong> El número *promedio* de
            clientes solo en la cola.
            <br />• <strong>Tu resultado ({formatNum(results?.lq)}):</strong> En
            promedio, {formatNum(results?.lq)} clientes están esperando.
          </p>
        </div>
      ),
    },
    // Paso 5 (Explicación Ws y Wq)
    {
      title: "Análisis: Ws y Wq",
      targetId: "asistente-paso-3",
      position: "bottom-center",
      content: (
        <div>
          <p className="mb-2">
            <strong>Tiempo en Sistema (Ws):</strong>
            <br />• <strong>Fórmula (Ley de Little):</strong>{" "}
            <span
              dangerouslySetInnerHTML={renderMath(
                selectedModel === "MM1" || selectedModel === "MMc"
                  ? "W_s = L_s / \\lambda"
                  : "W_s = L_s / \\lambda_{eff}"
              )}
            />
            <br />• <strong>Tu resultado ({formatNum(results?.ws)}):</strong> Un
            cliente pasa en promedio {formatNum(results?.ws)} unidades de tiempo
            en el sistema.
          </p>
          <p>
            <strong>Tiempo en Cola (Wq):</strong>
            <br />• <strong>Fórmula (Ley de Little):</strong>{" "}
            <span
              dangerouslySetInnerHTML={renderMath(
                selectedModel === "MM1" || selectedModel === "MMc"
                  ? "W_q = L_q / \\lambda"
                  : "W_q = L_q / \\lambda_{eff}"
              )}
            />
            <br />• <strong>Tu resultado ({formatNum(results?.wq)}):</strong> Un
            cliente espera un promedio de {formatNum(results?.wq)} unidades de
            tiempo.
          </p>
        </div>
      ),
    },
    // Paso 6 (Explicación cBarra - Condicional)
    ...(selectedModel === "MMc" || selectedModel === "MMcN"
      ? [
          {
            title: "Análisis: Servidores Inactivos (c-barra)", // <-- CORREGIDO
            targetId: "asistente-paso-3",
            position: "bottom-center" as AssistantPosition,
            content: (
              <p>
                <strong>Servidores Inactivos Promedio (c-barra):</strong>
                <br />• <strong>Fórmula:</strong>{" "}
                <span
                  dangerouslySetInnerHTML={renderMath(
                    "\\bar{c} = \\sum_{n=0}^{c-1} (c-n)P_n"
                  )}
                />
                <br />• <strong>Significado:</strong> En promedio,{" "}
                <strong>{formatNum(results?.cBarra, 4)}</strong> de los{" "}
                {results?.params.c} servidores están libres.
              </p>
            ),
          },
        ]
      : []),
    // Paso 7 (Explicación Lambda Eff y Perdida - Condicional)
    ...(selectedModel === "MM1N" || selectedModel === "MMcN"
      ? [
          {
            title: "Análisis: Tasas Finitas",
            targetId: "asistente-paso-3",
            position: "bottom-center" as AssistantPosition,
            content: (
              <div>
                <p className="mb-2">
                  <strong>Tasa Efectiva de Llegada (λeff):</strong>
                  <br />• <strong>Fórmula:</strong>{" "}
                  <span
                    dangerouslySetInnerHTML={renderMath(
                      "\\lambda_{eff} = \\lambda (1 - P_N)"
                    )}
                  />
                  <br />• <strong>Significado:</strong> De los{" "}
                  {results?.params.lambda} clientes que llegan, solo{" "}
                  <strong>{formatNum(results?.lambdaEff)}</strong> logran
                  entrar.
                </p>
                <p>
                  <strong>Tasa de Llegada Perdida (λp):</strong>
                  <br />• <strong>Fórmula:</strong>{" "}
                  <span
                    dangerouslySetInnerHTML={renderMath(
                      "\\lambda_p = \\lambda - \\lambda_{eff}"
                    )}
                  />
                  <br />• <strong>Significado:</strong> En promedio,{" "}
                  <strong>{formatNum(results?.lambdaPerdida)}</strong> clientes
                  son rechazados.
                </p>
              </div>
            ),
          },
        ]
      : []),
    // Paso 8 (Tabla Pn)
    {
      title: "Paso 4: Distribución de Probabilidad",
      targetId: "asistente-paso-4",
      position: "top-left",
      content: (
        <p>
          Esta tabla muestra la probabilidad exacta (Absoluta) de encontrar 'n'
          clientes en el sistema, y la probabilidad (Acumulada) de encontrar 'n'
          clientes o menos.
        </p>
      ),
    },
    // Paso 9 (Calculadora Pn)
    {
      title: "Paso 5: Calculadora de Probabilidad",
      targetId: "asistente-paso-5",
      position: "top-left",
      content: (
        <p>
          Usa esta herramienta para encontrar probabilidades específicas (ej.
          P(n `{">"}` 3)) basadas en los resultados de la tabla.
        </p>
      ),
    },
    // Paso 10 (Reportes)
    {
      title: "Paso 6: Guardar Reporte",
      targetId: "asistente-paso-6", // <-- ID Actualizado
      position: "center-left",
      content: (
        <p>
          ¡Excelente! Has completado el análisis. Ahora puedes guardar un
          reporte formal en PDF o imprimirlo.
        </p>
      ),
    },
  ];

  // --- Lógica de Resaltado (Highlighting) ---
  useEffect(() => {
    if (!isAssistantActive) {
      document
        .querySelectorAll(".asistente-highlight")
        .forEach((el) => el.classList.remove("asistente-highlight"));
      return;
    }
    const currentStepInfo = assistantSteps[assistantStep];
    const targetId = currentStepInfo?.targetId;
    if (targetId) {
      document
        .querySelectorAll(".asistente-highlight")
        .forEach((el) => el.classList.remove("asistente-highlight"));
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.classList.add("asistente-highlight");
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isAssistantActive, assistantStep, results, assistantSteps]);

  // --- Handlers del Asistente ---
  const handleAssistantNext = () => {
    if (assistantStep === 1 && !results) {
      // Si está en el paso de parámetros y no hay resultados
      addToast({
        title: "Acción Requerida",
        description: "¡Presiona 'Calcular Métricas' para continuar!",
        color: "warning",
      });
      return;
    }
    if (assistantStep === assistantSteps.length - 1) {
      // Si está en el último paso
      handleAssistantSkip(); // "Finalizar" cierra la guía
      return;
    }
    setAssistantStep((s) => Math.min(s + 1, assistantSteps.length - 1));
  };

  const handleAssistantPrev = () => {
    setAssistantStep((s) => Math.max(s - 1, 0));
  };

  const handleAssistantSkip = () => {
    setIsAssistantActive(false);
    document.querySelectorAll(".asistente-highlight").forEach((el) => {
      el.classList.remove("asistente-highlight");
    });
  };

  // --- Lógica de Avance Automático ---
  useEffect(() => {
    if (isAssistantActive && results && assistantStep === 1) {
      setAssistantStep(2); // Avanzar de Parámetros (1) a Resultados (2)
    }
  }, [results, isAssistantActive, assistantStep]);

  return (
    <main className="container mx-auto px-4 py-8">
      <Header />
      <div className="flex justify-end my-4 no-print">
        {/*
    Este div envuelve el botón y el tooltip.
    'relative' permite posicionar el tooltip de forma absoluta.
    'group' permite que el tooltip reaccione al hover.
  */}
        <div className="relative inline-flex group">
          {/* --- El Tooltip --- */}
          <span
            className="
        absolute z-10 
        top-1/2 -translate-y-1/2 
        right-full mr-2
        px-3 py-1 
        text-sm text-white bg-unimar-secondary 
        rounded-md shadow-lg 
        scale-0 group-hover:scale-100
        transition-all"
            style={{ whiteSpace: "nowrap" }} // Evita que el texto se parta
          >
            {isAssistantActive
              ? "Desactivar el asistente de cálculos"
              : "Activar el asistente para guiarte en los cálculos"}
          </span>

          {/* --- Tu Botón (sin cambios) --- */}
          <Button
            variant={isAssistantActive ? "solid" : "bordered"}
            color="primary"
            className={
              isAssistantActive
                ? "bg-unimar-primary text-white"
                : "border-unimar-primary text-unimar-primary hover:bg-unimar-primary hover:text-white"
            }
            onPress={() => {
              setIsAssistantActive(!isAssistantActive);
              setAssistantStep(0);
              if (results) setResults(null);
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
            {isAssistantActive ? "Salir del Modo Guía" : "Iniciar Modo Guía"}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <div id="asistente-paso-1">
          <ModelSelector
            selectedModel={selectedModel}
            setSelectedModel={handleModelChange} // Usar el nuevo handler
          />
        </div>
        <div id="asistente-paso-2">
          <CalculatorForm
            selectedModel={selectedModel}
            key={selectedModel} // Key para limpiar inputs al cambiar modelo
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
            <div id="asistente-paso-3">
              <ResultsDisplay results={results} />
            </div>
            <div id="asistente-paso-4">
              <ProbabilityTable results={results} />
            </div>

            {/* --- NUEVO: Renderizar Calculadora Pn --- */}
            <div id="asistente-paso-5">
              <ProbabilityCalculator probabilities={results.probabilities} />
            </div>

            {/* --- MODIFICADO: ID actualizado --- */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-4 mt-8 bg-white shadow-lg rounded-xl py-4"
              id="asistente-paso-6" // <-- ID actualizado
            >
              <Button
                variant="bordered"
                color="primary"
                className="border-unimar-primary text-unimar-primary hover:bg-unimar-primary hover:text-white"
                onPress={handleGeneratePdf}
                startContent={
                  !isGeneratingPdf ? <Icon icon="ph:file-pdf-bold" /> : null
                }
                isLoading={isGeneratingPdf}
                isDisabled={!results || isLoading || isGeneratingPdf}
              >
                {isGeneratingPdf ? "Generando..." : "Generar Reporte PDF"}
              </Button>
              <Button
                variant="bordered"
                color="secondary"
                className="border-unimar-secondary text-unimar-secondary hover:bg-unimar-primary hover:text-white"
                onPress={handlePrint}
                startContent={<Icon icon="ph:printer-bold" />}
                isDisabled={!results || isLoading || isGeneratingPdf}
              >
                Imprimir Resultados
              </Button>
            </motion.div>
          </>
        )}
      </div>

      {/* --- Renderizado del Asistente (sin cambios) --- */}
      <AnimatePresence>
        {isAssistantActive && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-[9990] no-print"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleAssistantSkip}
            />
            <AssistantWindow
              title={assistantSteps[assistantStep]?.title || "Asistente"}
              content={assistantSteps[assistantStep]?.content || "..."}
              step={assistantStep}
              totalSteps={assistantSteps.length}
              onNext={handleAssistantNext}
              onPrev={handleAssistantPrev}
              onSkip={handleAssistantSkip}
              position={
                assistantSteps[assistantStep]?.position ||
                ("bottom-right" as AssistantPosition)
              }
            />
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
