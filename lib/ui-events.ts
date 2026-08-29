/**
 * The chat dock and command palette are mounted in the layout, but opened from
 * anywhere — the header, a case study, an empty search result. Rather than lift
 * that state into a provider that would re-render the whole tree, they listen
 * for these two events.
 */
export const CHAT_OPEN = 'khai:chat-open';
export const PALETTE_OPEN = 'khai:palette-open';

/** Opens the chat dock, optionally seeding the input with a question. */
export function openChat(prompt?: string) {
  window.dispatchEvent(new CustomEvent(CHAT_OPEN, { detail: { prompt } }));
}

export function openPalette() {
  window.dispatchEvent(new CustomEvent(PALETTE_OPEN));
}
