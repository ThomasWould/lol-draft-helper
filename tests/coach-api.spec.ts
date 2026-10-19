import { test, expect } from '@playwright/test';
import handler from '../api/coach';

test('coach rejects malformed or unbounded input before contacting a model', async () => {
  for (const body of [null, [], {}, { message: ' ' }, { message: 'x'.repeat(4001) },
    { message: 'hi', context: 'instructions' }, { message: 'hi', images: ['https://example.com/remote.jpg'] },
    { message: 'hi', images: [123] }, { message: 'hi', context: { text: 'x'.repeat(17000) } }]) {
    let code = 0;
    const response = { status(n: number) { code = n; return this; }, json() {}, setHeader() {} };
    await handler({ method: 'POST', body }, response);
    expect(code).toBe(400);
  }
});

test('coach advertises allowed method', async () => {
  let code = 0;
  const headers: Record<string, string> = {};
  const response = { status(n: number) { code = n; return this; }, json() {}, setHeader(k: string, v: string) { headers[k] = v; } };
  await handler({ method: 'GET' }, response);
  expect(code).toBe(405);
  expect(headers.Allow).toBe('POST');
});
