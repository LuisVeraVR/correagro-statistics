import { useAuth } from '@/hooks/useAuth';

export interface OrfsReportData {
    corredor: string;
    totalVolume: number;
    clientCount: number;
    clients: {
        nit: string;
        name: string;
        total: number;
        months: {
            [key: string]: number;
        };
    }[];
}

export interface MarginReportData {
    kpis: {
        totalVolume: number;
        totalCommission: number;
        totalClients: number;
        avgMargin: number;
    };
    data: {
        corredor: string;
        totalVolume: number;
        totalCommission: number;
        avgMargin: number;
        clientCount: number;
        clients: {
            nit: string;
            name: string;
            totalVolume: number;
            totalCommission: number;
            totalMargin: number;
            months: {
                [key: string]: {
                    volume: number;
                    commission: number;
                    margin: number;
                };
            };
        }[];
    }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const getOrfsReport = async (token: string, year: number, month: string = 'all', trader: string | string[] = 'all', client: string | string[] = 'all', withGroups: boolean = true): Promise<OrfsReportData[]> => {
    const traderStr = Array.isArray(trader) ? trader.join(',') : trader;
    const clientStr = Array.isArray(client) ? client.join(',') : client;
    
    const query = new URLSearchParams({
        year: year.toString(),
        month,
        trader: traderStr,
        client: clientStr,
        withGroups: withGroups.toString()
    });

    const res = await fetch(`${API_URL}/reports/orfs?${query.toString()}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) throw new Error('Failed to fetch ORFS report');
    return res.json();
};

export const getMarginReport = async (token: string, year: number, month: string = 'all', trader: string | string[] = 'all', client: string | string[] = 'all', withGroups: boolean = true): Promise<MarginReportData> => {
    const traderStr = Array.isArray(trader) ? trader.join(',') : trader;
    const clientStr = Array.isArray(client) ? client.join(',') : client;

    const query = new URLSearchParams({
        year: year.toString(),
        month,
        trader: traderStr,
        client: clientStr,
        withGroups: withGroups.toString()
    });

    const res = await fetch(`${API_URL}/reports/margin?${query.toString()}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) throw new Error('Failed to fetch Margin report');
    return res.json();
};

export const getClients = async (token: string, year: number): Promise<string[]> => {
    const res = await fetch(`${API_URL}/reports/clients?year=${year}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
};

export interface RuedaOption {
    ruedaNo: number;
    fecha: string;
}

export interface RuedasReportData {
    kpis: {
        totalVolume: number;
        totalCommission: number;
        totalClients: number;
        totalTraders: number;
        avgMargin: number;
    };
    data: {
        corredor: string;
        totalVolume: number;
        totalCommission: number;
        avgMargin: number;
        clientCount: number;
        wheels: {
            ruedaNo: number;
            fecha: string;
            volume: number;
            commission: number;
            clients: {
                name: string;
                volume: number;
                commission: number;
            }[];
        }[];
    }[];
}

export interface DailyReportData {
    ruedas: number[];
    data: {
        name: string;
        wheels: { [key: number]: number };
    }[];
}

export const getRuedasOptions = async (token: string, year: number): Promise<RuedaOption[]> => {
    const res = await fetch(`${API_URL}/reports/ruedas-options?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch ruedas options');
    return res.json();
};

export const getRuedasReport = async (token: string, year: number, ruedas: string[], withGroups: boolean = true): Promise<RuedasReportData> => {
    const ruedasStr = ruedas.join(',');
    const query = new URLSearchParams({ 
        year: year.toString(), 
        ruedas: ruedasStr,
        withGroups: withGroups.toString() 
    });
    const res = await fetch(`${API_URL}/reports/ruedas?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch Ruedas report');
    return res.json();
};

export const getDailyReport = async (token: string, year: number, month: string = 'all', rueda: string = 'all', client: string = '', withGroups: boolean = true): Promise<DailyReportData> => {
    const query = new URLSearchParams({
        year: year.toString(),
        month,
        rueda,
        client,
        withGroups: withGroups.toString()
    });
    const res = await fetch(`${API_URL}/reports/daily?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch Daily report');
    return res.json();
};
