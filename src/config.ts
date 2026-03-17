const DEFAULT_API_URL = 'http://localhost:3000';

function readStringEnv(key: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[key];
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readBooleanEnv(key: keyof ImportMetaEnv, fallback: boolean): boolean {
  const value = readStringEnv(key);
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
}

export const API_URL = readStringEnv('VITE_API_URL') ?? DEFAULT_API_URL;
export const ENABLE_MOCK_MODE = import.meta.env.DEV && readBooleanEnv('VITE_ENABLE_MOCK_MODE', false);

export const FIREBASE_ENV = {
  apiKey: readStringEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readStringEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readStringEnv('VITE_FIREBASE_PROJECT_ID'),
  appId: readStringEnv('VITE_FIREBASE_APP_ID'),
} as const;

export const HAS_FIREBASE_ENV = Object.values(FIREBASE_ENV).every(Boolean);
