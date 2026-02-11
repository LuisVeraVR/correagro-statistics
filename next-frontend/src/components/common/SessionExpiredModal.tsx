"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const handleSessionExpired = () => {
      if (!isOpen) {
        setIsOpen(true);
        setCountdown(10);
      }
    };

    window.addEventListener("session-expired", handleSessionExpired);
    return () => window.removeEventListener("session-expired", handleSessionExpired);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (countdown === 0) {
      signOut({ callbackUrl: "/login" });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-destructive/50 shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-lg font-bold text-destructive">
            Sesión Expirada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Su sesión ha expirado por motivos de seguridad. Para proteger su información, el sistema se cerrará automáticamente y deberá iniciar sesión nuevamente.
          </p>
          <div className="rounded-md bg-muted/50 border border-border p-4 text-center">
             <p className="text-sm font-medium text-foreground">
               Redireccionando al inicio de sesión en:
             </p>
             <p className="mt-1 text-3xl font-bold text-primary tabular-nums">
               {countdown} s
             </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              variant="default" 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full"
            >
              Cerrar Sesión Ahora
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
