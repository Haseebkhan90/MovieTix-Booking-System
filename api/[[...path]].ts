import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../server/app.js';

let appPromise: Promise<FastifyInstance> | undefined;

const getApp = () => {
  if (!appPromise) {
    appPromise = buildApp({ serveStatic: false }).then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  app.server.emit('request', req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 10,
};
