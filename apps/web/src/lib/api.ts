const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function formatApiError(status: number, body: { message?: string | string[] }): string {
  const msg = body.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg) return msg;
  if (status === 401) return 'Неверный email или пароль';
  if (status === 429) return 'Слишком много запросов. Подождите минуту.';
  return `Ошибка сервера (${status})`;
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
  } catch {
    const isLocal = API_URL.includes('localhost');
    throw new Error(
      isLocal
        ? 'API недоступен. Запустите npm run dev и Docker (postgres).'
        : 'API недоступен. Подождите 60 сек (Render просыпается) или проверьте NEXT_PUBLIC_API_URL на Vercel.',
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(res.status, err));
  }
  return res.json();
}

export function getApiUrl(): string {
  return API_URL;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('eb_token');
}

export function setToken(token: string) {
  localStorage.setItem('eb_token', token);
}

export function setUser(user: Record<string, unknown>) {
  localStorage.setItem('eb_user', JSON.stringify(user));
}

export function getUser(): { role?: string; firstName?: string; lastName?: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('eb_user');
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  localStorage.removeItem('eb_token');
  localStorage.removeItem('eb_user');
}
