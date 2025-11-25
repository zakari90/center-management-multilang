import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',  // path to schema
  datasource: {
    url: env('DATABASE_URL'),      // correct singular property name
  },
  migrations: {
    path: 'prisma/migrations',
  },
});
