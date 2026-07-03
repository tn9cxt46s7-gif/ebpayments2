const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

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

  const res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Ошибка сервера');
  }
  return res.json();
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
