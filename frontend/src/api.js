const API_BASE = '/api';

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
