import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import path from 'node:path';
import { env, ROOT } from './env.js';
import { prisma } from './db.js';
import { handleRouteError, registerRoutes } from './routes.js';

const app = Fastify({ logger: !env.isProd });

await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cors, {
  origin: env.isProd ? env.appUrl : true,
  credentials: true,
});
await app.register(cookie);
await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
await registerRoutes(app);

app.setErrorHandler((error, request, reply) => handleRouteError(error, reply, request));

if (env.isProd) {
  const dist = path.join(ROOT, 'dist');
  await app.register(staticFiles, { root: dist, prefix: '/' });
  app.setNotFoundHandler((request, reply) => {
    if (request.raw.url?.startsWith('/api/')) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return reply.sendFile('index.html');
  });
}

const shutdown = async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ port: env.port, host: '0.0.0.0' });
console.log(`MovieTix API ready on http://127.0.0.1:${env.port}`);
