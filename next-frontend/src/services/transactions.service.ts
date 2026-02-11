import { CreateTransactionDto, UpdateTransactionDto, Transaction } from "@/types/transaction";
import { handleAuthError } from "@/utils/auth-helper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const getTransactions = async (token: string, year?: number): Promise<Transaction[]> => {
  let url = `${API_URL}/transactions`;
  if (year) {
    url += `?year=${year}`;
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

export const getTransaction = async (token: string, id: number): Promise<Transaction> => {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch transaction');
  return res.json();
};

export const createTransaction = async (token: string, data: CreateTransactionDto): Promise<void> => {
  const res = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to create transaction');
};

export const updateTransaction = async (token: string, id: number, data: UpdateTransactionDto): Promise<void> => {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to update transaction');
};

export const deleteTransaction = async (token: string, id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to delete transaction');
};

export const getDailySummary = async (token: string, year: number, month?: string): Promise<any[]> => {
  let url = `${API_URL}/transactions/summary/daily?year=${year}`;
  if (month) {
    url += `&month=${month}`;
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch daily summary');
  return res.json();
};

export const getRuedasSummary = async (token: string, year: number): Promise<any[]> => {
  const res = await fetch(`${API_URL}/transactions/summary/ruedas?year=${year}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch ruedas summary');
  return res.json();
};

export const getMarginReport = async (token: string, year: number): Promise<any[]> => {
  const res = await fetch(`${API_URL}/transactions/reports/margin?year=${year}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to fetch margin report');
  return res.json();
};
