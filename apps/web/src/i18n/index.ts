export type Locale = 'ru' | 'en' | 'lv' | 'de' | 'fr';

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'lv', label: 'Latviešu', flag: '🇱🇻' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

const translations: Record<Locale, Record<string, string>> = {
  ru: {
    login: 'Войти', register: 'Регистрация', dashboard: 'Кабинет', logout: 'Выйти',
    wallets: 'Кошельки', deposit: 'Пополнить', banks: 'Банки', exchange: 'Обмен',
    transfer: 'Перевод', crypto: 'Крипто', history: 'История', support: 'Поддержка',
    theme_dark: 'Тёмная', theme_light: 'Светлая', onboarding: 'Верификация',
    gdpr: 'Я согласен с Политикой конфиденциальности и Условиями использования (GDPR)',
    fee: 'Комиссия', verify_email: 'Подтвердить email', verify_phone: 'Подтвердить телефон',
    verify_age: 'Подтвердить возраст', verify_kyc: 'Загрузить документ',
    first_name: 'Имя', last_name: 'Фамилия', email: 'Email', password: 'Пароль',
    country: 'Страна', language: 'Язык интерфейса', captcha: 'Проверка',
    captcha_hint: 'Подтвердите, что вы не робот',
    register_submit: 'Зарегистрироваться', has_account: 'Уже есть аккаунт?',
  },
  en: {
    login: 'Sign in', register: 'Register', dashboard: 'Dashboard', logout: 'Sign out',
    wallets: 'Wallets', deposit: 'Top up', banks: 'Banks', exchange: 'Exchange',
    transfer: 'Transfer', crypto: 'Crypto', history: 'History', support: 'Support',
    theme_dark: 'Dark', theme_light: 'Light', onboarding: 'Verification',
    gdpr: 'I agree to the Privacy Policy and Terms of Service (GDPR)',
    fee: 'Fee', verify_email: 'Verify email', verify_phone: 'Verify phone',
    verify_age: 'Verify age', verify_kyc: 'Upload document',
    first_name: 'First name', last_name: 'Last name', email: 'Email', password: 'Password',
    country: 'Country', language: 'Interface language', captcha: 'Verification',
    captcha_hint: 'Confirm you are not a robot',
    register_submit: 'Create account', has_account: 'Already have an account?',
  },
  lv: {
    login: 'Pieslēgties', register: 'Reģistrēties', dashboard: 'Kabinets', logout: 'Iziet',
    wallets: 'Maki', deposit: 'Papildināt', banks: 'Bankas', exchange: 'Mainīt',
    transfer: 'Pārvedums', crypto: 'Kripto', history: 'Vēsture', support: 'Atbalsts',
    theme_dark: 'Tumšs', theme_light: 'Gaišs', onboarding: 'Verifikācija',
    gdpr: 'Es piekrītu Privātuma politikai un Lietošanas noteikumiem (GDPR)',
    fee: 'Komisija', verify_email: 'Apstiprināt e-pastu', verify_phone: 'Apstiprināt tālruni',
    verify_age: 'Apstiprināt vecumu', verify_kyc: 'Augšupielādēt dokumentu',
    first_name: 'Vārds', last_name: 'Uzvārds', email: 'E-pasts', password: 'Parole',
    country: 'Valsts', language: 'Interfeisa valoda', captcha: 'Pārbaude',
    captcha_hint: 'Apstipriniet, ka neesat robots',
    register_submit: 'Reģistrēties', has_account: 'Jau ir konts?',
  },
  de: {
    login: 'Anmelden', register: 'Registrieren', dashboard: 'Dashboard', logout: 'Abmelden',
    wallets: 'Konten', deposit: 'Aufladen', banks: 'Banken', exchange: 'Tauschen',
    transfer: 'Überweisen', crypto: 'Krypto', history: 'Verlauf', support: 'Support',
    theme_dark: 'Dunkel', theme_light: 'Hell', onboarding: 'Verifizierung',
    gdpr: 'Ich stimme der Datenschutzrichtlinie zu (DSGVO)',
    fee: 'Gebühr', verify_email: 'E-Mail bestätigen', verify_phone: 'Telefon bestätigen',
    verify_age: 'Alter bestätigen', verify_kyc: 'Dokument hochladen',
    first_name: 'Vorname', last_name: 'Nachname', email: 'E-Mail', password: 'Passwort',
    country: 'Land', language: 'Sprache', captcha: 'Verifizierung',
    captcha_hint: 'Bestätigen Sie, dass Sie kein Roboter sind',
    register_submit: 'Registrieren', has_account: 'Bereits registriert?',
  },
  fr: {
    login: 'Connexion', register: 'Inscription', dashboard: 'Tableau de bord', logout: 'Déconnexion',
    wallets: 'Portefeuilles', deposit: 'Recharger', banks: 'Banques', exchange: 'Échange',
    transfer: 'Virement', crypto: 'Crypto', history: 'Historique', support: 'Support',
    theme_dark: 'Sombre', theme_light: 'Clair', onboarding: 'Vérification',
    gdpr: "J'accepte la Politique de confidentialité (RGPD)",
    fee: 'Frais', verify_email: "Vérifier l'e-mail", verify_phone: 'Vérifier le téléphone',
    verify_age: "Vérifier l'âge", verify_kyc: 'Télécharger le document',
    first_name: 'Prénom', last_name: 'Nom', email: 'E-mail', password: 'Mot de passe',
    country: 'Pays', language: 'Langue', captcha: 'Vérification',
    captcha_hint: "Confirmez que vous n'êtes pas un robot",
    register_submit: "S'inscrire", has_account: 'Déjà un compte?',
  },
};

export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations.ru[key] ?? key;
}
