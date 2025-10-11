import { Router } from 'express';
import crypto from 'crypto';
import { exchangeAuthorizationCode } from '../yahoo/client';

const router = Router();

const AUTHORIZE_URL = 'https://api.login.yahoo.com/oauth2/request_auth';
const AUTH_COOKIE = 'yf_auth';
const DEFAULT_SCOPE = 'openid fspt-r profile email';

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

router.get('/auth/yahoo', (req, res, next) => {
  const clientId = requireEnv('YAHOO_CLIENT_ID');
  const redirectUri = requireEnv('YAHOO_REDIRECT_URI');
  const scope = process.env.YAHOO_SCOPE ?? DEFAULT_SCOPE;

  const state = crypto.randomBytes(16).toString('hex');
  if (!req.session) {
    return next(new Error('Session is required for Yahoo OAuth state handling.'));
  }

  req.session.yahooOAuthState = state;

  const authorizeUrl = new URL(AUTHORIZE_URL);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', scope);
  authorizeUrl.searchParams.set('state', state);

  console.log('Redirecting to Yahoo authorization endpoint.', {
    redirect_uri: redirectUri,
    scope,
    authorize_url: authorizeUrl.toString()
  });

  req.session.save((err) => {
    if (err) {
      return next(err);
    }
    res.redirect(authorizeUrl.toString());
  });
});

router.get('/auth/login', (_req, res) => {
  res.redirect('/auth/yahoo');
});

router.get('/login/oauth2/code/yahoo', async (req, res, next) => {
  const { code, state, error, error_description: errorDescription } = req.query;
  const redirectUri = requireEnv('YAHOO_REDIRECT_URI');
  const scope = process.env.YAHOO_SCOPE ?? DEFAULT_SCOPE;

  if (error) {
    console.error('Yahoo authorization returned an error.', {
      error,
      error_description: errorDescription,
      redirect_uri: redirectUri,
      scope
    });
    return res.status(400).send(`Yahoo authorization failed: ${errorDescription ?? error}`);
  }

  if (!code || typeof code !== 'string') {
    console.error('Yahoo authorization callback missing code parameter.', {
      redirect_uri: redirectUri,
      scope,
      state
    });
    return res.status(400).send('Missing OAuth code.');
  }

  if (!req.session) {
    return next(new Error('Session is required for Yahoo OAuth state handling.'));
  }

  const expectedState = req.session.yahooOAuthState;
  if (!state || typeof state !== 'string' || !expectedState || state !== expectedState) {
    return res.status(400).send('OAuth state mismatch. Please start again.');
  }

  try {
    await exchangeAuthorizationCode(code);
    delete req.session.yahooOAuthState;
    req.session.save((err) => {
      if (err) {
        return next(err);
      }

      res.cookie(AUTH_COOKIE, 'true', {
        httpOnly: false,
        sameSite: 'lax',
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.redirect(getPostLoginRedirect());
    });
  } catch (err) {
    next(err);
  }
});

export default router;
export { router };
