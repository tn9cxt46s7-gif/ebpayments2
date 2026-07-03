export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 prose prose-invert">
      <h1>Политика конфиденциальности</h1>
      <p><strong>EB Payments</strong> — оператор в ЕС (Латвия). Контакт: privacy@ebpayments.com</p>
      <h2>Собираемые данные</h2>
      <ul>
        <li>Имя, email, телефон, дата рождения</li>
        <li>KYC-документы (паспорт, ID) — требование AMLD5 ЕС</li>
        <li>Данные транзакций</li>
      </ul>
      <h2>GDPR — ваши права</h2>
      <p>Доступ, исправление, удаление, переносимость данных. Запрос: privacy@ebpayments.com</p>
      <h2>Хранение</h2>
      <p>KYC-данные — 5 лет после закрытия счёта (AML).</p>
    </div>
  );
}
