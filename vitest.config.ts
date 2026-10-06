import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    // Password/security tests intentionally exercise scrypt and can be CPU-heavy in CI.
    testTimeout: 30_000,
    // JSON adapters (.data/*.json) are process-shared on disk — parallel files race resets.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./tests/server-only-stub.ts"),
    },
  },
});
