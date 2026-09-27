import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build"
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    globals: true,
    setupFiles: "./src/test/setup.js"
  }
});
