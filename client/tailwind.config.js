/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#f9f9f9",
        surface: "#ffffff",
        primary: "#bc0002",
        "primary-container": "#e22619",
        secondary: "#2c4bdb",
        tertiary: "#715d00",
        "surface-container": "#eeeeee",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Space Grotesk", "monospace"]
      },
      borderRadius: {
        // El diseño no permite bordes redondeados
        DEFAULT: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        full: "0px"
      }
    },
  },
  plugins: [],
}
