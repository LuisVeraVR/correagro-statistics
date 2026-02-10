"use client";

import { useState, useCallback } from "react";
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
  const [errorKey, setErrorKey] = useState(0);

  // Recovery flow state
  const [view, setView] = useState<ViewState>("login");
  const [viewKey, setViewKey] = useState(0);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetErrorKey, setResetErrorKey] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const changeView = useCallback((newView: ViewState) => {
    setView(newView);
    setViewKey((k) => k + 1);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      console.log("[v0] Attempting signIn with username:", email);
      const result = await signIn("credentials", {
        username: email,
        password: password,
        redirect: false,
      });
      console.log("[v0] signIn result:", JSON.stringify(result));

      if (result?.error) {
        console.log("[v0] signIn error:", result.error, "status:", result.status);
        setError(
          "Credenciales invalidas. Verifica tu usuario y contrasena."
        );
        setErrorKey((k) => k + 1);
      } else if (result?.ok) {
        console.log("[v0] signIn success, redirecting to dashboard");
        router.push("/dashboard");
        router.refresh();
      } else if (result?.url) {
        // NextAuth v5 beta sometimes returns url on success
        console.log("[v0] signIn returned url:", result.url);
        router.push("/dashboard");
        router.refresh();
      } else {
        console.log("[v0] signIn returned unexpected result:", result);
        setError("Error inesperado al iniciar sesion.");
        setErrorKey((k) => k + 1);
      }
    } catch (err: any) {
      console.log("[v0] signIn caught exception:", err?.message || err, "type:", err?.type || err?.name);
      // NextAuth v5 beta throws CredentialsSignin error instead of returning it
      if (err?.message?.includes("CredentialsSignin") || err?.type === "CredentialsSignin") {
        setError("Credenciales invalidas. Verifica tu usuario y contrasena.");
      } else {
        setError("Error al iniciar sesion. Verifica tus credenciales.");
      }
      setErrorKey((k) => k + 1);
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
        setResetErrorKey((k) => k + 1);
        return;
      }

      if (data.resetCode) {
        setGeneratedCode(data.resetCode);
      }

      changeView("reset-password");
    } catch {
      setResetError("Error de conexion. Intenta de nuevo.");
      setResetErrorKey((k) => k + 1);
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
      setResetErrorKey((k) => k + 1);
      setResetLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setResetError("La contrasena debe tener al menos 6 caracteres.");
      setResetErrorKey((k) => k + 1);
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
        setResetErrorKey((k) => k + 1);
        return;
      }

      changeView("success");
    } catch {
      setResetError("Error de conexion. Intenta de nuevo.");
      setResetErrorKey((k) => k + 1);
    } finally {
      setResetLoading(false);
    }
  }

  function resetRecoveryState() {
    changeView("login");
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

  function renderStepIndicator(activeSteps: number) {
    return (
      <div className="flex items-center justify-center gap-2 pt-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              step <= activeSteps
                ? "w-8 bg-primary"
                : "w-8 bg-muted"
            } ${step === activeSteps ? "animate-step-dot-pulse" : ""}`}
          />
        ))}
      </div>
    );
  }

  function renderRightPanel() {
    switch (view) {
      case "login":
        return (
          <div key={`login-${viewKey}`} className="w-full max-w-sm space-y-8">
            {/* Mobile Logo */}
            <div className="flex flex-col items-center space-y-4 lg:hidden animate-fade-slide-up">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
                alt="Correagro S.A."
                width={180}
                height={45}
              />
            </div>

            <div className="space-y-2 animate-fade-slide-up stagger-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Iniciar Sesion
              </h1>
              <p className="text-sm text-muted-foreground">
                Ingresa tus credenciales para acceder al panel
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2 animate-fade-slide-up stagger-2">
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
                    className="pl-10 h-11 bg-card border-border transition-shadow duration-300 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                  />
                </div>
              </div>

              <div className="space-y-2 animate-fade-slide-up stagger-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Contrasena
                  </Label>
                  <button
                    type="button"
                    onClick={() => changeView("request-code")}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors duration-200"
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
                    className="pl-10 pr-10 h-11 bg-card border-border transition-shadow duration-300 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
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
                <div
                  key={errorKey}
                  className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 animate-error-shake"
                >
                  <p className="text-sm text-destructive font-medium">
                    {error}
                  </p>
                </div>
              )}

              <div className="animate-fade-slide-up stagger-4">
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
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
              </div>
            </form>

            {/* Demo credentials hint */}
            <div className="animate-fade-in stagger-5">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground text-center mb-1.5">
                  Credenciales de demo
                </p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-xs font-mono text-foreground/70">
                    admin / admin123
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center animate-fade-in stagger-6">
              <p className="text-xs text-muted-foreground">
                CORREAGRO S.A. - Comisionista No. 1 de la Bolsa Mercantil de
                Colombia
              </p>
            </div>
          </div>
        );

      case "request-code":
        return (
          <div key={`request-${viewKey}`} className="w-full max-w-sm space-y-8">
            {/* Mobile Logo */}
            <div className="flex flex-col items-center space-y-4 lg:hidden animate-fade-slide-up">
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
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 animate-fade-slide-down"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesion
              </button>
              <div className="space-y-2 animate-fade-slide-up stagger-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 animate-scale-in">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Recuperar acceso
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground animate-fade-in stagger-2">
                  Ingresa tu correo electronico o nombre de usuario para recibir
                  un codigo de verificacion.
                </p>
              </div>
            </div>

            <form onSubmit={handleRequestCode} className="space-y-5">
              <div className="space-y-2 animate-fade-slide-up stagger-3">
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
                    autoFocus
                    className="pl-10 h-11 bg-card border-border transition-shadow duration-300 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                  />
                </div>
              </div>

              {resetError && (
                <div
                  key={resetErrorKey}
                  className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 animate-error-shake"
                >
                  <p className="text-sm text-destructive font-medium">
                    {resetError}
                  </p>
                </div>
              )}

              <div className="animate-fade-slide-up stagger-4">
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
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
              </div>
            </form>

            <div className="animate-fade-in stagger-5">
              {renderStepIndicator(1)}
            </div>
          </div>
        );

      case "reset-password":
        return (
          <div key={`reset-${viewKey}`} className="w-full max-w-sm space-y-8">
            {/* Mobile Logo */}
            <div className="flex flex-col items-center space-y-4 lg:hidden animate-fade-slide-up">
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
                  changeView("request-code");
                  setResetCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setResetError(null);
                  setGeneratedCode(null);
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 animate-fade-slide-down"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
              <div className="space-y-2 animate-fade-slide-up stagger-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 animate-scale-in">
                    <KeyRound className="h-5 w-5 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Nueva contrasena
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground animate-fade-in stagger-2">
                  Ingresa el codigo de verificacion y tu nueva contrasena.
                </p>
              </div>
            </div>

            {/* Show generated code in demo mode */}
            {generatedCode && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 animate-scale-in stagger-2">
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
              <div className="space-y-2 animate-fade-slide-up stagger-3">
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
                    autoFocus
                    maxLength={6}
                    className="pl-10 h-11 bg-card border-border font-mono tracking-widest text-center uppercase transition-shadow duration-300 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                  />
                </div>
              </div>

              <div className="space-y-2 animate-fade-slide-up stagger-4">
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
                    className="pl-10 pr-10 h-11 bg-card border-border transition-shadow duration-300 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
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

              <div className="space-y-2 animate-fade-slide-up stagger-5">
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
                    className="pl-10 pr-10 h-11 bg-card border-border transition-shadow duration-300 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
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
                <div
                  key={resetErrorKey}
                  className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 animate-error-shake"
                >
                  <p className="text-sm text-destructive font-medium">
                    {resetError}
                  </p>
                </div>
              )}

              <div className="animate-fade-slide-up stagger-6">
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
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
              </div>
            </form>

            <div className="animate-fade-in stagger-6">
              {renderStepIndicator(2)}
            </div>
          </div>
        );

      case "success":
        return (
          <div key={`success-${viewKey}`} className="w-full max-w-sm space-y-8">
            {/* Mobile Logo */}
            <div className="flex flex-col items-center space-y-4 lg:hidden animate-fade-slide-up">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
                alt="Correagro S.A."
                width={180}
                height={45}
              />
            </div>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-success-pop">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2 animate-fade-slide-up stagger-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Contrasena actualizada
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tu contrasena ha sido restablecida exitosamente. Ya puedes
                  iniciar sesion con tu nueva contrasena.
                </p>
              </div>
              <div className="w-full animate-fade-slide-up stagger-3">
                <Button
                  onClick={resetRecoveryState}
                  className="w-full h-11 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                >
                  Ir a iniciar sesion
                </Button>
              </div>
            </div>

            <div className="animate-fade-in stagger-4">
              {renderStepIndicator(3)}
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

        <div className="relative z-10 animate-fade-slide-up">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
            alt="Correagro S.A."
            width={220}
            height={55}
            className="brightness-0 invert"
          />
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold tracking-tight text-white text-balance leading-tight animate-fade-slide-up stagger-1">
            Panel de Estadisticas y Reportes
          </h2>
          <p className="text-lg text-white/60 leading-relaxed max-w-md animate-fade-slide-up stagger-2">
            La comisionista No. 1 de la Bolsa Mercantil de Colombia. Accede a
            datos en tiempo real, reportes detallados y analisis avanzados del
            mercado agropecuario.
          </p>
          <div className="flex gap-8 pt-4">
            <div className="animate-fade-slide-up stagger-3">
              <div className="text-3xl font-bold text-primary">+500</div>
              <div className="text-sm text-white/40 mt-1">
                Operaciones diarias
              </div>
            </div>
            <div className="animate-fade-slide-up stagger-4">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-white/40 mt-1">
                Monitoreo continuo
              </div>
            </div>
            <div className="animate-fade-slide-up stagger-5">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-white/40 mt-1">Disponibilidad</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 animate-fade-in stagger-6">
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
