'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface ReCAPTCHAProps {
  siteKey: string;
}

interface Grecaptcha {
  ready: (callback: () => void) => void;
  execute: (sitekey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

export interface ReCAPTCHARef {
  execute: (action: string) => Promise<string | null>;
}

export const ReCAPTCHA = forwardRef<ReCAPTCHARef, ReCAPTCHAProps>(
  ({ siteKey }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useImperativeHandle(ref, () => ({
      execute: async (action: string) => {
        if (!isLoaded) return null;
        const grecaptcha = typeof window !== 'undefined' ? window.grecaptcha : undefined;
        if (!grecaptcha) return null;

        return new Promise((resolve) => {
          grecaptcha.ready(async () => {
            try {
              const token = await grecaptcha.execute(siteKey, { action });
              resolve(token);
            } catch (e) {
              console.error('Error executing reCAPTCHA:', e);
              resolve(null);
            }
          });
        });
      },
    }));

    useEffect(() => {
      const scriptId = 'recaptcha-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      const handleLoaded = () => {
        setIsLoaded(true);
      };

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        script.addEventListener('load', handleLoaded);
      } else {
        if (typeof window !== 'undefined' && window.grecaptcha) {
          setIsLoaded(true);
        } else {
          script.addEventListener('load', handleLoaded);
        }
      }

      return () => {
        if (script) {
          script.removeEventListener('load', handleLoaded);
        }
      };
    }, [siteKey]);

    // Render nothing visually
    return null;
  }
);

ReCAPTCHA.displayName = 'ReCAPTCHA';
