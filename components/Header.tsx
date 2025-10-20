import React from 'react';

export const Header = () => {
  return (
    <header className="bg-unimar-primary p-4 shadow-md">
      <h1 className="text-2xl font-bold text-white text-center font-headings">
        Calculadora de Líneas de Espera M/M/1
      </h1>
      {/* Podrías agregar el logo de UNIMAR aquí si lo tienes en /public */}
      {/* <img src="/logo-unimar.png" alt="UNIMAR Logo" className="h-8 mx-auto mt-2"/> */}
    </header>
  );
};