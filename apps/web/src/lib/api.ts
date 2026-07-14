function resolveApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';
  if (raw) {
    // Убираем кириллицу и прочие символы (частая опечатка: api/v1м)
    let cleaned = raw.replace(/[^\x21-\x7E]/g, '');
    cleaned = cleaned.replace(/\/api\/v1[^/].*$/i, '/api/v1');
    cleaned = cleaned.replace(/\/+$/, '');
    if (cleaned.startsWith('http')) return cleaned;
  }
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return 'https://eb-payments-api.onrender.com/api/v1';
  }
  return 'http://localhost:3001/api/v1';
}

const API_URL = resolveApiUrl();

function formatApiError(status: number, body: { message?: string | string[] }): string {
  const msg = body.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg) {
    if (msg.includes('Cannot POST') || msg.includes('Cannot GET')) {
      return 'API не найден. Проверьте NEXT_PUBLIC_API_URL на Vercel или перезапустите деплой.';
    }
    return msg;
  }
  if (status === 401) return 'Неверный email или пароль';
  if (status === 429) return 'Слишком много запросов. Подождите минуту.';
  return `Ошибка сервера (${status})`;
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${resolveApiUrl()}${path}`;

  let res: Response;
  try {
    res = await fetch(url, { ...fetchOptions, headers });
  } catch {
    const isLocal = resolveApiUrl().includes('localhost');
    throw new Error(
      isLocal
        ? 'API недоступен. Запустите npm run dev и Docker (postgres).'
        : 'API недоступен. Подождите 60 сек (Render просыпается).',
    );
  }

  if (!res.ok) {
    const text = await res.text();
    let err: { message?: string | string[] } = {};
    try {
      err = JSON.parse(text);
    } catch {
      err = { message: text || res.statusText };
    }
    throw new Error(formatApiError(res.status, err));
  }
  return res.json();
}

export function getApiUrl(): string {
  return resolveApiUrl();
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
