"use client"; // Necesario para useState y handlers

import React, { useState, useEffect } from 'react';
import { Spinner, Button, addToast } from '@heroui/react'; // Importar Spinner y Button
import { Icon } from '@iconify/react';

import { Header } from '@/components/Header'; // Asumiendo que lo creaste
import { ModelSelector } from '@/components/ModelSelector';
import { CalculatorForm } from '@/components/CalculatorForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { ProbabilityTable } from '@/components/ProbabilityTable';
import { QueueModelParams, QueueModelResults, CalculationError } from '@/lib/types'; // Importar tipos
import { motion, AnimatePresence } from 'framer-motion';

// Placeholder para las funciones de cálculo (las crearemos en la siguiente fase)
import { calculateMM1Infinite, calculateMM1Finite } from '@/lib/queuingModels'; 
import { generatePdfReport, downloadPdf } from '@/lib/pdfGenerator';
import { AssistantWindow, AssistantPosition } from '@/components/AssistantWindow';


const formatNum = (num?: number, decimals = 4): string => {
  if (num === undefined || num === null || isNaN(num)) return '-';
  if (Math.abs(num) < 1e-6 && num !== 0) {
      return num.toExponential(decimals > 0 ? decimals -1 : 0);
  }
  return num.toFixed(decimals);
};

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<'infinite' | 'finite'>('infinite');
  const [results, setResults] = useState<QueueModelResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [assistantStep, setAssistantStep] = useState(0);
  // No necesitamos un estado de error separado, usaremos toasts

  const handleCalculate = (params: QueueModelParams) => {
    setIsLoading(true);
    setResults(null); // Limpiar resultados anteriores

    // Simular un pequeño retraso para mostrar el spinner
    setTimeout(() => {
      try {
        let calculationResult: QueueModelResults | CalculationError;

        if (selectedModel === 'infinite') {
          calculationResult = calculateMM1Infinite(params.lambda, params.mu);
        } else {
          // Asegurarse de que N está definido para el modelo finito
          if (params.N === undefined) {
             throw new Error("El parámetro N (Capacidad del Sistema) es requerido para el modelo de cola finita.");
          }
          calculationResult = calculateMM1Finite(params.lambda, params.mu, params.N);
        }

        // Verificar si el resultado es un error
        if ('message' in calculationResult) {
          addToast({ title: "Error en el Cálculo", description: calculationResult.message, color: "danger" });
          setResults(null);
        } else {
          setResults(calculationResult);
           addToast({ title: "Cálculo Exitoso", description: "Métricas generadas correctamente.", color: "success" });
        }

      } catch (error: any) {
        console.error("Error inesperado:", error);
        addToast({ title: "Error Inesperado", description: error.message || "Ocurrió un error al procesar la solicitud.", color: "danger" });
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Pequeño delay artificial
  };

  // Funciones placeholder para PDF e Impresión (implementar en Fase 5)
  const handleGeneratePdf = async () => { // <-- Hacerla async
    if (!results) {
         addToast({ title: "Sin Resultados", description: "Calcula las métricas primero.", color: "warning" });
        return;
    };

    setIsGeneratingPdf(true); // Iniciar estado de carga del botón
     addToast({ title: "Generando PDF...", description: "Por favor espera.", color: "warning" });


    try {
      const pdfBytes = await generatePdfReport(results);
      const modelName = results.modelType === 'finite' ? `MM1N${results.params.N}` : 'MM1';
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      downloadPdf(pdfBytes, `Reporte_Colas_${modelName}_${timestamp}.pdf`);
      addToast({ title: "PDF Generado", description: "La descarga debería comenzar.", color: "success" });
    } catch (error) {
       console.error("Error generando PDF:", error);
       addToast({ title: "Error", description: "No se pudo generar el PDF.", color: "danger" });
    } finally {
        setIsGeneratingPdf(false); // Finalizar estado de carga
    }
  };

   const handlePrint = () => {
         if (!results) {
             addToast({ title: "Sin Resultados", description: "Calcula las métricas primero.", color: "warning" });
            return;
         };
        window.print(); // Llama a la función de impresión del navegador
    };

  // --- LÓGICA Y GUIÓN DEL ASISTENTE ---
 const assistantSteps: {
    title: string;
    targetId: string;
    content: React.ReactNode;
    position: AssistantPosition; // <-- Asegura que 'position' sea del tipo correcto
  }[] = [
    // Paso 0
    {
      title: "Paso 1: Elige el Modelo",
      targetId: "asistente-paso-1",
      position: 'bottom-right', // Ahora TypeScript sabe que esto debe ser 'AssistantPosition'
      content: (
        <p>
          ¡Hola! Soy tu asistente. Primero, elige el modelo de cola que quieres resolver.
          <br />• <strong>M/M/1 (Cola Infinita)</strong>: Un servidor, llegadas y servicios de Poisson, y la cola puede crecer sin límite.
          <br />• <strong>M/M/1/N (Cola Finita)</strong>: Igual, pero el sistema solo acepta un máximo de <strong>N</strong> clientes (en cola + en servicio).
        </p>
      )
    },
    // Paso 1
    {
      title: "Paso 2: Ingresa los Parámetros",
      targetId: "asistente-paso-2",
      position: 'top-left',
      content: (
         <p>
          Ahora, ingresa las tasas medias:
          <br />• <strong>Tasa de Llegada (λ)</strong>: Cuántos clientes llegan por unidad de tiempo (ej. 4 clientes/hora).
          <br />• <strong>Tasa de Servicio (μ)</strong>: Cuántos clientes puede atender el servidor en esa misma unidad de tiempo (ej. 6 clientes/hora).
          <br />• <strong>Capacidad (N)</strong>: Si elegiste cola finita, este es el número máximo total en el sistema.
        </p>
      )
    },
    // Paso 2 (Post-cálculo)
    {
      title: "Paso 3: ¡Resultados del Modelo!",
      targetId: "asistente-paso-3",
      position: 'bottom-center',
      content: (
        <p>
          ¡Genial! Aquí están tus métricas clave. Te explicaré las más importantes:
        </p>
      )
    },
     // Paso 3 (Explicación Rho y P0)
    {
      title: "Análisis: ρ y P₀",
      targetId: "asistente-paso-3",
      position: 'bottom-center',
      content: (
        <div>
          <p className="mb-2">
            <strong>Factor de Utilización (ρ):</strong> Muestra qué tan ocupado está el servidor.
            <br />• <strong>Fórmula:</strong> {'$\\rho = \\lambda / \\mu$'}
            <br />• <strong>Tu resultado ({formatNum(results?.rho)}):</strong> El servidor está ocupado un {formatNum((results?.rho ?? 0) * 100, 2)}% del tiempo.
          </p>
          <p>
            <strong>Prob. Sistema Vacío (P₀):</strong> La probabilidad de que no haya nadie en el sistema.
            <br />• <strong>Fórmula (Infinita):</strong> {'$P_0 = 1 - \\rho$'}
            <br />• <strong>Fórmula (Finita):</strong> Usa una fórmula más compleja con N.
            <br />• <strong>Tu resultado ({formatNum(results?.p0, 5)}):</strong> Hay un {formatNum((results?.p0 ?? 0) * 100, 2)}% de probabilidad de que esté vacío.
          </p>
        </div>
      )
    },
     // Paso 4 (Explicación Ls y Lq)
    {
      title: "Análisis: Ls y Lq",
      targetId: "asistente-paso-3",
      position: 'bottom-center',
      content: (
        <div>
          <p className="mb-2">
            <strong>Clientes en Sistema (Ls):</strong> El número *promedio* de clientes en el sistema (en cola + siendo atendido).
            <br />• <strong>Fórmula (Infinita):</strong> {'$L_s = \\rho / (1 - \\rho)$'}
            <br />• <strong>Tu resultado ({formatNum(results?.ls)}):</strong> En promedio, hay {formatNum(results?.ls)} clientes en el sistema.
          </p>
          <p>
            <strong>Clientes en Cola (Lq):</strong> El número *promedio* de clientes solo en la cola.
            <br />• <strong>Fórmula (Infinita):</strong> {'$L_q = \\rho^2 / (1 - \\rho)$'}
            <br />• <strong>Tu resultado ({formatNum(results?.lq)}):</strong> En promedio, {formatNum(results?.lq)} clientes están esperando.
          </p>
        </div>
      )
    },
    // Paso 5 (Explicación Ws y Wq)
    {
      title: "Análisis: Ws y Wq",
      targetId: "asistente-paso-3",
      position: 'bottom-center',
      content: (
        <div>
          <p className="mb-2">
            <strong>Tiempo en Sistema (Ws):</strong> El tiempo *promedio* que un cliente pasa en total (esperando + servicio).
            <br />• <strong>Fórmula:</strong> {'$W_s = L_s / \\lambda_{eff}$ (o $\\lambda$ en cola infinita)'}
            <br />• <strong>Tu resultado ({formatNum(results?.ws)}):</strong> Un cliente pasa en promedio {formatNum(results?.ws)} unidades de tiempo en el sistema.
          </p>
          <p>
            <strong>Tiempo en Cola (Wq):</strong> El tiempo *promedio* que un cliente pasa *esperando* en la cola.
            <br />• <strong>Fórmula:</strong> {'$W_q = L_q / \\lambda_{eff}$ (o $\\lambda$ en cola infinita)'}
            <br />• <strong>Tu resultado ({formatNum(results?.wq)}):</strong> Un cliente espera un promedio de {formatNum(results?.wq)} unidades de tiempo.
          </p>
        </div>
      )
    },
     // Paso 6 (Explicación Lambda Eff - Condicional)
    ...(selectedModel === 'finite' ? [{
      title: "Análisis: λ efectiva",
      targetId: "asistente-paso-3",
      position: 'bottom-center' as AssistantPosition, // 'as' sigue siendo necesario aquí por el spread (...)
      content: (
        <p>
          <strong>Tasa Efectiva de Llegada (λeff):</strong> Esta métrica es clave en colas finitas. Como el sistema se puede llenar (con N clientes), algunas llegadas son rechazadas.
          <br />• <strong>Definición:</strong> Es la tasa *real* de clientes que logran entrar al sistema.
          <br />• <strong>Fórmula:</strong> {'$\\lambda_{eff} = \\lambda \\times (1 - P_N)$'}
          <br />• <strong>Tu resultado ({formatNum(results?.lambdaEff)}):</strong> De los {results?.params.lambda} clientes que llegan por unidad de tiempo, solo {formatNum(results?.lambdaEff)} logran entrar en promedio.
        </p>
      )
    }] : []),
     // Paso 7 (Tabla Pn)
    {
      title: "Paso 4: Distribución de Probabilidad",
      targetId: "asistente-paso-4",
      position: 'top-left',
      content: (
        <p>
          Esta tabla muestra el detalle de las probabilidades.
          <br />• <strong>P(n) (Absoluta):</strong> Es la probabilidad exacta de encontrar 'n' clientes en el sistema en un momento dado.
          <br />• <strong>P(acumulada):</strong> Es la probabilidad de encontrar 'n' clientes *o menos*.
        </p>
      )
    },
     // Paso 8 (Reportes)
    {
      title: "Paso 5: Guardar Reporte",
      targetId: "asistente-paso-5",
      position: 'center-left',
      content: (
        <p>
          ¡Excelente! Has completado el análisis. Ahora puedes guardar un reporte formal de estos resultados en formato PDF o imprimirlo directamente.
          <br /><br />
          ¡Fin de la guía!
        </p>
      )
    }
  ];

  // --- Lógica de Resaltado (Highlighting) ---
  useEffect(() => {
    if (!isAssistantActive) {
      document.querySelectorAll('.asistente-highlight').forEach((el) => {
        el.classList.remove('asistente-highlight');
      });
      return;
    }

    const currentStepInfo = assistantSteps[assistantStep];
    const targetId = currentStepInfo?.targetId;

    if (targetId) {
      document.querySelectorAll('.asistente-highlight').forEach((el) => {
        el.classList.remove('asistente-highlight');
      });

      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.classList.add('asistente-highlight');
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isAssistantActive, assistantStep, results, assistantSteps]); // <- Añadido assistantSteps como dependencia

  // --- Handlers de Navegación del Asistente ---
  const handleAssistantNext = () => {
     if (assistantStep === 1 && !results) { 
       addToast({ title: "Acción Requerida", description: "¡Presiona 'Calcular Métricas' para continuar la guía!", color: "warning" });
       return; // No avanzar
     }
     
     // Si estamos en el último paso, llamamos a onSkip para cerrar
     if (assistantStep === assistantSteps.length - 1) {
         handleAssistantSkip();
         return;
     }

    setAssistantStep(s => Math.min(s + 1, assistantSteps.length - 1));
  };
  
  const handleAssistantPrev = () => {
    setAssistantStep(s => Math.max(s - 1, 0));
  };

  const handleAssistantSkip = () => {
    setIsAssistantActive(false);
    document.querySelectorAll('.asistente-highlight').forEach((el) => {
      el.classList.remove('asistente-highlight');
    });
  };
  
  // --- Lógica para avanzar automáticamente después del cálculo ---
  useEffect(() => {
      if (isAssistantActive && results && assistantStep === 1) {
          setAssistantStep(2); // Avanzar automáticamente al Paso 3 (Explicación)
      }
  }, [results, isAssistantActive, assistantStep]);
  

  return (
    <main className="container mx-auto px-4 py-8">
      <Header /> {/* Opcional */}

      <div className="flex justify-end my-4 no-print"> {/* no-print para ocultarlo al imprimir */}
      <Button
        variant={isAssistantActive ? "solid" : "bordered"}
        color="primary"
        className={isAssistantActive ? "bg-unimar-primary text-white" : "border-unimar-primary text-unimar-primary"}
        onPress={() => {
          setIsAssistantActive(!isAssistantActive);
          setAssistantStep(0); // Reiniciar el tour cada vez que se activa
          if (results) setResults(null); // Limpiar resultados para el tour
        }}
        startContent={<Icon icon={isAssistantActive ? "ph:chalkboard-teacher-fill" : "ph:student-bold"} />}
      >
        {isAssistantActive ? "Salir del Modo Guía" : "Iniciar Modo Guía"}
      </Button>
    </div>

      <div className="mt-8">
        <div id="asistente-paso-1"> 
          <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
      </div>
      <div id="asistente-paso-2"> 
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
            <div id="asistente-paso-3"> {/* ID para ResultsDisplay */}
              <ResultsDisplay results={results} />
            </div>
            <div id="asistente-paso-4"> {/* ID para ProbabilityTable */}
              <ProbabilityTable results={results} />
            </div>

             {/* Botones de acción */}
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center gap-4 mt-8"
                id="asistente-paso-5"
             >
                 <Button
                    variant="bordered"
                    color="primary"
                    className="border-unimar-primary text-unimar-primary"
                    onPress={handleGeneratePdf}
                    startContent={!isGeneratingPdf ? <Icon icon="ph:file-pdf-bold" /> : null}
                    isLoading={isGeneratingPdf} // <-- Usar estado isLoading
                    isDisabled={!results || isLoading || isGeneratingPdf} // <-- Deshabilitar si no hay resultados o está cargando
                >
                    {isGeneratingPdf ? 'Generando...' : 'Generar Reporte PDF'}
                </Button>
                  <Button
                    variant="bordered"
                    color="secondary"
                    className="border-unimar-secondary text-unimar-secondary"
                    onPress={handlePrint} // <-- Aún placeholder
                    startContent={<Icon icon="ph:printer-bold" />}
                    isDisabled={!results || isLoading || isGeneratingPdf} // <-- Deshabilitar
                >
                Imprimir Resultados
             </Button>
            </motion.div>
          </>
        )}
      </div>
    <AnimatePresence>
        {isAssistantActive && (
          <>
            {/* 1. El Overlay Oscuro */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-[9990] no-print"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleAssistantSkip} // Permite cerrar haciendo clic fuera
            />

            {/* 2. La Ventana del Asistente (pasando la nueva prop 'position') */}
            <AssistantWindow
              title={assistantSteps[assistantStep]?.title || "Asistente"}
              content={assistantSteps[assistantStep]?.content || "..."}
              step={assistantStep}
              totalSteps={assistantSteps.length}
              onNext={handleAssistantNext}
              onPrev={handleAssistantPrev}
              onSkip={handleAssistantSkip}
              // --- Pasa la posición del paso actual ---
              position={assistantSteps[assistantStep]?.position || 'bottom-right' as AssistantPosition}
            />
          </>
        )}
      </AnimatePresence>
    </main>
  );
}