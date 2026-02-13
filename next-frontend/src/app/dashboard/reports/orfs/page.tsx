'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getOrfsReport, OrfsReportData, getClients } from '@/services/reports.service';
import { getTraders } from '@/services/traders.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { 
    FileSpreadsheet, 
    ChevronDown, 
    ChevronRight, 
    Filter, 
    Users, 
    Calendar, 
    Download, 
    Maximize2, 
    Minimize2,
    Briefcase,
    DollarSign,
    Loader2,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        if (user?.role === 'trader' && user?.traderName) {
            setAvailableTraders([{ label: user.traderName, value: user.traderName }]);
            setSelectedTraders([user.traderName]);
        } else {
            getTraders(token).then(traders => {
                const options = traders.map(t => ({ label: t.nombre, value: t.nombre }));
                setAvailableTraders(options);
            }).catch(err => console.error("Error loading traders", err));
        }

        // Load Clients
        getClients(token, year).then(clients => {
             const options = clients.map(c => ({ label: c, value: c }));
             setAvailableClients(options);
        }).catch(err => console.error("Error loading clients", err));

    }, [token, year, user]);

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
            // Could use a toast here
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
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

    const handleExport = async () => {
        if (!data || data.length === 0) return;
        const XLSX = await import('xlsx-js-style');

        // 1. Prepare Data Structure (AOA)
        const headers = ["CORREDOR", "NOMBRE", ...MONTHS, "Total General"];
        const aoa: any[][] = [];
        
        // Metadata Rows
        const currentDate = new Date().toLocaleString('es-CO');
        const userName = user?.name || 'Desconocido';
        
        aoa.push(["CORREAGRO S.A."]); // Placeholder for Logo/Title
        aoa.push([`Generado por: ${userName}`]);
        aoa.push([`Fecha: ${currentDate}`]);
        aoa.push([]); // Empty row for spacing
        
        aoa.push(headers);

        const totalRows: number[] = []; // Track indices of total rows for styling
        let currentRow = 5; // Start after metadata (4 rows) + header (1 row) -> index 5 is first data row? No.
        // Row 0: CORREAGRO
        // Row 1: User
        // Row 2: Date
        // Row 3: Empty
        // Row 4: Headers
        // Row 5: Data...
        
        const headerRowIndex = 4;
        currentRow = 5;

        // Global Totals Accumulator
        const globalMonthlyTotals = new Array(MONTHS.length).fill(0);
        let globalGrandTotal = 0;

        data.forEach(group => {
            // Group Monthly Totals
            const groupMonthlyTotals = new Array(MONTHS.length).fill(0);
            let groupGrandTotal = 0;

            // Clients Rows
            group.clients.forEach((c, idx) => {
                const row: any[] = [];
                // Col A: Corredor (Group Name) - only on first row of group
                row.push(idx === 0 ? group.corredor : "");
                // Col B: Client Name
                row.push(c.name);
                
                // Months Columns
                MONTHS.forEach((m, mIdx) => {
                    const val = c.months[m] || 0;
                    row.push(val);
                    
                    // Accumulate Group Totals
                    groupMonthlyTotals[mIdx] += val;
                });
                
                // Client Total
                row.push(c.total);
                groupGrandTotal += c.total;
                
                aoa.push(row);
                currentRow++;
            });

            // Group Total Row
            const totalRow: any[] = [];
            totalRow.push(`Total ${group.corredor}`); // Col A
            totalRow.push(""); // Col B
            
            // Add Monthly Totals to Row and Accumulate Global
            groupMonthlyTotals.forEach((val, mIdx) => {
                totalRow.push(val);
                globalMonthlyTotals[mIdx] += val;
            });
            
            // Group Grand Total
            totalRow.push(groupGrandTotal);
            globalGrandTotal += groupGrandTotal;

            aoa.push(totalRow);
            totalRows.push(currentRow); // Mark this row for styling
            currentRow++;
        });

        // Global Total Row
        const globalRow: any[] = [];
        globalRow.push("Total General");
        globalRow.push("");
        globalMonthlyTotals.forEach(val => globalRow.push(val));
        globalRow.push(globalGrandTotal);
        
        aoa.push(globalRow);
        totalRows.push(currentRow);

        // 2. Create Sheet
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // 3. Apply Styles
        const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");

        // Define Styles
        const titleStyle = {
            font: { bold: true, sz: 14, color: { rgb: "000000" } },
            alignment: { horizontal: "left" }
        };
        
        const metaStyle = {
            font: { italic: true, sz: 10, color: { rgb: "555555" } },
            alignment: { horizontal: "left" }
        };

        const headerStyle = {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "EFEFEF" } },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            },
            alignment: { horizontal: "center", vertical: "center" }
        };

        const totalStyle = {
            font: { bold: true },
            fill: { fgColor: { rgb: "FFC000" } }, // Yellow/Orange as per screenshot
            border: {
                top: { style: "thin" },
                bottom: { style: "thin" }
            }
        };

        const numberFormat = '#,##0';

        // Apply Metadata Styles
        // A1: Title
        if (!ws["A1"]) ws["A1"] = { v: "", t: "s" };
        ws["A1"].s = titleStyle;
        
        // A2, A3: Meta
        if (!ws["A2"]) ws["A2"] = { v: "", t: "s" };
        ws["A2"].s = metaStyle;
        if (!ws["A3"]) ws["A3"] = { v: "", t: "s" };
        ws["A3"].s = metaStyle;

        // Apply Header Styles (Row index 4)
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
            if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
            ws[cellRef].s = headerStyle;
        }

        // Apply Content Styles
        for (let R = headerRowIndex + 1; R <= range.e.r; ++R) {
            const isTotalRow = totalRows.includes(R);
            
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };

                // Apply Total Row Style
                if (isTotalRow) {
                    ws[cellRef].s = totalStyle;
                }

                // Apply Number Format to Value Columns (Col Index >= 2)
                if (C >= 2 && typeof ws[cellRef].v === 'number') {
                    ws[cellRef].z = numberFormat;
                }
            }
        }
        
        // Merge Cells for Title if needed (optional)
        if(!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // Merge Title across 4 cols

        // Column Widths
        ws['!cols'] = [
            { wch: 40 }, // Corredor
            { wch: 50 }, // Nombre
            ...MONTHS.map(() => ({ wch: 15 })), // Months
            { wch: 20 } // Total
        ];

        // 4. Write File
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte ORFS");
        XLSX.writeFile(wb, `Reporte_ORFS_${year}.xlsx`);
    };

    // Calculate Global Totals
    const globalStats = useMemo(() => data.reduce((acc, curr) => ({
        traders: acc.traders + 1,
        clients: acc.clients + curr.clientCount,
        volume: acc.volume + curr.totalVolume
    }), { traders: 0, clients: 0, volume: 0 }), [data]);

    return (
        <div className="space-y-6 p-2 sm:p-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <FileSpreadsheet className="h-6 w-6 text-primary" />
                        Reporte ORFS
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Análisis mensual de operaciones por corredor y cliente
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => toggleAll(true)} 
                        variant="outline" 
                        size="sm"
                        disabled={loading || data.length === 0}
                    >
                        <Maximize2 className="mr-2 h-4 w-4" /> Abrir Todos
                    </Button>
                    <Button 
                        onClick={() => toggleAll(false)} 
                        variant="outline" 
                        size="sm"
                        disabled={loading || data.length === 0}
                    >
                        <Minimize2 className="mr-2 h-4 w-4" /> Cerrar Todos
                    </Button>
                    <Button 
                        onClick={handleExport} 
                        disabled={loading || data.length === 0}
                        className="shrink-0"
                    >
                        <Download className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1 text-primary text-sm font-medium">
                            <Briefcase className="w-4 h-4" /> Corredores Activos
                        </div>
                        <div className="text-2xl font-bold text-foreground">{globalStats.traders}</div>
                    </CardContent>
                </Card>
                <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1 text-primary text-sm font-medium">
                            <Users className="w-4 h-4" /> Clientes Activos
                        </div>
                        <div className="text-2xl font-bold text-foreground">{globalStats.clients}</div>
                    </CardContent>
                </Card>
                <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1 text-primary text-sm font-medium">
                            <DollarSign className="w-4 h-4" /> Volumen Total
                        </div>
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(globalStats.volume)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 gap-4 items-end md:grid-cols-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Año</label>
                            <select 
                                className="w-full bg-background border border-input rounded-md shadow-sm p-2 text-sm focus:ring-primary focus:border-primary"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Meses</label>
                            <select 
                                className="w-full bg-background border border-input rounded-md shadow-sm p-2 text-sm focus:ring-primary focus:border-primary"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                            >
                                <option value="all">Todos los meses</option>
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Corredores</label>
                            <MultiSelect
                                options={availableTraders}
                                selected={selectedTraders}
                                onChange={setSelectedTraders}
                                placeholder="Filtrar por corredores..."
                                disabled={user?.role === 'trader'}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Clientes</label>
                            <MultiSelect 
                                options={availableClients}
                                selected={selectedClients}
                                onChange={setSelectedClients}
                                placeholder="Todos los clientes"
                            />
                        </div>
                        
                        <div className="md:col-span-6 flex justify-end">
                             <Button onClick={fetchData} disabled={loading} className="w-full md:w-auto">
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
                                Aplicar Filtros
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Report Content */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
                        <p>Generando reporte...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        <Search className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-medium">No se encontraron datos</p>
                        <p className="text-sm">Intenta ajustar los filtros para ver resultados</p>
                    </div>
                ) : (
                    data.map((group) => (
                        <div key={group.corredor} className="border rounded-lg overflow-hidden shadow-sm bg-card text-card-foreground">
                            {/* Group Header */}
                            <div 
                                className="bg-muted/50 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer hover:bg-muted/70 transition-colors gap-2"
                                onClick={() => toggleTrader(group.corredor)}
                            >
                                <div className="flex items-center gap-2 font-semibold uppercase text-foreground">
                                    {expandedTraders.includes(group.corredor) ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                                    {group.corredor}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs">
                                    <span className="bg-background border px-2 py-1 rounded flex items-center gap-1 text-muted-foreground">
                                        <Users className="w-3 h-3" /> {group.clientCount} clientes
                                    </span>
                                    <span className="bg-background border px-2 py-1 rounded font-mono font-medium text-primary">
                                        {formatCurrency(group.totalVolume)}
                                    </span>
                                </div>
                            </div>

                            {/* Group Content */}
                            {expandedTraders.includes(group.corredor) && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground font-medium border-b">
                                            <tr>
                                                <th className="p-3 min-w-[100px]">NIT</th>
                                                <th className="p-3 min-w-[250px]">Cliente</th>
                                                {MONTHS.map(m => (
                                                    <th key={m} className="p-3 text-right min-w-[100px]">{m.substring(0, 3)}</th>
                                                ))}
                                                <th className="p-3 text-right min-w-[120px] font-bold">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {group.clients.map((c, idx) => (
                                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-3 font-mono text-xs text-muted-foreground">{c.nit}</td>
                                                    <td className="p-3 font-medium">{c.name}</td>
                                                    {MONTHS.map(m => (
                                                        <td key={m} className="p-3 text-right font-mono text-xs">
                                                            {c.months[m] > 0 ? formatCurrency(c.months[m]) : <span className="text-muted-foreground/30">-</span>}
                                                        </td>
                                                    ))}
                                                    <td className="p-3 text-right font-bold font-mono">
                                                        {formatCurrency(c.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Footer Row */}
                                            <tr className="bg-muted/30 font-bold border-t border-border">
                                                <td colSpan={2} className="p-3 text-primary">Total {group.corredor}</td>
                                                {MONTHS.map(m => {
                                                    const colTotal = group.clients.reduce((acc, curr) => acc + (curr.months[m] || 0), 0);
                                                    return (
                                                        <td key={m} className="p-3 text-right font-mono text-xs text-primary/80">
                                                            {colTotal > 0 ? formatCurrency(colTotal) : '-'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-3 text-right font-mono text-primary text-sm">
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
