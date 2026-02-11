'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getTrader, updateTrader, getTraderAdicionales, addTraderAdicional, deleteTraderAdicional } from '@/services/traders.service';
import { Trader } from '@/types/trader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Loader2, User, Tag } from 'lucide-react';

interface EditTraderModalProps {
  traderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditTraderModal({ traderId, open, onOpenChange, onSaved }: EditTraderModalProps) {
  const { data: session } = useSession();
  const [tab, setTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    porcentajeComision: '0.0000',
    activo: true,
  });

  const [aliases, setAliases] = useState<{ id: number; nombreAdicional: string }[]>([]);
  const [newAlias, setNewAlias] = useState('');
  const [addingAlias, setAddingAlias] = useState(false);

  useEffect(() => {
    if (open && traderId && session?.user?.accessToken) {
      setTab('info');
      setError('');
      loadTrader();
    }
  }, [open, traderId, session]);

  const loadTrader = async () => {
    setLoading(true);
    try {
      const token = session?.user?.accessToken as string;
      const trader = await getTrader(token, traderId!);
      setFormData({
        nombre: trader.nombre,
        nit: trader.nit || '',
        porcentajeComision: trader.porcentajeComision || '0.0000',
        activo: trader.activo,
      });
      const extra = await getTraderAdicionales(token, traderId!);
      setAliases(extra);
    } catch {
      setError('Error al cargar trader');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateTrader(session?.user?.accessToken as string, traderId!, formData);
      onSaved();
      onOpenChange(false);
    } catch {
      setError('Error al actualizar trader. Verifique los datos.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAlias = async () => {
    if (!newAlias.trim()) return;
    setAddingAlias(true);
    try {
      const token = session?.user?.accessToken as string;
      await addTraderAdicional(token, traderId!, newAlias);
      setNewAlias('');
      const extra = await getTraderAdicionales(token, traderId!);
      setAliases(extra);
    } catch {
      setError('Error al agregar alias');
    } finally {
      setAddingAlias(false);
    }
  };

  const handleDeleteAlias = async (aliasId: number) => {
    try {
      const token = session?.user?.accessToken as string;
      await deleteTraderAdicional(token, aliasId);
      const extra = await getTraderAdicionales(token, traderId!);
      setAliases(extra);
    } catch {
      setError('Error al eliminar alias');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Trader</DialogTitle>
          <DialogDescription>
            Modifica la informacion del trader y sus nombres adicionales.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="px-6">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="info">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Informacion
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="adiciones">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      Adiciones
                      {aliases.length > 0 && (
                        <span className="ml-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                          {aliases.length}
                        </span>
                      )}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {error && (
              <div className="mx-6 rounded-lg bg-destructive/10 text-destructive px-4 py-2.5 text-sm">
                {error}
              </div>
            )}

            {tab === 'info' && (
              <form onSubmit={handleSubmit}>
                <DialogBody className="space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-nombre">Nombre Completo</Label>
                    <Input
                      id="edit-nombre"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="edit-nit">NIT</Label>
                      <Input
                        id="edit-nit"
                        value={formData.nit}
                        onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="edit-comision">Comision (%)</Label>
                      <Input
                        id="edit-comision"
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
                      id="edit-activo"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    />
                    <Label htmlFor="edit-activo" className="font-normal cursor-pointer">
                      Trader activo
                    </Label>
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</>
                    ) : 'Guardar Cambios'}
                  </Button>
                </DialogFooter>
              </form>
            )}

            {tab === 'adiciones' && (
              <>
                <DialogBody className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Nombres adicionales con los que este trader puede aparecer en los reportes.
                  </p>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Nuevo nombre adicional..."
                      value={newAlias}
                      onChange={(e) => setNewAlias(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAlias(); } }}
                    />
                    <Button type="button" onClick={handleAddAlias} disabled={addingAlias || !newAlias.trim()} size="sm" className="shrink-0">
                      {addingAlias ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[240px] overflow-y-auto scrollbar-thin">
                    {aliases.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Tag className="h-8 w-8 mb-2 opacity-40" />
                        <p className="text-sm">Sin nombres adicionales registrados</p>
                      </div>
                    ) : (
                      aliases.map((alias) => (
                        <div
                          key={alias.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5 group hover:bg-muted/40 transition-colors"
                        >
                          <span className="text-sm font-medium">{alias.nombreAdicional}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAlias(alias.id)}
                            className="rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cerrar
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
