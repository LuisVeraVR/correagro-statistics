'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getRuedasReport, getRuedasOptions, RuedasReportData } from '@/services/reports.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { FileSpreadsheet, Filter, CircleDot, DollarSign, Users, Percent } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function RuedasReportPage() {
    const { token, user } = useAuth();
    const [data, setData] = useState<RuedasReportData | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [year, setYear] = useState(new Date().getFullYear());
    const [withGroups, setWithGroups] = useState(true);
    
    const [availableRuedas, setAvailableRuedas] = useState<{label: string, value: string}[]>([]);
    const [selectedRuedas, setSelectedRuedas] = useState<string[]>([]);

    // UI State
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [expandedTraders, setExpandedTraders] = useState<string[]>([]);

    // Load Filters Options
    useEffect(() => {
        if (!token) return;
        
        getRuedasOptions(token, year).then(ruedas => {
            const options = ruedas.map(r => ({ 
                label: `Rueda ${r.ruedaNo} - ${r.fecha}`, 
                value: r.ruedaNo.toString() 
            }));
            setAvailableRuedas(options);
        }).catch(err => console.error("Error loading ruedas options", err));

    }, [token, year]);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const result = await getRuedasReport(token, year, selectedRuedas.length > 0 ? selectedRuedas : [], withGroups);
            setData(result);
            setExpandedTraders([]);
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

    const toggleAll = (expand: boolean) => {
        if (data && expand) {
            setExpandedTraders(data.data.map(d => d.corredor));
        } else {
            setExpandedTraders([]);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
    };

    const formatMargin = (val: number) => {
        return `${val.toFixed(5)}%`;
    };

    const handleExport = () => {
        if (!data) return;
        const rows = data.data.map(d => ({
            Corredor: d.corredor,
            Clientes: d.clientCount,
            Volumen: d.totalVolume,
            Comision: d.totalCommission,
            Margen: d.avgMargin
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Ruedas");
        XLSX.writeFile(wb, `Reporte_Ruedas_${year}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CircleDot className="w-8 h-8 text-gray-700" />
                    Reporte de Ruedas
                </h1>
                <p className="text-gray-500">Detalle completo por rueda específica de negociación</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className={`grid grid-cols-1 gap-4 items-end ${user?.role === 'admin' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
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
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ruedas</label>
                            <MultiSelect 
                                options={availableRuedas}
                                selected={selectedRuedas}
                                onChange={setSelectedRuedas}
                                placeholder="Todas las ruedas"
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
                                Exportar Excel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats Line */}
            {data && (
                <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border">
                    <div className="flex gap-2">
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => toggleAll(true)}>
                            Abrir Todos
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => toggleAll(false)}>
                            Cerrar Todos
                        </Button>
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                        {data.kpis.totalTraders} corredores | {data.kpis.totalClients} clientes | Margen: {formatMargin(data.kpis.avgMargin)}
                    </div>
                </div>
            )}

            {/* Data List */}
            <div className="space-y-2">
                {loading ? (
                    <div className="text-center py-10">Cargando reporte...</div>
                ) : !data || data.data.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No se encontraron datos</div>
                ) : (
                    data.data.map((item) => (
                        <div key={item.corredor} className="border rounded-md overflow-hidden bg-white shadow-sm">
                             {/* Trader Bar */}
                            <div className="bg-[#3b5998] text-white p-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold uppercase text-sm">{item.corredor}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="bg-white/20 px-2 py-1 rounded text-xs flex items-center gap-1">
                                        <Users className="w-3 h-3" /> {item.clientCount} clientes
                                    </span>
                                    <span className="font-bold flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" /> {formatCurrency(item.totalVolume)}
                                    </span>
                                    <span className="bg-white/20 px-2 py-1 rounded text-xs flex items-center gap-1">
                                        <Percent className="w-3 h-3" /> {formatMargin(item.avgMargin)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
