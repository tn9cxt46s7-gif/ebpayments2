'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface RecaptchaHandle {
  getToken: () => string | null;
  reset: () => void;
}

type GreCaptcha = {
  ready(cb: () => void): void;
  render(container: HTMLElement, params: { sitekey: string }): number;
  getResponse(widgetId?: number): string;
  reset(widgetId?: number): void;
};

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

function getGreCaptcha(): GreCaptcha | undefined {
  return (window as unknown as { grecaptcha?: GreCaptcha }).grecaptcha;
}

export const Recaptcha = forwardRef<RecaptchaHandle>(function Recaptcha(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    getToken: () => {
      const gr = getGreCaptcha();
      if (!SITE_KEY || widgetId.current === null || !gr) return null;
      return gr.getResponse(widgetId.current) || null;
    },
    reset: () => {
      const gr = getGreCaptcha();
      if (gr && widgetId.current !== null) gr.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;

    const renderWidget = () => {
      const gr = getGreCaptcha();
      if (!containerRef.current || widgetId.current !== null || !gr) return;
      widgetId.current = gr.render(containerRef.current, { sitekey: SITE_KEY });
    };

    const gr = getGreCaptcha();
    if (gr) {
      gr.ready(renderWidget);
      return;
    }

    const existing = document.querySelector('script[src*="recaptcha/api.js"]');
    if (existing) {
      const poll = setInterval(() => {
        if (getGreCaptcha()) {
          clearInterval(poll);
          getGreCaptcha()?.ready(renderWidget);
        }
      }, 200);
      return () => clearInterval(poll);
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => getGreCaptcha()?.ready(renderWidget);
    document.body.appendChild(script);
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className="flex justify-center min-h-[78px]" />;
});

export function isRecaptchaEnabled() {
  return !!SITE_KEY;
}
