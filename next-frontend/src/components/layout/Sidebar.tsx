"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Upload,
  Users,
  Shield,
  FileArchive,
  LineChart,
  BarChart,
  CalendarDays,
  Table,
  Percent,
  Circle,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Activity,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { signOut, useSession } from "next-auth/react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href}>
      <span
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
    </Link>
  );
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [reportesOpen, setReportesOpen] = useState(
    pathname.startsWith("/dashboard/reports")
  );

  const role = session?.user?.role || "admin";

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Logo Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
            alt="Correagro S.A."
            width={160}
            height={40}
            className="brightness-0 invert"
            priority
          />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-6">
        {/* Main */}
        <div className="space-y-1">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-muted">
            Principal
          </p>
          {(role === "admin" || role === "business_intelligence") && (
            <NavItem
              href="/dashboard"
              icon={Home}
              label="Dashboard"
              active={pathname === "/dashboard"}
            />
          )}
          {(role === "admin" || role === "business_intelligence") && (
            <NavItem
              href="/dashboard/benchmark"
              icon={Activity}
              label="Benchmark"
              active={pathname.startsWith("/dashboard/benchmark")}
            />
          )}
          {role === "trader" && (
            <NavItem
              href="/trader/dashboard"
              icon={LineChart}
              label="Mi Dashboard"
              active={pathname === "/trader/dashboard"}
            />
          )}
        </div>

        {/* Administration */}
        {(role === "admin" || role === "business_intelligence") && (
          <div className="space-y-1">
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-muted flex items-center gap-1.5">
              <Settings className="h-3 w-3" />
              Administracion
            </p>
            <NavItem
              href="/admin/carga-archivo"
              icon={Upload}
              label="Cargar Archivo"
              active={pathname.startsWith("/admin/carga-archivo")}
            />
            <NavItem
              href="/dashboard/traders"
              icon={Users}
              label="Traders"
              active={pathname.startsWith("/dashboard/traders")}
            />
            <NavItem
              href="/dashboard/users"
              icon={Shield}
              label="Usuarios"
              active={pathname.startsWith("/dashboard/users")}
            />
          </div>
        )}

        {/* Business Intelligence */}
        {(role === "business_intelligence" || role === "admin") && (
          <div className="space-y-1">
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-muted">
              Business Intelligence
            </p>
            <NavItem
              href="/bi/archivos-historicos"
              icon={FileArchive}
              label="Archivos Historicos"
              active={pathname.startsWith("/bi/archivos-historicos")}
            />

            {/* Reportes Accordion */}
            <div className="space-y-0.5">
              <button
                onClick={() => setReportesOpen(!reportesOpen)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  reportesOpen
                    ? "text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <BarChart className="h-4 w-4 shrink-0" />
                  Reportes
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    reportesOpen ? "rotate-180" : ""
                  )}
                />
              </button>
              {reportesOpen && (
                <div className="ml-4 space-y-0.5 border-l border-sidebar-border pl-3">
                  <NavItem
                    href="/dashboard/reports/orfs"
                    icon={Table}
                    label="ORFS"
                    active={pathname === "/dashboard/reports/orfs"}
                  />
                  <NavItem
                    href="/dashboard/reports/margin"
                    icon={Percent}
                    label="% Margen"
                    active={pathname === "/dashboard/reports/margin"}
                  />
                  <NavItem
                    href="/dashboard/reports/ruedas"
                    icon={Circle}
                    label="Ruedas"
                    active={pathname === "/dashboard/reports/ruedas"}
                  />
                  <NavItem
                    href="/dashboard/reports/daily"
                    icon={CalendarDays}
                    label="Negociado Diario"
                    active={pathname === "/dashboard/reports/daily"}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/20 text-sidebar-accent">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {session?.user?.name || "Usuario"}
            </p>
            <p className="truncate text-xs text-sidebar-muted">
              {role === "business_intelligence"
                ? "Inteligencia de Negocios"
                : role.charAt(0).toUpperCase() + role.slice(1)}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
            title="Cerrar sesion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
