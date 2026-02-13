"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Users, Settings, Save, ChevronDown } from "lucide-react";
import { getDashboardSummary } from "@/services/dashboard.service";
import { DashboardSummary } from "@/types/dashboard";

import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RankingGrid } from "@/components/dashboard/RankingCards";
import { MonthlyCharts } from "@/components/dashboard/MonthlyCharts";
import { MonthlyTable } from "@/components/dashboard/MonthlyTable";
import { WidgetConfig } from "@/components/dashboard/WidgetConfig";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [withGroups, setWithGroups] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [widgets, setWidgets] = useState({
    kpi_registros: true,
    kpi_negociado: true,
    kpi_comision: true,
    kpi_ruedas: true,
    charts: true,
    ranking_clientes_trans: true,
    ranking_clientes_comi: true,
    ranking_traders_comi: true,
    ranking_traders_vol: true,
    resumen_mensual: true,
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") return;

    setLoading(true);

    if (session?.user?.accessToken) {
      getDashboardSummary(session.user.accessToken, year, withGroups)
        .then(setData)
        .catch((err) => {
          console.error("Failed to fetch dashboard data", err);
        })
        .finally(() => setLoading(false));
    }
  }, [year, status, session, withGroups]);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  const toggleWidget = (key: string) => {
    setWidgets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (status === "loading" || loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <span className="text-2xl text-destructive font-bold">!</span>
          </div>
          <p className="text-foreground font-semibold">Error al cargar datos</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Asegurate de que el backend este corriendo y vuelve a intentar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-border bg-card p-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {session?.user?.role === 'trader' ? 'Mi Dashboard' : 'Dashboard Administrativo'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Bienvenido,{" "}
            <span className="font-medium text-foreground">
              {session?.user?.name || "Administrador"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {session?.user?.role === "admin" && (
            <div className="flex items-center rounded-lg border border-border bg-background px-2">
              <span className="text-xs font-medium text-muted-foreground px-1">
                Filtro
              </span>
              <select
                value={withGroups ? "true" : "false"}
                onChange={(e) => setWithGroups(e.target.value === "true")}
                className="h-9 border-0 bg-transparent text-sm font-medium text-foreground focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="true">Con Grupos</option>
                <option value="false">Sin Grupos</option>
              </select>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
          )}

          <div className="flex items-center rounded-lg border border-border bg-background px-2">
            <span className="text-xs font-medium text-muted-foreground px-1">
              Periodo
            </span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 border-0 bg-transparent text-sm font-medium text-foreground focus:outline-none focus:ring-0 cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>

          {session?.user?.role === "admin" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                (window.location.href = "/dashboard/traders")
              }
              className="gap-2 text-foreground"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Traders</span>
            </Button>
          )}

          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className="gap-2"
          >
            {editMode ? (
              <Save className="h-4 w-4" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            {editMode ? "Guardar" : "Personalizar"}
          </Button>
        </div>
      </div>

      {/* Widget Config Panel */}
      {editMode && (
        <WidgetConfig widgets={widgets} toggleWidget={toggleWidget} />
      )}

      {/* KPI Cards */}
      <KpiCards kpis={data.kpis} widgets={widgets} />

      {/* Monthly Charts */}
      {widgets.charts && data.monthly_summary.length > 0 && (
        <MonthlyCharts data={data.monthly_summary} />
      )}

      {/* Rankings */}
      <RankingGrid rankings={data.rankings} widgets={widgets} />

      {/* Monthly Summary Table */}
      {widgets.resumen_mensual && (
        <MonthlyTable data={data.monthly_summary} year={year} />
      )}
    </div>
  );
}
