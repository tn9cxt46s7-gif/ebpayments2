'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken, setUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api<{ accessToken: string; user: { role: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.accessToken);
      setUser(data.user);
      router.push(data.user.role === 'admin' ? '/admin' : '/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-bold">EB</div>
            <span className="font-bold text-xl">EB Payments</span>
          </Link>
          <h1 className="text-2xl font-bold">Вход в аккаунт</h1>
          <p className="text-slate-400 text-sm mt-1">Управляйте своими финансами</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
          {error && <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 rounded-xl font-semibold disabled:opacity-50">
            {loading ? 'Вход...' : 'Войти'}
          </button>
          <p className="text-center text-sm text-slate-400">
            Нет аккаунта? <Link href="/register" className="text-indigo-400 hover:text-indigo-300">Зарегистрироваться</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
