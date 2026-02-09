import { CreateTraderDto, UpdateTraderDto, Trader } from "@/types/trader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const getTraders = async (token: string): Promise<Trader[]> => {
  const res = await fetch(`${API_URL}/traders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch traders');
  return res.json();
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
