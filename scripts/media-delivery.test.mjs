import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../public/_worker.js';
const bytes = Uint8Array.from({ length: 200 }, (_, i) => i);
function serve(headers = {}, method = 'GET', options = {}) {
  const env = { ASSETS: { fetch: async request => {
    assert.equal(request.headers.get('range'), null);
    return new Response(new ReadableStream({ start(c) { c.enqueue(bytes.slice(0, 70)); c.enqueue(bytes.slice(70, 130)); c.enqueue(bytes.slice(130)); c.close(); } }), {
      headers: { 'Content-Type': 'video/mp4', 'Content-Length': '200', ETag: '"stable"', 'Last-Modified': 'Wed, 01 Jan 2025 00:00:00 GMT', ...options },
    });
  } } };
  return worker.fetch(new Request('https://example.com/test.mp4', { method, headers }), env);
}
for (const [range, start, end] of [['bytes=0-9', 0, 9], ['bytes=65-135', 65, 135], ['bytes=190-', 190, 199], ['bytes=-10', 190, 199], ['bytes=190-999', 190, 199]]) {
  test(`exact streamed bytes for ${range}`, async () => {
    const response = await serve({ Range: range });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/200`);
    assert.equal(response.headers.get('content-length'), String(end - start + 1));
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes.slice(start, end + 1));
  });
}
test('unsatisfiable ranges return honest 416', async () => {
  for (const range of ['bytes=200-', 'bytes=50-20', 'bytes=-0']) {
    const r = await serve({ Range: range }); assert.equal(r.status, 416); assert.equal(r.headers.get('content-range'), 'bytes */200');
  }
});
test('malformed, multiple, and mismatched If-Range return full representations', async () => {
  for (const headers of [{ Range: 'garbage' }, { Range: 'bytes=1-2,4-5' }, { Range: 'bytes=1-2', 'If-Range': '"old"' }, { Range: 'bytes=1-2', 'If-Range': 'W/"stable"' }]) {
    const r = await serve(headers); assert.equal(r.status, 200); assert.deepEqual(new Uint8Array(await r.arrayBuffer()), bytes);
  }
});
test('matching strong validator allows ranges', async () => { assert.equal((await serve({ Range: 'bytes=1-2', 'If-Range': '"stable"' })).status, 206); });
test('HEAD returns full length and no body', async () => { const r = await serve({ Range: 'bytes=1-2' }, 'HEAD'); assert.equal(r.status, 200); assert.equal(r.headers.get('content-length'), '200'); assert.equal(await r.text(), ''); });
test('SPA HTML fallback is never served as a video', async () => { assert.equal((await serve({}, 'GET', { 'Content-Type': 'text/html' })).status, 404); });
test('nonvideo paths bypass media handling', async () => {
  const response = new Response('static');
  assert.equal(await worker.fetch(new Request('https://example.com/index.html'), { ASSETS: { fetch: async () => response } }), response);
});
