import { URL } from 'node:url';

import type { AppConfig } from './config.js';

export interface JellyseerrApi {
  request: <T>(
    method: string,
    endpoint: string,
    params?: Record<string, unknown> | null,
    body?: Record<string, unknown> | null,
  ) => Promise<T>;
  searchMedia: (query: string, limit?: number) => Promise<unknown>;
  requestMedia: (mediaId: number, mediaType: string, is4k?: boolean) => Promise<unknown>;
  getRequest: (requestId: number) => Promise<unknown>;
  close: () => void;
}

export class JellyseerrClient implements JellyseerrApi {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(config: AppConfig) {
    this.baseUrl = `${config.jellyseerrUrl}/api/v1`;
    this.headers = {
      'X-Api-Key': config.jellyseerrApiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    this.timeoutMs = config.timeoutMs;
  }

  close(): void {
    // No persistent connections to dispose for fetch; method kept for API parity.
  }

  async request<T>(
    method: string,
    endpoint: string,
    params?: Record<string, unknown> | null,
    body?: Record<string, unknown> | null,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint.replace(/^\//, '')}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(
          `Jellyseerr API error for ${method.toUpperCase()} ${url}: ${response.status} - ${text}`,
        );
      }

      return text ? (JSON.parse(text) as T) : ({} as T);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Jellyseerr request timed out after ${this.timeoutMs}ms`);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error while contacting Jellyseerr');
    } finally {
      clearTimeout(timeout);
    }
  }

  async searchMedia(query: string, limit = 20): Promise<unknown> {
    if (!query.trim()) {
      throw new Error('Query cannot be empty');
    }
    return this.request('GET', 'search', { query: query.trim(), limit });
  }

  async requestMedia(mediaId: number, mediaType: string, is4k = false): Promise<unknown> {
    if (!mediaId || mediaId < 0) {
      throw new Error('mediaId must be a positive number');
    }

    const normalizedType = mediaType.toLowerCase();
    if (!['movie', 'tv'].includes(normalizedType)) {
      throw new Error("mediaType must be either 'movie' or 'tv'");
    }

    const mediaDetails = await this.request<any>('GET', `${normalizedType}/${mediaId}`);
    const serviceSlug = `${normalizedType === 'movie' ? 'radarr' : 'sonarr'}${is4k ? '_4k' : ''}`;
    const matchingService = (mediaDetails.services as Array<Record<string, unknown>> | undefined)?.find(
      (service) => service?.slug === serviceSlug,
    );

    if (!matchingService || typeof matchingService.id !== 'number') {
      throw new Error(`Could not find a service matching slug '${serviceSlug}' for media_id ${mediaId}`);
    }

    const payload = {
      mediaId: mediaDetails.id,
      mediaType: normalizedType,
      is4k,
      serverId: matchingService.id,
    };

    return this.request('POST', 'request', null, payload);
  }

  getRequest(requestId: number): Promise<unknown> {
    if (!requestId || requestId < 0) {
      throw new Error('requestId must be a positive number');
    }
    return this.request('GET', `request/${requestId}`);
  }
}
