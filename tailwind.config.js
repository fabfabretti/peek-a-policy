const { heroui } = require("@heroui/react");
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/popup/**/*.{html,tsx,css}",
    "./node_modules/@heroui/theme/dist/components/*.js",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui()],
};
