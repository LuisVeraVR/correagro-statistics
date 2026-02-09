const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface BenchmarkSummary {
    totalWithGroups: number;
    totalWithoutGroups: number;
    activeSCBs: number;
    year: number;
}

export interface RankingItem {
    name: string;
    volume: number;
    share: number;
    position: number;
}

export interface TrendsData {
    market: Record<string, number>;
    traders: Record<string, Record<string, number>>;
    months: string[];
}

export interface CorreagroStats {
    position: number;
    share: number;
    gap1: number;
    gap2: number;
    volume: number;
    prevGap: number;
}

export const getBenchmarkSummary = async (token: string, year: number): Promise<BenchmarkSummary> => {
    const res = await fetch(`${API_URL}/benchmark/summary?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
};

export const getBenchmarkRanking = async (token: string, year: number, month: string = 'all', limit: number = 50): Promise<RankingItem[]> => {
    const res = await fetch(`${API_URL}/benchmark/ranking?year=${year}&month=${month}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch ranking');
    return res.json();
};

export const getBenchmarkTrends = async (token: string, year: number): Promise<TrendsData> => {
    const res = await fetch(`${API_URL}/benchmark/trends?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch trends');
    return res.json();
};

export const getCorreagroStats = async (token: string, year: number): Promise<CorreagroStats | null> => {
    const res = await fetch(`${API_URL}/benchmark/correagro?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch correagro stats');
    return res.json();
};

export interface ComparisonData {
    marketShare: { name: string; value: number; percentage: number }[];
    volumeHistory: any[];
    growth: { name: string; volume: number }[];
    gaps: { competitor: string; amount: number; monthsToReach: number } | null;
}

export const getBenchmarkComparison = async (token: string, traders: string[], period: number): Promise<ComparisonData> => {
    const response = await fetch(`${API_URL}/benchmark/compare?ids=${traders.join(',')}&period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
};

export const getBenchmarkSectors = async (token: string, year: number) => {

    const res = await fetch(`${API_URL}/benchmark/sectors?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch sectors');
    return res.json();
};

export const getBenchmarkProducts = async (token: string, year: number) => {
    const res = await fetch(`${API_URL}/benchmark/products?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
};
