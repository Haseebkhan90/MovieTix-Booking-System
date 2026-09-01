import { env } from './env.js';
import { prisma } from './db.js';
import { buildApp } from './app.js';

const app = await buildApp({ serveStatic: env.isProd });

const shutdown = async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ port: env.port, host: '0.0.0.0' });
console.log(`MovieTix API ready on http://127.0.0.1:${env.port}`);
