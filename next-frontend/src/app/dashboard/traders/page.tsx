'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Trader } from '@/types/trader';
import { getTraders, deleteTrader } from '@/services/traders.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { EditTraderModal } from '@/components/traders/EditTraderModal';
import { CreateTraderModal } from '@/components/traders/CreateTraderModal';
import {
  Plus,
  Edit,
  Trash,
  Search,
  Users,
  UserCheck,
  UserX,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PAGE_SIZE = 12;

export default function TradersPage() {
  const { data: session } = useSession();
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  // Modals
  const [editId, setEditId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user?.accessToken) {
      loadTraders();
    }
  }, [session]);

  const loadTraders = async () => {
    setLoading(true);
    try {
      const data = await getTraders(session?.user?.accessToken as string);
      setTraders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Estas seguro de eliminar este trader?')) return;
    setDeletingId(id);
    try {
      await deleteTrader(session?.user?.accessToken as string, id);
      loadTraders();
    } catch {
      alert('Error al eliminar trader');
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (id: number) => {
    setEditId(id);
    setEditOpen(true);
  };

  // Filtered + paginated data
  const filtered = useMemo(() => {
    let result = traders;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.nombre.toLowerCase().includes(q) ||
          (t.nit && t.nit.toLowerCase().includes(q))
      );
    }
    if (statusFilter === 'active') result = result.filter((t) => t.activo);
    if (statusFilter === 'inactive') result = result.filter((t) => !t.activo);
    return result;
  }, [traders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  // Stats
  const activeCount = traders.filter((t) => t.activo).length;
  const inactiveCount = traders.filter((t) => !t.activo).length;

  return (
    <div className="space-y-6 min-h-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion de Traders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra los corredores y sus configuraciones
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Trader
        </Button>
      </div>

      {/* Stats + Search row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:shadow-sm h-[76px] ${
            statusFilter === 'all' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card'
          }`}
        >
          <div className={`rounded-lg p-2.5 shrink-0 ${statusFilter === 'all' ? 'bg-primary/10' : 'bg-muted'}`}>
            <Users className={`h-5 w-5 ${statusFilter === 'all' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-foreground">{traders.length}</p>
            <p className="text-xs text-muted-foreground">Total Traders</p>
          </div>
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:shadow-sm h-[76px] ${
            statusFilter === 'active' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card'
          }`}
        >
          <div className={`rounded-lg p-2.5 shrink-0 ${statusFilter === 'active' ? 'bg-primary/10' : 'bg-muted'}`}>
            <UserCheck className={`h-5 w-5 ${statusFilter === 'active' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Activos</p>
          </div>
        </button>
        <button
          onClick={() => setStatusFilter('inactive')}
          className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:shadow-sm h-[76px] ${
            statusFilter === 'inactive' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card'
          }`}
        >
          <div className={`rounded-lg p-2.5 shrink-0 ${statusFilter === 'inactive' ? 'bg-primary/10' : 'bg-muted'}`}>
            <UserX className={`h-5 w-5 ${statusFilter === 'inactive' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-foreground">{inactiveCount}</p>
            <p className="text-xs text-muted-foreground">Inactivos</p>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o NIT..."
          className="pl-10 h-10 bg-card border-border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="min-h-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">NIT</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Comision</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((trader) => (
                      <tr
                        key={trader.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                              {trader.nombre.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground">{trader.nombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">
                          {trader.nit || '--'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                            {trader.porcentajeComision}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              trader.activo
                                ? 'bg-primary/10 text-primary'
                                : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${trader.activo ? 'bg-primary' : 'bg-destructive'}`} />
                            {trader.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEdit(trader.id)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(trader.id)}
                              disabled={deletingId === trader.id}
                            >
                              {deletingId === trader.id ? (
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
                        <td colSpan={5} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Users className="h-10 w-10 mb-3 opacity-30" />
                            <p className="font-medium">No se encontraron traders</p>
                            <p className="text-xs mt-1">Intenta ajustar los filtros de busqueda</p>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <EditTraderModal
        traderId={editId}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={loadTraders}
      />
      <CreateTraderModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={loadTraders}
      />
    </div>
  );
}
