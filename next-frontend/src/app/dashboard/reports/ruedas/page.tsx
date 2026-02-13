'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getRuedasReport, getRuedasOptions, RuedasReportData } from '@/services/reports.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { 
    FileSpreadsheet, 
    Filter, 
    CircleDot, 
    DollarSign, 
    Users, 
    Percent, 
    ChevronDown, 
    ChevronRight,
    Download,
    Maximize2,
    Minimize2,
    Briefcase,
    Loader2,
    Search,
    Calendar
} from 'lucide-react';
// @ts-ignore
import XLSX from 'xlsx-js-style';
import { cn } from '@/lib/utils';

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
    const [expandedTraders, setExpandedTraders] = useState<string[]>([]);
    const [expandedWheels, setExpandedWheels] = useState<string[]>([]); // "Trader-Rueda" keys

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
            setExpandedTraders(result.data.map(d => d.corredor));
            // Also expand all wheels by default? Maybe too much. Let's keep wheels collapsed or expanded based on user pref.
            // Let's expand all wheels for now to show data immediately
            const allWheels = result.data.flatMap(d => d.wheels.map(w => `${d.corredor}-${w.ruedaNo}`));
            setExpandedWheels(allWheels);
        } catch (error) {
            console.error(error);
            // toast error
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

    const toggleWheel = (key: string) => {
        setExpandedWheels(prev => 
            prev.includes(key) 
                ? prev.filter(k => k !== key) 
                : [...prev, key]
        );
    };

    const toggleAll = (expand: boolean) => {
        if (data && expand) {
            setExpandedTraders(data.data.map(d => d.corredor));
            setExpandedWheels(data.data.flatMap(d => d.wheels.map(w => `${d.corredor}-${w.ruedaNo}`)));
        } else {
            setExpandedTraders([]);
            setExpandedWheels([]);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

    const formatMargin = (val: number) => {
        return `${val.toFixed(3)}%`;
    };

    const handleExport = () => {
        if (!data || data.data.length === 0) return;
        
        // Structure: 
        // Header: CORREDOR, RUEDA, FECHA, CLIENTE, VOLUMEN, COMISION
        // Group by Trader -> Rueda -> Clients
        // This hierarchy is deeper: Trader > Rueda > Client.
        // Let's flatten slightly for readability or use indentation?
        // User asked for "lo mismo", meaning hierarchical.
        // Let's do:
        // Trader Row
        //   Rueda Row
        //     Client Rows...
        //     Total Rueda Row
        //   Total Trader Row
        // Total General Row
        
        const aoa: any[][] = [];
        
        // Metadata
        const currentDate = new Date().toLocaleString('es-CO');
        const userName = user?.name || 'Desconocido';
        
        aoa.push(["CORREAGRO S.A."]);
        aoa.push([`Generado por: ${userName}`]);
        aoa.push([`Fecha: ${currentDate}`]);
        aoa.push([]); 

        // Headers
        const headers = ["CORREDOR", "RUEDA", "FECHA", "CLIENTE", "VOLUMEN", "COMISION"];
        aoa.push(headers);
        
        const headerRowIndex = 4;
        let currentRow = 5;
        const totalRows: number[] = [];
        const subTotalRows: number[] = []; // For Rueda Totals (maybe different color?)

        let globalVol = 0;
        let globalCom = 0;

        data.data.forEach(trader => {
            let traderVol = 0;
            let traderCom = 0;

            // Trader Header Row (Optional, or just use first column)
            // If we follow the style of "Corredor" in first column for the block
            
            // We'll output rows per client, filling Corredor only on first row of Trader block?
            // Or better: Trader Name on its own row?
            // "Lo mismo" suggests Group Header Row.
            // Let's do Trader Header Row.
            
            aoa.push([trader.corredor, "", "", "", "", ""]);
            // Apply style to this? Maybe just bold.
            currentRow++;

            trader.wheels.forEach(wheel => {
                let wheelVol = 0;
                let wheelCom = 0;

                // Rueda Header Row? Or just list clients with Rueda info?
                // Rueda info (No, Date) is common for clients in that wheel.
                // Let's do:
                //   Rueda X - Date
                //     Client 1...
                //     Client 2...
                //   Total Rueda X
                
                aoa.push(["", `Rueda ${wheel.ruedaNo}`, wheel.fecha, "", "", ""]);
                currentRow++;

                wheel.clients.forEach(client => {
                    aoa.push(["", "", "", client.name, client.volume, client.commission]);
                    wheelVol += client.volume;
                    wheelCom += client.commission;
                    currentRow++;
                });

                // Rueda Total
                aoa.push(["", `Total Rueda ${wheel.ruedaNo}`, "", "", wheelVol, wheelCom]);
                subTotalRows.push(currentRow);
                currentRow++;

                traderVol += wheelVol;
                traderCom += wheelCom;
            });

            // Trader Total
            aoa.push([`Total ${trader.corredor}`, "", "", "", traderVol, traderCom]);
            totalRows.push(currentRow);
            currentRow++;

            globalVol += traderVol;
            globalCom += traderCom;
        });

        // Global Total
        aoa.push(["Total General", "", "", "", globalVol, globalCom]);
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
        const subTotalStyle = {
            font: { bold: true },
            fill: { fgColor: { rgb: "FFF2CC" } }, // Lighter yellow
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
            const isSubTotal = subTotalRows.includes(R);

            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };

                if (isTotal) ws[cellRef].s = totalStyle;
                else if (isSubTotal) ws[cellRef].s = subTotalStyle;

                if (C >= 4 && typeof ws[cellRef].v === 'number') { // Vol(4), Com(5)
                    ws[cellRef].z = numberFormat;
                }
            }
        }

        // Merges
        if(!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // Title

        // Widths
        ws['!cols'] = [
            { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 20 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Ruedas");
        XLSX.writeFile(wb, `Reporte_Ruedas_${year}.xlsx`);
    };

    return (
        <div className="space-y-6 p-2 sm:p-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <CircleDot className="h-6 w-6 text-primary" />
                        Reporte de Ruedas
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Detalle completo de operaciones por rueda de negociación
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => toggleAll(true)} 
                        variant="outline" 
                        size="sm"
                        disabled={loading || !data}
                    >
                        <Maximize2 className="mr-2 h-4 w-4" /> Abrir Todos
                    </Button>
                    <Button 
                        onClick={() => toggleAll(false)} 
                        variant="outline" 
                        size="sm"
                        disabled={loading || !data}
                    >
                        <Minimize2 className="mr-2 h-4 w-4" /> Cerrar Todos
                    </Button>
                    <Button 
                        onClick={handleExport} 
                        disabled={loading || !data}
                        className="shrink-0"
                    >
                        <Download className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            {data && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-primary/10 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1 text-primary text-sm font-medium">
                                <Briefcase className="w-4 h-4" /> Corredores
                            </div>
                            <div className="text-2xl font-bold text-foreground">{data.kpis.totalTraders}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/10 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1 text-primary text-sm font-medium">
                                <Users className="w-4 h-4" /> Clientes
                            </div>
                            <div className="text-2xl font-bold text-foreground">{data.kpis.totalClients}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/10 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1 text-primary text-sm font-medium">
                                <DollarSign className="w-4 h-4" /> Volumen Total
                            </div>
                            <div className="text-2xl font-bold text-foreground">{formatCurrency(data.kpis.totalVolume)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/10 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1 text-primary text-sm font-medium">
                                <Percent className="w-4 h-4" /> Margen Promedio
                            </div>
                            <div className="text-2xl font-bold text-foreground">{formatMargin(data.kpis.avgMargin)}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 gap-4 items-end md:grid-cols-5">
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
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Ruedas</label>
                            <MultiSelect 
                                options={availableRuedas}
                                selected={selectedRuedas}
                                onChange={setSelectedRuedas}
                                placeholder="Todas las ruedas"
                            />
                        </div>

                        {user?.role === 'admin' && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Grupos</label>
                            <select 
                                className="w-full bg-background border border-input rounded-md shadow-sm p-2 text-sm focus:ring-primary focus:border-primary"
                                value={withGroups ? "true" : "false"}
                                onChange={(e) => setWithGroups(e.target.value === "true")}
                            >
                                <option value="true">Con Grupos</option>
                                <option value="false">Sin Grupos</option>
                            </select>
                        </div>
                        )}

                        <div className="flex justify-end">
                            <Button onClick={fetchData} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
                                Aplicar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
                        <p>Generando reporte...</p>
                    </div>
                ) : !data || data.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        <Search className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-medium">No se encontraron datos</p>
                        <p className="text-sm">Intenta ajustar los filtros para ver resultados</p>
                    </div>
                ) : (
                    data.data.map((trader) => (
                        <div key={trader.corredor} className="border rounded-lg overflow-hidden shadow-sm bg-card text-card-foreground">
                             {/* Trader Bar */}
                            <div 
                                className="bg-muted/50 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer hover:bg-muted/70 transition-colors gap-2"
                                onClick={() => toggleTrader(trader.corredor)}
                            >
                                <div className="flex items-center gap-2 font-semibold uppercase text-foreground">
                                    {expandedTraders.includes(trader.corredor) ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                                    {trader.corredor}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs">
                                    <span className="bg-background border px-2 py-1 rounded flex items-center gap-1 text-muted-foreground">
                                        <Users className="w-3 h-3" /> {trader.clientCount} clientes
                                    </span>
                                    <span className="bg-background border px-2 py-1 rounded font-mono font-medium text-primary">
                                        {formatCurrency(trader.totalVolume)}
                                    </span>
                                    <span className="bg-background border px-2 py-1 rounded font-mono text-muted-foreground">
                                        {formatMargin(trader.avgMargin)}
                                    </span>
                                </div>
                            </div>

                            {/* Wheels List */}
                            {expandedTraders.includes(trader.corredor) && (
                                <div className="p-2 space-y-2 bg-muted/10">
                                    {trader.wheels.map(wheel => (
                                        <div key={wheel.ruedaNo} className="border rounded bg-background">
                                            {/* Wheel Header */}
                                            <div 
                                                className="p-2 flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors"
                                                onClick={() => toggleWheel(`${trader.corredor}-${wheel.ruedaNo}`)}
                                            >
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    {expandedWheels.includes(`${trader.corredor}-${wheel.ruedaNo}`) 
                                                        ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> 
                                                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                    }
                                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">
                                                        Rueda {wheel.ruedaNo}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> {wheel.fecha}
                                                    </span>
                                                </div>
                                                <div className="text-xs font-mono font-medium">
                                                    {formatCurrency(wheel.volume)}
                                                </div>
                                            </div>

                                            {/* Clients Table */}
                                            {expandedWheels.includes(`${trader.corredor}-${wheel.ruedaNo}`) && (
                                                <div className="border-t">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                                                            <tr>
                                                                <th className="p-2">Cliente</th>
                                                                <th className="p-2 text-right">Volumen</th>
                                                                <th className="p-2 text-right">Comisión</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border">
                                                            {wheel.clients.map((client, idx) => (
                                                                <tr key={idx} className="hover:bg-muted/20">
                                                                    <td className="p-2 font-medium">{client.name}</td>
                                                                    <td className="p-2 text-right font-mono text-muted-foreground">
                                                                        {formatCurrency(client.volume)}
                                                                    </td>
                                                                    <td className="p-2 text-right font-mono text-green-600/80">
                                                                        {formatCurrency(client.commission)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
