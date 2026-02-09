'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getMarginReport, MarginReportData, getClients } from '@/services/reports.service';
import { getTraders } from '@/services/traders.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { FileSpreadsheet, ChevronDown, ChevronRight, Filter, Users, TrendingUp, DollarSign, Percent } from 'lucide-react';
import * as XLSX from 'xlsx';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function MarginReportPage() {
    const { token, user } = useAuth();
    const [data, setData] = useState<MarginReportData | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState('all');
    const [withGroups, setWithGroups] = useState(true);
    
    // MultiSelect States
    const [availableTraders, setAvailableTraders] = useState<{label: string, value: string}[]>([]);
    const [availableClients, setAvailableClients] = useState<{label: string, value: string}[]>([]);
    const [selectedTraders, setSelectedTraders] = useState<string[]>([]);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);

    // UI State
    const [expandedTraders, setExpandedTraders] = useState<string[]>([]);

    // Load Filters Options
    useEffect(() => {
        if (!token) return;
        
        // Load Traders
        getTraders(token).then(traders => {
            const options = traders.map(t => ({ label: t.nombre, value: t.nombre }));
            setAvailableTraders(options);
        }).catch(err => console.error("Error loading traders", err));

        // Load Clients
        getClients(token, year).then(clients => {
                const options = clients.map(c => ({ label: c, value: c }));
                setAvailableClients(options);
        }).catch(err => console.error("Error loading clients", err));

    }, [token, year]);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // If empty, send 'all'
            const traderParam = selectedTraders.length > 0 ? selectedTraders : 'all';
            const clientParam = selectedClients.length > 0 ? selectedClients : 'all';

            const result = await getMarginReport(token, year, month, traderParam, clientParam, withGroups);
            setData(result);
            setExpandedTraders(result.data.map(d => d.corredor));
        } catch (error) {
            console.error(error);
            alert('Error al cargar el reporte');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const toggleTrader = (traderName: string) => {
        setExpandedTraders(prev => 
            prev.includes(traderName) 
                ? prev.filter(t => t !== traderName) 
                : [...prev, traderName]
        );
    };

    const toggleAll = (expand: boolean) => {
        if (data && expand) {
            setExpandedTraders(data.data.map(d => d.corredor));
        } else {
            setExpandedTraders([]);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

    const formatMargin = (val: number) => {
        return `${val.toFixed(5)}%`;
    };

    const handleExport = () => {
        if (!data) return;
        // Complex export logic could go here, for now simpler version
        const rows: any[] = [];
        data.data.forEach(group => {
            group.clients.forEach(c => {
                const row: any = {
                    Corredor: group.corredor,
                    NIT: c.nit,
                    Cliente: c.name,
                };
                MONTHS.forEach(m => {
                    row[`${m} - Vol`] = c.months[m]?.volume || 0;
                    row[`${m} - Com`] = c.months[m]?.commission || 0;
                    row[`${m} - Margen`] = c.months[m]?.margin || 0;
                });
                row['Total Vol'] = c.totalVolume;
                row['Total Com'] = c.totalCommission;
                row['Total Margen'] = c.totalMargin;
                rows.push(row);
            });
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Margen");
        XLSX.writeFile(wb, `Reporte_Margen_${year}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-gray-700" />
                    Reporte de Margen
                </h1>
                <p className="text-gray-500">Análisis de rentabilidad por corredor y cliente</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className={`grid grid-cols-1 gap-4 items-end ${user?.role === 'admin' ? 'md:grid-cols-6' : 'md:grid-cols-5'}`}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                            <select 
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Meses</label>
                            <select 
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                            >
                                <option value="all">Todos los meses</option>
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Corredores</label>
                            <MultiSelect 
                                options={availableTraders}
                                selected={selectedTraders}
                                onChange={setSelectedTraders}
                                placeholder="Todos los corredores"
                                disabled={user?.role === 'trader'}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Clientes</label>
                            <MultiSelect 
                                options={availableClients}
                                selected={selectedClients}
                                onChange={setSelectedClients}
                                placeholder="Todos los clientes"
                            />
                        </div>

                        {user?.role === 'admin' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Grupos</label>
                            <select 
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                value={withGroups ? "true" : "false"}
                                onChange={(e) => setWithGroups(e.target.value === "true")}
                            >
                                <option value="true">Con Grupos</option>
                                <option value="false">Sin Grupos</option>
                            </select>
                        </div>
                        )}

                        <div className="flex gap-2">
                            <Button className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={fetchData}>
                                <Filter className="w-4 h-4 mr-2" />
                                Aplicar
                            </Button>
                            <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={handleExport}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Exportar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#6f42c1] text-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-1 opacity-90 text-sm font-medium">
                            <DollarSign className="w-4 h-4" /> Total Transado
                        </div>
                        <div className="text-2xl font-bold">{formatCurrency(data.kpis.totalVolume)}</div>
                    </div>
                    <div className="bg-[#e83e8c] text-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-1 opacity-90 text-sm font-medium">
                            <DollarSign className="w-4 h-4" /> Total Comisión
                        </div>
                        <div className="text-2xl font-bold">{formatCurrency(data.kpis.totalCommission)}</div>
                    </div>
                    <div className="bg-[#20c997] text-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-1 opacity-90 text-sm font-medium">
                            <Percent className="w-4 h-4" /> Margen Promedio
                        </div>
                        <div className="text-2xl font-bold">{formatMargin(data.kpis.avgMargin)}</div>
                    </div>
                    <div className="bg-[#0dcaf0] text-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-1 opacity-90 text-sm font-medium">
                            <Users className="w-4 h-4" /> Total Clientes
                        </div>
                        <div className="text-2xl font-bold">{data.kpis.totalClients}</div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => toggleAll(true)}>
                        Abrir Todos
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => toggleAll(false)}>
                        Cerrar Todos
                    </Button>
                </div>
                {data && (
                    <div className="text-right text-gray-500 text-sm">
                        {data.data.length} corredores | {data.kpis.totalClients} clientes | Margen: {formatMargin(data.kpis.avgMargin)}
                    </div>
                )}
            </div>

            {/* Report Content */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10">Cargando reporte...</div>
                ) : !data || data.data.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No se encontraron datos</div>
                ) : (
                    data.data.map((group) => (
                        <div key={group.corredor} className="border rounded-lg overflow-hidden shadow-sm bg-white">
                            {/* Group Header */}
                            <div 
                                className="bg-[#1a1a1a] text-white p-3 flex justify-between items-center cursor-pointer hover:bg-[#333] transition-colors"
                                onClick={() => toggleTrader(group.corredor)}
                            >
                                <div className="flex items-center gap-2 font-bold uppercase">
                                    {expandedTraders.includes(group.corredor) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    {group.corredor}
                                </div>
                                <div className="flex gap-3 text-xs">
                                    <span className="bg-white/10 px-2 py-1 rounded flex items-center gap-1">
                                        <Users className="w-3 h-3" /> {group.clientCount} clientes
                                    </span>
                                    <span className="bg-white/10 px-2 py-1 rounded">
                                        {formatCurrency(group.totalVolume)}
                                    </span>
                                    <span className="bg-white/10 px-2 py-1 rounded text-pink-300">
                                        {formatCurrency(group.totalCommission)}
                                    </span>
                                    <span className="bg-green-900/50 px-2 py-1 rounded text-green-400 font-bold border border-green-800">
                                        {formatMargin(group.avgMargin)}
                                    </span>
                                </div>
                            </div>

                            {/* Group Content */}
                            {expandedTraders.includes(group.corredor) && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead className="bg-gray-100 text-gray-800 font-medium">
                                            <tr>
                                                <th rowSpan={2} className="p-2 border bg-white sticky left-0 z-10 min-w-[100px]">NIT</th>
                                                <th rowSpan={2} className="p-2 border bg-white sticky left-[100px] z-10 min-w-[200px]">Cliente</th>
                                                {MONTHS.map(m => (
                                                    <th key={m} colSpan={3} className="p-1 text-center border bg-blue-50 text-blue-800">{m.substring(0, 3)}</th>
                                                ))}
                                                <th colSpan={3} className="p-1 text-center border bg-gray-200">Total</th>
                                            </tr>
                                            <tr>
                                                {MONTHS.map(m => (
                                                    <>
                                                        <th key={`${m}-vol`} className="p-1 text-right border min-w-[100px] text-[10px] text-gray-500">Trans.</th>
                                                        <th key={`${m}-com`} className="p-1 text-right border min-w-[80px] text-[10px] text-gray-500">Com.</th>
                                                        <th key={`${m}-mar`} className="p-1 text-right border min-w-[60px] text-[10px] text-gray-500">Margen</th>
                                                    </>
                                                ))}
                                                <th className="p-1 text-right border min-w-[100px]">Trans.</th>
                                                <th className="p-1 text-right border min-w-[80px]">Com.</th>
                                                <th className="p-1 text-right border min-w-[60px]">Margen</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.clients.map((c, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-2 border font-mono sticky left-0 bg-white">{c.nit}</td>
                                                    <td className="p-2 border font-medium sticky left-[100px] bg-white">{c.name}</td>
                                                    {MONTHS.map(m => {
                                                        const mData = c.months[m];
                                                        return (
                                                            <>
                                                                <td key={`${m}-v`} className="p-1 text-right border text-gray-600">{mData?.volume > 0 ? formatCurrency(mData.volume) : '-'}</td>
                                                                <td key={`${m}-c`} className="p-1 text-right border text-gray-600">{mData?.commission > 0 ? formatCurrency(mData.commission) : '-'}</td>
                                                                <td key={`${m}-m`} className={`p-1 text-right border font-mono ${mData?.margin > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                                                                    {mData?.margin > 0 ? formatMargin(mData.margin) : '-'}
                                                                </td>
                                                            </>
                                                        );
                                                    })}
                                                    <td className="p-1 text-right border font-bold bg-gray-50">{formatCurrency(c.totalVolume)}</td>
                                                    <td className="p-1 text-right border font-bold bg-gray-50">{formatCurrency(c.totalCommission)}</td>
                                                    <td className="p-1 text-right border font-bold bg-gray-50 text-green-700">{formatMargin(c.totalMargin)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-900 text-white font-bold text-xs">
                                                <td colSpan={2} className="p-2 border sticky left-0 z-10 bg-gray-900">Total {group.corredor}</td>
                                                {MONTHS.map(m => {
                                                    const mVol = group.clients.reduce((acc, c) => acc + (c.months[m]?.volume || 0), 0);
                                                    const mCom = group.clients.reduce((acc, c) => acc + (c.months[m]?.commission || 0), 0);
                                                    const mMar = mVol > 0 ? (mCom / mVol) * 100 : 0;
                                                    return (
                                                        <>
                                                            <td key={`${m}-tv`} className="p-1 text-right border">{mVol > 0 ? formatCurrency(mVol) : '-'}</td>
                                                            <td key={`${m}-tc`} className="p-1 text-right border text-pink-200">{mCom > 0 ? formatCurrency(mCom) : '-'}</td>
                                                            <td key={`${m}-tm`} className="p-1 text-right border text-green-400">{mMar > 0 ? formatMargin(mMar) : '-'}</td>
                                                        </>
                                                    );
                                                })}
                                                <td className="p-1 text-right border">{formatCurrency(group.totalVolume)}</td>
                                                <td className="p-1 text-right border text-pink-200">{formatCurrency(group.totalCommission)}</td>
                                                <td className="p-1 text-right border text-green-400">{formatMargin(group.avgMargin)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
