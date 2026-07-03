'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken, getUser, clearAuth } from '@/lib/api';

interface Stats {
  totalUsers: number;
  totalTransactions: number;
  totalFeesCollected: string;
  platformRevenue: Array<{ currency: string; total: string }>;
}

interface KycRequest {
  id: string;
  userId: string;
  documentType: string;
  fileName: string;
  status: string;
  uploadedAt: string;
  email: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  phone: string;
  dateOfBirth: string;
}

const DOC_LABELS: Record<string, string> = {
  passport: 'Паспорт',
  id_card: 'ID-карта',
  drivers_license: 'Водительские права',
};

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [tab, setTab] = useState<'stats' | 'users' | 'kyc' | 'transactions'>('stats');
  const [transactions, setTransactions] = useState<Array<Record<string, unknown>>>([]);
  const [kycRequests, setKycRequests] = useState<KycRequest[]>([]);
  const [kycLoading, setKycLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || user?.role !== 'admin') {
      router.push('/login');
      return;
    }
    loadData(token);
  }, [router]);

  async function loadData(token: string) {
    const [s, u, t, k] = await Promise.all([
      api<Stats>('/admin/stats', { token }),
      api<Array<Record<string, unknown>>>('/admin/users', { token }),
      api<Array<Record<string, unknown>>>('/admin/transactions', { token }),
      api<KycRequest[]>('/admin/kyc', { token }),
    ]);
    setStats(s);
    setUsers(u);
    setTransactions(t);
    setKycRequests(k);
  }

  async function handleKycAction(userId: string, action: 'approve' | 'reject') {
    const token = getToken();
    if (!token) return;

    if (action === 'reject') {
      const reason = window.prompt('Причина отклонения (необязательно):');
      if (reason === null) return;
      setKycLoading(userId);
      try {
        await api(`/admin/kyc/${userId}/reject`, {
          method: 'POST',
          token,
          body: JSON.stringify({ reason: reason || undefined }),
        });
        setMessage('KYC отклонён. Пользователь может отправить документы снова.');
        await loadData(token);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'Ошибка');
      } finally {
        setKycLoading(null);
      }
      return;
    }

    if (!window.confirm('Одобрить верификацию этого пользователя?')) return;
    setKycLoading(userId);
    try {
      await api(`/admin/kyc/${userId}/approve`, { method: 'POST', token });
      setMessage('KYC одобрен. Пользователь получит доступ к кошельку.');
      await loadData(token);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setKycLoading(null);
    }
  }

  if (!stats) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen">
      <nav className="glass sticky top-0 z-50 border-b border-amber-500/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-sm">⚙</div>
            <div>
              <span className="font-bold">Админ-панель</span>
              <p className="text-[10px] text-amber-500/80 uppercase tracking-widest">EB Payments</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">Кабинет</Link>
            <button onClick={() => { clearAuth(); router.push('/'); }} className="text-sm text-slate-400 hover:text-white">Выйти</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {message && (
          <div className="mb-6 glass border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white ml-4">✕</button>
          </div>
        )}

        <div className="flex gap-2 mb-8 flex-wrap">
          {([
            ['stats', 'Статистика'],
            ['users', 'Пользователи'],
            ['kyc', `KYC${kycRequests.length > 0 ? ` (${kycRequests.length})` : ''}`],
            ['transactions', 'Транзакции'],
          ] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t ? 'bg-amber-600 text-white' : 'glass text-slate-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'stats' && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="glass rounded-2xl p-6">
              <p className="text-slate-400 text-sm">Пользователей</p>
              <p className="text-4xl font-bold mt-1">{stats.totalUsers}</p>
            </div>
            <div className="glass rounded-2xl p-6">
              <p className="text-slate-400 text-sm">Транзакций</p>
              <p className="text-4xl font-bold mt-1">{stats.totalTransactions}</p>
            </div>
            <div className="glass rounded-2xl p-6">
              <p className="text-slate-400 text-sm">Собрано комиссий</p>
              <p className="text-4xl font-bold mt-1 text-amber-400">{parseFloat(stats.totalFeesCollected).toFixed(2)}</p>
            </div>
          </div>
        )}

        {tab === 'stats' && stats.platformRevenue.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Доход платформы по валютам</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.platformRevenue.map((r) => (
                <div key={r.currency} className="bg-white/5 rounded-xl p-4">
                  <p className="text-slate-400 text-sm">{r.currency}</p>
                  <p className="font-mono font-bold">{parseFloat(r.total).toFixed(4)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-slate-400 text-left">
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Имя</th>
                  <th className="px-6 py-3">Страна</th>
                  <th className="px-6 py-3">KYC</th>
                  <th className="px-6 py-3">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id as string} className="hover:bg-white/5">
                    <td className="px-6 py-3">{u.email as string}</td>
                    <td className="px-6 py-3">{u.firstName as string} {u.lastName as string}</td>
                    <td className="px-6 py-3">{u.countryCode as string}</td>
                    <td className="px-6 py-3">
                      <span className={
                        u.kycStatus === 'verified' ? 'text-emerald-400' :
                        u.kycStatus === 'pending' ? 'text-amber-400' :
                        u.kycStatus === 'rejected' ? 'text-red-400' : 'text-slate-400'
                      }>
                        {u.kycStatus as string}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{new Date(u.createdAt as string).toLocaleDateString('ru')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'kyc' && (
          <div className="space-y-4">
            {kycRequests.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center text-slate-400">
                Нет заявок на проверку
              </div>
            ) : (
              kycRequests.map((k) => (
                <div key={k.id} className="glass rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{k.firstName} {k.lastName}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">на проверке</span>
                      </div>
                      <p className="text-slate-400 text-sm">{k.email}</p>
                      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-sm mt-3">
                        <p><span className="text-slate-500">Телефон:</span> {k.phone || '—'}</p>
                        <p><span className="text-slate-500">Страна:</span> {k.countryCode || '—'}</p>
                        <p><span className="text-slate-500">Дата рождения:</span> {k.dateOfBirth ? new Date(k.dateOfBirth).toLocaleDateString('ru') : '—'}</p>
                        <p><span className="text-slate-500">Документ:</span> {DOC_LABELS[k.documentType] ?? k.documentType}</p>
                        <p><span className="text-slate-500">Файл:</span> {k.fileName}</p>
                        <p><span className="text-slate-500">Отправлено:</span> {new Date(k.uploadedAt).toLocaleString('ru')}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button
                        disabled={kycLoading === k.userId}
                        onClick={() => handleKycAction(k.userId, 'reject')}
                        className="px-4 py-2 rounded-xl text-sm border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Отклонить
                      </button>
                      <button
                        disabled={kycLoading === k.userId}
                        onClick={() => handleKycAction(k.userId, 'approve')}
                        className="px-4 py-2 rounded-xl text-sm bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                      >
                        {kycLoading === k.userId ? '...' : 'Одобрить'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'transactions' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <div key={tx.id as string} className="px-6 py-4 flex justify-between hover:bg-white/5">
                  <div>
                    <p className="font-medium">{tx.type as string} · {tx.user_email as string}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.created_at as string).toLocaleString('ru')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">{parseFloat(tx.amount as string).toFixed(2)} {tx.currency as string}</p>
                    {parseFloat(tx.fee as string) > 0 && <p className="text-xs text-amber-400">+{parseFloat(tx.fee as string).toFixed(2)} комиссия</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
