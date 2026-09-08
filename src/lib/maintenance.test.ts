import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { isMaintenanceMode } from './maintenance';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
      readFileSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

describe('isMaintenanceMode', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.MAINTENANCE;
    delete process.env.maintenance;
    delete process.env.NEXT_PUBLIC_MAINTENANCE;
    delete process.env.NEXT_PUBLIC_maintenance;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns true when .env has MAINTENANCE=true', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('MAINTENANCE=true\nOTHER=123');

    expect(isMaintenanceMode()).toBe(true);
  });

  it('returns false when .env has MAINTENANCE=false', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('MAINTENANCE=false\nOTHER=123');

    expect(isMaintenanceMode()).toBe(false);
  });

  it('returns true when lowercase maintenance=true in .env', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('maintenance=true');

    expect(isMaintenanceMode()).toBe(true);
  });

  it('falls back to process.env when file does not exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    process.env.MAINTENANCE = 'true';
    expect(isMaintenanceMode()).toBe(true);

    process.env.MAINTENANCE = 'false';
    expect(isMaintenanceMode()).toBe(false);
  });
});
