'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
    getBenchmarkSummary, getBenchmarkRanking, getBenchmarkTrends, getCorreagroStats, 
    getBenchmarkSectors, getBenchmarkProducts, getBenchmarkComparison,
    BenchmarkSummary, RankingItem, TrendsData, CorreagroStats, ComparisonData
} from '@/services/benchmark.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Award, LayoutGrid, PieChart, Package, Scale, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function BenchmarkPage() {
    const { token, user } = useAuth();
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'comparativa' | 'sectores' | 'productos'>('general');
    
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="w-8 h-8 text-gray-700" />
                        Benchmark
                    </h1>
                    <p className="text-gray-500">Ranking competitivo - Correagro S.A., comisionista No. 1 de la Bolsa Mercantil</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Año:</label>
                    <select 
                        className="border-gray-300 rounded-md shadow-sm p-2 border"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                    >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b">
                <button
                    onClick={() => setActiveTab('general')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 border-b-2",
                        activeTab === 'general' ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                    )}
                >
                    <LayoutGrid className="w-4 h-4" />
                    General
                </button>
                <button
                    onClick={() => setActiveTab('comparativa')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 border-b-2",
                        activeTab === 'comparativa' ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                    )}
                >
                    <Scale className="w-4 h-4" />
                    Comparativa
                </button>
                <button
                    onClick={() => setActiveTab('sectores')}

                    className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 border-b-2",
                        activeTab === 'sectores' ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                    )}
                >
                    <PieChart className="w-4 h-4" />
                    Sectores
                </button>
                <button
                    onClick={() => setActiveTab('productos')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 border-b-2",
                        activeTab === 'productos' ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                    )}
                >
                    <Package className="w-4 h-4" />
                    Productos
                </button>
            </div>

            {activeTab === 'general' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="text-sm font-medium text-gray-500 mb-1">Volumen Total (MM)</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {summary ? formatMillions(summary.totalWithGroups) : '--'}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="text-sm font-medium text-gray-500 mb-1">SCB Activos</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {summary ? summary.activeSCBs : '--'}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="text-sm font-medium text-gray-500 mb-1">Total Con Grupos</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {summary ? formatMillions(summary.totalWithGroups) : '--'}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="text-sm font-medium text-gray-500 mb-1">Total Sin Grupos</div>
                                <div className="text-2xl font-bold text-gray-600">
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
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => formatCurrency(Number(value) * 1000000)} />
                                            <Legend />
                                            <Bar dataKey="Bavaria" fill="#eab308" />
                                            <Bar dataKey="Bios" fill="#f97316" />
                                            <Bar dataKey="Correagro" fill="#16a34a" />
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
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis tickFormatter={(val) => `${val}%`} />
                                            <Tooltip formatter={(value: number) => formatPercent(value)} />
                                            <Area type="monotone" dataKey="share" stroke="#16a34a" fill="#dcfce7" />
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
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value: number) => formatPercent(value)} />
                                            <Bar dataKey="growth" fill="#3b82f6" />
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
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3">Pos</th>
                                                <th className="px-4 py-3">SCB</th>
                                                <th className="px-4 py-3 text-right">Volumen</th>
                                                <th className="px-4 py-3 text-right">Part. %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ranking.map((item) => (
                                                <tr key={item.name} className={`border-b hover:bg-gray-50 ${item.name === 'Correagro S.A.' ? 'bg-green-50' : ''}`}>
                                                    <td className="px-4 py-3 font-medium">{item.position}</td>
                                                    <td className="px-4 py-3 font-medium">{item.name}</td>
                                                    <td className="px-4 py-3 text-right">{formatMillions(item.volume)}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-gray-600">{formatPercent(item.share)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Correagro Stats */}
                        <Card className="border-green-200 bg-green-50/30">
                            <CardHeader>
                                <CardTitle className="text-green-800 flex items-center gap-2">
                                    <Award className="w-5 h-5" />
                                    Correagro S.A.
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {correagroStats ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <div className="text-sm text-gray-500">Posición</div>
                                                <div className="text-3xl font-bold text-green-700">#{correagroStats.position}</div>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <div className="text-sm text-gray-500">Cuota</div>
                                                <div className="text-3xl font-bold text-green-700">{formatPercent(correagroStats.share)}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-white rounded border border-green-100">
                                                <span className="text-sm text-gray-600">Gap vs #1</span>
                                                <span className="font-bold text-red-500">-{formatMillions(correagroStats.gap1)}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white rounded border border-green-100">
                                                <span className="text-sm text-gray-600">Gap vs #2</span>
                                                <span className="font-bold text-orange-500">-{formatMillions(correagroStats.gap2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white rounded border border-green-100">
                                                <span className="text-sm text-gray-600">Gap vs Anterior</span>
                                                <span className="font-bold text-blue-500">-{formatMillions(correagroStats.prevGap)}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-10 text-gray-500">
                                        No hay datos disponibles para Correagro S.A.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'comparativa' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de Comparativa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">SCB a Comparar (Máx 5)</label>
                                    <div className="h-48 overflow-y-auto border rounded-md p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {ranking.map((item) => (
                                            <div key={item.name} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                                                <input
                                                    type="checkbox"
                                                    id={`scb-${item.name}`}
                                                    checked={selectedTraders.includes(item.name)}
                                                    onChange={() => toggleTraderSelection(item.name)}
                                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <label htmlFor={`scb-${item.name}`} className="text-sm text-gray-700 cursor-pointer w-full truncate">
                                                    {item.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-full md:w-48">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
                                    <select
                                        value={comparisonPeriod}
                                        onChange={(e) => setComparisonPeriod(Number(e.target.value))}
                                        className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
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
                                                        fill="#8884d8"
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {comparisonData.marketShare.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => formatMillions(Number(value))} />
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
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip formatter={(value) => formatMillions(Number(value))} />
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
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip formatter={(value) => formatMillions(Number(value))} />
                                                    <Bar dataKey="volume" fill="#8884d8">
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
                                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="text-sm text-gray-500 mb-1">Competidor Objetivo</div>
                                                    <div className="text-xl font-bold text-gray-900">{comparisonData.gaps.competitor}</div>
                                                </div>
                                                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                                    <div className="text-sm text-red-600 mb-1">Volumen a Superar</div>
                                                    <div className="text-2xl font-bold text-red-700">-{formatMillions(comparisonData.gaps.amount)}</div>
                                                </div>
                                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                                    <div className="text-sm text-blue-600 mb-1">Meses Estimados</div>
                                                    <div className="text-2xl font-bold text-blue-700">--</div>
                                                    <div className="text-xs text-blue-500">Cálculo basado en crecimiento histórico</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                                                <Check className="w-12 h-12 text-green-500 mb-2" />
                                                <p className="font-medium text-gray-900">¡Líder del Grupo!</p>
                                                <p className="text-sm">Correagro S.A. tiene el mayor volumen en esta selección.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'sectores' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-green-700">{sectors.filter(s => s.status === 'lider').length}</div>
                                <div className="text-sm font-medium text-green-600">Líder</div>
                                <div className="text-xs text-green-500 mt-1">Defender participación</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-blue-700">{sectors.filter(s => s.status === 'oportunidad').length}</div>
                                <div className="text-sm font-medium text-blue-600">Oportunidad</div>
                                <div className="text-xs text-blue-500 mt-1">Invertir para crecer</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-red-700">{sectors.filter(s => s.status === 'rezago').length}</div>
                                <div className="text-sm font-medium text-red-600">Rezago</div>
                                <div className="text-xs text-red-500 mt-1">Revisar estrategia</div>
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
                                            <CartesianGrid />
                                            <XAxis type="number" dataKey="share" name="Participación" unit="%" domain={[0, 'auto']} label={{ value: 'Participación de Mercado (%)', position: 'bottom', offset: 0 }} />
                                            <YAxis type="number" dataKey="growth" name="Crecimiento" unit="%" label={{ value: 'Crecimiento Mercado (%)', angle: -90, position: 'insideLeft' }} />
                                            <ZAxis type="number" dataKey="volume" range={[60, 400]} name="Volumen" />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white p-3 border rounded shadow-sm text-xs">
                                                            <p className="font-bold mb-1">{data.sector}</p>
                                                            <p>Participación: {data.share.toFixed(2)}%</p>
                                                            <p>Crecimiento: {data.growth.toFixed(2)}%</p>
                                                            <p>Volumen: {formatMillions(data.volume)}</p>
                                                            <p className={`capitalize font-semibold mt-1 ${
                                                                data.status === 'lider' ? 'text-green-600' : 
                                                                data.status === 'oportunidad' ? 'text-blue-600' : 'text-red-600'
                                                            }`}>{data.status}</p>
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
                                                fill: s.status === 'lider' ? '#16a34a' : s.status === 'oportunidad' ? '#2563eb' : '#dc2626'
                                            }))} fill="#8884d8" />
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
                                        <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                                            <div>
                                                <div className="font-medium text-sm">{sector.sector}</div>
                                                <div className="text-xs text-gray-500">Top: {sector.top.scb} ({sector.top.share.toFixed(1)}%)</div>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                                sector.status === 'lider' ? 'bg-green-100 text-green-700' : 
                                                sector.status === 'oportunidad' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                            }`}>
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
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 font-medium text-gray-500">Sector</th>
                                            <th className="text-right py-3 font-medium text-gray-500">Mi Participación</th>
                                            <th className="text-right py-3 font-medium text-gray-500">Crecimiento Mdo.</th>
                                            <th className="text-left py-3 pl-6 font-medium text-gray-500">Competidor #1</th>
                                            <th className="text-center py-3 font-medium text-gray-500">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sectors.map((sector, i) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="py-3 font-medium">{sector.sector}</td>
                                                <td className="py-3 text-right">{sector.corre.share.toFixed(2)}%</td>
                                                <td className="py-3 text-right">
                                                    <span className={sector.corre.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {sector.corre.growth > 0 ? '+' : ''}{sector.corre.growth.toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td className="py-3 pl-6">
                                                    <div className="flex flex-col">
                                                        <span>{sector.top.scb}</span>
                                                        <span className="text-xs text-gray-500">{sector.top.share.toFixed(2)}% share</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                                        sector.status === 'lider' ? 'bg-green-100 text-green-700' : 
                                                        sector.status === 'oportunidad' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                                    }`}>
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
                </div>
            )}

            {activeTab === 'productos' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <Card>
                        <CardHeader>
                            <CardTitle>Análisis por Productos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 font-medium text-gray-500">Producto</th>
                                            <th className="text-left py-3 font-medium text-gray-500">Sector</th>
                                            <th className="text-right py-3 font-medium text-gray-500">Volumen (MM)</th>
                                            <th className="text-right py-3 font-medium text-gray-500">Participación</th>
                                            <th className="text-right py-3 font-medium text-gray-500">Variación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.length > 0 ? (
                                            products.map((item, i) => (
                                                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="py-3 font-medium">{item.producto}</td>
                                                    <td className="py-3 text-gray-500">{item.sector}</td>
                                                    <td className="py-3 text-right">{formatMillions(item.monto_millones * 1000000)}</td>
                                                    <td className="py-3 text-right">{item.participacion_pct.toFixed(2)}%</td>
                                                    <td className="py-3 text-right">
                                                        <span className={item.variacion_pct >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                            {item.variacion_pct > 0 ? '+' : ''}{item.variacion_pct.toFixed(2)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                                    No hay datos de productos disponibles para este año.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
