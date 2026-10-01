import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Base "/JurisControle/" garante que os assets funcionem quando publicado
// em https://1colossos.github.io/JurisControle/ (GitHub Pages).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  base: process.env.GITHUB_PAGES === "true" ? "/JurisControle/" : "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          charts: ["recharts"],
        },
      },
    },
  },
});
