'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTransactions, deleteTransaction, getDailySummary, getRuedasSummary } from '@/services/transactions.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash } from 'lucide-react';
import Link from 'next/link';
import { Transaction } from '@/types/transaction';

export default function TransactionsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [dailySummary, setDailySummary] = useState<any[]>([]);
    const [ruedasSummary, setRuedasSummary] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [tab, setTab] = useState('list'); // list, daily, ruedas

    useEffect(() => {
        if (session?.user?.accessToken) {
            loadData();
        }
    }, [session, year, tab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (tab === 'list') {
                const data = await getTransactions(session?.user?.accessToken as string, year);
                setTransactions(data);
            } else if (tab === 'daily') {
                const data = await getDailySummary(session?.user?.accessToken as string, year);
                setDailySummary(data);
            } else if (tab === 'ruedas') {
                const data = await getRuedasSummary(session?.user?.accessToken as string, year);
                setRuedasSummary(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Está seguro de eliminar esta transacción?')) return;
        try {
            await deleteTransaction(session?.user?.accessToken as string, id);
            loadData();
        } catch (error) {
            console.error(error);
            alert('Error al eliminar');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Transacciones ORFS</h1>
                <Link href="/dashboard/transactions/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Nueva Operación
                    </Button>
                </Link>
            </div>

            <div className="flex items-center space-x-4">
                <Button variant={tab === 'list' ? 'default' : 'outline'} onClick={() => setTab('list')}>
                    Lista General
                </Button>
                <Button variant={tab === 'daily' ? 'default' : 'outline'} onClick={() => setTab('daily')}>
                    Negociados Diario
                </Button>
                <Button variant={tab === 'ruedas' ? 'default' : 'outline'} onClick={() => setTab('ruedas')}>
                    Resumen Ruedas
                </Button>
                
                <div className="ml-auto flex items-center space-x-2">
                    <Label htmlFor="year">Año:</Label>
                    <Input 
                        id="year" 
                        type="number" 
                        value={year} 
                        onChange={(e) => setYear(+e.target.value)} 
                        className="w-24"
                    />
                </div>
            </div>

            {loading ? (
                <div>Cargando...</div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        {tab === 'list' && (
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-left">
                                        <tr className="border-b">
                                            <th className="p-4 font-medium">Fecha</th>
                                            <th className="p-4 font-medium">Rueda</th>
                                            <th className="p-4 font-medium">NIT</th>
                                            <th className="p-4 font-medium">Cliente</th>
                                            <th className="p-4 font-medium">Corredor</th>
                                            <th className="p-4 font-medium text-right">Negociado</th>
                                            <th className="p-4 font-medium text-right">Comisión</th>
                                            <th className="p-4 font-medium">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="border-b hover:bg-muted/50">
                                                <td className="p-4">{new Date(tx.fecha).toLocaleDateString()}</td>
                                                <td className="p-4">{tx.ruedaNo}</td>
                                                <td className="p-4">{tx.nit}</td>
                                                <td className="p-4">{tx.nombre}</td>
                                                <td className="p-4">{tx.corredor}</td>
                                                <td className="p-4 text-right">{Number(tx.negociado).toLocaleString()}</td>
                                                <td className="p-4 text-right">{Number(tx.comiBna).toLocaleString()}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <Link href={`/dashboard/transactions/${tx.id}/edit`}>
                                                            <Button variant="ghost" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(tx.id)}>
                                                            <Trash className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                                    No se encontraron transacciones para el año {year}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {tab === 'daily' && (
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-left">
                                        <tr className="border-b">
                                            <th className="p-4 font-medium">Fecha</th>
                                            <th className="p-4 font-medium text-right">Total Negociado</th>
                                            <th className="p-4 font-medium text-right">Cantidad Operaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailySummary.map((item, idx) => (
                                            <tr key={idx} className="border-b hover:bg-muted/50">
                                                <td className="p-4">{new Date(item.fecha).toLocaleDateString()}</td>
                                                <td className="p-4 text-right">{Number(item.totalNegociado).toLocaleString()}</td>
                                                <td className="p-4 text-right">{item.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {tab === 'ruedas' && (
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-left">
                                        <tr className="border-b">
                                            <th className="p-4 font-medium">Rueda No.</th>
                                            <th className="p-4 font-medium text-right">Total Negociado</th>
                                            <th className="p-4 font-medium text-right">Cantidad Operaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ruedasSummary.map((item, idx) => (
                                            <tr key={idx} className="border-b hover:bg-muted/50">
                                                <td className="p-4">{item.ruedaNo}</td>
                                                <td className="p-4 text-right">{Number(item.totalNegociado).toLocaleString()}</td>
                                                <td className="p-4 text-right">{item.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
