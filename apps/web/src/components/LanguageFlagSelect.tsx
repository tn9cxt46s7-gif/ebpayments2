'use client';

import { LOCALES, type Locale } from '@/i18n';

interface Props {
  value: Locale;
  onChange: (locale: Locale) => void;
}

export function LanguageFlagSelect({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap" role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => onChange(l.code)}
          title={l.label}
          aria-label={l.label}
          aria-pressed={value === l.code}
          className={`text-2xl leading-none px-3 py-2.5 rounded-xl transition border ${
            value === l.code
              ? 'border-indigo-500 bg-indigo-500/20 scale-105 shadow-lg shadow-indigo-500/20'
              : 'border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10'
          }`}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}
