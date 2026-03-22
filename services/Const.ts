// Environment variables loaded from .env.local
// Note: Variables prefixed with VITE_ are exposed to the browser by Vite

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Gemini API Key (if needed in browser context)
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Environment mode (development, production, etc.)
export const ENV_MODE = import.meta.env.MODE;

// Check if we're in development mode
export const IS_DEV = import.meta.env.DEV;

// Check if we're in production mode
export const IS_PROD = import.meta.env.PROD;

export const AUTH_KEY = 'exbuilder_auth_user';

// App configuration object
export const APP_CONFIG = {
  apiBaseUrl: API_BASE_URL,
  geminiApiKey: GEMINI_API_KEY,
  authKey : AUTH_KEY,
  mode: ENV_MODE,
  isDev: IS_DEV,
  isProd: IS_PROD,
};