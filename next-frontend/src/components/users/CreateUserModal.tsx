'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { createUser } from '@/services/users.service';
import { UserRole } from '@/types/user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateUserModal({ open, onOpenChange, onCreated }: CreateUserModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest' as UserRole,
    traderName: '',
    activo: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'guest',
      traderName: '',
      activo: true
    });
    setError('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createUser(session?.user?.accessToken as string, formData);
      resetForm();
      onCreated();
      onOpenChange(false);
    } catch {
      setError('Error al crear usuario. Verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent onClose={() => { resetForm(); onOpenChange(false); }} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Usuario</DialogTitle>
          <DialogDescription>Ingresa los datos del nuevo usuario del sistema.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2.5 text-sm">
                {error}
              </div>
            )}
            
            <div className="grid gap-1.5">
              <Label htmlFor="create-name">Nombre Completo</Label>
              <Input
                id="create-name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del usuario"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="create-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="create-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="create-role">Rol</Label>
              <select
                id="create-role"
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
                <Label htmlFor="create-traderName">Nombre de Trader (para reportes)</Label>
                <Input
                  id="create-traderName"
                  value={formData.traderName}
                  onChange={(e) => setFormData({ ...formData, traderName: e.target.value })}
                  placeholder="Ej: LUIS FERNANDO VELEZ VELEZ"
                />
              </div>
            )}

            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <input
                type="checkbox"
                id="create-activo"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              <Label htmlFor="create-activo" className="cursor-pointer font-medium">Usuario Activo</Label>
            </div>
          </DialogBody>
          <div className="flex justify-end gap-3 p-6 pt-2">
            <Button variant="outline" type="button" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
