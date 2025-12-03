// components/Sidebar.tsx
"use client";

import React from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

// Actualizamos el tipo para incluir la nueva vista
export type ViewType = "QUEUING" | "MONTECARLO" | "RESTAURANT";

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    {
      id: "QUEUING" as ViewType,
      label: "Teoría de Colas",
      icon: "ph:users-three-bold",
      description: "Modelos M/M/1 y M/M/c",
    },
    {
      id: "MONTECARLO" as ViewType,
      label: "Simulación Montecarlo",
      icon: "ph:chart-line-up-bold",
      description: "Poisson y Exponencial",
    },
    {
      id: "RESTAURANT" as ViewType,
      label: "Simulador Restaurante",
      icon: "ph:storefront-bold",
      description: "Eventos Discretos",
    },
  ];

  return (
    <div className="h-full w-full">
      <Card className="h-full bg-white border-r border-gray-200 rounded-none shadow-none">
        <CardBody className="p-4">
          <div className="mb-8 px-2 flex items-center gap-2 text-unimar-primary mt-5">
             <Icon icon="ph:calculator-fill" className="text-3xl" />
             <span className="font-headings font-bold text-xl">SYOP</span>
          </div>

          <div className="mb-4 px-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Módulos
            </h2>
          </div>
          
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "solid" : "light"}
                  color="primary"
                  className={`justify-start h-auto py-3 px-4 ${
                    isActive
                      ? "bg-unimar-primary text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onPress={() => onViewChange(item.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      icon={item.icon}
                      className={`text-2xl ${isActive ? "text-white" : "text-unimar-primary"}`}
                    />
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-sm">{item.label}</span>
                      <span className={`text-xs ${isActive ? "text-gray-200" : "text-gray-400"}`}>
                        {item.description}
                      </span>
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute right-0 w-1 h-full bg-unimar-accent rounded-l"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </Button>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};