import { describe, expect, it } from 'vitest';
import { classifyChatError } from '../errors';

/**
 * The routes reply with a JSON body, and the AI SDK surfaces that body — not
 * the status line — in error.message. These cases are the shapes actually seen.
 */
describe('classifyChatError', () => {
  it('reads the reason from the response body', () => {
    expect(classifyChatError(new Error('{"error":"rate"}'))).toBe('rateLimited');
    expect(classifyChatError(new Error('{"error":"budget"}'))).toBe('budgetExhausted');
    expect(classifyChatError(new Error('{"error":"unconfigured"}'))).toBe('unconfigured');
  });

  it('still recognises a bare status code', () => {
    expect(classifyChatError(new Error('Request failed with status 429'))).toBe('rateLimited');
    expect(classifyChatError(new Error('Request failed with status 503'))).toBe('unconfigured');
  });

  it('prefers budget over rate when both words appear', () => {
    // A budget stop is the more specific and more actionable message.
    expect(classifyChatError(new Error('{"error":"budget"} 429'))).toBe('budgetExhausted');
  });

  it('falls back to the generic message for anything else', () => {
    expect(classifyChatError(new Error('network error'))).toBe('error');
    expect(classifyChatError(undefined)).toBe('error');
    expect(classifyChatError('boom')).toBe('error');
  });
});
