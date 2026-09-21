/**
 * Server-side reCAPTCHA v3 verification utility.
 *
 * Calls Google's siteverify API and enforces a minimum score threshold.
 * Must only be called from server-side code (API routes / Server Actions).
 */

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/** Minimum score to consider a request human. Range: 0.0 (bot) – 1.0 (human). */
const DEFAULT_SCORE_THRESHOLD = 0.5;

export interface RecaptchaVerifyResult {
  success: boolean;
  score: number;
  action: string;
  /** Human-readable reason for failure, present when success is false. */
  reason?: string;
}

/**
 * Verifies a reCAPTCHA v3 token against Google's siteverify API.
 *
 * @param token - The token generated on the client via `executeRecaptcha()`.
 * @param expectedAction - Optional: the action name used when executing the token (e.g. 'contact_form').
 *                         When provided, verification will fail if the action doesn't match.
 * @param scoreThreshold - Minimum accepted score (default: 0.5).
 * @returns A result object indicating whether the token is valid.
 */
export async function verifyRecaptcha(
  token: string | null | undefined,
  expectedAction?: string,
  scoreThreshold = DEFAULT_SCORE_THRESHOLD,
): Promise<RecaptchaVerifyResult> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('[verifyRecaptcha] RECAPTCHA_SECRET_KEY is not configured.');
    return { success: false, score: 0, action: '', reason: 'reCAPTCHA is not configured on the server.' };
  }

  if (!token) {
    return { success: false, score: 0, action: '', reason: 'reCAPTCHA token is missing.' };
  }

  let data: {
    success: boolean;
    score?: number;
    action?: string;
    'error-codes'?: string[];
  };

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: token }).toString(),
    });

    data = await response.json();
  } catch (err) {
    console.error('[verifyRecaptcha] Network error contacting Google siteverify:', err);
    return { success: false, score: 0, action: '', reason: 'Could not reach reCAPTCHA verification service.' };
  }

  const score = data.score ?? 0;
  const action = data.action ?? '';

  if (!data.success) {
    const errorCodes = data['error-codes']?.join(', ') ?? 'unknown';
    console.warn(`[verifyRecaptcha] Token invalid. Error codes: ${errorCodes}`);
    return { success: false, score, action, reason: 'reCAPTCHA token is invalid or expired.' };
  }

  if (score < scoreThreshold) {
    console.warn(`[verifyRecaptcha] Score ${score} is below threshold ${scoreThreshold}. Action: ${action}`);
    return { success: false, score, action, reason: 'reCAPTCHA score too low. Possible bot activity.' };
  }

  if (expectedAction && action !== expectedAction) {
    console.warn(`[verifyRecaptcha] Action mismatch: expected "${expectedAction}", got "${action}".`);
    return { success: false, score, action, reason: 'reCAPTCHA action mismatch.' };
  }

  return { success: true, score, action };
}
