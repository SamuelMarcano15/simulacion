// components/views/RestaurantView.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Slider,
  Tooltip,
  Divider,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRestaurantSim } from "@/lib/hooks/useRestaurantSim";
import { RestaurantLayout } from "@/components/restaurant/RestaurantLayout";
import { RestaurantConfig } from "@/lib/types";
import { generatePdfReport, downloadPdf } from "@/lib/pdfGenerator";
// Importamos los componentes del asistente
import {
  AssistantWindow,
  AssistantPosition,
} from "@/components/AssistantWindow";

export const RestaurantView = () => {
  // --- ESTADOS DE CONFIGURACIÓN ---
  const [config, setConfig] = useState<RestaurantConfig>({
    tableCount: 8,
    queueLimit: 10,
    arrivalLambda: 15, // 15 clientes/hora
    serviceMu: 2,      // 2 clientes/hora por mesa
    simulationSpeed: 10, // x10 velocidad
  });

  // Instanciar el Motor de Simulación
  const { state, start, pause, stop, reset } = useRestaurantSim(config);

  // Estados locales para inputs
  const [localConfig, setLocalConfig] = useState(config);
  
  // Estado para PDF
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // --- ESTADOS DEL ASISTENTE ---
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [assistantStep, setAssistantStep] = useState(0);

  // Sincronizar config local cuando cambia la del hook
  useEffect(() => {
    if (!state.isRunning && !state.isPaused) {
       // Opcional: setLocalConfig(config); 
    }
  }, [state.isRunning, state.isPaused]);

  // --- HANDLERS ---
  const handleApplyConfig = () => {
    if (localConfig.tableCount < 4 || localConfig.tableCount > 20) {
      addToast({ title: "Error", description: "Las mesas deben ser entre 4 y 20.", color: "danger" });
      return;
    }
    if (localConfig.arrivalLambda <= 0 || localConfig.serviceMu <= 0) {
      addToast({ title: "Error", description: "Las tasas deben ser positivas.", color: "danger" });
      return;
    }
    setConfig(localConfig);
    reset(); 
    addToast({ title: "Configuración Aplicada", description: "Simulación reiniciada.", color: "success" });
    
    // Avance automático del asistente si está en el paso de configuración
    if (isAssistantActive && assistantStep === 1) {
        setAssistantStep(2);
    }
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const reportData = { state: state, config: config };
      const pdfBytes = await generatePdfReport(reportData);
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadPdf(pdfBytes, `Reporte_Restaurante_${timestamp}.pdf`);
      addToast({ title: "PDF Generado", color: "success" });
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", description: "Fallo al generar PDF", color: "danger" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatTime = (totalMinutes: number) => {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const mins = Math.floor(totalMinutes % 60);
    const startHour = 8;
    const currentHour = (startHour + hours) % 24;
    return `Día ${days + 1} - ${currentHour.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // --- CONFIGURACIÓN DEL ASISTENTE ---
  const assistantSteps = [
    {
      title: "Bienvenido al Simulador",
      targetId: "rest-header", // ID del Header
      position: "bottom-left" as AssistantPosition,
      content: (
        <p>
          Este es el módulo más avanzado. Aquí simularemos un restaurante paso a paso
          usando <strong>Eventos Discretos</strong>. Podrás ver visualmente cómo se comporta
          el sistema ante diferentes cargas de trabajo.
        </p>
      ),
    },
    {
      title: "1. Configura el Escenario",
      targetId: "rest-config-params", // ID del panel de parámetros
      position: "right-top" as AssistantPosition, // Ajustado para que se vea bien al lado del panel
      content: (
        <p>
          Define la estructura física y operativa:
          <br />• <strong>Mesas:</strong> Cantidad de servidores activos (4-20).
          <br />• <strong>Llegada (λ):</strong> Clientes por hora que entran.
          <br />• <strong>Servicio (μ):</strong> Clientes por hora que atiende 1 mesa.
          <br />• <strong>Cola (N):</strong> Capacidad máxima de espera.
          <br /><em>¡No olvides dar clic en "Aplicar Cambios"!</em>
        </p>
      ),
    },
    {
      title: "2. Controla el Tiempo",
      targetId: "rest-config-speed", // ID del slider de velocidad
      position: "top-left" as AssistantPosition,
      content: (
        <p>
          La simulación puede ser lenta o rápida.
          <br />• <strong>x1:</strong> Tiempo real (lento, para análisis detallado).
          <br />• <strong>x100:</strong> Avance rápido (para obtener resultados estadísticos pronto).
        </p>
      ),
    },
    {
      title: "3. Ejecuta la Simulación",
      targetId: "rest-controls", // ID de los botones play/pause
      position: "bottom-right" as AssistantPosition,
      content: (
        <p>
          Usa estos controles para <strong>Iniciar</strong>, <strong>Pausar</strong> o <strong>Reiniciar</strong> la simulación.
          <br />Observa cómo el reloj avanza en el panel superior.
        </p>
      ),
    },
    {
      title: "4. Métricas en Vivo (HUD)",
      targetId: "rest-hud", // ID del HUD superior
      position: "bottom-center" as AssistantPosition,
      content: (
        <p>
          Monitorea la salud del sistema en tiempo real:
          <br />• <strong>Tiempo:</strong> Reloj simulado.
          <br />• <strong>En Sistema:</strong> Total clientes (Mesas + Cola).
          <br />• <strong>Ocupación:</strong> % de uso de las mesas.
          <br />• <strong>Perdidos:</strong> Clientes rechazados por aforo lleno.
        </p>
      ),
    },
    {
      title: "5. Visualización (Drone View)",
      targetId: "rest-layout", // ID del área gráfica
      position: "top-left" as AssistantPosition,
      content: (
        <p>
          Aquí ocurre la magia. Observa los estados visuales:
          <br />🟢 <strong>Verde:</strong> Mesa Libre.
          <br />🔴 <strong>Rojo:</strong> Mesa Ocupada (Comiendo).
          <br />🟡 <strong>Amarillo:</strong> Mesa Sucia (Limpiando).
          <br />También verás la cola formarse en la recepción.
        </p>
      ),
    },
    {
      title: "6. Resultados y Reporte",
      targetId: "rest-stats-panel", // ID del panel de stats y botón PDF
      position: "right-bottom" as AssistantPosition,
      content: (
        <p>
          Al finalizar o pausar, revisa los promedios acumulados aquí.
          <br />Cuando estés satisfecho, genera el <strong>Reporte PDF</strong> profesional para entregar.
        </p>
      ),
    },
  ];

  // Efecto de resaltado
  useEffect(() => {
    if (!isAssistantActive) {
      document.querySelectorAll(".asistente-highlight").forEach((el) => el.classList.remove("asistente-highlight"));
      return;
    }
    const targetId = assistantSteps[assistantStep]?.targetId;
    if (targetId) {
      document.querySelectorAll(".asistente-highlight").forEach((el) => el.classList.remove("asistente-highlight"));
      const el = document.getElementById(targetId);
      if (el) {
        el.classList.add("asistente-highlight");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isAssistantActive, assistantStep, state]); // Dependencia 'state' para refrescar si cambia el layout

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 pb-12 h-[calc(100vh-100px)]"
    >
      {/* --- HEADER Y CONTROLES PRINCIPALES --- */}
      <header 
        id="rest-header" 
        className="bg-white p-4 shadow-sm rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-unimar-primary rounded-lg text-white">
            <Icon icon="ph:storefront-bold" className="text-2xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-unimar-primary font-headings leading-tight">
              Simulador de Restaurante
            </h1>
            <p className="text-xs text-gray-500">Proyecto Final - Eventos Discretos</p>
          </div>
        </div>

        {/* HUD: Métricas Rápidas */}
        <div id="rest-hud" className="flex gap-4 md:gap-8 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 transition-colors">
            <MetricBox icon="ph:clock-bold" label="Tiempo" value={formatTime(state.currentTime)} color="text-gray-700" />
            <MetricBox icon="ph:users-three-bold" label="En Sistema" value={`${state.activeCustomers.length + state.queue.length}`} color="text-unimar-primary" />
            <MetricBox icon="ph:chart-pie-slice-bold" label="Ocupación" value={`${(state.stats.utilization * 100).toFixed(1)}%`} color="text-blue-600" />
            <MetricBox icon="ph:warning-circle-bold" label="Perdidos" value={`${state.stats.customersLost}`} color="text-red-500" />
        </div>

        {/* Botones de Control y Asistente */}
        <div className="flex items-center gap-2">
          {/* Botón Asistente */}
          <div className="no-print">
            <Tooltip content="Guía paso a paso" color="foreground">
              <Button
                isIconOnly
                variant={isAssistantActive ? "solid" : "flat"}
                color="secondary"
                onPress={() => {
                  setIsAssistantActive(!isAssistantActive);
                  setAssistantStep(0);
                }}
              >
                <Icon icon="ph:chalkboard-teacher-bold" className="text-xl" />
              </Button>
            </Tooltip>
          </div>

          <div id="rest-controls" className="flex items-center gap-2 rounded-lg transition-colors p-1">
            {!state.isRunning || state.isPaused ? (
                <Button color="success" className="text-white font-bold" onPress={start} startContent={<Icon icon="ph:play-bold" />}>
                {state.isPaused ? "Reanudar" : "Iniciar"}
                </Button>
            ) : (
                <Button color="warning" className="text-white font-bold" onPress={pause} startContent={<Icon icon="ph:pause-bold" />}>
                Pausar
                </Button>
            )}
            <Tooltip content="Reiniciar simulación">
                <Button isIconOnly color="danger" variant="flat" onPress={reset}>
                <Icon icon="ph:arrow-counter-clockwise-bold" />
                </Button>
            </Tooltip>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* --- COLUMNA IZQUIERDA: CONFIGURACIÓN --- */}
        <Card className="w-full lg:w-80 flex-shrink-0 border border-gray-200 shadow-sm h-full overflow-y-auto">
          <CardBody className="p-5 gap-6">
            <div id="rest-config-params" className="transition-colors p-1 rounded-lg">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon icon="ph:sliders-horizontal-bold" /> Parámetros
              </h3>
              
              <div className="flex flex-col gap-4">
                <Input
                  label="Mesas (Servidores)"
                  type="number"
                  variant="bordered"
                  value={localConfig.tableCount.toString()}
                  onValueChange={(v) => setLocalConfig(prev => ({...prev, tableCount: parseInt(v) || 0}))}
                  description="Entre 4 y 20 mesas."
                  min={4} max={20}
                />
                
                <Input
                  label="Llegada (λ)"
                  type="number"
                  variant="bordered"
                  value={localConfig.arrivalLambda.toString()}
                  onValueChange={(v) => setLocalConfig(prev => ({...prev, arrivalLambda: parseFloat(v) || 0}))}
                  endContent={<span className="text-xs text-gray-400">cli/h</span>}
                />

                <Input
                  label="Servicio (μ por mesa)"
                  type="number"
                  variant="bordered"
                  value={localConfig.serviceMu.toString()}
                  onValueChange={(v) => setLocalConfig(prev => ({...prev, serviceMu: parseFloat(v) || 0}))}
                  endContent={<span className="text-xs text-gray-400">cli/h</span>}
                />

                <Input
                  label="Límite Cola (N)"
                  type="number"
                  variant="bordered"
                  value={localConfig.queueLimit?.toString() || ""}
                  onValueChange={(v) => setLocalConfig(prev => ({...prev, queueLimit: v ? parseInt(v) : undefined}))}
                  placeholder="Infinito"
                />
                
                <Button 
                    size="sm" 
                    color="primary" 
                    variant="flat" 
                    className="mt-2 font-semibold"
                    onPress={handleApplyConfig}
                >
                    Aplicar Cambios y Reiniciar
                </Button>
              </div>
            </div>

            <Divider />

            <div id="rest-config-speed" className="transition-colors p-1 rounded-lg">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon icon="ph:gauge-bold" /> Velocidad (x{config.simulationSpeed})
              </h3>
              <Slider 
                aria-label="Velocidad"
                step={1}
                maxValue={100}
                minValue={1}
                value={config.simulationSpeed}
                onChange={(v) => {
                    const val = Array.isArray(v) ? v[0] : v;
                    setConfig(prev => ({...prev, simulationSpeed: val}));
                }}
                className="max-w-md"
                color="secondary"
                size="sm"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Lento (x1)</span>
                <span>Rápido (x100)</span>
              </div>
            </div>

            <Divider />
            
            {/* Panel de Estadísticas y PDF */}
            <div id="rest-stats-panel" className="flex flex-col gap-4 transition-colors p-1 rounded-lg">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-500 mb-2">RESULTADOS ACUMULADOS</h4>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span>Clientes Atendidos:</span>
                            <span className="font-bold">{state.stats.customersServed}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tiempo Prom. Sistema:</span>
                            <span className="font-bold">{state.stats.avgSystemTime.toFixed(2)} min</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tiempo Prom. Cola:</span>
                            <span className="font-bold">{state.stats.avgWaitTime.toFixed(2)} min</span>
                        </div>
                    </div>
                </div>

                <Button
                  className="w-full font-bold shadow-sm"
                  color="secondary"
                  variant="solid"
                  onPress={handleGeneratePdf}
                  isLoading={isGeneratingPdf}
                  isDisabled={state.stats.totalCustomers === 0}
                  startContent={!isGeneratingPdf ? <Icon icon="ph:file-pdf-bold" className="text-lg"/> : null}
                >
                  {isGeneratingPdf ? "Generando..." : "Descargar Reporte PDF"}
                </Button>
            </div>

          </CardBody>
        </Card>

        {/* --- COLUMNA DERECHA: VISUALIZACIÓN --- */}
        <div id="rest-layout" className="flex-1 min-h-[500px] flex flex-col transition-colors rounded-xl">
            <RestaurantLayout state={state} />
        </div>

      </div>

      {/* --- ASISTENTE FLOTANTE --- */}
      <AnimatePresence>
        {isAssistantActive && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-[9990] no-print"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssistantActive(false)}
            />

            <AssistantWindow
              title={assistantSteps[assistantStep]?.title || "Asistente"}
              content={assistantSteps[assistantStep]?.content || "..."}
              step={assistantStep}
              totalSteps={assistantSteps.length}
              onNext={() => {
                if (assistantStep === assistantSteps.length - 1) {
                  setIsAssistantActive(false);
                } else {
                  setAssistantStep((s) => s + 1);
                }
              }}
              onPrev={() => setAssistantStep((s) => Math.max(s - 1, 0))}
              onSkip={() => setIsAssistantActive(false)}
              position={assistantSteps[assistantStep]?.position || "bottom-right"}
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Pequeño componente auxiliar para el HUD
const MetricBox = ({ icon, label, value, color }: { icon: string, label: string, value: string, color: string }) => (
    <div className="flex flex-col items-center min-w-[60px]">
        <div className="flex items-center gap-1 mb-0.5">
            <Icon icon={icon} className={`text-sm ${color}`} />
            <span className="text-[10px] font-semibold text-gray-400 uppercase">{label}</span>
        </div>
        <span className={`text-lg font-bold leading-none ${color}`}>{value}</span>
    </div>
);