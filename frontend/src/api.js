const API_BASE = '/api';

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { status: 'error', models_loaded: false };
    return await res.json();
  } catch (err) {
    return { status: 'offline', models_loaded: false, error: err.message };
  }
}

export async function predictFeed(readings) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(readings),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Prediction failed');
  return res.json();
}

export async function predictImage(file) {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${API_BASE}/predict/image`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Image analysis failed');
  return res.json();
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to load dashboard stats');
  return res.json();
}

export async function getSilageMonitor() {
  const res = await fetch(`${API_BASE}/silage/monitor`);
  if (!res.ok) throw new Error('Failed to load silage data');
  return res.json();
}

export async function generateQR(analysisResult, readings) {
  const res = await fetch(`${API_BASE}/qr/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis_result: analysisResult, readings }),
  });
  if (!res.ok) throw new Error('Failed to generate QR code');
  return res.json();
}

export async function verifyQR(batchId) {
  const res = await fetch(`${API_BASE}/qr/verify/${encodeURIComponent(batchId)}`);
  if (!res.ok) throw new Error('Verification failed');
  return res.json();
}

export async function getQRBatches() {
  const res = await fetch(`${API_BASE}/qr/batches`);
  if (!res.ok) throw new Error('Failed to load batches');
  return res.json();
}

export async function getHistory(limit = 50) {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}

export async function getHistoryFiltered({ feedType = '', qualityStatus = '', search = '', limit = 100 } = {}) {
  const params = new URLSearchParams();
  if (feedType && feedType !== 'All') params.append('feed_type', feedType);
  if (qualityStatus && qualityStatus !== 'All') params.append('quality_status', qualityStatus);
  if (search) params.append('search', search);
  if (limit) params.append('limit', limit);

  const res = await fetch(`${API_BASE}/history?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load filtered history');
  return res.json();
}

export async function getHistoryDetail(recordId) {
  const res = await fetch(`${API_BASE}/history/${encodeURIComponent(recordId)}`);
  if (!res.ok) throw new Error(`Report '${recordId}' not found`);
  return res.json();
}
