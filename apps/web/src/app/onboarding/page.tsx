'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import { SettingsBar } from '@/components/SettingsBar';

interface Step { id: string; label: string; done: boolean }
interface Status {
  currentStep: string;
  canUseWallet: boolean;
  email: string;
  phone: string;
  steps: Step[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useApp();
  const [status, setStatus] = useState<Status | null>(null);
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [docType, setDocType] = useState('passport');
  const [docNumber, setDocNumber] = useState('');
  const [message, setMessage] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    const s = await api<Status>('/verification/status', { token });
    setStatus(s);
    if (s.canUseWallet) router.push('/dashboard');
  }

  useEffect(() => {
    loadStatus();
  }, [router]);

  useEffect(() => {
    if (!status || status.currentStep !== 'email_verify') return;
    const token = getToken();
    if (!token) return;
    api<{ message?: string; devCode?: string }>('/verification/email/send', {
      method: 'POST',
      token,
    })
      .then((r) => {
        setMessage(r.message ?? 'Код отправлен');
        if (r.devCode) setDevCode(r.devCode);
      })
      .catch(() => {});
  }, [status?.currentStep]);

  async function action(fn: () => Promise<{ message?: string; devCode?: string; nextStep?: string }>) {
    setLoading(true);
    setMessage('');
    try {
      const r = await fn();
      setMessage(r.message ?? 'Готово');
      if (r.devCode) setDevCode(r.devCode);
      await loadStatus();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  if (!status) return <div className="min-h-screen flex items-center justify-center text-muted">Загрузка...</div>;

  const step = status.currentStep;

  return (
    <div className="min-h-screen">
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-bold">EB Payments</Link>
          <SettingsBar />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-2">{t('onboarding')}</h1>
        <p className="text-muted text-sm mb-8">Для использования кошелька пройдите все этапы (требование ЕС AML/KYC)</p>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {status.steps.map((s, i) => (
            <div key={s.id} className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium ${s.done ? 'bg-emerald-600/20 text-emerald-400' : step === s.id ? 'bg-indigo-600 text-white' : 'glass text-muted'}`}>
              {i + 1}. {s.label}
            </div>
          ))}
        </div>

        {message && (
          <div className="mb-4 glass border-indigo-500/30 text-indigo-300 px-4 py-3 rounded-xl text-sm">
            {message}
            {devCode && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-amber-300 text-xs mb-1">Локальный режим (без почты):</p>
                <p className="font-mono text-2xl font-bold text-amber-200 tracking-widest">{devCode}</p>
              </div>
            )}
          </div>
        )}

        {step === 'email_verify' && (
          <div className="glass rounded-2xl p-8 space-y-4">
            <h2 className="font-semibold">{t('verify_email')}</h2>
            <p className="text-muted text-sm">Код отправлен на {status.email}</p>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="eb-input" maxLength={6} />
            <div className="flex gap-3">
              <button disabled={loading} onClick={() => action(() => api('/verification/email/send', { method: 'POST', token: getToken()! }))} className="eb-btn-secondary flex-1 py-3 rounded-xl">Отправить снова</button>
              <button disabled={loading || code.length < 4} onClick={() => action(() => api('/verification/email/verify', { method: 'POST', token: getToken()!, body: JSON.stringify({ code }) }))} className="eb-btn-primary flex-1 py-3">Подтвердить</button>
            </div>
          </div>
        )}

        {step === 'phone_verify' && (
          <div className="glass rounded-2xl p-8 space-y-4">
            <h2 className="font-semibold">{t('verify_phone')}</h2>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+371 20000000" className="eb-input" />
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SMS-код" className="eb-input" />
            <div className="flex gap-3">
              <button disabled={loading || !phone} onClick={() => action(() => api('/verification/phone/send', { method: 'POST', token: getToken()!, body: JSON.stringify({ phone }) }))} className="eb-btn-secondary flex-1 py-3 rounded-xl">Отправить SMS</button>
              <button disabled={loading || !code} onClick={() => action(() => api('/verification/phone/verify', { method: 'POST', token: getToken()!, body: JSON.stringify({ code }) }))} className="eb-btn-primary flex-1 py-3">Подтвердить</button>
            </div>
          </div>
        )}

        {step === 'age_verify' && (
          <div className="glass rounded-2xl p-8 space-y-4">
            <h2 className="font-semibold">{t('verify_age')}</h2>
            <p className="text-muted text-sm">Сервис доступен только лицам старше 18 лет</p>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="eb-input" />
            <button disabled={loading || !dob} onClick={() => action(() => api('/verification/age', { method: 'POST', token: getToken()!, body: JSON.stringify({ dateOfBirth: dob }) }))} className="eb-btn-primary w-full py-3">Подтвердить возраст</button>
          </div>
        )}

        {(step === 'kyc_verify' || step === 'kyc_pending') && (
          <div className="glass rounded-2xl p-8 space-y-4">
            <h2 className="font-semibold">{t('verify_kyc')}</h2>
            {step === 'kyc_pending' ? (
              <p className="text-amber-400">⏳ Документы на проверке. Обычно до 24 часов.</p>
            ) : (
              <>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="eb-select">
                  <option value="passport">Паспорт</option>
                  <option value="id_card">ID-карта (ЕС)</option>
                  <option value="drivers_license">Водительские права</option>
                </select>
                <input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="Номер документа" className="eb-input" />
                <input type="file" accept="image/*,.pdf" className="eb-input text-sm" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setMessage(`Файл: ${f.name} (будет проверен)`);
                }} />
                <button disabled={loading || !docNumber} onClick={() => action(() => api('/verification/kyc', { method: 'POST', token: getToken()!, body: JSON.stringify({ documentType: docType, documentNumber: docNumber, fileName: 'document.jpg' }) }))} className="eb-btn-primary w-full py-3">Отправить на проверку</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
