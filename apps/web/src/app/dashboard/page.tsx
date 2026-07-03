'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken, clearAuth } from '@/lib/api';

interface Wallet {
  id: string;
  currency: string;
  balance: string;
  availableBalance: string;
}

interface User {
  firstName: string;
  lastName: string;
  email: string;
  kycStatus: string;
}

interface TxItem {
  id: string;
  typeLabel: string;
  amount: string;
  currency: string;
  fee: string;
  status: string;
  createdAt: string;
}

const CURRENCY_ICONS: Record<string, string> = {
  USD: '💵', EUR: '💶', RUB: '₽', KZT: '🇰🇿',
  BTC: '₿', ETH: 'Ξ', USDT: '💲',
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'Доллар', EUR: 'Евро', RUB: 'Рубль', KZT: 'Тенге',
  BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tether',
};

const TABS = [
  { id: 'wallets', label: 'Кошельки', icon: '💼' },
  { id: 'deposit', label: 'Пополнить', icon: '💳' },
  { id: 'banks', label: 'Банки', icon: '🏦' },
  { id: 'exchange', label: 'Обмен', icon: '💱' },
  { id: 'transfer', label: 'Перевод', icon: '📤' },
  { id: 'crypto', label: 'Крипто', icon: '₿' },
  { id: 'history', label: 'История', icon: '📋' },
] as const;

type Tab = (typeof TABS)[number]['id'];

const FEE_PERCENT = 3;

function calcFee(amount: number) {
  const fee = amount * (FEE_PERCENT / 100);
  return { fee, net: amount - fee, total: amount + fee };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [history, setHistory] = useState<TxItem[]>([]);
  const [tab, setTab] = useState<Tab>('wallets');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [banks, setBanks] = useState<Array<{ id: string; name: string; supportsOpenBanking: boolean }>>([]);
  const [connectedBanks, setConnectedBanks] = useState<Array<Record<string, unknown>>>([]);
  const [bankCountry, setBankCountry] = useState('RU');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'google_pay' | 'apple_pay'>('card');

  const [depositForm, setDepositForm] = useState({ walletId: '', amount: '', method: 'card' as 'card' | 'bank' | 'crypto' });
  const [exchangeForm, setExchangeForm] = useState({ fromWalletId: '', toWalletId: '', amount: '' });
  const [transferForm, setTransferForm] = useState({ fromWalletId: '', toEmail: '', amount: '', note: '' });
  const [cryptoForm, setCryptoForm] = useState({ fromWalletId: '', amount: '', address: '' });

  const [loading, setLoading] = useState(false);

  async function loadBanks(token: string, country: string) {
    const data = await api<{ banks: Array<{ id: string; name: string; supportsOpenBanking: boolean }> }>(
      `/banks?country=${country}`,
    );
    setBanks(data.banks);
    const connected = await api<Array<Record<string, unknown>>>('/banks/connected', { token });
    setConnectedBanks(connected);
  }

  const loadData = useCallback(async (token: string) => {
    const [userData, walletsData, historyData] = await Promise.all([
      api<User>('/users/me', { token }),
      api<Wallet[]>('/wallets', { token }),
      api<TxItem[]>('/transactions/history', { token }),
    ]);
    setUser(userData);
    setWallets(walletsData);
    setHistory(historyData);
    if (walletsData.length > 0) {
      const first = walletsData[0].id;
      const second = walletsData[1]?.id ?? first;
      const firstCrypto = walletsData.find((w) => w.currency === 'BTC')?.id ?? first;
      setDepositForm((f) => ({ ...f, walletId: first }));
      setExchangeForm((f) => ({ ...f, fromWalletId: first, toWalletId: second }));
      setTransferForm((f) => ({ ...f, fromWalletId: first }));
      setCryptoForm((f) => ({ ...f, fromWalletId: firstCrypto }));
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    loadData(token).catch(() => { clearAuth(); router.push('/login'); });
  }, [router, loadData]);

  async function runAction(fn: () => Promise<unknown>) {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const result = await fn();
      const msg = (result as { message?: string })?.message;
      setMessage(msg ?? 'Операция выполнена успешно!');
      await loadData(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }

  const cryptoWallets = wallets.filter((w) => ['BTC', 'ETH', 'USDT'].includes(w.currency));

  const depositAmount = parseFloat(depositForm.amount) || 0;
  const depositCalc = calcFee(depositAmount);
  const transferAmount = parseFloat(transferForm.amount) || 0;
  const transferCalc = calcFee(transferAmount);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-eb-500 border-t-transparent rounded-full animate-spin" />
          Загрузка кабинета...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-eb-400 to-eb-700 flex items-center justify-center font-bold text-sm">EB</div>
            <span className="font-bold">EB Payments</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <button onClick={() => { clearAuth(); router.push('/'); }} className="text-sm text-slate-400 hover:text-white glass px-3 py-1.5 rounded-lg">
              Выйти
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Личный кабинет</h1>
          <p className="text-slate-400">
            KYC: <span className="text-emerald-400">{user.kycStatus === 'verified' ? '✓ Верифицирован' : user.kycStatus}</span>
            {' · '}Комиссия платформы: <span className="text-eb-400 font-medium">{FEE_PERCENT}%</span>
          </p>
        </div>

        {message && (
          <div className="mb-4 glass border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm">
            ✓ {message}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm">
            ✗ {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                if (t.id === 'banks') {
                  const token = getToken();
                  if (token) loadBanks(token, bankCountry);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-gradient-to-r from-eb-600 to-eb-500 text-white shadow-lg shadow-eb-600/25'
                  : 'glass text-slate-400 hover:text-white'
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {tab === 'wallets' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map((w) => (
              <div key={w.id} className="glass rounded-2xl p-6 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CURRENCY_ICONS[w.currency] ?? '💰'}</span>
                    <div>
                      <p className="font-bold font-mono text-lg">{w.currency}</p>
                      <p className="text-xs text-slate-500">{CURRENCY_NAMES[w.currency] ?? w.currency}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-1 rounded-lg">Активен</span>
                </div>
                <p className="text-3xl font-bold mb-1">
                  {parseFloat(w.balance).toLocaleString('ru-RU', { maximumFractionDigits: 8 })}
                </p>
                <p className="text-sm text-slate-400">
                  Доступно: {parseFloat(w.availableBalance).toLocaleString('ru-RU', { maximumFractionDigits: 8 })}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === 'deposit' && (
          <div className="glass rounded-2xl p-8 max-w-lg">
            <h2 className="text-xl font-bold mb-2">Пополнение счёта</h2>
            <p className="text-slate-400 text-sm mb-6">Комиссия {FEE_PERCENT}% · Безопасная оплата</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Кошелёк зачисления</label>
                <select value={depositForm.walletId} onChange={(e) => setDepositForm({ ...depositForm, walletId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  {wallets.map((w) => <option key={w.id} value={w.id}>{CURRENCY_ICONS[w.currency]} {w.currency}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Способ оплаты</label>
                <div className="grid grid-cols-3 gap-2">
                  {([['card', '💳 Карта'], ['google_pay', 'G Pay'], ['apple_pay', ' Apple Pay']] as const).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setPaymentMethod(v)}
                      className={`py-3 rounded-xl text-sm font-medium ${paymentMethod === v ? 'bg-indigo-600 text-white' : 'glass text-slate-400'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Сумма</label>
                <input type="number" value={depositForm.amount} onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" placeholder="1000" min="1" />
              </div>
              {depositAmount > 0 && (
                <div className="glass rounded-xl p-4 text-sm space-y-1">
                  <div className="flex justify-between text-orange-400"><span>Комиссия ({FEE_PERCENT}%)</span><span>−{depositCalc.fee.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-emerald-400"><span>Зачислится</span><span>{depositCalc.net.toFixed(2)}</span></div>
                </div>
              )}
              <button disabled={loading || !depositForm.amount} onClick={() => {
                const wallet = wallets.find((w) => w.id === depositForm.walletId);
                return runAction(() => api('/stripe/create-payment', {
                  method: 'POST', token: getToken()!,
                  body: JSON.stringify({
                    walletId: depositForm.walletId,
                    amount: depositForm.amount,
                    currency: wallet?.currency ?? 'USD',
                    method: paymentMethod,
                  }),
                }));
              }}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 rounded-xl font-semibold disabled:opacity-50">
                {loading ? 'Обработка платежа...' : paymentMethod === 'card' ? 'Оплатить картой' : paymentMethod === 'google_pay' ? 'Оплатить Google Pay' : 'Оплатить Apple Pay'}
              </button>
              <p className="text-xs text-slate-500 text-center">Visa · Mastercard · МИР · Google Pay · Apple Pay</p>
            </div>
          </div>
        )}

        {tab === 'banks' && (
          <div className="max-w-2xl space-y-6">
            {connectedBanks.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Подключённые банки</h3>
                <div className="space-y-2">
                  {connectedBanks.map((b) => (
                    <div key={b.id as string} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <div>
                        <p className="font-medium">{b.bank_name as string}</p>
                        <p className="text-xs text-slate-500">{b.country_code as string} · Подключён</p>
                      </div>
                      <span className="text-emerald-400 text-sm">✓ Активен</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Подключить банк</h3>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-1.5">Страна</label>
                <select value={bankCountry} onChange={(e) => {
                  setBankCountry(e.target.value);
                  const token = getToken();
                  if (token) loadBanks(token, e.target.value);
                }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <option value="RU">Россия</option>
                  <option value="KZ">Казахстан</option>
                  <option value="US">США</option>
                  <option value="DE">Германия</option>
                  <option value="GB">Великобритания</option>
                  <option value="UA">Украина</option>
                  <option value="AE">ОАЭ</option>
                  <option value="TR">Турция</option>
                  <option value="FR">Франция</option>
                </select>
              </div>
              {banks.length === 0 ? (
                <p className="text-slate-400 text-sm">Для этой страны используйте пополнение картой, Google Pay или Apple Pay во вкладке «Пополнить».</p>
              ) : (
                <div className="space-y-2">
                  {banks.map((b) => (
                    <button key={b.id} disabled={loading}
                      onClick={() => runAction(() => api('/banks/connect', {
                        method: 'POST', token: getToken()!,
                        body: JSON.stringify({ countryCode: bankCountry, bankId: b.id }),
                      })).then(() => { const t = getToken(); if (t) loadBanks(t, bankCountry); })}
                      className="w-full flex items-center justify-between glass rounded-xl px-4 py-3 hover:bg-white/10 transition text-left">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-indigo-400 text-sm">Подключить →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'exchange' && (
          <div className="glass rounded-2xl p-8 max-w-lg">
            <h2 className="text-xl font-bold mb-2">Обмен валют и крипты</h2>
            <p className="text-slate-400 text-sm mb-6">Комиссия обмена — {FEE_PERCENT}%</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Отдаю</label>
                <select value={exchangeForm.fromWalletId} onChange={(e) => setExchangeForm({ ...exchangeForm, fromWalletId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  {wallets.map((w) => <option key={w.id} value={w.id}>{w.currency} — {w.balance}</option>)}
                </select>
              </div>
              <div className="text-center text-2xl">↓</div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Получаю</label>
                <select value={exchangeForm.toWalletId} onChange={(e) => setExchangeForm({ ...exchangeForm, toWalletId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  {wallets.map((w) => <option key={w.id} value={w.id}>{w.currency} — {w.balance}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Сумма</label>
                <input type="number" value={exchangeForm.amount} onChange={(e) => setExchangeForm({ ...exchangeForm, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" placeholder="100" />
              </div>
              <button disabled={loading || !exchangeForm.amount} onClick={() => runAction(() => api('/exchange/execute', { method: 'POST', token: getToken()!, body: JSON.stringify(exchangeForm) }))}
                className="w-full bg-gradient-to-r from-eb-600 to-cyan-600 py-3.5 rounded-xl font-semibold disabled:opacity-50">
                {loading ? 'Обмен...' : 'Обменять'}
              </button>
            </div>
          </div>
        )}

        {tab === 'transfer' && (
          <div className="glass rounded-2xl p-8 max-w-lg">
            <h2 className="text-xl font-bold mb-2">Перевод пользователю</h2>
            <p className="text-slate-400 text-sm mb-6">Комиссия перевода — {FEE_PERCENT}%</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Из кошелька</label>
                <select value={transferForm.fromWalletId} onChange={(e) => setTransferForm({ ...transferForm, fromWalletId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  {wallets.map((w) => <option key={w.id} value={w.id}>{w.currency} — {w.balance}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Email получателя</label>
                <input type="email" value={transferForm.toEmail} onChange={(e) => setTransferForm({ ...transferForm, toEmail: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" placeholder="poluchatel@mail.ru" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Сумма</label>
                <input type="number" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" placeholder="500" />
              </div>
              {transferAmount > 0 && (
                <div className="glass rounded-xl p-4 text-sm space-y-1">
                  <div className="flex justify-between text-orange-400"><span>Комиссия ({FEE_PERCENT}%)</span><span>+{transferCalc.fee.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold"><span>Итого спишется</span><span>{(transferAmount + transferCalc.fee).toFixed(2)}</span></div>
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Комментарий</label>
                <input value={transferForm.note} onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" placeholder="За услуги" />
              </div>
              <button disabled={loading || !transferForm.amount || !transferForm.toEmail} onClick={() => runAction(() => api('/transfers/send', { method: 'POST', token: getToken()!, body: JSON.stringify(transferForm) }))}
                className="w-full bg-gradient-to-r from-eb-600 to-cyan-600 py-3.5 rounded-xl font-semibold disabled:opacity-50">
                {loading ? 'Отправка...' : 'Отправить перевод'}
              </button>
            </div>
          </div>
        )}

        {tab === 'crypto' && (
          <div className="glass rounded-2xl p-8 max-w-lg">
            <h2 className="text-xl font-bold mb-2">Отправка криптовалюты</h2>
            <p className="text-slate-400 text-sm mb-6">BTC, ETH, USDT — комиссия {FEE_PERCENT}%</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Крипто-кошелёк</label>
                <select value={cryptoForm.fromWalletId} onChange={(e) => setCryptoForm({ ...cryptoForm, fromWalletId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  {cryptoWallets.map((w) => <option key={w.id} value={w.id}>{w.currency} — {w.balance}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Адрес получателя</label>
                <input value={cryptoForm.address} onChange={(e) => setCryptoForm({ ...cryptoForm, address: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm" placeholder="bc1q... или 0x..." />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Сумма</label>
                <input type="number" value={cryptoForm.amount} onChange={(e) => setCryptoForm({ ...cryptoForm, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" placeholder="0.01" step="any" />
              </div>
              <button disabled={loading || !cryptoForm.amount || !cryptoForm.address} onClick={() => runAction(() => api('/transfers/crypto', { method: 'POST', token: getToken()!, body: JSON.stringify(cryptoForm) }))}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-500 py-3.5 rounded-xl font-semibold disabled:opacity-50">
                {loading ? 'Отправка...' : '₿ Отправить крипту'}
              </button>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">История операций</h2>
            </div>
            {history.length === 0 ? (
              <p className="p-8 text-center text-slate-400">Операций пока нет</p>
            ) : (
              <div className="divide-y divide-white/5">
                {history.map((tx) => (
                  <div key={tx.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5">
                    <div>
                      <p className="font-medium">{tx.typeLabel}</p>
                      <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString('ru-RU')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold">{parseFloat(tx.amount).toFixed(2)} {tx.currency}</p>
                      {parseFloat(tx.fee) > 0 && <p className="text-xs text-orange-400">комиссия: {parseFloat(tx.fee).toFixed(2)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
