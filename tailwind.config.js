const { heroui } = require("@heroui/react");
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/entrypoints/popup/**/*.{html,tsx,css}",
    "./node_modules/@heroui/theme/dist/components/*.js",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#403E80",
        secondary: "#A94EFF",
        background: "#F9FAFB",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      keyframes: {
        fillUp: {
          "0%": { height: "0%" },
          "100%": { height: "100%" },
        },
        wave: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        fillUp: "fillUp 1s ease-out forwards",
        wave: "wave 2s infinite linear",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};
