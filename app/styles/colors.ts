

export const colors = {
    unimar: {
          primary: '#0B508C',      // Azul Principal
          secondary: '#3C74A6',   // Azul Secundario
          accent: '#7EA1BF',       // Azul Acento
          background: '#F2F2F2', // Fondo Claro (Podrías usar 'white' o 'gray-100' también)
          textDark: '#262626',     // Texto Oscuro
          // Puedes añadir variantes si lo necesitas, ej: primary-dark, primary-light
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
    'primary': colors.unimar.primary,
    'accent': colors.unimar.accent,
    'dark': colors.unimar.textDark,
    'background': colors.unimar.background,
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