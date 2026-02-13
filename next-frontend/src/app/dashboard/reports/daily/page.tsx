'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDailyReport, getRuedasOptions, DailyReportData } from '@/services/reports.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
    Filter, 
    RotateCcw, 
    TrendingUp, 
    Download, 
    Loader2, 
    Search,
    Calendar,
    FileSpreadsheet
} from 'lucide-react';
// @ts-ignore
import XLSX from 'xlsx-js-style';
import { cn } from '@/lib/utils';

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
            })
            .finally(() => setLoading(false));
    };

    const handleExport = () => {
        if (!data || data.data.length === 0) return;
        
        // This report is Matrix: Client (Rows) x Ruedas (Cols)
        // Structure:
        // Metadata
        // Header: CLIENTE, [Rueda1], [Rueda2]..., Total
        
        const aoa: any[][] = [];
        
        // Metadata
        const currentDate = new Date().toLocaleString('es-CO');
        const userName = user?.name || 'Desconocido';
        
        aoa.push(["CORREAGRO S.A."]);
        aoa.push([`Generado por: ${userName}`]);
        aoa.push([`Fecha: ${currentDate}`]);
        aoa.push([]); 

        // Headers
        const headers = ["CLIENTE", ...data.ruedas, "Total"];
        aoa.push(headers);

        const headerRowIndex = 4;
        let currentRow = 5;
        const totalRows: number[] = []; // Usually total row is at bottom
        
        // Global Column Totals
        const colTotals = new Array(data.ruedas.length).fill(0);
        let globalTotal = 0;

        data.data.forEach(row => {
            const excelRow: any[] = [];
            excelRow.push(row.name);
            
            let rowTotal = 0;
            data.ruedas.forEach((r, idx) => {
                const val = row.wheels[r] || 0;
                excelRow.push(val);
                rowTotal += val;
                
                colTotals[idx] += val;
            });
            
            excelRow.push(rowTotal);
            globalTotal += rowTotal;
            
            aoa.push(excelRow);
            currentRow++;
        });

        // Global Total Row
        const totalRow: any[] = [];
        totalRow.push("Total General");
        colTotals.forEach(val => totalRow.push(val));
        totalRow.push(globalTotal);
        
        aoa.push(totalRow);
        totalRows.push(currentRow);

        // 2. Create Sheet
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // 3. Styles
        const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");

        const titleStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: "left" } };
        const metaStyle = { font: { italic: true, sz: 10, color: { rgb: "555555" } }, alignment: { horizontal: "left" } };
        const headerStyle = { 
            font: { bold: true }, 
            fill: { fgColor: { rgb: "EFEFEF" } },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
            alignment: { horizontal: "center", vertical: "center" }
        };
        const totalStyle = { 
            font: { bold: true }, 
            fill: { fgColor: { rgb: "FFC000" } },
            border: { top: { style: "thin" }, bottom: { style: "thin" } }
        };
        const numberFormat = '#,##0';

        // Metadata
        if (!ws["A1"]) ws["A1"] = { v: "", t: "s" }; ws["A1"].s = titleStyle;
        if (!ws["A2"]) ws["A2"] = { v: "", t: "s" }; ws["A2"].s = metaStyle;
        if (!ws["A3"]) ws["A3"] = { v: "", t: "s" }; ws["A3"].s = metaStyle;

        // Header
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
            if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
            ws[cellRef].s = headerStyle;
        }

        // Content
        for (let R = headerRowIndex + 1; R <= range.e.r; ++R) {
            const isTotal = totalRows.includes(R);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };

                if (isTotal) ws[cellRef].s = totalStyle;
                
                if (C >= 1 && typeof ws[cellRef].v === 'number') {
                     ws[cellRef].z = numberFormat;
                }
            }
        }

        // Merges
        if(!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // Title

        // Widths
        ws['!cols'] = [
            { wch: 40 }, // Client Name
            ...Array(data.ruedas.length).fill({ wch: 15 }),
            { wch: 20 } // Total
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Diario");
        XLSX.writeFile(wb, `Reporte_Diario_${year}_${month}.xlsx`);
    };

    const formatCurrency = (val: number) => {
        if (!val || val === 0) return '-';
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6 min-h-0">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        Negociado Diario
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Vista matricial por cliente y rueda
                    </p>
                </div>
                <Button 
                    onClick={handleExport} 
                    disabled={!data || data.data.length === 0}
                    className="shrink-0"
                >
                    <Download className="mr-2 h-4 w-4" /> Exportar Excel
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className={`grid grid-cols-1 gap-4 items-end ${user?.role === 'admin' ? 'md:grid-cols-6' : 'md:grid-cols-5'}`}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Año</label>
                            <select 
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Mes</label>
                            <select 
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                            >
                                <option value="all">Todos los meses</option>
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Rueda</label>
                            <select 
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={rueda}
                                onChange={(e) => setRueda(e.target.value)}
                            >
                                <option value="all">Todas las ruedas</option>
                                {availableRuedas.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Cliente</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar cliente..." 
                                    className="pl-8"
                                    value={client}
                                    onChange={(e) => setClient(e.target.value)}
                                />
                            </div>
                        </div>

                        {user?.role === 'admin' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Grupos</label>
                            <select 
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={withGroups ? "true" : "false"}
                                onChange={(e) => setWithGroups(e.target.value === "true")}
                            >
                                <option value="true">Con Grupos</option>
                                <option value="false">Sin Grupos</option>
                            </select>
                        </div>
                        )}

                        <div className="flex gap-2">
                             <Button variant="outline" onClick={handleClearFilters} className="flex-1" title="Limpiar filtros">
                                <RotateCcw className="h-4 w-4" />
                             </Button>
                             <Button onClick={fetchData} className="flex-1" title="Aplicar filtros">
                                <Filter className="h-4 w-4" />
                             </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Matrix Table */}
            <Card className="min-h-0 overflow-hidden">
                <CardHeader className="px-6 py-4 border-b">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        Detalle matricial
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : !data || data.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-medium">No se encontraron datos</p>
                            <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    ) : (
                        <div className="relative">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[200px] sticky left-0 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10">
                                            Cliente
                                        </th>
                                        {data.ruedas.map(r => (
                                            <th key={r} className="px-4 py-3 text-right min-w-[100px] whitespace-nowrap">
                                                {r}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {data.data.map((row, i) => (
                                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-foreground truncate max-w-[300px] sticky left-0 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10" title={row.name}>
                                                {row.name}
                                            </td>
                                            {data.ruedas.map(r => (
                                                <td key={r} className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                                    {formatCurrency(row.wheels[r])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
