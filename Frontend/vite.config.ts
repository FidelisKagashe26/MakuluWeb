import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

const devApiTarget = process.env.VITE_DEV_API_TARGET || "http://localhost:5001";

export default defineConfig({
  plugins: [react()],
  cacheDir: ".vite-cache",
  server: {
    proxy: {
      "/api": {
        target: devApiTarget,
        changeOrigin: true
      },
      "/uploads": {
        target: devApiTarget,
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
