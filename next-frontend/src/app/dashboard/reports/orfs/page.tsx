'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getOrfsReport, OrfsReportData, getClients } from '@/services/reports.service';
import { getTraders } from '@/services/traders.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { FileSpreadsheet, ChevronDown, ChevronRight, Filter, Users, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function OrfsReportPage() {
    const { token, user } = useAuth();
    const [data, setData] = useState<OrfsReportData[]>([]);
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

            const result = await getOrfsReport(token, year, month, traderParam, clientParam, withGroups);
            setData(result);
            setExpandedTraders(result.map(d => d.corredor));
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
    }, [token]); // Initial load

    const toggleTrader = (traderName: string) => {
        setExpandedTraders(prev => 
            prev.includes(traderName) 
                ? prev.filter(t => t !== traderName) 
                : [...prev, traderName]
        );
    };

    const toggleAll = (expand: boolean) => {
        if (expand) {
            setExpandedTraders(data.map(d => d.corredor));
        } else {
            setExpandedTraders([]);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(val);
    };

    const handleExport = () => {
        // Flatten data for export
        const rows: any[] = [];
        data.forEach(group => {
            group.clients.forEach(c => {
                const row: any = {
                    Corredor: group.corredor,
                    NIT: c.nit,
                    Cliente: c.name,
                };
                MONTHS.forEach(m => {
                    row[m] = c.months[m] || 0;
                });
                row['Total'] = c.total;
                rows.push(row);
            });
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte ORFS");
        XLSX.writeFile(wb, `Reporte_ORFS_${year}.xlsx`);
    };

    // Calculate Global Totals
    const globalStats = data.reduce((acc, curr) => ({
        traders: acc.traders + 1,
        clients: acc.clients + curr.clientCount,
        volume: acc.volume + curr.totalVolume
    }), { traders: 0, clients: 0, volume: 0 });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-gray-700" />
                    Reporte ORFS
                </h1>
                <p className="text-gray-500">Vista mensual por corredor y cliente</p>
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

            {/* Stats & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2">
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => toggleAll(true)}>
                        Abrir Todos
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => toggleAll(false)}>
                        Cerrar Todos
                    </Button>
                </div>
                <div className="text-right text-gray-600 font-medium">
                    {globalStats.traders} corredores | {globalStats.clients} clientes | Total: <span className="text-gray-800 font-bold">{formatCurrency(globalStats.volume)}</span>
                </div>
            </div>

            {/* Report Content */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10">Cargando reporte...</div>
                ) : data.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No se encontraron datos</div>
                ) : (
                    data.map((group) => (
                        <div key={group.corredor} className="border rounded-lg overflow-hidden shadow-sm bg-white">
                            {/* Group Header */}
                            <div 
                                className="bg-[#3b5998] text-white p-3 flex justify-between items-center cursor-pointer hover:bg-[#2d4373] transition-colors"
                                onClick={() => toggleTrader(group.corredor)}
                            >
                                <div className="flex items-center gap-2 font-bold uppercase">
                                    {expandedTraders.includes(group.corredor) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    {group.corredor}
                                </div>
                                <div className="flex gap-3">
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {group.clientCount} clientes
                                    </span>
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                                        {formatCurrency(group.totalVolume)}
                                    </span>
                                </div>
                            </div>

                            {/* Group Content */}
                            {expandedTraders.includes(group.corredor) && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                                            <tr>
                                                <th className="p-3 min-w-[100px]">NIT</th>
                                                <th className="p-3 min-w-[250px]">Cliente</th>
                                                {MONTHS.map(m => (
                                                    <th key={m} className="p-3 text-right min-w-[120px]">{m.substring(0, 3)}</th>
                                                ))}
                                                <th className="p-3 text-right min-w-[150px] font-bold">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {group.clients.map((c, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 text-gray-600">
                                                    <td className="p-3 font-mono text-xs">{c.nit}</td>
                                                    <td className="p-3 font-medium text-gray-800">{c.name}</td>
                                                    {MONTHS.map(m => (
                                                        <td key={m} className="p-3 text-right font-mono">
                                                            {c.months[m] > 0 ? formatCurrency(c.months[m]) : <span className="text-gray-300">$ 0</span>}
                                                        </td>
                                                    ))}
                                                    <td className="p-3 text-right font-bold font-mono text-gray-900">
                                                        {formatCurrency(c.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Footer Row */}
                                            <tr className="bg-green-50 font-bold border-t-2 border-green-100">
                                                <td colSpan={2} className="p-3 text-green-800">Total {group.corredor}</td>
                                                {MONTHS.map(m => {
                                                    const colTotal = group.clients.reduce((acc, curr) => acc + (curr.months[m] || 0), 0);
                                                    return (
                                                        <td key={m} className="p-3 text-right font-mono text-green-700">
                                                            {colTotal > 0 ? formatCurrency(colTotal) : '-'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-3 text-right font-mono text-green-900 text-base">
                                                    {formatCurrency(group.totalVolume)}
                                                </td>
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
