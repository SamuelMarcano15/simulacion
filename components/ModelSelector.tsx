"use client"; // Necesario para componentes interactivos

import React from 'react';
import { Tabs, Tab } from "@heroui/react";
import { motion } from 'framer-motion';

interface ModelSelectorProps {
  selectedModel: 'infinite' | 'finite';
  setSelectedModel: (model: 'infinite' | 'finite') => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, setSelectedModel }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex w-full flex-col items-center mb-6"
    >
      <Tabs
        aria-label="Seleccionar Modelo de Cola"
        selectedKey={selectedModel}
        onSelectionChange={(key) => setSelectedModel(key as 'infinite' | 'finite')}
        color="primary" // Usa el color primario de HeroUI (configurable globalmente o adaptar a UNIMAR si es necesario)
        size="lg"
      >
        <Tab key="infinite" title="Modelo M/M/1 (Cola Infinita)" />
        <Tab key="finite" title="Modelo M/M/1/N (Cola Finita)" />
      </Tabs>
    </motion.div>
  );
};