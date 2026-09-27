// Pages static assets do not implement byte ranges. Browsers need real partial
// responses to seek and reopen MP4s. Only MP4 routes invoke this worker.
// Filled from the actual build files because ASSETS can omit Content-Length.
const assetSizes = {};
export function byteRange(value, size) {
  if (!value || !/^bytes=\d*-\d*$/.test(value)) return null;
  const [left, right] = value.slice(6).split('-');
  if (!left && !right) return null;
  const start = left ? Number(left) : Math.max(0, size - Number(right));
  const end = left ? (right ? Math.min(Number(right), size - 1) : size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start || (!left && Number(right) === 0)) return false;
  return { start, end };
}

function sliceStream(body, start, end) {
  const reader = body.getReader();
  let offset = 0;
  return new ReadableStream({
    async pull(controller) {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) { controller.close(); return; }
          const before = offset;
          offset += value.byteLength;
          if (offset <= start) continue;
          const piece = value.subarray(Math.max(0, start - before), Math.min(value.byteLength, end + 1 - before));
          if (piece.byteLength) controller.enqueue(piece);
          if (offset > end) { controller.close(); await reader.cancel(); }
          return;
        }
      } catch (error) { controller.error(error); }
    },
    cancel(reason) { return reader.cancel(reason); },
  });
}

export default {
  async fetch(request, env) {
    if (!new URL(request.url).pathname.endsWith('.mp4') || !['GET', 'HEAD'].includes(request.method)) return env.ASSETS.fetch(request);
    const headers = new Headers(request.headers);
    const requestedRange = headers.get('Range');
    const ifRange = headers.get('If-Range');
    headers.delete('Range');
    headers.delete('If-Range');
    // Evaluate the full representation's validators before slicing it.
    const asset = await env.ASSETS.fetch(new Request(request, { method: 'GET', headers }));
    if (asset.status !== 200) return new Response(request.method === 'HEAD' ? null : asset.body, asset);
    if (!asset.headers.get('Content-Type')?.toLowerCase().startsWith('video/mp4')) {
      await asset.body?.cancel();
      return new Response('Video not found', { status: 404 });
    }
    const responseHeaders = new Headers(asset.headers);
    responseHeaders.set('Accept-Ranges', 'bytes');
    const length = Number(asset.headers.get('Content-Length') ?? assetSizes[new URL(request.url).pathname]);
    if (!Number.isSafeInteger(length) || length <= 0) {
      // Without a reliable size do not claim partial-response support.
      responseHeaders.delete('Accept-Ranges');
      return new Response(request.method === 'HEAD' ? null : asset.body, { headers: responseHeaders });
    }
    responseHeaders.set('Content-Length', String(length));
    if (request.method === 'HEAD') { await asset.body?.cancel(); return new Response(null, { headers: responseHeaders }); }
    const validatorMatches = !ifRange || (ifRange.startsWith('"')
      ? ifRange === asset.headers.get('ETag')
      : !ifRange.startsWith('W/') && Number.isFinite(Date.parse(ifRange)) && Date.parse(asset.headers.get('Last-Modified')) <= Date.parse(ifRange));
    const range = validatorMatches ? byteRange(requestedRange, length) : null;
    if (range === false) {
      await asset.body?.cancel();
      responseHeaders.set('Content-Range', `bytes */${length}`);
      responseHeaders.set('Content-Length', '0');
      return new Response(null, { status: 416, headers: responseHeaders });
    }
    if (!range) return new Response(asset.body, { headers: responseHeaders });
    responseHeaders.set('Content-Range', `bytes ${range.start}-${range.end}/${length}`);
    responseHeaders.set('Content-Length', String(range.end - range.start + 1));
    return new Response(sliceStream(asset.body, range.start, range.end), { status: 206, headers: responseHeaders });
  },
};
