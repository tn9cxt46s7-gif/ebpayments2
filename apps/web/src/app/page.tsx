import Link from 'next/link';

const features = [
  { icon: '💳', title: 'Пополнение с карты', desc: 'Visa, Mastercard, МИР — мгновенное зачисление на кошелёк' },
  { icon: '📱', title: 'Google Pay и Apple Pay', desc: 'Оплата в один клик с телефона' },
  { icon: '🏦', title: 'Подключение банков', desc: 'Привяжите свой банк для быстрых переводов' },
  { icon: '₿', title: 'Криптовалюты', desc: 'Bitcoin, Ethereum, USDT — хранение и обмен' },
  { icon: '💱', title: 'Обмен валют', desc: 'Выгодные курсы в 70+ странах мира' },
  { icon: '🔒', title: 'Безопасность', desc: 'Шифрование, KYC-верификация, защита платежей' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/30">EB</div>
            <div>
              <span className="font-bold text-lg tracking-tight">EB Payments</span>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Международные платежи</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 text-sm transition">Войти</Link>
            <Link href="/register" className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition">
              Открыть счёт
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <p className="text-indigo-400 text-sm font-medium mb-4 tracking-wide uppercase">Платёжная платформа нового поколения</p>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Ваши деньги.<br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Любая валюта. Любая страна.</span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-xl">
            Пополняйте счёт с карты, Google Pay или Apple Pay. Подключайте банк, обменивайте валюту и крипту, переводите по всему миру.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-2xl font-semibold hover:bg-slate-100 transition shadow-xl">
            Начать бесплатно →
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 card-hover">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="glass rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Готовы начать?</h2>
            <p className="text-slate-400">Регистрация занимает меньше минуты</p>
          </div>
          <Link href="/register" className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-3.5 rounded-xl font-semibold whitespace-nowrap">
            Создать аккаунт
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-slate-500 text-sm">
        © 2026 EB Payments · Лицензированная платёжная платформа
      </footer>
    </div>
  );
}
