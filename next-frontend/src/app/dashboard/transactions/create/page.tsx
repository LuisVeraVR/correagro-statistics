'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createTransaction } from '@/services/transactions.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CreateTransactionDto } from '@/types/transaction';

export default function CreateTransactionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<Partial<CreateTransactionDto>>({
    fecha: new Date().toISOString().split('T')[0],
    nit: '',
    nombre: '',
    corredor: '',
    ruedaNo: 0,
    negociado: '0',
    comiCorr: '0',
    comiBna: '0',
    ivaComi: '0',
    ivaBna: '0',
    facturado: '0',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const date = new Date(formData.fecha!);
      const year = date.getFullYear();
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      const mes = monthNames[date.getMonth()];

      const dataToSend: CreateTransactionDto = {
        ...formData as CreateTransactionDto,
        year,
        mes,
        ruedaNo: Number(formData.ruedaNo),
      };

      await createTransaction(session?.user?.accessToken as string, dataToSend);
      router.push('/dashboard/transactions');
      router.refresh();
    } catch (err) {
      setError('Error al crear transacción. Verifique los datos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/transactions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Nueva Operación ORFS</h1>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Detalles de la Operación</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input id="fecha" type="date" required value={formData.fecha} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="ruedaNo">Rueda No.</Label>
                    <Input id="ruedaNo" type="number" required value={formData.ruedaNo} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="nit">NIT Cliente</Label>
                    <Input id="nit" required value={formData.nit} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre Cliente</Label>
                    <Input id="nombre" required value={formData.nombre} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="corredor">Corredor</Label>
                    <Input id="corredor" required value={formData.corredor} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input id="ciudad" value={formData.ciudad || ''} onChange={handleInputChange} />
                </div>
            </div>

            <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Valores Financieros</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="negociado">Valor Negociado</Label>
                        <Input id="negociado" type="number" step="0.01" value={formData.negociado} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="comiCorr">Comisión Corredor</Label>
                        <Input id="comiCorr" type="number" step="0.01" value={formData.comiCorr} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="comiBna">Comisión BNA</Label>
                        <Input id="comiBna" type="number" step="0.01" value={formData.comiBna} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="ivaComi">IVA Comisión</Label>
                        <Input id="ivaComi" type="number" step="0.01" value={formData.ivaComi} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="ivaBna">IVA BNA</Label>
                        <Input id="ivaBna" type="number" step="0.01" value={formData.ivaBna} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="facturado">Total Facturado</Label>
                        <Input id="facturado" type="number" step="0.01" value={formData.facturado} onChange={handleInputChange} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/transactions">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Operación'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
