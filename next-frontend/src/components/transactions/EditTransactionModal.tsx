'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getTransaction, updateTransaction } from '@/services/transactions.service';
import { UpdateTransactionDto } from '@/types/transaction';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, DollarSign } from 'lucide-react';

interface EditTransactionModalProps {
  transactionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditTransactionModal({ transactionId, open, onOpenChange, onSaved }: EditTransactionModalProps) {
  const { data: session } = useSession();
  const [tab, setTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<UpdateTransactionDto>>({});

  useEffect(() => {
    if (open && transactionId && session?.user?.accessToken) {
      setTab('info');
      setError('');
      loadTransaction();
    }
  }, [open, transactionId, session]);

  const loadTransaction = async () => {
    setLoading(true);
    try {
      const tx = await getTransaction(session?.user?.accessToken as string, transactionId!);
      const formattedDate = tx.fecha ? new Date(tx.fecha).toISOString().split('T')[0] : '';
      setFormData({
        ...tx,
        fecha: formattedDate,
        ruedaNo: tx.ruedaNo,
        negociado: String(tx.negociado),
        comiCorr: String(tx.comiCorr),
        comiBna: String(tx.comiBna),
        ivaComi: String(tx.ivaComi),
        ivaBna: String(tx.ivaBna),
        facturado: String(tx.facturado),
      });
    } catch {
      setError('Error al cargar operacion');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    // Strip "modal-" prefix from field IDs
    const field = id.replace('modal-', '');
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const date = new Date(formData.fecha!);
      const year = date.getFullYear();
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const mes = monthNames[date.getMonth()];
      const dataToSend: UpdateTransactionDto = {
        ...formData,
        year,
        mes,
        ruedaNo: Number(formData.ruedaNo),
      };
      await updateTransaction(session?.user?.accessToken as string, transactionId!, dataToSend);
      onSaved();
      onOpenChange(false);
    } catch {
      setError('Error al actualizar operacion. Verifique los datos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Operacion</DialogTitle>
          <DialogDescription>Modifica los datos de la operacion ORFS.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-6">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="info">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Informacion
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="adiciones">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      Valores Financieros
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {error && (
              <div className="mx-6 mt-3 rounded-lg bg-destructive/10 text-destructive px-4 py-2.5 text-sm">
                {error}
              </div>
            )}

            {tab === 'info' && (
              <DialogBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-fecha">Fecha</Label>
                    <Input id="modal-fecha" type="date" required value={formData.fecha || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-ruedaNo">Rueda No.</Label>
                    <Input id="modal-ruedaNo" type="number" required value={formData.ruedaNo || ''} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-nit">NIT Cliente</Label>
                    <Input id="modal-nit" required value={formData.nit || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-nombre">Nombre Cliente</Label>
                    <Input id="modal-nombre" required value={formData.nombre || ''} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-corredor">Corredor</Label>
                    <Input id="modal-corredor" required value={formData.corredor || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-ciudad">Ciudad</Label>
                    <Input id="modal-ciudad" value={formData.ciudad || ''} onChange={handleInputChange} />
                  </div>
                </div>
              </DialogBody>
            )}

            {tab === 'adiciones' && (
              <DialogBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-negociado">Valor Negociado</Label>
                    <Input id="modal-negociado" type="number" step="0.01" value={formData.negociado || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-facturado">Total Facturado</Label>
                    <Input id="modal-facturado" type="number" step="0.01" value={formData.facturado || ''} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-comiCorr">Comision Corredor</Label>
                    <Input id="modal-comiCorr" type="number" step="0.01" value={formData.comiCorr || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-comiBna">Comision BNA</Label>
                    <Input id="modal-comiBna" type="number" step="0.01" value={formData.comiBna || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-comiPorcentual">Comision %</Label>
                    <Input id="modal-comiPorcentual" type="text" value={formData.comiPorcentual || ''} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-ivaComi">IVA Comision</Label>
                    <Input id="modal-ivaComi" type="number" step="0.01" value={formData.ivaComi || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-ivaBna">IVA BNA</Label>
                    <Input id="modal-ivaBna" type="number" step="0.01" value={formData.ivaBna || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="modal-ivaCama">IVA Cama</Label>
                    <Input id="modal-ivaCama" type="number" step="0.01" value={formData.ivaCama || ''} onChange={handleInputChange} />
                  </div>
                </div>
              </DialogBody>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</> : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
