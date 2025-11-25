import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // This is used by Prisma CLI (migrate, introspect, etc.)
    url: env('DATABASE_URL'),
  },
});