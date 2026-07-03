# EB Payments

Глобальная платёжная платформа: обмен валют, переводы, крипто, Stripe.

## Локальный запуск

```powershell
cd C:\Users\setna\projects\eb-payments
docker compose up -d postgres
npm.cmd install
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

- Сайт: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

## Деплой в интернет (бесплатно)

Полная инструкция: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

Кратко: **Vercel** (сайт) + **Render** (API) + **Neon** (PostgreSQL) = $0/мес на старте.

## Админ (только для владельца)

- Email: `admin@ebpayments.com`
- Пароль: `EbAdmin2026!`

## Комиссия платформы — 3%

На пополнение, переводы, обмен и крипто-отправку.
