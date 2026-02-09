"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Lock,
  UserCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

type ViewState = "login" | "request-code" | "reset-password" | "success";

export default function LoginPage() {
  const router = useRouter();

  // Login state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Recovery flow state
  const [view, setView] = useState<ViewState>("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        username: email,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Credenciales invalidas. Verifica tu usuario y contrasena."
        );
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Error al iniciar sesion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);

    try {
      const res = await fetch(`${API_URL}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetError(data.message || "Error al solicitar el codigo.");
        return;
      }

      // In development/demo, the API returns the code directly
      if (data.resetCode) {
        setGeneratedCode(data.resetCode);
      }

      setView("reset-password");
    } catch {
      setResetError("Error de conexion. Intenta de nuevo.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);

    if (newPassword !== confirmPassword) {
      setResetError("Las contrasenas no coinciden.");
      setResetLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setResetError("La contrasena debe tener al menos 6 caracteres.");
      setResetLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          token: resetCode,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetError(data.message || "Error al restablecer la contrasena.");
        return;
      }

      setView("success");
    } catch {
      setResetError("Error de conexion. Intenta de nuevo.");
    } finally {
      setResetLoading(false);
    }
  }

  function resetRecoveryState() {
    setView("login");
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError(null);
    setResetLoading(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setGeneratedCode(null);
  }

  function renderRightPanel() {
    switch (view) {
      case "login":
        return (
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile Logo */}
            <div className="flex flex-col items-center space-y-4 lg:hidden">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
                alt="Correagro S.A."
                width={180}
                height={45}
              />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Iniciar Sesion
              </h1>
              <p className="text-sm text-muted-foreground">
                Ingresa tus credenciales para acceder al panel
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Usuario
                </Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="text"
                    placeholder="admin"
                    required
                    disabled={loading}
                    className="pl-10 h-11 bg-card border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Contrasena
                  </Label>
                  <button
                    type="button"
                    onClick={() => setView("request-code")}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Recuperar acceso
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Contrasena"
                    required
                    disabled={loading}
                    className="pl-10 pr-10 h-11 bg-card border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-sm text-destructive font-medium">
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Ingresar al Panel"
                )}
              </Button>
            </form>

            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                CORREAGRO S.A. - Comisionista No. 1 de la Bolsa Mercantil de
                Colombia
              </p>
            </div>
          </div>
        );

      case "request-code":
        return (
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile Logo */}
            <div className="flex flex-col items-center space-y-4 lg:hidden">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
                alt="Correagro S.A."
                width={180}
                height={45}
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={resetRecoveryState}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesion
              </button>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Recuperar acceso
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ingresa tu correo electronico o nombre de usuario para recibir
                  un codigo de verificacion.
                </p>
              </div>
            </div>

            <form onSubmit={handleRequestCode} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="reset-email"
                  className="text-sm font-medium text-foreground"
                >
                  Correo electronico o usuario
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="text"
                    placeholder="tu@correo.com o usuario"
                    required
                    disabled={resetLoading}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10 h-11 bg-card border-border"
                  />
                </div>
              </div>

              {resetError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-sm text-destructive font-medium">
                    {resetError}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando codigo...
                  </>
                ) : (
                  "Solicitar codigo"
                )}
              </Button>
            </form>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="h-2 w-8 rounded-full bg-primary" />
              <div className="h-2 w-8 rounded-full bg-muted" />
              <div className="h-2 w-8 rounded-full bg-muted" />
            </div>
          </div>
        );

      case "reset-password":
        return (
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile Logo */}
            <div className="flex flex-col items-center space-y-4 lg:hidden">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
                alt="Correagro S.A."
                width={180}
                height={45}
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setView("request-code");
                  setResetCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setResetError(null);
                  setGeneratedCode(null);
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <KeyRound className="h-5 w-5 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Nueva contrasena
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ingresa el codigo de verificacion y tu nueva contrasena.
                </p>
              </div>
            </div>

            {/* Show generated code in demo mode */}
            {generatedCode && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Codigo de verificacion
                    </p>
                    <p className="text-xs text-muted-foreground">
                      En produccion este codigo se enviaria por correo. Por
                      ahora, tu codigo es:
                    </p>
                    <p className="text-2xl font-bold tracking-[0.3em] text-primary font-mono">
                      {generatedCode}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="reset-code"
                  className="text-sm font-medium text-foreground"
                >
                  Codigo de verificacion
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-code"
                    type="text"
                    placeholder="Ej: A1B2C3"
                    required
                    disabled={resetLoading}
                    value={resetCode}
                    onChange={(e) =>
                      setResetCode(e.target.value.toUpperCase())
                    }
                    maxLength={6}
                    className="pl-10 h-11 bg-card border-border font-mono tracking-widest text-center uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-sm font-medium text-foreground"
                >
                  Nueva contrasena
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Minimo 6 caracteres"
                    required
                    minLength={6}
                    disabled={resetLoading}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-card border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showNewPassword
                        ? "Ocultar contrasena"
                        : "Mostrar contrasena"
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-foreground"
                >
                  Confirmar contrasena
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repetir contrasena"
                    required
                    minLength={6}
                    disabled={resetLoading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-card border-border"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar contrasena"
                        : "Mostrar contrasena"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {resetError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-sm text-destructive font-medium">
                    {resetError}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Restablecer contrasena"
                )}
              </Button>
            </form>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="h-2 w-8 rounded-full bg-primary" />
              <div className="h-2 w-8 rounded-full bg-primary" />
              <div className="h-2 w-8 rounded-full bg-muted" />
            </div>
          </div>
        );

      case "success":
        return (
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile Logo */}
            <div className="flex flex-col items-center space-y-4 lg:hidden">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
                alt="Correagro S.A."
                width={180}
                height={45}
              />
            </div>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Contrasena actualizada
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tu contrasena ha sido restablecida exitosamente. Ya puedes
                  iniciar sesion con tu nueva contrasena.
                </p>
              </div>
              <Button
                onClick={resetRecoveryState}
                className="w-full h-11 text-sm font-semibold"
              >
                Ir a iniciar sesion
              </Button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="h-2 w-8 rounded-full bg-primary" />
              <div className="h-2 w-8 rounded-full bg-primary" />
              <div className="h-2 w-8 rounded-full bg-primary" />
            </div>
          </div>
        );
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[hsl(150,10%,8%)] p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
            alt="Correagro S.A."
            width={220}
            height={55}
            className="brightness-0 invert"
          />
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold tracking-tight text-white text-balance leading-tight">
            Panel de Estadisticas y Reportes
          </h2>
          <p className="text-lg text-white/60 leading-relaxed max-w-md">
            La comisionista No. 1 de la Bolsa Mercantil de Colombia. Accede a
            datos en tiempo real, reportes detallados y analisis avanzados del
            mercado agropecuario.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-3xl font-bold text-primary">+500</div>
              <div className="text-sm text-white/40 mt-1">
                Operaciones diarias
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-white/40 mt-1">
                Monitoreo continuo
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-white/40 mt-1">Disponibilidad</div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/30">
            Vigilado por la Superintendencia Financiera de Colombia
          </p>
        </div>
      </div>

      {/* Right Panel - Dynamic Content */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 lg:p-12">
        {renderRightPanel()}
      </div>
    </div>
  );
}
