import { Router } from 'express';
import crypto from 'crypto';
import { exchangeAuthorizationCode } from '../yahoo/client';

const router = Router();

const AUTHORIZE_URL = 'https://api.login.yahoo.com/oauth2/request_auth';
const STATE_COOKIE = 'yahoo_oauth_state';
const AUTH_COOKIE = 'yf_auth';

function requireEnv(key: keyof NodeJS.ProcessEnv): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getPostLoginRedirect(): string {
  const configured = process.env.POST_LOGIN_REDIRECT;
  if (configured) {
    return configured;
  }
  const origins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);
  return origins && origins.length > 0 ? origins[0] : '/';
}

router.get('/auth/login', (req, res) => {
  const clientId = requireEnv('YAHOO_CLIENT_ID');
  const redirectUri = requireEnv('YAHOO_REDIRECT_URI');

  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    signed: Boolean(process.env.SESSION_SECRET),
    sameSite: 'lax',
    secure: true,
    maxAge: 5 * 60 * 1000
  });

  const authorizeUrl = new URL(AUTHORIZE_URL);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'fspt-r fspt-w');
  authorizeUrl.searchParams.set('state', state);

  res.redirect(authorizeUrl.toString());
});

router.get('/login/oauth2/code/yahoo', async (req, res, next) => {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    return res.status(400).send(`Yahoo authorization failed: ${errorDescription ?? error}`);
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing OAuth code.');
  }

  const expectedState = (req.signedCookies ?? {})[STATE_COOKIE] ?? (req.cookies ?? {})[STATE_COOKIE];
  if (!state || typeof state !== 'string' || !expectedState || state !== expectedState) {
    return res.status(400).send('OAuth state mismatch. Please start again.');
  }

  try {
    await exchangeAuthorizationCode(code);
    res.clearCookie(STATE_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      signed: Boolean(process.env.SESSION_SECRET)
    });
    res.cookie(AUTH_COOKIE, 'true', {
      httpOnly: false,
      sameSite: 'lax',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(getPostLoginRedirect());
  } catch (err) {
    next(err);
  }
});

export default router;
export { router };
