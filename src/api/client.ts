export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error || 'Request failed');
  }
  return data as T;
}

export const formatMoney = (amountMinor: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  }).format(amountMinor / 100);
