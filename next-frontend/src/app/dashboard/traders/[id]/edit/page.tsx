'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getTrader, updateTrader, getTraderAdicionales, addTraderAdicional, deleteTraderAdicional } from '@/services/traders.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function EditTraderPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    porcentajeComision: '0.0000',
    activo: true
  });

  // Aliases state
  const [aliases, setAliases] = useState<{ id: number, nombreAdicional: string }[]>([]);
  const [newAlias, setNewAlias] = useState('');

  useEffect(() => {
    if (session?.user?.accessToken && params.id) {
        loadTrader();
    }
  }, [session, params.id]);

  const loadTrader = async () => {
    try {
        const token = session?.user?.accessToken as string;
        const traderId = +params.id;

        const trader = await getTrader(token, traderId);
        setFormData({
            nombre: trader.nombre,
            nit: trader.nit || '',
            porcentajeComision: trader.porcentajeComision || '0.0000',
            activo: trader.activo
        });

        // Load aliases
        const extra = await getTraderAdicionales(token, traderId);
        setAliases(extra);

    } catch (err) {
        setError('Error al cargar trader');
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleAddAlias = async () => {
    if (!newAlias.trim()) return;
    try {
        const token = session?.user?.accessToken as string;
        await addTraderAdicional(token, +params.id, newAlias);
        setNewAlias('');
        // Refresh
        const extra = await getTraderAdicionales(token, +params.id);
        setAliases(extra);
    } catch (err) {
        console.error(err);
        alert('Error al agregar alias');
    }
  };

  const handleDeleteAlias = async (aliasId: number) => {
    if (!confirm('¿Eliminar este alias?')) return;
    try {
        const token = session?.user?.accessToken as string;
        await deleteTraderAdicional(token, aliasId);
        // Refresh
        const extra = await getTraderAdicionales(token, +params.id);
        setAliases(extra);
    } catch (err) {
        console.error(err);
        alert('Error al eliminar alias');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await updateTrader(session?.user?.accessToken as string, +params.id, formData);
      router.push('/dashboard/traders');
      router.refresh();
    } catch (err) {
      setError('Error al actualizar trader. Verifique los datos.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/traders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Editar Trader</h1>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Detalles del Trader</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nit">NIT</Label>
              <Input
                id="nit"
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="porcentajeComision">Porcentaje Comisión (%)</Label>
              <Input
                id="porcentajeComision"
                type="number"
                step="0.0001"
                required
                value={formData.porcentajeComision}
                onChange={(e) => setFormData({ ...formData, porcentajeComision: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              <Label htmlFor="activo">Trader Activo</Label>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/traders">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Aliases Section */}
      <Card>
        <CardHeader>
            <CardTitle>Nombres Adicionales (Alias)</CardTitle>
            <CardDescription>
                Agrega otros nombres con los que este trader puede aparecer en los reportes (ej. "NOMBRE - SUBASTA").
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-2">
                <Input 
                    placeholder="Nuevo alias..." 
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                />
                <Button type="button" onClick={handleAddAlias} variant="secondary">
                    <Plus className="h-4 w-4 mr-2" /> Agregar
                </Button>
            </div>

            <div className="space-y-2 border rounded-md p-2 bg-gray-50 max-h-[200px] overflow-y-auto">
                {aliases.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Sin alias registrados.</p>}
                {aliases.map((alias) => (
                    <div key={alias.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                        <span className="text-sm font-medium">{alias.nombreAdicional}</span>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteAlias(alias.id)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
