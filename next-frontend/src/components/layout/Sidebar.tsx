"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
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
  collapsed?: boolean;
  onClose?: () => void;
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  collapsed?: boolean;
}) {
  const inner = (
    <Link href={href}>
      <span
        className={cn(
          "flex items-center rounded-lg transition-all duration-200",
          collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2.5",
          "text-sm font-medium",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <span className="truncate sidebar-label">{label}</span>
        )}
      </span>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip content={label} side="right" enabled={collapsed}>
        {inner}
      </Tooltip>
    );
  }

  return inner;
}

export function Sidebar({ className, collapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [reportesOpen, setReportesOpen] = useState(
    pathname.startsWith("/dashboard/reports")
  );

  const role = session?.user?.role || "admin";

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-[68px]" : "w-[260px]",
        className
      )}
    >
      {/* Logo Header */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border transition-all duration-300 shrink-0",
        collapsed ? "justify-center px-2 py-5 h-14" : "justify-between px-5 py-5 h-14"
      )}>
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent/20">
            <span className="text-sm font-bold text-sidebar-accent">C</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
              alt="Correagro S.A."
              width={140}
              height={35}
              className="brightness-0 invert"
            />
          </div>
        )}
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 overflow-y-auto scrollbar-thin py-4 space-y-6",
        collapsed ? "px-1.5" : "px-3"
      )}>
        {/* Main */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-muted">
              Principal
            </p>
          )}
          {collapsed && (
            <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
          )}
          {(role === "admin" || role === "business_intelligence") && (
            <NavItem
              href="/dashboard"
              icon={Home}
              label="Dashboard"
              active={pathname === "/dashboard"}
              collapsed={collapsed}
            />
          )}
          {(role === "admin" || role === "business_intelligence") && (
            <NavItem
              href="/dashboard/benchmark"
              icon={Activity}
              label="Benchmark"
              active={pathname.startsWith("/dashboard/benchmark")}
              collapsed={collapsed}
            />
          )}
          {role === "trader" && (
            <NavItem
              href="/trader/dashboard"
              icon={LineChart}
              label="Mi Dashboard"
              active={pathname === "/trader/dashboard"}
              collapsed={collapsed}
            />
          )}
        </div>

        {/* Administration */}
        {(role === "admin" || role === "business_intelligence") && (
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-muted flex items-center gap-1.5">
                <Settings className="h-3 w-3" />
                Administracion
              </p>
            )}
            {collapsed && (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            )}
            <NavItem
              href="/dashboard/traders"
              icon={Users}
              label="Traders"
              active={pathname.startsWith("/dashboard/traders")}
              collapsed={collapsed}
            />
            <NavItem
              href="/dashboard/users"
              icon={Shield}
              label="Usuarios"
              active={pathname.startsWith("/dashboard/users")}
              collapsed={collapsed}
            />
          </div>
        )}

        {/* Business Intelligence */}
        {(role === "business_intelligence" || role === "admin") && (
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-muted">
                Business Intelligence
              </p>
            )}
            {collapsed && (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            )}
            <NavItem
              href="/admin/carga-archivo"
              icon={FileArchive}
              label="Cargar Archivos"
              active={pathname.startsWith("/admin/carga-archivo")}
              collapsed={collapsed}
            />

            {/* Reportes Accordion */}
            {collapsed ? (
              // When collapsed, show report items as flat tooltipped icons
              <>
                <Tooltip content="Reportes" side="right" enabled>
                  <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-lg text-sidebar-foreground/70">
                    <BarChart className="h-4 w-4 shrink-0" />
                  </div>
                </Tooltip>
                <NavItem
                  href="/dashboard/reports/orfs"
                  icon={Table}
                  label="ORFS"
                  active={pathname === "/dashboard/reports/orfs"}
                  collapsed
                />
                <NavItem
                  href="/dashboard/reports/margin"
                  icon={Percent}
                  label="% Margen"
                  active={pathname === "/dashboard/reports/margin"}
                  collapsed
                />
                <NavItem
                  href="/dashboard/reports/ruedas"
                  icon={Circle}
                  label="Ruedas"
                  active={pathname === "/dashboard/reports/ruedas"}
                  collapsed
                />
                <NavItem
                  href="/dashboard/reports/daily"
                  icon={CalendarDays}
                  label="Negociado Diario"
                  active={pathname === "/dashboard/reports/daily"}
                  collapsed
                />
              </>
            ) : (
              <div className="space-y-0.5">
                <button
                  onClick={() => setReportesOpen(!reportesOpen)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    reportesOpen
                      ? "text-sidebar-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <BarChart className="h-4 w-4 shrink-0" />
                    <span className="sidebar-label">Reportes</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-300 ease-in-out",
                      reportesOpen ? "rotate-180" : ""
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "ml-4 space-y-0.5 border-l border-sidebar-border pl-3 overflow-hidden transition-all duration-300 ease-in-out",
                    reportesOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
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
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-sidebar-border shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 py-3">
            <Tooltip content={session?.user?.name || "Usuario"} side="right" enabled>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent/20 text-sidebar-accent">
                <User className="h-4 w-4" />
              </div>
            </Tooltip>
            <Tooltip content="Cerrar sesion" side="right" enabled>
              <button
                onClick={() => signOut()}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
                title="Cerrar sesion"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className="p-3">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/20 text-sidebar-accent">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 overflow-hidden sidebar-label">
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
        )}
      </div>
    </div>
  );
}
