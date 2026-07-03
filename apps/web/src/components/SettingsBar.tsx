'use client';

import { useApp } from './AppProvider';
import { LOCALES, Locale } from '@/i18n';

export function SettingsBar() {
  const { theme, locale, setTheme, setLocale, t } = useApp();

  return (
    <div className="flex items-center gap-2">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="eb-select text-xs py-1.5 px-2 rounded-lg"
        aria-label="Язык"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
        ))}
      </select>
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="eb-btn-secondary text-xs py-1.5 px-3 rounded-lg"
        title={theme === 'dark' ? t('theme_light') : t('theme_dark')}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
