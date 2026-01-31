import { config, assertApiKey } from '../config.js';

/**
 * Get authorization headers for Inworld API
 */
export function getAuthHeaders(): Record<string, string> {
  const apiKey = assertApiKey();
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${apiKey}`,
  };
}

/**
 * Make a POST request to Inworld API
 */
export async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const url = `${config.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error [${response.status}]:`, errorBody);
    throw new Error(`Inworld API returned ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Make a streaming POST request to Inworld API
 * Returns the response body stream
 */
export async function postStream(
  endpoint: string,
  body: unknown
): Promise<ReadableStream<Uint8Array>> {
  const url = `${config.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error [${response.status}]:`, errorBody);
    throw new Error(`Inworld API returned ${response.status}: ${errorBody}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  return response.body;
}
