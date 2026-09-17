import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isDevelopmentMode, getRobotsMetadata } from './indexing';

describe('SEO Indexing Utility', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.DEVELOPMENT;
    delete process.env.NEXT_PUBLIC_DEVELOPMENT;
    delete process.env.NEXT_PUBLIC_APP_ENV;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns true for isDevelopmentMode when DEVELOPMENT=true', () => {
    process.env.DEVELOPMENT = 'true';
    expect(isDevelopmentMode()).toBe(true);
    expect(getRobotsMetadata()).toEqual({
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    });
  });

  it('returns false for isDevelopmentMode when DEVELOPMENT=false', () => {
    process.env.DEVELOPMENT = 'false';
    expect(isDevelopmentMode()).toBe(false);
    expect(getRobotsMetadata()).toEqual({
      index: true,
      follow: true,
    });
  });

  it('returns true when NEXT_PUBLIC_DEVELOPMENT=true', () => {
    process.env.NEXT_PUBLIC_DEVELOPMENT = 'true';
    expect(isDevelopmentMode()).toBe(true);
    expect(getRobotsMetadata().index).toBe(false);
  });

  it('falls back to true when NEXT_PUBLIC_APP_ENV is staging', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'staging';
    expect(isDevelopmentMode()).toBe(true);
    expect(getRobotsMetadata().index).toBe(false);
  });
});
