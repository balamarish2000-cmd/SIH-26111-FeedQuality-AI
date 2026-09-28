// Same-origin '/api' in dev (Vite proxy) and on Vercel; set VITE_API_BASE to the
// full backend URL (e.g. https://feedguard-api.onrender.com/api) for Netlify.
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '');

async function handleResponse(res, fallbackMessage = 'Request failed') {
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (data && data.error) {
      throw new Error(data.error);
    }
    const text = await res.text().catch(() => '');
    throw new Error(text || `${fallbackMessage} (${res.status})`);
  }

  if (data !== null && data !== undefined) {
    return data;
  }
  return await res.json();
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { status: 'error', models_loaded: false };
    return await res.json();
  } catch (err) {
    return { status: 'offline', models_loaded: false, error: err.message };
  }
}

export async function predictFeed(readings, lang = 'en') {
  const res = await fetch(`${API_BASE}/predict?lang=${encodeURIComponent(lang)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...readings, lang }),
  });
  return handleResponse(res, 'Feed quality prediction failed');
}

export async function predictImage(file, lang = 'en') {
  const form = new FormData();
  form.append('image', file);
  form.append('lang', lang);
  const res = await fetch(`${API_BASE}/predict/image?lang=${encodeURIComponent(lang)}`, {
    method: 'POST',
    body: form,
  });
  return handleResponse(res, 'Image analysis failed');
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  return handleResponse(res, 'Failed to load dashboard stats');
}

export async function getSilageMonitor() {
  const res = await fetch(`${API_BASE}/silage/monitor`);
  return handleResponse(res, 'Failed to load silage data');
}

export async function generateQR(analysisResult, readings) {
  const res = await fetch(`${API_BASE}/qr/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis_result: analysisResult, readings }),
  });
  return handleResponse(res, 'Failed to generate QR code');
}

export async function verifyQR(batchId) {
  const res = await fetch(`${API_BASE}/qr/verify/${encodeURIComponent(batchId)}`);
  return handleResponse(res, 'Verification failed');
}

export async function getQRBatches() {
  const res = await fetch(`${API_BASE}/qr/batches`);
  return handleResponse(res, 'Failed to load batches');
}

export async function getHistory(limit = 50) {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  return handleResponse(res, 'Failed to load history');
}

export async function getHistoryFiltered({ feedType = '', qualityStatus = '', search = '', limit = 100 } = {}) {
  const params = new URLSearchParams();
  if (feedType && feedType !== 'All') params.append('feed_type', feedType);
  if (qualityStatus && qualityStatus !== 'All') params.append('quality_status', qualityStatus);
  if (search) params.append('search', search);
  if (limit) params.append('limit', limit);

  const res = await fetch(`${API_BASE}/history?${params.toString()}`);
  return handleResponse(res, 'Failed to load filtered history');
}

export async function getHistoryDetail(recordId) {
  const res = await fetch(`${API_BASE}/history/${encodeURIComponent(recordId)}`);
  return handleResponse(res, `Report '${recordId}' not found`);
}
