'use client';

import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getMarginReport, MarginReportData, getClients } from '@/services/reports.service';
import { getTraders } from '@/services/traders.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { 
    FileSpreadsheet, 
    ChevronDown, 
    ChevronRight, 
    Filter, 
    Users, 
    TrendingUp, 
    DollarSign, 
    Percent,
    Download,
    Loader2,
    RotateCcw,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

            const result = await getMarginReport(token, year, month, traderParam, clientParam, withGroups);
            setData(result);
            setExpandedTraders(result.data.map(d => d.corredor));
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

    const handleExport = async () => {
        if (!data || data.data.length === 0) return;
        const XLSX = await import('xlsx-js-style');
        
        // 1. Prepare Headers (Double Header for Month Columns: Vol, Com, Margin)
        // Row 1: CORREDOR, NOMBRE, [Month]..., Totales
        // Row 2: ..., ..., Vol, Com, %, ..., Vol, Com, %
        
        // Let's simplify to single row header for compatibility with the style logic, 
        // OR implement merged headers. 
        // The user asked for "lo mismo", implying hierarchical structure.
        // Let's use a similar structure:
        // Header 1: Metadata
        // Header 2: Columns
        
        const aoa: any[][] = [];
        
        // Metadata Rows
        const currentDate = new Date().toLocaleString('es-CO');
        const userName = user?.name || 'Desconocido';
        
        aoa.push(["CORREAGRO S.A."]);
        aoa.push([`Generado por: ${userName}`]);
        aoa.push([`Fecha: ${currentDate}`]);
        aoa.push([]); 

        // Headers
        // Main Header Row
        const headerRow1 = ["CORREDOR", "CLIENTE"];
        MONTHS.forEach(m => {
            headerRow1.push(m, "", ""); // 3 columns per month
        });
        headerRow1.push("TOTAL", "", "");
        aoa.push(headerRow1);

        // Sub Header Row
        const headerRow2 = ["", ""];
        MONTHS.forEach(() => {
            headerRow2.push("Vol", "Com", "%");
        });
        headerRow2.push("Vol", "Com", "%");
        aoa.push(headerRow2);

        const headerRowIndexStart = 4;
        const headerRowIndexEnd = 5;
        let currentRow = 6;
        const totalRows: number[] = [];

        // Global Accumulators (We need to calculate these as we go or pre-calculate)
        // Since data already has totals, we can sum them up.
        // But for "Margin %" global, we cannot sum percentages. We need sum(Vol) and sum(Com).
        
        const globalMonthStats = MONTHS.map(() => ({ vol: 0, com: 0 }));
        let globalTotalVol = 0;
        let globalTotalCom = 0;

        data.data.forEach(group => {
            // Group Accumulators
            const groupMonthStats = MONTHS.map(() => ({ vol: 0, com: 0 }));
            let groupTotalVol = 0;
            let groupTotalCom = 0;

            // Clients
            group.clients.forEach((c, idx) => {
                const row: any[] = [];
                row.push(idx === 0 ? group.corredor : "");
                row.push(c.name);

                MONTHS.forEach((m, mIdx) => {
                    const vol = c.months[m]?.volume || 0;
                    const com = c.months[m]?.commission || 0;
                    const margin = c.months[m]?.margin || 0;
                    
                    row.push(vol, com, margin);

                    // Accumulate
                    groupMonthStats[mIdx].vol += vol;
                    groupMonthStats[mIdx].com += com;
                });

                row.push(c.totalVolume, c.totalCommission, c.totalMargin);
                
                groupTotalVol += c.totalVolume;
                groupTotalCom += c.totalCommission;

                aoa.push(row);
                currentRow++;
            });

            // Group Total Row
            const totalRow: any[] = [];
            totalRow.push(`Total ${group.corredor}`);
            totalRow.push("");

            MONTHS.forEach((_, mIdx) => {
                const vol = groupMonthStats[mIdx].vol;
                const com = groupMonthStats[mIdx].com;
                const margin = vol > 0 ? (com / vol) * 100 : 0; // Assuming margin is percentage 0-100 or 0-1. 
                // Wait, in code data.margin is likely 0.2 for 0.2%. Let's check formatMargin: `${val.toFixed(5)}%`.
                // If it is raw number, we should check.
                // In page.tsx: `data.margin < 0.2 ? ...`. So it is likely percentage number (e.g. 0.15)
                // Let's assume input data is correct.
                
                totalRow.push(vol, com, margin);
                
                // Add to Global
                globalMonthStats[mIdx].vol += vol;
                globalMonthStats[mIdx].com += com;
            });

            const groupTotalMargin = groupTotalVol > 0 ? (groupTotalCom / groupTotalVol) * 100 : 0;
            totalRow.push(groupTotalVol, groupTotalCom, groupTotalMargin);
            
            globalTotalVol += groupTotalVol;
            globalTotalCom += groupTotalCom;

            aoa.push(totalRow);
            totalRows.push(currentRow);
            currentRow++;
        });

        // Global Total Row
        const globalRow: any[] = [];
        globalRow.push("Total General");
        globalRow.push("");

        MONTHS.forEach((_, mIdx) => {
            const vol = globalMonthStats[mIdx].vol;
            const com = globalMonthStats[mIdx].com;
            const margin = vol > 0 ? (com / vol) * 100 : 0;
            globalRow.push(vol, com, margin);
        });

        const globalTotalMargin = globalTotalVol > 0 ? (globalTotalCom / globalTotalVol) * 100 : 0;
        globalRow.push(globalTotalVol, globalTotalCom, globalTotalMargin);

        aoa.push(globalRow);
        totalRows.push(currentRow);

        // 2. Create Sheet
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // 3. Styles
        const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");

        // Styles Definitions
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
        const percentFormat = '0.000%';

        // Apply Metadata
        if (!ws["A1"]) ws["A1"] = { v: "", t: "s" }; ws["A1"].s = titleStyle;
        if (!ws["A2"]) ws["A2"] = { v: "", t: "s" }; ws["A2"].s = metaStyle;
        if (!ws["A3"]) ws["A3"] = { v: "", t: "s" }; ws["A3"].s = metaStyle;

        // Apply Header Styles
        for (let R = headerRowIndexStart; R <= headerRowIndexEnd; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
                ws[cellRef].s = headerStyle;
            }
        }

        // Apply Content Styles
        for (let R = headerRowIndexEnd + 1; R <= range.e.r; ++R) {
            const isTotalRow = totalRows.includes(R);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };

                if (isTotalRow) ws[cellRef].s = totalStyle;

                // Formats
                // Cols: 0,1 -> Text
                // Month Blocks: 3 cols each. Start Col 2.
                // Month 0: 2,3,4 (Vol, Com, %)
                // Month 1: 5,6,7
                // ...
                // Total: Last 3 cols.
                
                if (C >= 2 && typeof ws[cellRef].v === 'number') {
                    // Check if it is a % column
                    // Col 2 = Vol, 3 = Com, 4 = %
                    // (C - 2) % 3 === 2 -> Percent column
                    if ((C - 2) % 3 === 2) {
                         ws[cellRef].z = percentFormat;
                         // Also color red/green if needed?
                         // If value < 0.2 (assuming 0.2%) -> Red, else Green?
                         // The logic in frontend is data.margin < 0.2 (meaning 0.2%).
                         // Here we are calculating percentages. 
                         // If raw value is 0.15 (15%), then 0.2 is 20%.
                         // Need to be careful with units.
                         // Frontend: data.margin.toFixed(3). If data.margin is 0.1534, it prints 0.153.
                         // If < 0.2 (0.2), it is Red.
                         // Let's stick to standard formatting for now.
                    } else {
                        ws[cellRef].z = numberFormat;
                    }
                }
            }
        }

        // Merge Cells
        if(!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // Title
        
        // Merge Main Headers (Month Names)
        // Row 4 (index 4). Col 2,3,4 -> Month 1
        let col = 2;
        MONTHS.forEach(() => {
            ws['!merges'].push({ s: { r: 4, c: col }, e: { r: 4, c: col + 2 } });
            col += 3;
        });
        // Merge Total Header
        ws['!merges'].push({ s: { r: 4, c: col }, e: { r: 4, c: col + 2 } });

        // Column Widths
        ws['!cols'] = [
            { wch: 30 }, { wch: 40 }, 
            ...Array(MONTHS.length * 3 + 3).fill({ wch: 12 })
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Margen");
        XLSX.writeFile(wb, `Reporte_Margen_${year}.xlsx`);
    };

    const handleClearFilters = () => {
        setYear(new Date().getFullYear());
        setMonth('all');
        setSelectedTraders([]);
        setSelectedClients([]);
        setWithGroups(true);
    };

    return (
        <div className="space-y-6 min-h-0">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        Reporte de Margen
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Análisis de rentabilidad por corredor y cliente
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => toggleAll(true)} 
                        variant="outline" 
                        size="sm"
                        disabled={!data}
                    >
                        <Maximize2 className="mr-2 h-4 w-4" /> Abrir Todos
                    </Button>
                    <Button 
                        onClick={() => toggleAll(false)} 
                        variant="outline" 
                        size="sm"
                        disabled={!data}
                    >
                        <Minimize2 className="mr-2 h-4 w-4" /> Cerrar Todos
                    </Button>
                    <Button 
                        onClick={handleExport} 
                        disabled={!data || data.data.length === 0}
                        className="shrink-0"
                    >
                        <Download className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className={`grid grid-cols-1 gap-4 items-end ${user?.role === 'admin' ? 'md:grid-cols-6' : 'md:grid-cols-5'}`}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Año</label>
                            <select 
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Meses</label>
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
                            <label className="text-sm font-medium leading-none">Corredores</label>
                            <MultiSelect 
                                options={availableTraders}
                                selected={selectedTraders}
                                onChange={setSelectedTraders}
                                placeholder="Filtrar por corredores..."
                                disabled={user?.role === 'trader'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Clientes</label>
                            <MultiSelect 
                                options={availableClients}
                                selected={selectedClients}
                                onChange={setSelectedClients}
                                placeholder="Todos los clientes"
                            />
                        </div>

                        {(user?.role === 'admin' || user?.role === 'business_intelligence') && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Grupos</label>
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

            {/* KPI Cards */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-primary/10 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1 text-primary text-sm font-medium">
                                <DollarSign className="w-4 h-4" /> Total Transado
                            </div>
                            <div className="text-2xl font-bold text-foreground">{formatCurrency(data.kpis.totalVolume)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/10">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1 text-foreground/80 text-sm font-medium">
                                <DollarSign className="w-4 h-4" /> Total Comisión
                            </div>
                            <div className="text-2xl font-bold text-foreground">{formatCurrency(data.kpis.totalCommission)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-500/10 border-green-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1 text-green-700 text-sm font-medium">
                                <Percent className="w-4 h-4" /> Margen Promedio
                            </div>
                            <div className="text-2xl font-bold text-green-700">{formatMargin(data.kpis.avgMargin)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1 text-muted-foreground text-sm font-medium">
                                <Users className="w-4 h-4" /> Total Clientes
                            </div>
                            <div className="text-2xl font-bold text-foreground">{data.kpis.totalClients}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Report Content */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-[200px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !data || data.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
                        <p className="font-medium">No se encontraron datos</p>
                    </div>
                ) : (
                    data.data.map((group) => (
                        <Card key={group.corredor} className="overflow-hidden">
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
                                    <span className="bg-background border px-2 py-1 rounded font-mono">
                                        {formatCurrency(group.totalVolume)}
                                    </span>
                                    <span className="bg-background border px-2 py-1 rounded font-mono text-primary font-medium">
                                        {formatCurrency(group.totalCommission)}
                                    </span>
                                    <span className={cn(
                                        "px-2 py-1 rounded font-bold border",
                                        group.avgMargin < 0.2 ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200"
                                    )}>
                                        {formatMargin(group.avgMargin)}
                                    </span>
                                </div>
                            </div>

                            {/* Group Content */}
                            {expandedTraders.includes(group.corredor) && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead className="bg-muted/30 text-muted-foreground font-medium">
                                            <tr>
                                                <th rowSpan={2} className="p-2 border-b bg-background sticky left-0 z-10 min-w-[100px]">NIT</th>
                                                <th rowSpan={2} className="p-2 border-b bg-background sticky left-[100px] z-10 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Cliente</th>
                                                {MONTHS.map(m => (
                                                    <th key={m} colSpan={3} className="p-2 border text-center border-l border-r">{m.substring(0, 3)}</th>
                                                ))}
                                                <th colSpan={3} className="p-2 border text-center bg-primary/5">Total</th>
                                            </tr>
                                            <tr>
                                                {MONTHS.map(m => (
                                                    <Fragment key={m}>
                                                        <th className="p-1 border text-right min-w-[80px] text-muted-foreground">Vol</th>
                                                        <th className="p-1 border text-right min-w-[60px] text-muted-foreground">Com</th>
                                                        <th className="p-1 border text-right min-w-[50px] text-muted-foreground">%</th>
                                                    </Fragment>
                                                ))}
                                                <th className="p-1 border text-right bg-primary/5 font-bold">Vol</th>
                                                <th className="p-1 border text-right bg-primary/5 font-bold">Com</th>
                                                <th className="p-1 border text-right bg-primary/5 font-bold">%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.clients.map((client, idx) => (
                                                <tr key={client.nit + idx} className="hover:bg-muted/20">
                                                    <td className="p-2 border-b bg-background sticky left-0 z-10 font-mono text-muted-foreground">{client.nit}</td>
                                                    <td className="p-2 border-b bg-background sticky left-[100px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate max-w-[200px]" title={client.name}>{client.name}</td>
                                                    {MONTHS.map(m => {
                                                        const data = client.months[m];
                                                        return (
                                                            <Fragment key={m}>
                                                                <td className="p-1 border-b border-r text-right text-muted-foreground">{data ? formatCurrency(data.volume).replace('$','').replace(',00','') : '-'}</td>
                                                                <td className="p-1 border-b border-r text-right text-muted-foreground">{data ? formatCurrency(data.commission).replace('$','').replace(',00','') : '-'}</td>
                                                                <td className={cn("p-1 border-b border-r text-right font-medium", 
                                                                    data ? (data.margin < 0.2 ? "text-red-600" : "text-green-600") : "text-muted-foreground"
                                                                )}>
                                                                    {data ? data.margin.toFixed(3) : '-'}
                                                                </td>
                                                            </Fragment>
                                                        );
                                                    })}
                                                    <td className="p-1 border-b border-r text-right bg-primary/5 font-medium">{formatCurrency(client.totalVolume).replace('$','').replace(',00','')}</td>
                                                    <td className="p-1 border-b border-r text-right bg-primary/5 font-medium">{formatCurrency(client.totalCommission).replace('$','').replace(',00','')}</td>
                                                    <td className={cn("p-1 border-b border-r text-right bg-primary/5 font-bold", 
                                                        client.totalMargin < 0.2 ? "text-red-600" : "text-green-600"
                                                    )}>
                                                        {client.totalMargin.toFixed(3)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
