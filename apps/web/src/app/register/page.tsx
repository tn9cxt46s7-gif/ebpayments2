'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES, type Country } from '@/lib/countries';
import { api, setToken, setUser } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import { SettingsBar } from '@/components/SettingsBar';

interface Captcha { captchaId: string; question: string }

export default function RegisterPage() {
  const router = useRouter();
  const { locale, t } = useApp();
  const [countries, setCountries] = useState<Country[]>(COUNTRIES);
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [gdpr, setGdpr] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', countryCode: 'LV', captchaAnswer: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadCaptcha() {
    const c = await api<Captcha>('/auth/captcha');
    setCaptcha(c);
    setForm((f) => ({ ...f, captchaAnswer: '' }));
  }

  useEffect(() => {
    api<Country[]>('/banks/countries')
      .then((list) => { if (list.length > 0) setCountries(list); })
      .catch(() => {});
    loadCaptcha();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!captcha || !gdpr) return;
    setLoading(true);
    setError('');
    try {
      const data = await api<{ accessToken: string; user: Record<string, unknown> }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          captchaId: captcha.captchaId,
          captchaAnswer: parseInt(form.captchaAnswer, 10),
          gdprConsent: true,
          locale,
        }),
      });
      setToken(data.accessToken);
      setUser(data.user);
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-bold">EB</div>
            <span className="font-bold text-xl">EB Payments</span>
          </Link>
          <SettingsBar />
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-4">
          <h1 className="text-xl font-bold">{t('register')}</h1>
          {error && <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted mb-1">Имя</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="eb-input py-2.5" required />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Фамилия</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="eb-input py-2.5" required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="eb-input py-2.5" required />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Пароль</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="eb-input py-2.5" minLength={8} required />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Страна</label>
            <select value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} className="eb-select py-2.5">
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          {captcha && (
            <div>
              <label className="block text-sm text-muted mb-1">{captcha.question}</label>
              <div className="flex gap-2">
                <input type="number" value={form.captchaAnswer} onChange={(e) => setForm({ ...form, captchaAnswer: e.target.value })} className="eb-input py-2.5 flex-1" required />
                <button type="button" onClick={loadCaptcha} className="eb-btn-secondary px-3 rounded-xl">↻</button>
              </div>
            </div>
          )}
          <label className="flex items-start gap-3 text-sm text-muted cursor-pointer">
            <input type="checkbox" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} className="mt-1" required />
            <span>{t('gdpr')} <Link href="/legal/privacy" className="text-indigo-400 underline">GDPR</Link></span>
          </label>
          <button type="submit" disabled={loading || !gdpr || !captcha} className="eb-btn-primary w-full py-3.5">
            {loading ? '...' : t('register')}
          </button>
          <p className="text-center text-sm text-muted">
            <Link href="/login" className="text-indigo-400">{t('login')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
