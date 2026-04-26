import { loadEnvFile } from "node:process";
import { defineConfig, env } from "prisma/config";

try {
  loadEnvFile();
} catch {
  // Next and deployed environments can provide DATABASE_URL directly.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
