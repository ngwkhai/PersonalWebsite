/**
 * Smoke-tests the agent from the command line: sends one question and prints
 * the tools it called and the answer it gave. Used to verify grounding
 * behaviour without clicking through the UI.
 */
const [, , question, locale = 'en'] = process.argv;

const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    locale,
    messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: question }] }],
  }),
});

if (!response.ok) {
  console.log(`HTTP ${response.status}:`, await response.text());
  process.exit(0);
}

/** Tools with no server-side execute; only a browser can complete these. */
const CLIENT_TOOLS = new Set(['navigateTo']);

let text = '';
const tools = [];
const clientPending = [];
const buffer = [];

for await (const chunk of response.body.pipeThrough(new TextDecoderStream())) {
  buffer.push(chunk);
}

for (const line of buffer.join('').split('\n')) {
  if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
  let event;
  try {
    event = JSON.parse(line.slice(6));
  } catch {
    continue;
  }
  if (event.type === 'text-delta') text += event.delta;
  if (event.type === 'tool-input-available') {
    tools.push(`${event.toolName}(${JSON.stringify(event.input)})`);
    if (CLIENT_TOOLS.has(event.toolName)) clientPending.push(event.toolName);
  }
}

console.log('TOOLS:', tools.length ? tools.join('\n       ') : '(none)');
if (clientPending.length > 0) {
  console.log(
    `\nNOTE: ${clientPending.join(', ')} execute in the browser, not on the server. This ` +
      'script has no client to return their output, so the agent stops here rather than ' +
      'writing an answer. In the app the result is sent back and the turn continues.',
  );
}
console.log('\nANSWER:\n' + (text || '(none — see note above)'));
