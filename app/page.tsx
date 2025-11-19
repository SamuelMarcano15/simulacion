"use client";

import React, { useState } from "react";
import { Sidebar, ViewType } from "@/components/Sidebar";
import { QueuingView } from "@/components/views/QueuingView";
import { MonteCarloView } from "@/components/views/MonteCarloView";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("QUEUING");

  return (
    // 1. Contenedor principal: Ocupa toda la pantalla y no tiene scroll global
    <div className="flex h-screen bg-unimar-background overflow-hidden">
      
      {/* 2. Sidebar Fija: Ancho fijo, altura completa */}
      <aside className="w-72 flex-shrink-0 h-full bg-white z-20 hidden md:block">
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView} 
        />
      </aside>

      {/* 3. Área de Contenido: Ocupa el resto y tiene su propio scroll */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Contenedor con scroll para las vistas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {currentView === "QUEUING" ? (
              <QueuingView />
            ) : (
              <MonteCarloView />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}