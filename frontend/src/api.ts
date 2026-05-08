const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type User = {
  id: string;
  user_id: string;
  store_code: string;
  display_name: string;
};

export type Client = {
  id: string;
  owner_user_id: string;
  name: string;
  phone_number?: string;
  order_number: string;
  provider?: string;
  installation_date: string;
  order_details: string;
  created_at: string;
  updated_at: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      detail = JSON.parse(text).detail || text;
    } catch {}
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (user_id: string, store_code: string) =>
    request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ user_id, store_code }),
    }),
  register: (user_id: string, store_code: string, display_name?: string) =>
    request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ user_id, store_code, display_name }),
    }),
  listClients: (owner_user_id: string, q?: string) => {
    const params = new URLSearchParams({ owner_user_id });
    if (q) params.append('q', q);
    return request<Client[]>(`/clients?${params.toString()}`);
  },
  getReminders: (owner_user_id: string) =>
    request<Client[]>(`/clients/reminders?owner_user_id=${encodeURIComponent(owner_user_id)}`),
  getClient: (id: string) => request<Client>(`/clients/${id}`),
  createClient: (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) =>
    request<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: Partial<Client>) =>
    request<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) =>
    request<{ ok: boolean }>(`/clients/${id}`, { method: 'DELETE' }),
};
