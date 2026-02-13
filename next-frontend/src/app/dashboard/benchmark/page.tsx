"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
    getBenchmarkSummary, getBenchmarkRanking, getBenchmarkTrends, getCorreagroStats, 
    getBenchmarkSectors, getBenchmarkProducts, getBenchmarkComparison,
    BenchmarkSummary, RankingItem, TrendsData, CorreagroStats, ComparisonData
} from '@/services/benchmark.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Award, LayoutGrid, PieChart, Package, Scale, Check, Download, Loader2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const COLORS = [
    'hsl(var(--primary))', 
    'hsl(var(--chart-2))', 
    'hsl(var(--chart-3))', 
    'hsl(var(--chart-4))', 
    'hsl(var(--chart-5))',
    'hsl(var(--chart-1))'
];

export default function BenchmarkPage() {
    const { token, user } = useAuth();
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    
    const [summary, setSummary] = useState<BenchmarkSummary | null>(null);
    const [ranking, setRanking] = useState<RankingItem[]>([]);
    const [trends, setTrends] = useState<TrendsData | null>(null);
    const [correagroStats, setCorreagroStats] = useState<CorreagroStats | null>(null);
    const [sectors, setSectors] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Comparativa State
    const [selectedTraders, setSelectedTraders] = useState<string[]>(['Correagro S.A.', 'Bavaria', 'Grupo BIOS']);
    const [comparisonPeriod, setComparisonPeriod] = useState(12);
    const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token, year]);

    useEffect(() => {
        if (token && activeTab === 'comparativa') {
            fetchComparison();
        }
    }, [token, activeTab, selectedTraders, comparisonPeriod]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sumRes, rankRes, trendsRes, corrRes, sectRes, prodRes] = await Promise.all([
                getBenchmarkSummary(token!, year),
                getBenchmarkRanking(token!, year, 'all', 50),
                getBenchmarkTrends(token!, year),
                getCorreagroStats(token!, year),
                getBenchmarkSectors(token!, year),
                getBenchmarkProducts(token!, year)
            ]);
            setSummary(sumRes);
            setRanking(rankRes);
            setTrends(trendsRes);
            setCorreagroStats(corrRes);
            setSectors(sectRes);
            setProducts(prodRes);
        } catch (error) {
            console.error("Error fetching benchmark data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComparison = async () => {
        if (selectedTraders.length === 0) return;
        try {
            const data = await getBenchmarkComparison(token!, selectedTraders, comparisonPeriod);
            setComparisonData(data);
        } catch (error) {
            console.error("Error fetching comparison", error);
        }
    };

    const toggleTraderSelection = (traderName: string) => {
        setSelectedTraders(prev => {
            if (prev.includes(traderName)) {
                return prev.filter(t => t !== traderName);
            } else {
                if (prev.length >= 5) return prev; // Limit to 5
                return [...prev, traderName];
            }
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

    const formatMillions = (val: number) => {
        return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val / 1000000) + ' MM';
    };

    const formatPercent = (val: number) => {
        return `${val.toFixed(2)}%`;
    };

    const exportToExcel = async () => {
        if (!ranking.length) return;
        const XLSX = await import('xlsx');

        const wb = XLSX.utils.book_new();
        
        // Ranking Sheet
        const wsRanking = XLSX.utils.json_to_sheet(ranking.map(item => ({
            Posición: item.position,
            SCB: item.name,
            Volumen: item.volume,
            'Participación %': item.share
        })));
        XLSX.utils.book_append_sheet(wb, wsRanking, "Ranking");

        // Trends Sheet (if available)
        if (trends) {
            const wsTrends = XLSX.utils.json_to_sheet(trends.months.map(m => ({
                Mes: m,
                'Volumen Mercado': trends.market[m] || 0,
                'Volumen Correagro': trends.traders['Correagro S.A.']?.[m] || 0
            })));
            XLSX.utils.book_append_sheet(wb, wsTrends, "Tendencias");
        }

        XLSX.writeFile(wb, `Benchmark_${year}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Chart Data Preparation
    const getShareData = () => {
        if (!trends) return [];
        return trends.months.map(m => {
            const marketVol = trends.market[m] || 0;
            const correagroVol = trends.traders['Correagro S.A.']?.[m] || 0;
            return {
                name: m.substring(0, 3),
                share: marketVol > 0 ? (correagroVol / marketVol) * 100 : 0
            };
        });
    };

    const getComparativeData = () => {
        if (!trends) return [];
        return trends.months.map(m => {
            const bavaria = (trends.traders['Grupo Bavaria']?.[m] || 0) + (trends.traders['Bavaria']?.[m] || 0);
            const bios = (trends.traders['Grupo BIOS']?.[m] || 0) + (trends.traders['Bios']?.[m] || 0);
            const correagro = trends.traders['Correagro S.A.']?.[m] || 0;
            return {
                name: m.substring(0, 3),
                Bavaria: bavaria / 1000000,
                Bios: bios / 1000000,
                Correagro: correagro / 1000000
            };
        });
    };

    const getGrowthData = () => {
        if (!trends) return [];
        return trends.months.map((m, i) => {
            const current = trends.traders['Correagro S.A.']?.[m] || 0;
            const prevMonth = i > 0 ? trends.months[i-1] : null;
            const prev = prevMonth ? (trends.traders['Correagro S.A.']?.[prevMonth] || 0) : 0;
            const growth = prev > 0 ? ((current - prev) / prev) * 100 : 0;
            return {
                name: m.substring(0, 3),
                growth: growth
            };
        });
    };

    return <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Activity className="w-8 h-8 text-primary" />
                        Benchmark
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Ranking competitivo - Correagro S.A., comisionista No. 1 de la Bolsa Mercantil
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-card border rounded-md px-3 py-1">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <label className="text-sm font-medium text-muted-foreground">Año:</label>
                        <select 
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <Button variant="outline" onClick={exportToExcel} disabled={loading || ranking.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            {loading && !summary ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-muted/50 p-1">
                        <TabsTrigger value="general" className="gap-2">
                            <LayoutGrid className="w-4 h-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="comparativa" className="gap-2">
                            <Scale className="w-4 h-4" />
                            Comparativa
                        </TabsTrigger>
                        <TabsTrigger value="sectores" className="gap-2">
                            <PieChart className="w-4 h-4" />
                            Sectores
                        </TabsTrigger>
                        <TabsTrigger value="productos" className="gap-2">
                            <Package className="w-4 h-4" />
                            Productos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Volumen Total (MM)</div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {summary ? formatMillions(summary.totalWithGroups) : '--'}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="text-sm font-medium text-muted-foreground mb-1">SCB Activos</div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {summary ? summary.activeSCBs : '--'}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Total Con Grupos</div>
                                    <div className="text-2xl font-bold text-primary">
                                        {summary ? formatMillions(summary.totalWithGroups) : '--'}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Total Sin Grupos</div>
                                    <div className="text-2xl font-bold text-muted-foreground">
                                        {summary ? formatMillions(summary.totalWithoutGroups) : '--'}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Row 1 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Comparativa Bavaria/Bios vs Correagro (MM)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={getComparativeData()}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    formatter={(value) => formatCurrency(Number(value) * 1000000)}
                                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                                />
                                                <Legend />
                                                <Bar dataKey="Bavaria" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="Bios" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="Correagro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Participación Correagro Mes a Mes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={getShareData()}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis tickFormatter={(val) => `${val}%`} fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    formatter={(value: number) => formatPercent(value)}
                                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                                />
                                                <Area type="monotone" dataKey="share" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Row 2: Growth */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Crecimiento Mensual Correagro (%)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={getGrowthData()}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    formatter={(value: number) => formatPercent(value)}
                                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                                />
                                                <Bar dataKey="growth" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Ranking and Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Ranking Table */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Ranking SCB</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-lg">Pos</th>
                                                    <th className="px-4 py-3">SCB</th>
                                                    <th className="px-4 py-3 text-right">Volumen</th>
                                                    <th className="px-4 py-3 text-right rounded-tr-lg">Part. %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ranking.map((item) => (
                                                    <tr key={item.name} className={cn(
                                                        "border-b last:border-0 hover:bg-muted/50 transition-colors",
                                                        item.name === 'Correagro S.A.' ? "bg-primary/5 hover:bg-primary/10" : ""
                                                    )}>
                                                        <td className="px-4 py-3 font-medium">{item.position}</td>
                                                        <td className="px-4 py-3 font-medium">{item.name}</td>
                                                        <td className="px-4 py-3 text-right">{formatMillions(item.volume)}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-muted-foreground">{formatPercent(item.share)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Correagro Stats */}
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader>
                                    <CardTitle className="text-primary flex items-center gap-2">
                                        <Award className="w-5 h-5" />
                                        Correagro S.A.
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {correagroStats ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-background p-4 rounded-lg shadow-sm border">
                                                    <div className="text-sm text-muted-foreground">Posición</div>
                                                    <div className="text-3xl font-bold text-primary">#{correagroStats.position}</div>
                                                </div>
                                                <div className="bg-background p-4 rounded-lg shadow-sm border">
                                                    <div className="text-sm text-muted-foreground">Cuota</div>
                                                    <div className="text-3xl font-bold text-primary">{formatPercent(correagroStats.share)}</div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center p-3 bg-background rounded border border-primary/10">
                                                    <span className="text-sm text-muted-foreground">Gap vs #1</span>
                                                    <span className="font-bold text-red-600 dark:text-red-400">-{formatMillions(correagroStats.gap1)}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-background rounded border border-primary/10">
                                                    <span className="text-sm text-muted-foreground">Gap vs #2</span>
                                                    <span className="font-bold text-orange-600 dark:text-orange-400">-{formatMillions(correagroStats.gap2)}</span>
                                                </div>
                                            <div className="flex justify-between items-center p-3 bg-background rounded border border-primary/10">
                                                <span className="text-sm text-muted-foreground">Gap vs Anterior</span>
                                                <span className="font-bold text-blue-600 dark:text-blue-400">-{formatMillions(correagroStats.prevGap)}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No hay datos disponibles para Correagro S.A.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

            <TabsContent value="comparativa" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuración de Comparativa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-muted-foreground mb-2">SCB a Comparar (Máx 5)</label>
                                <div className="h-48 overflow-y-auto border rounded-md p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-background">
                                    {ranking.map((item) => (
                                        <div key={item.name} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                id={`scb-${item.name}`}
                                                checked={selectedTraders.includes(item.name)}
                                                onChange={() => toggleTraderSelection(item.name)}
                                                className="rounded border-input text-primary focus:ring-primary"
                                            />
                                            <label htmlFor={`scb-${item.name}`} className="text-sm text-foreground cursor-pointer w-full truncate">
                                                {item.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="w-full md:w-48">
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Periodo</label>
                                <select
                                    value={comparisonPeriod}
                                    onChange={(e) => setComparisonPeriod(Number(e.target.value))}
                                    className="w-full bg-background border border-input rounded-md shadow-sm p-2 text-sm"
                                >
                                    <option value={6}>Últimos 6 meses</option>
                                    <option value={12}>Últimos 12 meses</option>
                                    <option value={24}>Últimos 24 meses</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {comparisonData && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle>Market Share (Periodo)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsPieChart>
                                                <Pie
                                                    data={comparisonData.marketShare}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    fill="hsl(var(--chart-1))"
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {comparisonData.marketShare.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value) => formatMillions(Number(value))}
                                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                                />
                                                <Legend />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Volumen Mensual (MM)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={comparisonData.volumeHistory}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    formatter={(value) => formatMillions(Number(value))}
                                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                                />
                                                <Legend />
                                                {selectedTraders.map((trader, index) => (
                                                    <Line 
                                                        key={trader} 
                                                        type="monotone" 
                                                        dataKey={trader} 
                                                        stroke={COLORS[index % COLORS.length]} 
                                                        activeDot={{ r: 8 }} 
                                                    />
                                                ))}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Volumen Acumulado</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={comparisonData.growth}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    formatter={(value) => formatMillions(Number(value))}
                                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                                />
                                                <Bar dataKey="volume" fill="hsl(var(--chart-1))">
                                                    {comparisonData.growth.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Brechas Competitivas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {comparisonData.gaps ? (
                                        <div className="space-y-6">
                                            <div className="p-4 bg-muted/50 rounded-lg border">
                                                <div className="text-sm text-muted-foreground mb-1">Competidor Objetivo</div>
                                                <div className="text-xl font-bold text-foreground">{comparisonData.gaps.competitor}</div>
                                            </div>
                                            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                                                <div className="text-sm text-red-600 mb-1">Volumen a Superar</div>
                                                <div className="text-2xl font-bold text-red-600">-{formatMillions(comparisonData.gaps.amount)}</div>
                                            </div>
                                            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                <div className="text-sm text-blue-600 mb-1">Meses Estimados</div>
                                                <div className="text-2xl font-bold text-blue-600">--</div>
                                                <div className="text-xs text-blue-500">Cálculo basado en crecimiento histórico</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                                            <Check className="w-12 h-12 text-green-500 mb-2" />
                                            <p className="font-medium text-foreground">¡Líder del Grupo!</p>
                                            <p className="text-sm">Correagro S.A. tiene el mayor volumen en esta selección.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </TabsContent>

            <TabsContent value="sectores" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-green-500/10 border-green-500/20">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{sectors.filter(s => s.status === 'lider').length}</div>
                            <div className="text-sm font-medium text-green-700 dark:text-green-300">Líder</div>
                            <div className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">Defender participación</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-500/10 border-blue-500/20">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sectors.filter(s => s.status === 'oportunidad').length}</div>
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Oportunidad</div>
                            <div className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">Invertir para crecer</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-500/10 border-red-500/20">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{sectors.filter(s => s.status === 'rezago').length}</div>
                            <div className="text-sm font-medium text-red-700 dark:text-red-300">Rezago</div>
                            <div className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">Revisar estrategia</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Matriz de Crecimiento - Participación (BCG)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis type="number" dataKey="share" name="Participación" unit="%" domain={[0, 'auto']} label={{ value: 'Participación de Mercado (%)', position: 'bottom', offset: 0 }} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis type="number" dataKey="growth" name="Crecimiento" unit="%" label={{ value: 'Crecimiento Mercado (%)', angle: -90, position: 'insideLeft' }} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <ZAxis type="number" dataKey="volume" range={[60, 400]} name="Volumen" />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-card p-3 border rounded shadow-sm text-xs text-card-foreground">
                                                        <p className="font-bold mb-1">{data.sector}</p>
                                                        <p>Participación: {data.share.toFixed(2)}%</p>
                                                        <p>Crecimiento: {data.growth.toFixed(2)}%</p>
                                                        <p>Volumen: {formatMillions(data.volume)}</p>
                                                        <p className={cn("capitalize font-semibold mt-1",
                                                            data.status === 'lider' ? 'text-green-600 dark:text-green-400' : 
                                                            data.status === 'oportunidad' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                                                        )}>{data.status}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }} />
                                        <Scatter name="Sectores" data={sectors.map(s => ({
                                            sector: s.sector,
                                            share: s.corre.share,
                                            growth: s.corre.growth,
                                            volume: s.corre.volume,
                                            status: s.status,
                                            fill: s.status === 'lider' ? 'hsl(var(--chart-2))' : s.status === 'oportunidad' ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))'
                                        }))} />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recomendaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {sectors.slice(0, 6).map((sector, i) => (
                                    <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                                        <div>
                                            <div className="font-medium text-sm text-foreground">{sector.sector}</div>
                                            <div className="text-xs text-muted-foreground">Top: {sector.top.scb} ({sector.top.share.toFixed(1)}%)</div>
                                        </div>
                                        <div className={cn("px-2 py-1 rounded text-xs font-medium capitalize",
                                            sector.status === 'lider' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 
                                            sector.status === 'oportunidad' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                        )}>
                                            {sector.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Detalle por Sector</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Sector</th>
                                        <th className="px-4 py-3 text-right">Mi Participación</th>
                                        <th className="px-4 py-3 text-right">Crecimiento Mdo.</th>
                                        <th className="px-4 py-3">Competidor #1</th>
                                        <th className="px-4 py-3 text-center rounded-tr-lg">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sectors.map((sector, i) => (
                                        <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-foreground">{sector.sector}</td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">{sector.corre.share.toFixed(2)}%</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={sector.corre.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                                    {sector.corre.growth > 0 ? '+' : ''}{sector.corre.growth.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground">{sector.top.scb}</span>
                                                    <span className="text-xs text-muted-foreground">{sector.top.share.toFixed(2)}% share</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize",
                                                    sector.status === 'lider' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 
                                                    sector.status === 'oportunidad' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                )}>
                                                    {sector.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="productos" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card>
                    <CardHeader>
                        <CardTitle>Análisis por Productos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Producto</th>
                                        <th className="px-4 py-3">Sector</th>
                                        <th className="px-4 py-3 text-right">Volumen (MM)</th>
                                        <th className="px-4 py-3 text-right">Participación</th>
                                        <th className="px-4 py-3 text-right rounded-tr-lg">Variación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length > 0 ? (
                                        products.map((item, i) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-foreground">{item.producto}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.sector}</td>
                                                <td className="px-4 py-3 text-right">{formatMillions(item.monto_millones * 1000000)}</td>
                                                <td className="px-4 py-3 text-right font-medium">{item.participacion_pct.toFixed(2)}%</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={item.variacion_pct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                                        {item.variacion_pct > 0 ? '+' : ''}{item.variacion_pct.toFixed(2)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                                No hay datos de productos disponibles para este año.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
                </Tabs>
            )}
        </div>;
}
