'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Trader } from '@/types/trader';
import { getTraders, deleteTrader } from '@/services/traders.service';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TradersPage() {
  const { data: session } = useSession();
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.accessToken) {
      loadTraders();
    }
  }, [session]);

  const loadTraders = async () => {
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
    if (!confirm('¿Estás seguro de eliminar este trader?')) return;
    
    try {
      await deleteTrader(session?.user?.accessToken as string, id);
      loadTraders();
    } catch (err) {
      alert('Error al eliminar trader');
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Traders</h1>
        <Link href="/dashboard/traders/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Trader
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Traders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nombre</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">NIT</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Comisión %</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {traders.map((trader) => (
                  <tr key={trader.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle">{trader.id}</td>
                    <td className="p-4 align-middle font-medium">{trader.nombre}</td>
                    <td className="p-4 align-middle">{trader.nit || '-'}</td>
                    <td className="p-4 align-middle">{trader.porcentajeComision}%</td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        trader.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trader.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/traders/${trader.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(trader.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {traders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      No hay traders registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
