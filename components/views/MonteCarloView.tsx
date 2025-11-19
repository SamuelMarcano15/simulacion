"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Divider, Input, Button, Select, SelectItem, addToast, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { DistributionType, MonteCarloResults } from "@/lib/types";
import { runMonteCarloSimulation } from "@/lib/monteCarlo"; 
import { MonteCarloResultsDisplay } from "@/components/MonteCarloResultsDisplay";
import { AssistantWindow, AssistantPosition } from "@/components/AssistantWindow";
import { generatePdfReport, downloadPdf } from "@/lib/pdfGenerator"; // <-- Importar generador

export const MonteCarloView = () => {
  const [distribution, setDistribution] = useState<DistributionType>("POISSON");
  const [lambda, setLambda] = useState("");
  const [nVariables, setNVariables] = useState("");
  const [nObservations, setNObservations] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // <-- Estado para carga de PDF
  const [results, setResults] = useState<MonteCarloResults | null>(null);

  // --- Estados del Asistente ---
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [assistantStep, setAssistantStep] = useState(0);

  const handleSimulate = () => {
    const lam = parseFloat(lambda);
    const vars = parseInt(nVariables);
    const obs = parseInt(nObservations);

    if (isNaN(lam) || lam <= 0) {
      addToast({ title: "Error", description: "Lambda debe ser un número positivo.", color: "danger" });
      return;
    }
    if (isNaN(vars) || vars < 1) {
      addToast({ title: "Error", description: "Debe haber al menos 1 variable.", color: "danger" });
      return;
    }
    if (isNaN(obs) || obs < 1) {
      addToast({ title: "Error", description: "Debe haber al menos 1 observación.", color: "danger" });
      return;
    }
    
    if (obs > 100000) {
        addToast({ title: "Aviso", description: "Máximo 100,000 observaciones permitidas por rendimiento.", color: "warning" });
        return;
    }

    setIsLoading(true);
    setResults(null); 
    
    setTimeout(() => {
        try {
            const simulationResults = runMonteCarloSimulation({
                distribution,
                lambda: lam,
                nVariables: vars,
                nObservations: obs
            });
            setResults(simulationResults);
            addToast({ title: "Éxito", description: "Simulación completada.", color: "success" });
            
            if (isAssistantActive && assistantStep === 1) {
                setAssistantStep(2);
            }
        } catch (e) {
            console.error(e);
            addToast({ title: "Error", description: "Falló la simulación.", color: "danger" });
        } finally {
            setIsLoading(false);
        }
    }, 500);
  };

  // --- MANEJADOR DE PDF ---
  const handleGeneratePdf = async () => {
    if (!results) return;
    setIsGeneratingPdf(true);
    try {
      const pdfBytes = await generatePdfReport(results);
      const timestamp = new Date().toISOString().slice(0, 10);
      // Nombre de archivo descriptivo
      const filename = `Simulacion_Montecarlo_${results.params.distribution}_${timestamp}.pdf`;
      downloadPdf(pdfBytes, filename);
      addToast({ title: "PDF Generado", color: "success" });
    } catch (error) {
      console.error(error);
      addToast({ title: "Error", description: "No se pudo generar el PDF.", color: "danger" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const assistantSteps = [
    { 
      title: "Paso 1: Configuración", 
      targetId: "mc-step-1", 
      position: "bottom-left" as AssistantPosition, 
      content: (
        <p>
          Define los parámetros de tu simulación:
          <br/>• <strong>Distribución:</strong> Elige Poisson (eventos discretos) o Exponencial (tiempo entre eventos).
          <br/>• <strong>Lambda (λ):</strong> La tasa media de ocurrencia.
          <br/>• <strong>Variables:</strong> Cuántas series independientes deseas generar.
          <br/>• <strong>Observaciones:</strong> Tamaño de la muestra (n).
        </p>
      )
    },
    { 
      title: "Paso 2: Ejecutar", 
      targetId: "mc-step-2", 
      position: "bottom-center" as AssistantPosition, 
      content: <p>Presiona el botón para generar los números aleatorios y simular las variables.</p> 
    },
    { 
      title: "Paso 3: Estadísticas", 
      targetId: "montecarlo-stats", 
      position: "bottom-center" as AssistantPosition, 
      content: (
        <p>
          Aquí verás un resumen estadístico de tus variables simuladas:
          <br/>• Media muestral vs. Teórica.
          <br/>• Desviación Estándar.
          <br/>• Valores Mínimos y Máximos generados.
        </p>
      ) 
    },
    { 
      title: "Paso 4: Base de Datos", 
      targetId: "montecarlo-table", 
      position: "top-left" as AssistantPosition, 
      content: (
        <p>
          Esta tabla muestra los datos generados.
          <br/>• <strong>R:</strong> El número aleatorio (0-1) generado.
          <br/>• <strong>V:</strong> El valor simulado resultante tras aplicar la transformada inversa o algoritmo correspondiente.
        </p>
      ) 
    },
    { 
      title: "Paso 5: Reporte", 
      targetId: "mc-step-5", 
      position: "center-left" as AssistantPosition, 
      content: <p>Descarga un PDF con todas las observaciones o imprime el reporte de la simulación.</p> 
    },
  ];

  useEffect(() => {
    if (!isAssistantActive) {
      document.querySelectorAll(".asistente-highlight").forEach((el) => el.classList.remove("asistente-highlight"));
      return;
    }
    const targetId = assistantSteps[assistantStep]?.targetId;
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.classList.add("asistente-highlight");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isAssistantActive, assistantStep, results]);

  return (
    <div className="flex-1 pb-12 relative">
      <header className="bg-unimar-primary p-4 shadow-md rounded-xl mb-6 flex justify-between items-center">
        <div className="flex-1 flex justify-center">
            <h1 className="text-2xl font-bold text-white text-center font-headings flex items-center gap-3">
            <Icon icon="ph:chart-line-up-bold" />
            Simulación de Montecarlo
            </h1>
        </div>
        
        <div className="no-print">
            <Tooltip content="Presiona el botón para ayudarte con el proceso" color="foreground" placement="bottom">
                <Button
                variant={isAssistantActive ? "solid" : "bordered"}
                className={isAssistantActive 
                    ? "bg-white text-unimar-secondary font-bold z-[9991] relative"
                    : "border-white text-white hover:bg-white/20"
                }
                size="sm"
                onPress={() => { setIsAssistantActive(!isAssistantActive); setAssistantStep(0); }}
                startContent={<Icon icon={isAssistantActive ? "ph:chalkboard-teacher-fill" : "ph:student-bold"} />}
                >
                {isAssistantActive ? "Salir Guía" : "Modo Guía"}
                </Button>
            </Tooltip>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-lg border border-gray-200">
          <CardHeader>
            <h2 className="text-xl font-semibold text-unimar-primary font-headings px-2">
              Configuración de la Simulación
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div id="mc-step-1" className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-lg p-2 transition-colors">
                <Select 
                label="Distribución a Simular" 
                placeholder="Seleccione una distribución"
                selectedKeys={[distribution]}
                onChange={(e) => setDistribution(e.target.value as DistributionType)}
                variant="bordered"
                >
                <SelectItem key="POISSON" textValue="Poisson">Poisson</SelectItem>
                <SelectItem key="EXPONENTIAL" textValue="Exponencial">Exponencial</SelectItem>
                </Select>

                <Input
                label="Parámetro Lambda (λ)"
                placeholder="Tasa media (ej. 5)"
                type="number"
                variant="bordered"
                value={lambda}
                onValueChange={setLambda}
                min={0}
                />

                <Input
                label="Variables a Simular"
                placeholder="Cantidad de variables (ej. 2)"
                type="number"
                variant="bordered"
                value={nVariables}
                onValueChange={setNVariables}
                description="Número de variables independientes a generar."
                min={1}
                />

                <Input
                label="Observaciones (Iteraciones)"
                placeholder="Cantidad (ej. 1000)"
                type="number"
                variant="bordered"
                value={nObservations}
                onValueChange={setNObservations}
                description="Total de iteraciones para la simulación."
                min={1}
                />
            </div>

            <div id="mc-step-2" className="md:col-span-2 flex justify-end mt-4 bg-white rounded-lg p-2 transition-colors">
              <Button 
                color="primary" 
                className="bg-unimar-primary text-white font-bold w-full md:w-auto"
                size="lg"
                onPress={handleSimulate}
                isLoading={isLoading}
                startContent={!isLoading && <Icon icon="ph:play-circle-bold" className="text-xl"/>}
              >
                {isLoading ? "Simulando..." : "Ejecutar Simulación"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
      
      {results && (
          <div className="mt-8">
             <MonteCarloResultsDisplay results={results} />
             
             {/* Botones de Reporte (Paso 5) */}
             <div id="mc-step-5" className="bg-transparent rounded-lg p-2 transition-colors">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.6 }} 
                    className="flex justify-center gap-4 mt-6 bg-white shadow-lg rounded-xl py-4"
                >
                    <Button 
                        variant="bordered" 
                        color="primary" 
                        onPress={handleGeneratePdf} 
                        isLoading={isGeneratingPdf} 
                        startContent={!isGeneratingPdf ? <Icon icon="ph:file-pdf-bold" /> : null}
                    >
                        Generar Reporte PDF
                    </Button>
                    <Button 
                        variant="bordered" 
                        color="secondary" 
                        onPress={() => window.print()} 
                        startContent={<Icon icon="ph:printer-bold" />}
                    >
                        Imprimir Resultados
                    </Button>
                </motion.div>
             </div>
          </div>
      )}

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
                  if (assistantStep === 1 && !results) {
                      addToast({ title: "Acción Requerida", description: "Ejecuta la simulación primero.", color: "warning" });
                      return;
                  }
                  // Cerrar si es el último paso
                  if (assistantStep === assistantSteps.length - 1) {
                      setIsAssistantActive(false);
                  } else {
                      setAssistantStep(s => s + 1);
                  }
              }}
              onPrev={() => setAssistantStep(s => Math.max(s - 1, 0))}
              onSkip={() => setIsAssistantActive(false)}
              position={assistantSteps[assistantStep].position}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};