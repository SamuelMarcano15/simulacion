'use client'
import { Button } from "@heroui/react";

export default function Home() {
  return (
    <>
     <main className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <h1 className="text-4xl font-headings text-gray-text-primary">
        Probando el Botón de HeroUI
      </h1>
      
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Usamos los props `color` y `variant` que investigaste */}
        <Button  color="primary" className="bg-primary" variant="solid" onPress={() => alert("Botón Primario")}>
          Botón Primario
        </Button>

        <Button color="secondary" variant="bordered">
          Botón Secundario
        </Button>

        <Button color="success" variant="flat">
          Botón de Éxito
        </Button>
        
        <Button color="warning" variant="ghost">
          Botón de Advertencia
        </Button>

        <Button color="danger" variant="shadow" isLoading>
          Cargando...
        </Button>
      </div>
    </main>
    </>
  );
}
