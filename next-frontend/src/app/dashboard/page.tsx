'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  SlidersHorizontal, 
  Save, 
  X, 
  Activity, 
  DollarSign, 
  Users, 
  TrendingUp, 
  FileText, 
  Calendar,
  Settings
} from "lucide-react";
import { getDashboardSummary } from "@/services/dashboard.service";
import { DashboardSummary } from "@/types/dashboard";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [withGroups, setWithGroups] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // Widget Visibility State
  const [widgets, setWidgets] = useState({
    kpis: true,
    charts: true,
    insights: true,
    tables: true,
    // Specifics
    kpi_registros: true,
    kpi_negociado: true,
    kpi_comision: true,
    kpi_ruedas: true,
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

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-2">
          <Activity className="h-8 w-8 animate-pulse text-blue-600" />
          <div className="text-lg text-muted-foreground animate-pulse">Cargando estadísticas...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-lg text-destructive">Error al cargar datos. Asegúrate de que el backend esté corriendo.</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatLargeCurrency = (value: number) => {
      if (value >= 1000000000) {
          return `$${(value / 1000000000).toFixed(1)}B`;
      }
      if (value >= 1000000) {
          return `$${(value / 1000000).toFixed(1)}M`;
      }
      return formatCurrency(value);
  };

  const toggleWidget = (key: keyof typeof widgets) => {
    setWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper for Rankings
  const RankingCard = ({ title, data, type = 'currency' }: { title: string, data: { name: string, value: number }[], type?: 'currency' | 'number' }) => (
    <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
           {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700 truncate max-w-[180px]" title={item.name}>
                    {idx + 1}. {item.name}
                </span>
                <span className="text-gray-500">
                    {type === 'currency' ? formatCurrency(item.value) : item.value}
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                  className={cn("h-full rounded-full", 
                    idx === 0 ? "bg-green-500" : 
                    idx === 1 ? "bg-blue-500" : 
                    idx === 2 ? "bg-purple-500" : "bg-gray-400"
                  )}
                  style={{ width: `${data[0]?.value > 0 ? (item.value / data[0].value) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
          {data.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">Sin datos</div>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Administrativo</h1>
          <p className="text-sm text-muted-foreground">
            Bienvenido, <span className="font-semibold text-foreground">{session?.user?.name || "Administrador"}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Admin Links */}
            {session?.user?.role === 'admin' && (
                <>
                <div className="flex items-center bg-gray-50 p-1 rounded-md border">
                    <span className="text-xs font-medium px-2 text-gray-500">Filtro:</span>
                    <select
                        value={withGroups ? "true" : "false"}
                        onChange={(e) => setWithGroups(e.target.value === "true")}
                        className="h-8 w-[100px] rounded-md border-0 bg-transparent py-0 text-sm focus:outline-none focus:ring-0 font-medium cursor-pointer"
                    >
                        <option value="true">Con Grupos</option>
                        <option value="false">Sin Grupos</option>
                    </select>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/traders'}>
                    <Users className="w-4 h-4 mr-2" />
                    Gestión Traders
                </Button>
                </>
            )}

            {/* Year Filter */}
            <div className="flex items-center bg-gray-50 p-1 rounded-md border">
            <span className="text-xs font-medium px-2 text-gray-500">Año:</span>
            <select
                id="year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-8 w-[80px] rounded-md border-0 bg-transparent py-0 text-sm focus:outline-none focus:ring-0 font-medium cursor-pointer"
            >
                {years.map((y) => (
                <option key={y} value={y}>
                    {y}
                </option>
                ))}
            </select>
            </div>

            <Button 
                variant={editMode ? "default" : "outline"} 
                size="sm" 
                onClick={() => setEditMode(!editMode)}
                className="gap-2"
            >
                {editMode ? <Save className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                {editMode ? "Guardar" : "Personalizar"}
            </Button>
        </div>
      </div>

      {/* Edit Mode Panel */}
      {editMode && (
        <Card className="bg-gray-50 border-dashed border-2">
            <CardHeader>
                <CardTitle className="text-base">Widgets disponibles</CardTitle>
                <CardDescription>Selecciona los elementos que deseas ver en tu dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* KPIs */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KPIs</h4>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="kpi_registros" checked={widgets.kpi_registros} onCheckedChange={() => toggleWidget('kpi_registros')} />
                                <Label htmlFor="kpi_registros">Total Registros</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="kpi_negociado" checked={widgets.kpi_negociado} onCheckedChange={() => toggleWidget('kpi_negociado')} />
                                <Label htmlFor="kpi_negociado">Total Negociado</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="kpi_comision" checked={widgets.kpi_comision} onCheckedChange={() => toggleWidget('kpi_comision')} />
                                <Label htmlFor="kpi_comision">Total Comisión</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="kpi_ruedas" checked={widgets.kpi_ruedas} onCheckedChange={() => toggleWidget('kpi_ruedas')} />
                                <Label htmlFor="kpi_ruedas">Total Ruedas</Label>
                            </div>
                        </div>
                    </div>

                    {/* Rankings */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rankings (Insights)</h4>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="ranking_clientes_trans" checked={widgets.ranking_clientes_trans} onCheckedChange={() => toggleWidget('ranking_clientes_trans')} />
                                <Label htmlFor="ranking_clientes_trans">Clientes por Transacción</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="ranking_clientes_comi" checked={widgets.ranking_clientes_comi} onCheckedChange={() => toggleWidget('ranking_clientes_comi')} />
                                <Label htmlFor="ranking_clientes_comi">Clientes por Comisión</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="ranking_traders_comi" checked={widgets.ranking_traders_comi} onCheckedChange={() => toggleWidget('ranking_traders_comi')} />
                                <Label htmlFor="ranking_traders_comi">Traders por Comisión</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="ranking_traders_vol" checked={widgets.ranking_traders_vol} onCheckedChange={() => toggleWidget('ranking_traders_vol')} />
                                <Label htmlFor="ranking_traders_vol">Traders por Volumen</Label>
                            </div>
                        </div>
                    </div>

                    {/* Tables */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tablas</h4>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="resumen_mensual" checked={widgets.resumen_mensual} onCheckedChange={() => toggleWidget('resumen_mensual')} />
                                <Label htmlFor="resumen_mensual">Resumen Mensual</Label>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

      {/* KPI Cards Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {widgets.kpi_registros && (
            <Card className="bg-purple-600 text-white border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase opacity-80">Total Registros</CardTitle>
                <FileText className="h-4 w-4 opacity-70" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{data.kpis.total_transactions}</div>
                </CardContent>
            </Card>
        )}
        {widgets.kpi_negociado && (
            <Card className="bg-pink-500 text-white border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase opacity-80">Total Negociado</CardTitle>
                <DollarSign className="h-4 w-4 opacity-70" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{formatLargeCurrency(data.kpis.total_volume)}</div>
                </CardContent>
            </Card>
        )}
        {widgets.kpi_comision && (
            <Card className="bg-blue-400 text-white border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase opacity-80">Total Comisión</CardTitle>
                <DollarSign className="h-4 w-4 opacity-70" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{formatLargeCurrency(data.kpis.total_commission)}</div>
                </CardContent>
            </Card>
        )}
        {widgets.kpi_ruedas && (
            <Card className="bg-green-500 text-white border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase opacity-80">Total Ruedas</CardTitle>
                <Calendar className="h-4 w-4 opacity-70" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{data.kpis.total_ruedas}</div>
                </CardContent>
            </Card>
        )}
      </div>

      {/* Rankings Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {widgets.ranking_clientes_trans && (
              <RankingCard 
                  title="Clientes por Transacción" 
                  data={data.rankings.clients_by_volume} // Using volume just for example, ideally should be by count if available, but schema grouped by volume. Let's stick to volume for now as 'Transacción Generada' often means Volume. Wait, user said "Transacción generada" vs "Comision generada". Maybe count? My backend service returns clients_by_volume. I'll rename "clients_by_volume" to "Ranking de clientes por transaccion generada" as per screenshot which shows large numbers (money), so it IS volume.
                  type="currency"
              />
          )}
           {widgets.ranking_clientes_comi && (
              <RankingCard 
                  title="Clientes por Comisión" 
                  data={data.rankings.clients_by_commission}
                  type="currency"
              />
          )}
           {widgets.ranking_traders_comi && (
              <RankingCard 
                  title="Traders por Comisión" 
                  data={data.rankings.traders_by_commission}
                  type="currency"
              />
          )}
           {widgets.ranking_traders_vol && (
              <RankingCard 
                  title="Traders por Volumen" 
                  data={data.rankings.traders_by_volume}
                  type="currency"
              />
          )}
      </div>

      {/* Monthly Summary Table */}
      {widgets.resumen_mensual && (
          <Card className="shadow-sm">
              <CardHeader>
                  <CardTitle className="text-lg text-gray-800">Resumen Mensual {year}</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-700 uppercase bg-green-600 text-white">
                              <tr>
                                  <th className="px-6 py-3 rounded-tl-lg">Mes</th>
                                  <th className="px-6 py-3">Ruedas</th>
                                  <th className="px-6 py-3">Transacciones</th>
                                  <th className="px-6 py-3">Negociado</th>
                                  <th className="px-6 py-3">Comisión</th>
                                  <th className="px-6 py-3 rounded-tr-lg">Margen</th>
                              </tr>
                          </thead>
                          <tbody>
                              {data.monthly_summary.map((item, idx) => (
                                  <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                                      <td className="px-6 py-4 font-medium text-gray-900">{item.month}</td>
                                      <td className="px-6 py-4">{item.ruedas}</td>
                                      <td className="px-6 py-4">{item.transactions}</td>
                                      <td className="px-6 py-4">{formatCurrency(item.volume)}</td>
                                      <td className="px-6 py-4">{formatCurrency(item.commission)}</td>
                                      <td className="px-6 py-4">$0</td> {/* Placeholder as per screenshot */}
                                  </tr>
                              ))}
                              {data.monthly_summary.length === 0 && (
                                  <tr>
                                      <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">No hay datos para este año</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </CardContent>
          </Card>
      )}
    </div>
  );
}
