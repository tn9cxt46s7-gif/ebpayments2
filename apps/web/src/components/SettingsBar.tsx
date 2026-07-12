'use client';

import { useApp } from './AppProvider';
import { LanguageFlagSelect } from './LanguageFlagSelect';

export function SettingsBar() {
  const { theme, locale, setTheme, setLocale, t } = useApp();

  return (
    <div className="flex items-center gap-2">
      <LanguageFlagSelect value={locale} onChange={setLocale} />
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
