/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Base de negros en degradado (fondo de la app)
        base: {
          950: "#050608",
          900: "#0a0d12",
          850: "#0d111a",
          800: "#111621",
          700: "#161c2b",
          600: "#1c2436",
        },
        // Azul eléctrico (color primario de marca)
        electric: {
          50: "#e6f1ff",
          100: "#c2ddff",
          200: "#8fc0ff",
          300: "#5aa2ff",
          400: "#2f86ff",
          500: "#0d6bff", // primario
          600: "#0055e6",
          700: "#0043b3",
          800: "#003180",
          900: "#001f52",
        },
        // Acentos neón (resaltados, glow, estados activos)
        neon: {
          blue: "#00d9ff",
          cyan: "#37f0ff",
          violet: "#8b5cf6",
          green: "#39ff88",
          amber: "#ffcc33",
          pink: "#ff4fd8",
          red: "#ff3860",
        },
      },
      backgroundImage: {
        "app-gradient":
          "radial-gradient(circle at 20% 0%, #0d1b33 0%, #05060a 45%, #000000 100%)",
        "panel-gradient":
          "linear-gradient(160deg, #131a27 0%, #0b0e15 60%, #050608 100%)",
        "electric-gradient":
          "linear-gradient(135deg, #0d6bff 0%, #00d9ff 100%)",
        "sidebar-gradient":
          "linear-gradient(180deg, #0a0d15 0%, #05060a 100%)",
      },
      boxShadow: {
        "neon-blue": "0 0 8px rgba(0,217,255,0.55), 0 0 24px rgba(13,107,255,0.35)",
        "neon-blue-sm": "0 0 6px rgba(0,217,255,0.45)",
        "neon-violet": "0 0 8px rgba(139,92,246,0.55), 0 0 24px rgba(139,92,246,0.3)",
        "neon-green": "0 0 8px rgba(57,255,136,0.5), 0 0 20px rgba(57,255,136,0.25)",
        "neon-red": "0 0 8px rgba(255,56,96,0.5), 0 0 20px rgba(255,56,96,0.25)",
        "panel": "0 4px 24px rgba(0,0,0,0.5)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
