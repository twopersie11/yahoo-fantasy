import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs-extra';
import https from 'https';
import path from 'path';
import yahooAuthRouter from './auth/yahoo';
import { withYahooClient } from './yahoo/client';

loadEnv();

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  } else {
    require('dotenv').config();
  }
}

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    },
    credentials: true,
    exposedHeaders: ['set-cookie']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));

app.get('/', (_req, res) => {
  res.send('Yahoo Fantasy development backend is running. Visit /auth/login to start OAuth.');
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use(yahooAuthRouter);

app.get('/api/me/leagues', async (_req, res, next) => {
  try {
    const data = await withYahooClient((client) => client.user.game_leagues('nba'));
    res.json(data);
  } catch (err) {
    if ((err as { status?: number }).status === 401) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    next(err);
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({ error: err.message ?? 'Internal Server Error' });
});

function resolvePath(target: string): string {
  return path.isAbsolute(target) ? target : path.resolve(process.cwd(), target);
}

async function start(): Promise<void> {
  const port = Number(process.env.PORT ?? 8443);
  const keySetting = process.env.TLS_KEY;
  const crtSetting = process.env.TLS_CRT;

  if (!keySetting || !crtSetting) {
    throw new Error('TLS_KEY and TLS_CRT must be configured in the environment');
  }

  const keyPath = resolvePath(keySetting);
  const crtPath = resolvePath(crtSetting);

  const [key, cert] = await Promise.all([fs.readFile(keyPath), fs.readFile(crtPath)]);

  https
    .createServer({ key, cert }, app)
    .listen(port, () => {
      console.log(`HTTPS listening at https://localhost:${port}`);
    });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exitCode = 1;
});
