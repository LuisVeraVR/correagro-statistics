'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getUser, updateUser } from '@/services/users.service';
import { UserRole, UpdateUserDto } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<UpdateUserDto>({
    name: '',
    email: '',
    password: '',
    role: 'guest',
    traderName: '',
    activo: true
  });

  useEffect(() => {
    if (session?.user?.accessToken && params.id) {
        loadUser();
    }
  }, [session, params.id]);

  const loadUser = async () => {
    try {
        const user = await getUser(session?.user?.accessToken as string, +params.id);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // No cargamos password
            role: user.role,
            traderName: user.traderName || '',
            activo: user.activo
        });
    } catch (err) {
        setError('Error al cargar usuario');
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const dataToSend = { ...formData };
      if (!dataToSend.password) delete dataToSend.password; // Solo enviar si cambió

      await updateUser(session?.user?.accessToken as string, +params.id, dataToSend);
      router.push('/dashboard/users');
      router.refresh();
    } catch (err) {
      setError('Error al actualizar usuario. Verifique los datos.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Editar Usuario</h1>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Detalles del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña (Dejar en blanco para mantener actual)</Label>
              <Input
                id="password"
                type="password"
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
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
              <div className="grid gap-2">
                <Label htmlFor="traderName">Nombre de Trader (para reportes)</Label>
                <Input
                  id="traderName"
                  value={formData.traderName}
                  onChange={(e) => setFormData({ ...formData, traderName: e.target.value })}
                  placeholder="Ej: LUIS FERNANDO VELEZ VELEZ"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              <Label htmlFor="activo">Usuario Activo</Label>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/users">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
