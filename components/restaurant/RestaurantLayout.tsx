// components/restaurant/RestaurantLayout.tsx
"use client";

import React from "react";
import { Card, CardBody, Tooltip, Badge } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { RestaurantState, TableEntity, CustomerEntity } from "@/lib/types";

interface RestaurantLayoutProps {
  state: RestaurantState;
}

export const RestaurantLayout: React.FC<RestaurantLayoutProps> = ({ state }) => {
  return (
    <div className="flex flex-col h-full gap-4 p-2">
      {/* --- ZONA 1: COCINA Y BARRA (Fondo) --- */}
      <div className="flex gap-4 h-24">
        {/* Cocina */}
        <Card className="flex-1 bg-gray-100 border-b-4 border-unimar-secondary shadow-sm">
          <CardBody className="flex flex-row items-center justify-center gap-4 p-2 overflow-hidden relative">
            <Icon
              icon="ph:cooking-pot-bold"
              className="absolute text-gray-200 text-8xl -left-4 -bottom-4 rotate-12"
            />
            <div className="z-10 flex flex-col items-center">
              <h3 className="font-headings font-bold text-gray-500 uppercase tracking-widest text-sm">
                Cocina
              </h3>
              <div className="flex gap-2 mt-1">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-green-500"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="w-3 h-3 rounded-full bg-orange-500"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Barra */}
        <Card className="w-1/3 bg-gray-800 border-b-4 border-unimar-accent shadow-sm">
          <CardBody className="flex items-center justify-center p-2 relative overflow-hidden">
            <Icon
              icon="ph:martini-bold"
              className="absolute text-gray-700 text-7xl -right-2 -top-2 rotate-12"
            />
            <div className="z-10 text-center">
              <h3 className="font-headings font-bold text-gray-300 uppercase tracking-widest text-sm">
                Barra
              </h3>
              <p className="text-xs text-gray-500">Bebidas & Café</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* --- ZONA 2: SALÓN Y RECEPCIÓN --- */}
      <div className="flex flex-1 gap-4 min-h-[400px]">
        {/* RECEPCIÓN (Cola) */}
        <Card className="w-24 md:w-32 bg-orange-50 border-r-2 border-orange-200 shadow-inner flex-shrink-0 z-20">
          <CardBody className="p-2 flex flex-col items-center relative h-full">
            <div className="text-center mb-4 border-b border-orange-200 w-full pb-2">
              <span className="text-xs font-bold text-orange-800 block">
                RECEPCIÓN
              </span>
              <span className="text-[10px] text-orange-600">
                Cola: {state.queue.length}
              </span>
            </div>

            {/* Visualización de la Cola */}
            {/* IMPORTANTE: layout="position" permite que se reacomoden suavemente */}
            <div className="flex flex-col-reverse gap-1 w-full items-center overflow-y-auto flex-1 no-scrollbar pb-2">
              <AnimatePresence mode="popLayout">
                {state.queue.map((customer) => (
                  <motion.div
                    key={customer.id}
                    layoutId={`customer-${customer.id}`} // IDENTIFICADOR MAGICO PARA LA ANIMACION
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }} // Se desvanece si se va, o se mueve si cambia de layoutId
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative shrink-0"
                  >
                    <Tooltip content={`Cliente #${customer.id}`}>
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full border-2 border-orange-400 flex items-center justify-center shadow-sm z-10">
                        <Icon icon="ph:user-bold" className="text-orange-500" />
                      </div>
                    </Tooltip>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {state.queue.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-xs text-gray-400 text-center mt-10 italic"
                >
                  Cola vacía
                </motion.div>
              )}
            </div>
            
            <div className="absolute bottom-0 w-full h-2 bg-red-800/20" />
          </CardBody>
        </Card>

        {/* SALÓN (Mesas) */}
        <Card className="flex-1 bg-white border border-gray-200 shadow-inner relative overflow-hidden z-10">
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
          />
          
          <CardBody className="p-4 md:p-8 z-10 overflow-y-auto">
            <motion.div 
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10 justify-items-center"
            >
              {state.tables.map((table) => (
                <TableComponent 
                  key={table.id} 
                  table={table} 
                  // Pasamos la lista de clientes activos para buscar quién está sentado aquí
                  activeCustomer={state.activeCustomers.find(c => c.id === table.currentCustomerId)}
                />
              ))}
            </motion.div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

// --- Componente Individual de Mesa ---
const TableComponent: React.FC<{ table: TableEntity, activeCustomer?: CustomerEntity }> = ({ table, activeCustomer }) => {
  const getTableStyles = (status: TableEntity['status']) => {
    switch (status) {
      case 'OCCUPIED':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          statusText: 'Ocupada',
          badgeColor: "danger" as const
        };
      case 'DIRTY':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          statusText: 'Limpiando...',
          badgeColor: "warning" as const
        };
      case 'FREE':
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-300',
          statusText: 'Libre',
          badgeColor: "success" as const
        };
    }
  };

  const styles = getTableStyles(table.status);

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative group"
    >
      {/* Mesa (Base) */}
      <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full ${styles.bg} border-4 ${styles.border} flex flex-col items-center justify-center shadow-md relative transition-colors duration-500`}>
        
        {/* Sillas */}
        <div className="absolute -top-3 w-10 h-3 bg-gray-300 rounded-full" />
        <div className="absolute -bottom-3 w-10 h-3 bg-gray-300 rounded-full" />
        <div className="absolute -left-3 h-10 w-3 bg-gray-300 rounded-full" />
        <div className="absolute -right-3 h-10 w-3 bg-gray-300 rounded-full" />

        {/* --- AQUÍ OCURRE LA MAGIA DEL "WALKING" --- */}
        <AnimatePresence>
          {activeCustomer ? (
            // Si hay cliente, mostramos el Avatar con el MISMO layoutId que tenía en la cola
            <motion.div
              key={activeCustomer.id}
              layoutId={`customer-${activeCustomer.id}`} 
              className="absolute z-20"
              initial={{ opacity: 0, scale: 0.5 }} // Si aparece de la nada (ej. carga inicial)
              animate={{ opacity: 1, scale: 1.5 }} // Escala un poco más grande en la mesa
              exit={{ opacity: 0, scale: 0 }} // Al irse, se desvanece
              transition={{ 
                type: "spring", 
                stiffness: 150, // Menos rigidez = movimiento más lento y visible
                damping: 20 
              }}
            >
               <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center shadow-lg">
                  <Icon icon="ph:user-fill" className="text-blue-600" />
               </div>
            </motion.div>
          ) : (
            // Si no hay cliente, mostramos el icono por defecto de la mesa o limpieza
            <motion.div 
                key="empty-icon"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
            >
                <Icon 
                    icon={table.status === 'DIRTY' ? "ph:sparkle-fill" : "ph:chair-bold"} 
                    className={`text-3xl ${table.status === 'DIRTY' ? 'text-yellow-600' : 'text-green-500'}`} 
                />
                {table.status === 'FREE' && <span className="text-[10px] font-bold text-gray-400 mt-1">#{table.id}</span>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicador de Progreso Circular (Timer) */}
        {table.remainingTime > 0 && (
           <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
             <circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke={table.status === 'OCCUPIED' ? '#ef4444' : '#eab308'} 
                strokeWidth="4"
                strokeDasharray="289" // 2 * PI * 46
                // Animación simple CSS para dar feedback de que el tiempo corre
                className="animate-[spin_4s_linear_infinite]"
                strokeOpacity="0.3"
             />
           </svg>
        )}
      </div>

      {/* Badge de Estado */}
      <div className="absolute -top-4 -right-4 z-30">
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm border border-white ${
            table.status === 'FREE' ? 'bg-green-500' : 
            table.status === 'OCCUPIED' ? 'bg-red-500' : 'bg-yellow-500'
        }`}>
            {styles.statusText}
        </div>
      </div>
    </motion.div>
  );
};