import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import path from 'node:path';
import { env, ROOT } from './env.js';
import { handleRouteError, registerRoutes } from './routes.js';

export async function buildApp(opts: { serveStatic?: boolean } = {}) {
  const app = Fastify({
    logger: !env.isProd,
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: true,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
  await registerRoutes(app);
  app.setErrorHandler((error, request, reply) => handleRouteError(error, reply, request));

  if (opts.serveStatic) {
    const dist = path.join(ROOT, 'dist');
    await app.register(staticFiles, { root: dist, prefix: '/' });
    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith('/api/')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
