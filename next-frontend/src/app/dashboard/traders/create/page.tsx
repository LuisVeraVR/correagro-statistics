'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createTrader } from '@/services/traders.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateTraderPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    porcentajeComision: '0.0000',
    activo: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createTrader(session?.user?.accessToken as string, formData);
      router.push('/dashboard/traders');
      router.refresh();
    } catch (err) {
      setError('Error al crear trader. Verifique los datos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/traders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Crear Nuevo Trader</h1>
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
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Trader'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
