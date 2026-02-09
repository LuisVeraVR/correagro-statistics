export interface DashboardSummary {
  year: number;
  kpis: {
    total_volume: number;
    total_commission: number;
    total_transactions: number;
    total_ruedas: number;
    active_traders: number;
  };
  rankings: {
    traders_by_volume: { name: string; value: number }[];
    traders_by_commission: { name: string; value: number }[];
    clients_by_volume: { name: string; value: number }[];
    clients_by_commission: { name: string; value: number }[];
  };
  monthly_summary: {
    month: string;
    volume: number;
    commission: number;
    transactions: number;
    ruedas: number;
  }[];
}
