# Деплой EB Payments (бесплатный старт)

Пошаговая инструкция: выложить проект в интернет **бесплатно**, а позже докупать платные сервисы по мере роста.

## Архитектура (бесплатно)


| Компонент      | Сервис                | Бесплатный URL                         |
| -------------- | --------------------- | -------------------------------------- |
| Сайт (Next.js) | **Vercel**            | `https://твой-проект.vercel.app`       |
| API (NestJS)   | **Render**            | `https://eb-payments-api.onrender.com` |
| База данных    | **Neon** (PostgreSQL) | подключение по `DATABASE_URL`          |
| SSL / HTTPS    | Vercel + Render       | включено                               |
| Email (старт)  | Режим dev / **Brevo** | 300 писем/день бесплатно               |
| Платежи (тест) | **Stripe** test mode  | бесплатно                              |
| SMS (старт)    | Dev-режим в консоли   | бесплатно                              |


Redis **не нужен** — в коде не используется.

---

## Шаг 1 — GitHub

1. Создай репозиторий на [https://github.com/new](https://github.com/new)
2. Залей код:

```powershell
cd C:\Users\setna\projects\eb-payments
git init
git add .
git commit -m "Initial EB Payments deployment"
git branch -M main
git remote add origin https://github.com/ТВОЙ_ЛОГИН/eb-payments.git


```

---

## Шаг 2 — База данных Neon (бесплатно)

1. Зарегистрируйся: [https://neon.tech](https://neon.tech)
2. **New Project** → регион **Frankfurt (EU)** — ближе к Латвии, GDPR-friendly
3. Скопируй **Connection string** (с `?sslmode=require`)
4. Сохрани — это `DATABASE_URL`

Лимит free: ~0.5 GB, достаточно для старта и тестов.

---

## Шаг 3 — API на Render (бесплатно)

1. [https://render.com](https://render.com) → Sign up (через GitHub)
2. **New → Blueprint** → подключи репозиторий `eb-payments`
3. Render найдёт `render.yaml` и создаст сервис `eb-payments-api`
4. В **Environment** добавь переменные:


| Переменная       | Значение                                                 |
| ---------------- | -------------------------------------------------------- |
| `DATABASE_URL`   | строка из Neon                                           |
| `CORS_ORIGIN`    | `https://твой-проект.vercel.app` (обновишь после Vercel) |
| `WEB_URL`        | то же, что CORS_ORIGIN                                   |
| `JWT_SECRET`     | длинная случайная строка (Render может сгенерировать)    |
| `RUN_MIGRATIONS` | `true`                                                   |
| `RUN_SEED`       | `true` (только первый деплой, потом убери)               |


1. Дождись деплоя. Проверь:
  `https://eb-payments-api.onrender.com/api/v1/health` → `{"status":"ok"}`

Swagger: `https://eb-payments-api.onrender.com/api/docs`

**Важно:** на free-плане Render «засыпает» после ~15 мин без трафика. Первый запрос может идти 30–60 сек.

---

## Шаг 4 — Сайт на Vercel (бесплатно)

1. [https://vercel.com](https://vercel.com) → Sign up (GitHub)
2. **Add New Project** → импорт `eb-payments`
3. **Root Directory:** `apps/web`
4. **Environment Variables:**


| Переменная            | Значение                                      |
| --------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `https://eb-payments-api.onrender.com/api/v1` |


1. Deploy
2. Вернись в Render → обнови `CORS_ORIGIN` и `WEB_URL` на реальный URL Vercel, например:
  `https://eb-payments.vercel.app`

---

## Шаг 5 — Первый вход

- Сайт: `https://твой-проект.vercel.app`
- Админ: `https://твой-проект.vercel.app/admin`
- Логин: тот, что задан через `ADMIN_EMAIL`/`ADMIN_PASSWORD` в переменных окружения Render (см. README и `.env.example`)

После первого успешного деплоя **убери** `RUN_SEED=true` в Render (чтобы не перезаписывать данные).

---

## Шаг 6 — Email бесплатно (опционально)

### Вариант A — без почты (локальный режим)

Не задавай SMTP — коды показываются на `/onboarding` и в логах Render.

### Вариант B — Brevo (300 писем/день бесплатно)

1. [https://www.brevo.com](https://www.brevo.com) → регистрация
2. SMTP: `smtp-relay.brevo.com`, порт `587`
3. В Render добавь:

```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=твой_login@brevo
SMTP_PASS=SMTP_key_из_brevo
SMTP_FROM=EB Payments <noreply@твой-домен.com>
```

---

## Шаг 7 — Stripe (тест, бесплатно)

1. [https://stripe.com](https://stripe.com) → аккаунт
2. **Developers → API keys** → test keys
3. В Render:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Webhook (позже): `https://eb-payments-api.onrender.com/api/v1/stripe/webhook`

---

## Что уже работает бесплатно

- Регистрация, капча, JWT
- Верификация email/телефон (dev-коды или Brevo)
- KYC + одобрение в админке
- Кошельки, обмен, переводы (3% комиссия)
- Stripe test mode (карты тестовые)
- Админ-панель, поддержка
- i18n, темы

---

## Таблица: бесплатно сейчас vs что купить потом

### Сейчас — $0 / месяц


| Что        | Сервис                 | Лимит free        | Качество                    |
| ---------- | ---------------------- | ----------------- | --------------------------- |
| Фронтенд   | Vercel Hobby           | 100 GB трафик/мес | Отлично для Next.js         |
| API        | Render Free            | 750 ч/мес, sleep  | Норм для MVP/демо           |
| PostgreSQL | Neon Free              | 0.5 GB, EU регион | Надёжно для старта          |
| HTTPS      | Vercel + Render        | ∞                 | Production-grade            |
| Email      | Dev / Brevo            | 300/день          | Достаточно для тестов       |
| SMS        | Dev в консоли          | —                 | Только разработка           |
| Платежи    | Stripe Test            | ∞ тестов          | Полный функционал в sandbox |
| Мониторинг | UptimeRobot            | 50 мониторов      | Пингует /health             |
| Аналитика  | Vercel Analytics       | базово            | Опционально                 |
| CI/CD      | GitHub + Vercel/Render | авто-деплой       | При push в main             |


### Потом — по приоритету покупки


| Приоритет | Что купить                       | Зачем                              | Ориентир цены                |
| --------- | -------------------------------- | ---------------------------------- | ---------------------------- |
| 1         | **Домен** `.com` / `.lv` / `.eu` | Бренд, доверие клиентов            | €10–15 / год                 |
| 2         | **Render Starter**               | API без «сна», быстрее ответ       | ~$7 / мес                    |
| 3         | **Neon Scale**                   | Больше БД, бэкапы, нагрузка        | от ~$19 / мес                |
| 4         | **Resend Pro** или Brevo paid    | Много писем, чеки, KYC-уведомления | от ~$20 / мес                |
| 5         | **Twilio**                       | Реальные SMS-коды                  | ~€0.05 / SMS                 |
| 6         | **Stripe Live**                  | Реальные платежи                   | 1.5% + €0.25 за карту (EU)   |
| 7         | **Cloudflare Pro** (опц.)        | WAF, DDoS, CDN                     | ~$20 / мес                   |
| 8         | **Sentry**                       | Ошибки в проде                     | free → $26 / мес             |
| 9         | **Sumsub / Onfido**              | Авто-KYC (паспорт, селфи)          | от ~€1–3 / проверка          |
| 10        | **Юрист + GDPR**                 | Политики, DPA, cookie consent      | €500–3000 разово             |
| 11        | **Лицензия FCMC (Латвия)**       | Легальные платежи/EMI в ЕС         | €10 000+ (капитал + процесс) |
| 12        | **Страхование / аудит**          | PCI, финтех-комплаенс              | по запросу                   |
| 13        | **Мобильное приложение**         | App Store + Google Play            | $99/год + dev time           |
| 14        | **Выделенный support chat**      | Intercom / Crisp paid              | от ~$29 / мес                |


### Рекомендуемый путь роста

```
Месяц 0     → Vercel + Render + Neon (бесплатно), Stripe test
Месяц 1–2   → Домен + Render paid ($7)
Месяц 3–4   → Brevo/Resend + Twilio (реальные коды)
Месяц 5–6   → Stripe Live (малые суммы, тест с друзьями)
Месяц 6+    → KYC-провайдер, юрист, подготовка к лицензии
Год 1–2     → FCMC / EMI лицензия (если серьёзный бизнес)
```

---

## Переменные окружения (полный список)

См. `.env.example` в корне репозитория.

---

## Обновление после изменений в коде

```powershell
git add .
git commit -m "Update"
git push
```

Vercel и Render задеплоят автоматически.

---

## Проблемы


| Симптом             | Решение                                         |
| ------------------- | ----------------------------------------------- |
| API долго отвечает  | Render free «просыпается» — подожди 60 сек      |
| CORS error          | `CORS_ORIGIN` в Render = точный URL Vercel      |
| 500 при регистрации | Проверь `DATABASE_URL`, логи в Render Dashboard |
| Email не приходит   | SMTP или используй dev-код на `/onboarding`     |
| Админ не входит     | Один раз `RUN_SEED=true` и redeploy             |


---

## Безопасность перед публичным запуском

1. Смени пароль админа после первого входа
2. `JWT_SECRET` — только случайная длинная строка
3. Не коммить `.env`
4. `RUN_SEED=false` после первого деплоя
5. Stripe — только test keys до юридической готовности

