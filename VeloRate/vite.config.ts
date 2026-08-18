import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      srcDirectory: "app",
      server: { entry: "server" }
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    host: "::",
    port: 8080
  }
});
