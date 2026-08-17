import { GatewayHealth, GatewayConfigData, ModelData, RequestLogItem, ReviewRecordItem } from './types';

const API_BASE = '/v1';

export async function fetchHealth(): Promise<GatewayHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchModels(): Promise<ModelData[]> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error(`Fetch models failed: ${res.statusText}`);
  const data = await res.json();
  return data.data || [];
}

export async function fetchLogs(limit = 100): Promise<{
  logs: RequestLogItem[];
  reviews: ReviewRecordItem[];
  stats: any;
}> {
  const res = await fetch(`${API_BASE}/logs?limit=${limit}`);
  if (!res.ok) throw new Error(`Fetch logs failed: ${res.statusText}`);
  return res.json();
}

export async function fetchConfig(): Promise<GatewayConfigData> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error(`Fetch config failed: ${res.statusText}`);
  return res.json();
}

export async function sendChatCompletion(payload: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
}) {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Chat request failed: ${res.statusText}`);
  }
  return res.json();
}

export async function runReview(payload: {
  model?: string;
  code?: string;
  diff?: string;
  context?: string;
  focus?: string;
}): Promise<ReviewRecordItem> {
  const res = await fetch(`${API_BASE}/reviews/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.errorMessage || `Review failed: ${res.statusText}`);
  }
  return res.json();
}
