// Vitest configuration
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup-server.js"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 45000,
  },
});
