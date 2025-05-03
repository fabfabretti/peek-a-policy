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
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};
