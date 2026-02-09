"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // For the legacy migration, we treat 'email' input as 'username' 
    // because the backend expects 'username' (e.g. 'admin')
    const username = email; 

    try {
      const result = await signIn("credentials", {
        username: username,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales inválidas. Intente con Usuario: admin, Contraseña: password");
      } else {
        router.push("/dashboard");
        router.refresh(); // Ensure session is updated
      }
    } catch (err) {
      setError("Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
             {/* Simple Logo Placeholder */}
            <svg
              className="h-6 w-6 text-emerald-600"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            ORFS Estadísticas
          </h1>
          <p className="text-sm text-gray-500">
            Ingresa a tu cuenta para continuar
          </p>
        </div>

        <Card className="border-gray-100 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle className="text-center text-lg">Bienvenido</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Usuario / Correo</Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="admin"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <a
                    href="#"
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="password"
                  required
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-500 font-medium text-center">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
          <div className="p-4 text-center text-xs text-gray-400">
             CORREAGRO S.A. © 2026
          </div>
        </Card>
      </div>
    </div>
  );
}
