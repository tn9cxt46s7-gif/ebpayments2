'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES, type Country } from '@/lib/countries';
import { api, setToken, setUser } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import { SettingsBar } from '@/components/SettingsBar';
import { Recaptcha, isRecaptchaEnabled, type RecaptchaHandle } from '@/components/Recaptcha';
import { LOCALES, type Locale } from '@/i18n';

interface MathCaptcha { captchaId: string; question: string; useRecaptcha?: boolean }

export default function RegisterPage() {
  const router = useRouter();
  const { locale, setLocale, t } = useApp();
  const recaptchaRef = useRef<RecaptchaHandle>(null);
  const useGoogleCaptcha = isRecaptchaEnabled();

  const [countries, setCountries] = useState<Country[]>(COUNTRIES);
  const [mathCaptcha, setMathCaptcha] = useState<MathCaptcha | null>(null);
  const [gdpr, setGdpr] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', countryCode: 'LV', captchaAnswer: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadMathCaptcha() {
    try {
      const c = await api<MathCaptcha>('/auth/captcha');
      if (!c.useRecaptcha) {
        setMathCaptcha(c);
        setForm((f) => ({ ...f, captchaAnswer: '' }));
      }
    } catch {
      /* локально работает без API */
    }
  }

  useEffect(() => {
    api<Country[]>('/banks/countries')
      .then((list) => { if (list.length > 0) setCountries(list); })
      .catch(() => {});
    if (!useGoogleCaptcha) loadMathCaptcha();
  }, [useGoogleCaptcha]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gdpr) return;

    if (useGoogleCaptcha) {
      const token = recaptchaRef.current?.getToken();
      if (!token) {
        setError('Подтвердите Google reCAPTCHA');
        return;
      }
    } else if (!mathCaptcha) {
      setError('Капча не загружена. Обновите страницу.');
      return;
    }

    setLoading(true);
    setError('');

    const recaptchaToken = useGoogleCaptcha ? recaptchaRef.current?.getToken() ?? undefined : undefined;

    try {
      const data = await api<{ accessToken: string; user: Record<string, unknown> }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          countryCode: form.countryCode,
          locale,
          gdprConsent: true,
          recaptchaToken,
          captchaId: useGoogleCaptcha ? undefined : mathCaptcha?.captchaId,
          captchaAnswer: useGoogleCaptcha ? undefined : parseInt(form.captchaAnswer, 10),
        }),
      });
      setToken(data.accessToken);
      setUser(data.user);
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
      recaptchaRef.current?.reset();
      if (!useGoogleCaptcha) loadMathCaptcha();
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = gdpr && (useGoogleCaptcha || !!mathCaptcha);

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
              <label className="block text-sm text-muted mb-1">{t('first_name')}</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="eb-input py-2.5" required />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">{t('last_name')}</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="eb-input py-2.5" required />
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">{t('email')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="eb-input py-2.5" required />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">{t('password')}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="eb-input py-2.5" minLength={8} required />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">{t('country')}</label>
            <select value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} className="eb-select py-2.5">
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">{t('language')}</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="eb-select py-2.5"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">{t('captcha')}</label>
            {useGoogleCaptcha ? (
              <div className="space-y-2">
                <p className="text-xs text-muted">{t('captcha_hint')}</p>
                <Recaptcha ref={recaptchaRef} />
              </div>
            ) : mathCaptcha ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-sm mb-1">{mathCaptcha.question}</p>
                  <input
                    type="number"
                    value={form.captchaAnswer}
                    onChange={(e) => setForm({ ...form, captchaAnswer: e.target.value })}
                    className="eb-input py-2.5 w-full"
                    required
                  />
                </div>
                <button type="button" onClick={loadMathCaptcha} className="eb-btn-secondary px-3 rounded-xl self-end">↻</button>
              </div>
            ) : (
              <p className="text-sm text-amber-400">Загрузка капчи...</p>
            )}
          </div>

          <label className="flex items-start gap-3 text-sm text-muted cursor-pointer">
            <input type="checkbox" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} className="mt-1" required />
            <span>{t('gdpr')} <Link href="/legal/privacy" className="text-indigo-400 underline">GDPR</Link></span>
          </label>

          <button type="submit" disabled={loading || !canSubmit} className="eb-btn-primary w-full py-3.5">
            {loading ? '...' : t('register_submit')}
          </button>

          <p className="text-center text-sm text-muted">
            {t('has_account')} <Link href="/login" className="text-indigo-400">{t('login')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
