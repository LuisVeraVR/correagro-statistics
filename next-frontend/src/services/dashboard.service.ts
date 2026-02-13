import { DashboardSummary } from "@/types/dashboard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const getDashboardSummary = async (token: string, year: number, withGroups: boolean = true, trader?: string): Promise<DashboardSummary> => {
    let url = `${API_URL}/dashboard/summary?year=${year}&withGroups=${withGroups}`;
    if (trader) {
        url += `&trader=${encodeURIComponent(trader)}`;
    }
    
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error('Failed to fetch dashboard summary');
    }

    return res.json();
};

export const getDashboardLayout = async (token: string, userId: number): Promise<any> => {
    const res = await fetch(`${API_URL}/dashboard/layout?userId=${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error('Failed to fetch dashboard layout');
    }

    return res.json();
};

export const saveDashboardLayout = async (token: string, userId: number, layout: any): Promise<void> => {
    const res = await fetch(`${API_URL}/dashboard/layout?userId=${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(layout),
    });

    if (!res.ok) {
        throw new Error('Failed to save dashboard layout');
    }
};
