'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getUser, updateUser } from '@/services/users.service';
import { UserRole, UpdateUserDto } from '@/types/user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, User as UserIcon, Lock, Loader2 } from 'lucide-react';

interface EditUserModalProps {
  userId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditUserModal({ userId, open, onOpenChange, onSaved }: EditUserModalProps) {
  const { data: session } = useSession();
  const [tab, setTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'guest' as UserRole,
    traderName: '',
    activo: true
  });

  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open && userId && session?.user?.accessToken) {
      setTab('info');
      setError('');
      setPassword('');
      loadUser();
    }
  }, [open, userId, session]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const token = session?.user?.accessToken as string;
      const user = await getUser(token, userId!);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        traderName: user.traderName || '',
        activo: user.activo
      });
    } catch {
      setError('Error al cargar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const updateData: UpdateUserDto = { ...formData };
      if (password) {
        updateData.password = password;
      }

      await updateUser(session?.user?.accessToken as string, userId!, updateData);
      onSaved();
      onOpenChange(false);
    } catch {
      setError('Error al actualizar usuario. Verifique los datos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica la información del usuario y sus permisos.
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
                      <UserIcon className="h-3.5 w-3.5" />
                      Información
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <span className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      Seguridad
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <form onSubmit={handleSubmit}>
              <DialogBody className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2.5 text-sm">
                    {error}
                  </div>
                )}

                {tab === 'info' && (
                  <>
                    <div className="grid gap-1.5">
                      <Label htmlFor="edit-name">Nombre Completo</Label>
                      <Input
                        id="edit-name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="edit-role">Rol</Label>
                      <select
                        id="edit-role"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      >
                        <option value="guest">Invitado</option>
                        <option value="trader">Trader</option>
                        <option value="business_intelligence">Business Intelligence</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>

                    {formData.role === 'trader' && (
                      <div className="grid gap-1.5">
                        <Label htmlFor="edit-traderName">Nombre de Trader</Label>
                        <Input
                          id="edit-traderName"
                          value={formData.traderName}
                          onChange={(e) => setFormData({ ...formData, traderName: e.target.value })}
                          placeholder="Nombre usado en reportes"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <input
                        type="checkbox"
                        id="edit-activo"
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      />
                      <Label htmlFor="edit-activo" className="font-normal cursor-pointer">
                        Usuario activo
                      </Label>
                    </div>
                  </>
                )}

                {tab === 'security' && (
                  <div className="space-y-4 py-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="edit-password">Nueva Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="edit-password"
                          type={showPassword ? "text" : "password"}
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Dejar en blanco para mantener actual"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Solo ingresa un valor si deseas cambiar la contraseña del usuario.
                      </p>
                    </div>
                  </div>
                )}
              </DialogBody>
              <div className="flex justify-end gap-3 p-6 pt-2">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
