import fs from 'node:fs';
import path from 'node:path';

/**
 * Check whether maintenance mode is active.
 *
 * Reads .env.local and .env directly from disk on each invocation
 * so changes take effect IMMEDIATELY without needing `npm run build`
 * or even a process restart.
 *
 * Falls back to process.env if the disk files cannot be read.
 */
export function isMaintenanceMode(): boolean {
  try {
    const rootDir = process.cwd();
    const envFiles = ['.env.local', '.env'];

    for (const file of envFiles) {
      const fullPath = path.join(rootDir, file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const match = content.match(/^\s*(?:NEXT_PUBLIC_)?maintenance\s*=\s*['"]?(true|false|1|0)['"]?/im);
        if (match) {
          const val = match[1].toLowerCase();
          return val === 'true' || val === '1';
        }
      }
    }
  } catch {
    // In restricted/read-only environments, fall back to process.env
  }

  const envVal =
    process.env.MAINTENANCE ??
    process.env.maintenance ??
    process.env.NEXT_PUBLIC_MAINTENANCE ??
    process.env.NEXT_PUBLIC_maintenance;

  if (typeof envVal === 'string') {
    const lower = envVal.trim().toLowerCase();
    return lower === 'true' || lower === '1';
  }

  return false;
}
