/**
 * Maps a failed AI request to the message key the UI should show.
 *
 * The routes reply with `{ error: 'rate' | 'budget' | 'unconfigured' | ... }`
 * and an HTTP status. The AI SDK surfaces the *response body* in
 * `error.message`, not the status line, so matching on '429' silently misses
 * and every rate-limited visitor sees the generic failure instead of being
 * told when they can try again. Match on the reason token, which this codebase
 * controls, and treat the status as a fallback.
 */
export type ChatErrorKind = 'rateLimited' | 'budgetExhausted' | 'unconfigured' | 'error';

export function classifyChatError(error: unknown): ChatErrorKind {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (/"?budget"?/.test(message)) return 'budgetExhausted';
  if (/"?rate"?/.test(message) || message.includes('429')) return 'rateLimited';
  if (/unconfigured/.test(message) || message.includes('503')) return 'unconfigured';
  return 'error';
}
