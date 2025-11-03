// components/ModelSelector.tsx
"use client";

import React from "react";
import { Tabs, Tab } from "@heroui/react";
import { motion } from "framer-motion";

// --- MODIFICADO: Tipo para 4 modelos ---
export type ModelType = "MM1" | "MM1N" | "MMc" | "MMcN";

interface ModelSelectorProps {
  selectedModel: ModelType;
  setSelectedModel: (model: ModelType) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  setSelectedModel,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex w-full py-4 flex-col items-center mb-6 bg-white shadow-lg rounded-xl"
    >
      <Tabs
        aria-label="Seleccionar Modelo de Cola"
        selectedKey={selectedModel}
        onSelectionChange={(key) => setSelectedModel(key as ModelType)}
        color="primary"
        size="lg"
        variant="underlined" // Un estilo diferente para 4 tabs
      >
        <Tab key="MM1" title="M/M/1 (Infinita)" />
        <Tab key="MM1N" title="M/M/1/N (Finita)" />
        <Tab key="MMc" title="M/M/c (Infinita)" />
        <Tab key="MMcN" title="M/M/c/N (Finita)" />
      </Tabs>
    </motion.div>
  );
};
