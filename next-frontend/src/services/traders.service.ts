import { CreateTraderDto, UpdateTraderDto, Trader } from "@/types/trader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { timestamp: number; data: unknown }>();

const getCached = async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }
  const data = await fetcher();
  cache.set(key, { timestamp: Date.now(), data });
  return data;
};

export const getTraders = async (token: string): Promise<Trader[]> => {
  const cacheKey = `traders:${token}`;
  return getCached(cacheKey, async () => {
    const res = await fetch(`${API_URL}/traders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch traders');
    return res.json();
  });
};

export const getTrader = async (token: string, id: number): Promise<Trader> => {
  const res = await fetch(`${API_URL}/traders/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch trader');
  return res.json();
};

export const createTrader = async (token: string, data: CreateTraderDto): Promise<void> => {
  const res = await fetch(`${API_URL}/traders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create trader');
};

export const updateTrader = async (token: string, id: number, data: UpdateTraderDto): Promise<void> => {
  const res = await fetch(`${API_URL}/traders/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update trader');
};

export const deleteTrader = async (token: string, id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/traders/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to delete trader');
};

export const getTraderAdicionales = async (token: string, id: number): Promise<{ id: number, nombreAdicional: string }[]> => {
  const res = await fetch(`${API_URL}/traders/${id}/adicionales`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch trader adicionales');
  return res.json();
};

export const addTraderAdicional = async (token: string, id: number, nombreAdicional: string): Promise<void> => {
  const res = await fetch(`${API_URL}/traders/${id}/adicionales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nombreAdicional }),
  });
  if (!res.ok) throw new Error('Failed to add trader adicional');
};

export const deleteTraderAdicional = async (token: string, id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/traders/adicionales/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to delete trader adicional');
};
