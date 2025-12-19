import dotenv from 'dotenv';

export interface AppConfig {
  jellyseerrUrl: string;
  jellyseerrApiKey: string;
  timeoutMs: number;
}

export function loadConfig(): AppConfig {
  dotenv.config();

  const jellyseerrUrl = (process.env.JELLYSEERR_URL || '').trim().replace(/\/$/, '');
  const jellyseerrApiKey = (process.env.JELLYSEERR_API_KEY || '').trim();
  const timeoutValue = (process.env.JELLYSEERR_TIMEOUT || '').trim();

  if (!jellyseerrUrl || !jellyseerrApiKey) {
    throw new Error(
      'Missing configuration. Please set JELLYSEERR_URL and JELLYSEERR_API_KEY environment variables.',
    );
  }

  const timeoutMs = Number(timeoutValue) > 0 ? Number(timeoutValue) * 1000 : 15000;

  return {
    jellyseerrUrl,
    jellyseerrApiKey,
    timeoutMs,
  };
}
