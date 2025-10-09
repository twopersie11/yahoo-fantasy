export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      YAHOO_CLIENT_ID: string;
      YAHOO_CLIENT_SECRET: string;
      YAHOO_REDIRECT_URI: string;
      CORS_ORIGINS?: string;
      SESSION_SECRET?: string;
      TOKEN_STORE?: string;
      TLS_KEY: string;
      TLS_CRT: string;
      POST_LOGIN_REDIRECT?: string;
    }
  }
}
