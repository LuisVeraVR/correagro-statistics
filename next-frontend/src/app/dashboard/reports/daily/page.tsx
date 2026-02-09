'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDailyReport, getRuedasOptions, DailyReportData } from '@/services/reports.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, RotateCcw, TrendingUp } from 'lucide-react';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function DailyReportPage() {
    const { token, user } = useAuth();
    const [data, setData] = useState<DailyReportData | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState('all');
    const [rueda, setRueda] = useState('all');
    const [client, setClient] = useState('');
    const [withGroups, setWithGroups] = useState(true);
    
    const [availableRuedas, setAvailableRuedas] = useState<{label: string, value: string}[]>([]);

    // Load Ruedas Options
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
            const result = await getDailyReport(token, year, month, rueda, client, withGroups);
            setData(result);
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

    const handleClearFilters = () => {
        const dYear = new Date().getFullYear();
        setYear(dYear);
        setMonth('all');
        setRueda('all');
        setClient('');
        setWithGroups(true);
        
        if (!token) return;
        setLoading(true);
        getDailyReport(token, dYear, 'all', 'all', '', true)
            .then(res => setData(res))
            .catch(err => {
                console.error(err);
                alert('Error al cargar el reporte');
            })
            .finally(() => setLoading(false));
    };

    const formatCurrency = (val: number) => {
        if (!val || val === 0) return '-';
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-gray-700" />
                    Negociado Diario
                </h1>
                <p className="text-gray-500">Vista matricial por cliente y rueda</p>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rueda</label>
                            <select 
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                value={rueda}
                                onChange={(e) => setRueda(e.target.value)}
                            >
                                <option value="all">Todas las ruedas</option>
                                {availableRuedas.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                            <input 
                                type="text" 
                                placeholder="Buscar por nombre de cliente..."
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                value={client}
                                onChange={(e) => setClient(e.target.value)}
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
                             <Button variant="secondary" onClick={handleClearFilters} className="flex-1">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Limpiar
                             </Button>
                             <Button className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={fetchData}>
                                <Filter className="w-4 h-4" />
                             </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Matrix Table */}
            <Card>
                <div className="p-4 border-b">
                     <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Detalle matricial
                     </h3>
                </div>
                <CardContent className="p-0 overflow-x-auto">
                    {loading ? (
                         <div className="text-center py-10">Cargando...</div>
                    ) : !data || data.data.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No se encontraron datos</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#3b5998] text-white">
                                <tr>
                                    <th className="p-3 font-semibold min-w-[200px] sticky left-0 bg-[#3b5998]">NOMBRE</th>
                                    {data.ruedas.map(r => (
                                        <th key={r} className="p-3 font-semibold text-center min-w-[100px]">{r}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data.data.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-700 truncate max-w-[300px] sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" title={row.name}>
                                            {row.name}
                                        </td>
                                        {data.ruedas.map(r => (
                                            <td key={r} className="p-3 text-right text-gray-600">
                                                {formatCurrency(row.wheels[r])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
