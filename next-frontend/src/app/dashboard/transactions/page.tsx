'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { getTransactions, deleteTransaction, getDailySummary, getRuedasSummary } from '@/services/transactions.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EditTransactionModal } from '@/components/transactions/EditTransactionModal';
import {
  Plus,
  Edit,
  Trash,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  List,
  ArrowDownUp,
  FileBarChart,
} from 'lucide-react';
import Link from 'next/link';
import { Transaction } from '@/types/transaction';

const PAGE_SIZE = 15;

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailySummary, setDailySummary] = useState<any[]>([]);
  const [ruedasSummary, setRuedasSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [tab, setTab] = useState('list');

  // Filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Edit modal
  const [editId, setEditId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    if (!confirm('Estas seguro de eliminar esta operacion?')) return;
    setDeletingId(id);
    try {
      await deleteTransaction(session?.user?.accessToken as string, id);
      loadData();
    } catch {
      alert('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered + paginated
  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.nombre.toLowerCase().includes(q) ||
        tx.nit.toLowerCase().includes(q) ||
        tx.corredor.toLowerCase().includes(q) ||
        (tx.ciudad && tx.ciudad.toLowerCase().includes(q))
    );
  }, [transactions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, tab]);

  const tabs = [
    { id: 'list', label: 'Lista General', icon: List },
    { id: 'daily', label: 'Negociados Diario', icon: Calendar },
    { id: 'ruedas', label: 'Resumen Ruedas', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operaciones ORFS</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historico de operaciones de la Bolsa Mercantil
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
            <Label htmlFor="year" className="text-xs text-muted-foreground shrink-0">Ano:</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="h-7 w-20 border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0"
            />
          </div>
          <Link href="/dashboard/transactions/create">
            <Button className="shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Nueva Operacion
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Search (only for list) */}
      {tab === 'list' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, NIT, corredor o ciudad..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileBarChart className="h-4 w-4" />
                <span>{filtered.length} registros</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* LIST TAB */}
              {tab === 'list' && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rueda</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">NIT</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Corredor</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Negociado</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Comision</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((tx) => (
                          <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                {new Date(tx.fecha).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.ruedaNo}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.nit}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{tx.nombre}</td>
                            <td className="px-4 py-3 text-muted-foreground">{tx.corredor}</td>
                            <td className="px-4 py-3 text-right font-mono text-sm">
                              ${Number(tx.negociado).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm text-primary font-medium">
                              ${Number(tx.comiBna).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => { setEditId(tx.id); setEditOpen(true); }}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(tx.id)}
                                  disabled={deletingId === tx.id}
                                >
                                  {deletingId === tx.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash className="h-3.5 w-3.5" />
                                  )}
                                  <span className="sr-only">Eliminar</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {paginated.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center text-muted-foreground">
                                <ArrowDownUp className="h-10 w-10 mb-3 opacity-30" />
                                <p className="font-medium">No se encontraron operaciones</p>
                                <p className="text-xs mt-1">para el ano {year}</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filtered.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between border-t px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                          return start + i;
                        }).map((p) => (
                          <Button
                            key={p}
                            variant={p === page ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0 text-xs"
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </Button>
                        ))}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* DAILY TAB */}
              {tab === 'daily' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Negociado</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cantidad de Operaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySummary.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                              {new Date(item.fecha).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                            ${Number(item.totalNegociado).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
                              {item.count}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {dailySummary.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                            Sin datos para el ano {year}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RUEDAS TAB */}
              {tab === 'ruedas' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rueda No.</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Negociado</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cantidad de Operaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ruedasSummary.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium">{item.ruedaNo}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                            ${Number(item.totalNegociado).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
                              {item.count}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {ruedasSummary.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                            Sin datos para el ano {year}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditTransactionModal
        transactionId={editId}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={loadData}
      />
    </div>
  );
}
