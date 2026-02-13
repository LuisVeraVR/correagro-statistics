"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  User,
  LogOut,
  ChevronDown,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

interface NavbarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/benchmark": "Benchmark",
  "/dashboard/traders": "Traders",
  "/dashboard/traders/create": "Nuevo Trader",
  "/dashboard/users": "Usuarios",
  "/dashboard/users/create": "Nuevo Usuario",
  "/dashboard/transactions": "Operaciones ORFS",
  "/dashboard/transactions/create": "Nueva Operacion",
  "/dashboard/reports/orfs": "Reporte ORFS",
  "/dashboard/reports/margin": "Reporte % Margen",
  "/dashboard/reports/ruedas": "Reporte Ruedas",
  "/dashboard/reports/daily": "Negociado Diario",
  "/admin/carga-archivo": "Cargar Archivos",
};

function getBreadcrumb(pathname: string): string {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];
  // Handle dynamic routes like /dashboard/traders/1/edit
  if (pathname.match(/\/dashboard\/traders\/\d+\/edit/)) return "Editar Trader";
  if (pathname.match(/\/dashboard\/users\/\d+\/edit/)) return "Editar Usuario";
  if (pathname.match(/\/dashboard\/transactions\/\d+\/edit/)) return "Editar Operacion";
  return "Dashboard";
}

export function Navbar({ collapsed, onToggleSidebar, onOpenMobileSidebar }: NavbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const pageName = getBreadcrumb(pathname);
  const role = session?.user?.role || "admin";
  const roleLabel =
    role === "business_intelligence"
      ? "Inteligencia de Negocios"
      : role === "admin"
        ? "Administrador"
        : role.charAt(0).toUpperCase() + role.slice(1);

  const handleSignOut = async () => {
    setLoggingOut(true);
    // Add a delay to ensure the loader is rendered and visible to the user
    await new Promise(resolve => setTimeout(resolve, 2000));
    await signOut();
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4 gap-3">
      {loggingOut && <FullScreenLoader text="Cerrando sesión..." />}
      {/* Desktop sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </button>

      {/* Mobile hamburger */}
      <button
        onClick={onOpenMobileSidebar}
        className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile logo */}
      <img
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
        alt="Correagro S.A."
        width={110}
        height={28}
        className="md:hidden"
      />

      {/* Breadcrumb / Page title */}
      <div className="hidden md:flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Correagro</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium text-foreground">{pageName}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notification bell placeholder */}
      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notificaciones"
      >
        <Bell className="h-[18px] w-[18px]" />
      </button>

      {/* Profile dropdown */}
      <div ref={profileRef} className="relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted",
            profileOpen && "bg-muted"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-foreground leading-none">
              {session?.user?.name || "Usuario"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{roleLabel}</p>
          </div>
          <ChevronDown
            className={cn(
              "hidden md:block h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
              profileOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown */}
        {profileOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border border-border bg-card shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150 z-50">
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-sm font-medium text-foreground">
                {session?.user?.name || "Usuario"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {session?.user?.email || ""}
              </p>
            </div>
            <div className="p-1.5">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
