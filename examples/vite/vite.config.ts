import { defineConfig } from "vite";

// Nothing special: the package must work in a plain Vite setup (ADR 0007).
export default defineConfig({ build: { target: "es2022" } });
