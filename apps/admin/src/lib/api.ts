const API_BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await import('../lib/supabase').then((m) => m.supabase.auth.getSession());
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = (await getAuthHeaders()) as Record<string, string>;
  const method = (options?.method ?? 'GET').toUpperCase();
  const merged: Record<string, string> = { ...headers, ...(options?.headers as Record<string, string>) };

  const hasBody =
    options?.body !== undefined && options?.body !== null && String(options.body).length > 0;
  if (!hasBody && (method === 'GET' || method === 'HEAD' || method === 'DELETE')) {
    delete merged['Content-Type'];
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: merged,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as {
      error?: string;
      detail?: string;
      fieldErrors?: Record<string, string>;
    };
    const message = err.detail ?? err.error ?? res.statusText;
    throw new ApiRequestError(res.status, message, err);
  }
  return res.json();
}

export const apiGet = <T>(path: string) => api<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'PUT', body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = (path: string) => api<void>(path, { method: 'DELETE' });
