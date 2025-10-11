import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import fs from 'fs-extra';
import https from 'https';
import path from 'path';
import yahooAuthRouter from './auth/yahoo';
import { fetchNbaGameResource, withYahooClient } from './yahoo/client';

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

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be configured to enable Yahoo OAuth sessions.');
}

app.use(
  session({
    name: 'yf.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 10 * 60 * 1000
    }
  })
);

app.get('/', (_req, res) => {
  res.send('Yahoo Fantasy development backend is running. Visit /auth/yahoo to start OAuth.');
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

app.get('/api/yahoo/game/nba', async (_req, res, next) => {
  try {
    const data = await fetchNbaGameResource();
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
  const defaultKey = path.resolve(__dirname, '../certs/dev/key.pem');
  const defaultCert = path.resolve(__dirname, '../certs/dev/cert.pem');
  const keySetting = process.env.TLS_KEY ?? defaultKey;
  const crtSetting = process.env.TLS_CRT ?? defaultCert;

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
