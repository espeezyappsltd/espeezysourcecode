
import { defineConfig } from 'prisma/config';

export default defineConfig({
  // Use env var or hardcode for local dev
  datasource: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/espeezy_local',
  },
});
