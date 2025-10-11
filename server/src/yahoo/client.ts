import axios from 'axios';
import dayjs from 'dayjs';
import fs from 'fs-extra';
import path from 'path';
import YahooFantasy from 'yahoo-fantasy';

export interface TokenSet {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: string;
  token_type?: string;
  xoauth_yahoo_guid?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
  xoauth_yahoo_guid?: string;
}

const tokenStorePath = path.resolve(process.cwd(), process.env.TOKEN_STORE ?? '.data/yahoo_tokens.json');

let cachedTokenSet: TokenSet | null = null;
let cachedClient: YahooFantasy | null = null;

function requireEnv(key: keyof NodeJS.ProcessEnv): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function isExpired(token: TokenSet): boolean {
  return dayjs(token.expires_at).isBefore(dayjs().add(30, 'second'));
}

async function readTokenSet(): Promise<TokenSet | null> {
  if (cachedTokenSet) {
    return cachedTokenSet;
  }

  if (!(await fs.pathExists(tokenStorePath))) {
    return null;
  }

  const content = await fs.readFile(tokenStorePath, 'utf8');
  try {
    const parsed = JSON.parse(content) as TokenSet;
    cachedTokenSet = parsed;
    return parsed;
  } catch (err) {
    console.warn('Unable to parse token store, ignoring and starting fresh.');
    return null;
  }
}

async function writeTokenSet(token: TokenSet): Promise<void> {
  await fs.ensureDir(path.dirname(tokenStorePath));
  await fs.writeJson(tokenStorePath, token, { spaces: 2 });
  cachedTokenSet = token;
}

function mapResponseToTokenSet(response: TokenResponse, previous?: TokenSet | null): TokenSet {
  const refreshToken = response.refresh_token ?? previous?.refresh_token;
  if (!refreshToken) {
    throw new Error('Yahoo response did not include a refresh token.');
  }

  return {
    access_token: response.access_token,
    refresh_token: refreshToken,
    expires_in: response.expires_in,
    expires_at: dayjs().add(response.expires_in, 'second').toISOString(),
    token_type: response.token_type,
    xoauth_yahoo_guid: response.xoauth_yahoo_guid ?? previous?.xoauth_yahoo_guid
  };
}

async function requestToken(params: URLSearchParams, previous?: TokenSet | null): Promise<TokenSet> {
  const clientId = requireEnv('YAHOO_CLIENT_ID');
  const clientSecret = requireEnv('YAHOO_CLIENT_SECRET');

  const authorization = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');

  try {
    const { data } = await axios.post<TokenResponse>('https://api.login.yahoo.com/oauth2/get_token', params.toString(), {
      headers: {
        Authorization: `Basic ${authorization}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return mapResponseToTokenSet(data, previous ?? undefined);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data ?? error.message;
      throw new Error(`Failed to obtain Yahoo token: ${JSON.stringify(message)}`);
    }
    throw error;
  }
}

export async function exchangeAuthorizationCode(code: string): Promise<TokenSet> {
  const redirectUri = requireEnv('YAHOO_REDIRECT_URI');
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri
  });

  const tokenSet = await requestToken(params);
  await writeTokenSet(tokenSet);
  return tokenSet;
}

export async function refreshAccessToken(): Promise<TokenSet> {
  const current = await readTokenSet();
  if (!current) {
    throw new Error('No Yahoo tokens available to refresh.');
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: current.refresh_token
  });

  const tokenSet = await requestToken(params, current);
  await writeTokenSet(tokenSet);
  return tokenSet;
}

async function ensureFreshToken(): Promise<TokenSet | null> {
  const existing = await readTokenSet();
  if (!existing) {
    return null;
  }
  if (!isExpired(existing)) {
    return existing;
  }

  try {
    return await refreshAccessToken();
  } catch (err) {
    console.error('Failed to refresh Yahoo access token:', err);
    throw err;
  }
}

export async function getYahooClient(): Promise<YahooFantasy> {
  if (!cachedClient) {
    const clientId = requireEnv('YAHOO_CLIENT_ID');
    const clientSecret = requireEnv('YAHOO_CLIENT_SECRET');
    cachedClient = new YahooFantasy(clientId, clientSecret);
  }

  const token = await ensureFreshToken();
  if (token) {
    cachedClient.setUserToken(token.access_token);
  }

  return cachedClient;
}

function tokenExpired(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as Record<string, unknown>;
  const message = typeof candidate.message === 'string' ? candidate.message : '';
  if (message.includes('token_expired')) {
    return true;
  }

  const status = (candidate.status as number | undefined) ?? (candidate.statusCode as number | undefined);
  if (status === 401) {
    return true;
  }

  const potentialDescriptions: Array<unknown> = [];

  if (typeof (candidate as { error_description?: unknown }).error_description === 'string') {
    potentialDescriptions.push((candidate as { error_description: string }).error_description);
  }

  const data = candidate.data as Record<string, unknown> | undefined;
  if (data) {
    if (typeof (data as { error_description?: unknown }).error_description === 'string') {
      potentialDescriptions.push((data as { error_description: string }).error_description);
    }

    const nestedError = data.error as Record<string, unknown> | undefined;
    if (nestedError && typeof nestedError.description === 'string') {
      potentialDescriptions.push(nestedError.description);
    }
  }

  return potentialDescriptions.some((value) => typeof value === 'string' && value.includes('token_expired'));
}

export async function withYahooClient<T>(fn: (client: YahooFantasy) => Promise<T>): Promise<T> {
  const client = await getYahooClient();
  let token = await readTokenSet();
  if (!token) {
    throw Object.assign(new Error('Yahoo account not connected.'), { status: 401 });
  }

  client.setUserToken(token.access_token);

  try {
    return await fn(client);
  } catch (err) {
    if (!tokenExpired(err)) {
      throw err;
    }

    token = await refreshAccessToken();
    client.setUserToken(token.access_token);
    return await fn(client);
  }
}

async function getAuthenticatedToken(): Promise<TokenSet> {
  const token = await ensureFreshToken();
  if (!token) {
    throw Object.assign(new Error('Yahoo account not connected.'), { status: 401 });
  }
  return token;
}

export async function fetchNbaGameResource(): Promise<unknown> {
  const token = await getAuthenticatedToken();
  try {
    const { data } = await axios.get('https://fantasysports.yahooapis.com/fantasy/v2/game/nba', {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: 'application/json'
      }
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data ?? error.message;
      throw Object.assign(new Error(`Failed to fetch Yahoo Fantasy game data: ${JSON.stringify(message)}`), {
        status: error.response?.status
      });
    }
    throw error;
  }
}
