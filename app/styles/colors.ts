/**
 * Elara frontend - Brand principal
 *
 * Este archivo centraliza todos los colores
 * utilizados en la aplicacion
 
*/


export const colors = {
    brand: {
        primary: "#4F758C",   // Nuestro azul medio
        accent: "#60BFA4",    // Nuestro turquesa verdoso
        dark: "#404759",      // Un gris azulado
        background: "#F9FAFB", // Fondo principal para modo claro
        darkBackground: "#1F2937", // Fondo oscuro, un negro azulado
    },

    // Estados y mensajes de la aplicación
    status: {
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6",
    },

    //Escala de grises para textos e interfaces
    gray: {
        text_primary: "#1F2937", // Texto principal sobre fondos claros
        text_secondary: "#6b7280",
        text_light: "#F9FAFB",   // Texto principal sobre fondos oscuros
        border: "#e5e7eb",
    },

    //Colores básicos
    base: {
        white: "#FFFFFF",
        black: "#000000"
    },
};

//Configuracion para ser consumida por Tailwind

export const tailwindColors = {
    'primary': colors.brand.primary,
    'accent': colors.brand.accent,
    'dark': colors.brand.dark,
    'background': colors.brand.background,
    'darkBackground': colors.brand.darkBackground,
    'success': colors.status.success,
    'error': colors.status.error,
    'warning': colors.status.warning,
    'info': colors.status.info,
    'text_primary': colors.gray.text_primary,
    'text_secondary': colors.gray.text_secondary,
    'text_light': colors.gray.text_light,
    'border': colors.gray.border,
    'white': colors.base.white,
    'black': colors.base.black
}