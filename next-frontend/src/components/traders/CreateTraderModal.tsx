'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { createTrader } from '@/services/traders.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface CreateTraderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateTraderModal({ open, onOpenChange, onCreated }: CreateTraderModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    porcentajeComision: '0.0000',
    activo: true,
  });

  const resetForm = () => {
    setFormData({ nombre: '', nit: '', porcentajeComision: '0.0000', activo: true });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createTrader(session?.user?.accessToken as string, formData);
      resetForm();
      onCreated();
      onOpenChange(false);
    } catch {
      setError('Error al crear trader. Verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent onClose={() => { resetForm(); onOpenChange(false); }} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Trader</DialogTitle>
          <DialogDescription>Ingresa los datos del nuevo corredor.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2.5 text-sm">
                {error}
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="create-nombre">Nombre Completo</Label>
              <Input
                id="create-nombre"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del trader"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="create-nit">NIT</Label>
                <Input
                  id="create-nit"
                  value={formData.nit}
                  onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                  placeholder="900123456"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="create-comision">Comision (%)</Label>
                <Input
                  id="create-comision"
                  type="number"
                  step="0.0001"
                  required
                  value={formData.porcentajeComision}
                  onChange={(e) => setFormData({ ...formData, porcentajeComision: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <input
                type="checkbox"
                id="create-activo"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              <Label htmlFor="create-activo" className="font-normal cursor-pointer">
                Trader activo
              </Label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando...</> : 'Crear Trader'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
