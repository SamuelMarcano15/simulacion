// app/components/AssistantWindow.tsx
"use client";

import React from "react";
import { Card, CardBody, CardFooter, Button, Divider } from "@heroui/react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

// 1. Definir los tipos de posición que aceptaremos
export type AssistantPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center"
  | "center-left";

interface AssistantWindowProps {
  title: string;
  content: React.ReactNode;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  position: AssistantPosition; // 2. Añadir la prop 'position'
}

// 3. Función helper para obtener las clases de Tailwind según la posición
const getPositionClasses = (pos: AssistantPosition): string => {
  switch (pos) {
    case "top-left":
      return "top-4 left-4";
    case "top-right":
      return "top-4 right-4";
    case "bottom-left":
      return "bottom-4 left-4";
    case "bottom-center":
      return "bottom-4 left-1/2 -translate-x-1/2"; // Centrado horizontal
    case "center-left":
      return "top-1/2 left-4 -translate-y-1/2"; // Centrado vertical
    case "bottom-right":
    default:
      return "bottom-4 right-4";
  }
};

export const AssistantWindow: React.FC<AssistantWindowProps> = ({
  title,
  content,
  step,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  position, // Recibir la prop
}) => {
  return (
    <motion.div
      // 4. Aplicar las clases dinámicas de posición y eliminar la altura fija 'h-60'
      className={`fixed ${getPositionClasses(
        position
      )} w-full max-w-lg z-[9999] no-print`}
      // 5. Cambiar la animación a un fade-in/slide-up genérico
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      // Key prop para forzar la re-animación si la posición cambia (opcional pero bueno)
      key={position}
    >
      <Card className="shadow-2xl border-2 border-unimar-primary bg-white">
        <CardBody className="p-5 relative">
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="absolute top-2 right-2 text-gray-500 hover:text-unimar-primary"
            onPress={onSkip}
            aria-label="Cerrar asistente"
          >
            <Icon icon="ph:x-bold" />
          </Button>

          <div className="flex items-center gap-3 mb-2 pr-6">
            <Icon
              icon="ph:chalkboard-teacher-bold"
              className="text-unimar-primary text-3xl"
            />
            <h3 className="text-lg font-bold font-headings text-unimar-primary">
              {title}
            </h3>
          </div>
          <Divider className="my-2" />
          {/* 6. Aumentar el max-h para más contenido, h-60 era el problema */}
          <div className="text-sm text-unimar-textDark max-h-60 overflow-y-auto pr-2">
            {content}
          </div>
        </CardBody>
        <CardFooter className="flex justify-between items-center p-3 bg-gray-50">
          <Button size="sm" variant="light" color="secondary" onPress={onSkip}>
            Omitir Guía
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {step + 1} / {totalSteps}
            </span>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={onPrev}
              isDisabled={step === 0}
            >
              <Icon icon="ph:arrow-left-bold" />
            </Button>
            <Button
              size="sm"
              color="primary"
              className="bg-unimar-primary text-white"
              onPress={onNext} // Ajuste: Habilitar el último 'Siguiente' para que se convierta en 'Finalizar' o se oculte
            >
              {step === totalSteps - 1 ? "Finalizar" : "Siguiente"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
