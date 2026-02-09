"use client";

import Link from "next/link";
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
  Calendar,
  Package,
  FileOutput,
  Table,
  Percent,
  Circle,
  CalendarDays,
  User,
  LogOut,
  ChevronDown,
  Layers,
  Settings,
  Activity
} from "lucide-react";
import React, { useState } from "react";
import { signOut, useSession } from "next-auth/react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);
  const [reportesOpen, setReportesOpen] = useState(false);
  const [traderReportesOpen, setTraderReportesOpen] = useState(false);

  // Default to admin for dev/preview if no session, or check actual role
  const role = session?.user?.role || "admin"; 

  return (
    <div className={cn("pb-12 min-h-screen border-r bg-background", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            ORFS Estadísticas
          </h2>
          <div className="space-y-1">
            {(role === "admin" || role === "business_intelligence") && (
              <Link href="/dashboard">
                <span
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === "/dashboard" ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </span>
              </Link>
            )}

            
            {(role === "admin" || role === "business_intelligence") && (
              <Link href="/dashboard/benchmark">
                <span
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname.startsWith("/dashboard/benchmark") ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Benchmark
                </span>
              </Link>
            )}
            
            {(role === "trader") && (
               <Link href="/trader/dashboard">
               <span
                 className={cn(
                   "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                   pathname === "/trader/dashboard" ? "bg-accent text-accent-foreground" : "transparent"
                 )}
               >
                 <LineChart className="mr-2 h-4 w-4" />
                 Mi Dashboard
               </span>
             </Link>
            )}
          </div>
        </div>

        {(role === "admin" || role === "business_intelligence") && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
               <Settings className="mr-2 h-3 w-3" /> ADMINISTRACION
            </h2>
            <div className="space-y-1">
              <Link href="/admin/carga-archivo">
                <span className={cn("flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground", pathname.startsWith("/admin/carga-archivo") ? "bg-accent text-accent-foreground" : "transparent")}>
                  <Upload className="mr-2 h-4 w-4" />
                  Cargar Archivo
                </span>
              </Link>
              <Link href="/dashboard/traders">
                <span className={cn("flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground", pathname.startsWith("/dashboard/traders") ? "bg-accent text-accent-foreground" : "transparent")}>
                  <Users className="mr-2 h-4 w-4" />
                  Traders
                </span>
              </Link>
              <Link href="/dashboard/users">
                <span className={cn("flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground", pathname.startsWith("/dashboard/users") ? "bg-accent text-accent-foreground" : "transparent")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Usuarios
                </span>
              </Link>
            </div>
          </div>
        )}

        {(role === "business_intelligence" || role === "admin") && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Business Intelligence
            </h2>
            <div className="space-y-1">
              <Link href="/bi/archivos-historicos">
                <span className={cn("flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground", pathname.startsWith("/bi/archivos-historicos") ? "bg-accent text-accent-foreground" : "transparent")}>
                  <FileArchive className="mr-2 h-4 w-4" />
                  Archivos Historicos
                </span>
              </Link>



               {/* Reportes Accordion (BI/Admin) */}
               <div className="space-y-1">
                <button
                  onClick={() => setReportesOpen(!reportesOpen)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="flex items-center">
                    <BarChart className="mr-2 h-4 w-4" />
                    REPORTES
                  </div>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", reportesOpen ? "rotate-180" : "")}
                  />
                </button>
                {reportesOpen && (
                  <div className="ml-4 space-y-1 border-l pl-2">
                    <Link href="/dashboard/reports/orfs">
                      <span className={cn("flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground", pathname === "/dashboard/reports/orfs" ? "bg-accent text-accent-foreground" : "transparent")}>
                        <Table className="mr-2 h-4 w-4" />
                        ORFS
                      </span>
                    </Link>
                    <Link href="/dashboard/reports/margin">
                      <span className={cn("flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground", pathname === "/dashboard/reports/margin" ? "bg-accent text-accent-foreground" : "transparent")}>
                        <Percent className="mr-2 h-4 w-4" />
                        % MARGEN
                      </span>
                    </Link>
                    <Link href="/dashboard/reports/ruedas">
                      <span className={cn("flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground", pathname === "/dashboard/reports/ruedas" ? "bg-accent text-accent-foreground" : "transparent")}>
                        <Circle className="mr-2 h-4 w-4" />
                        RUEDAS
                      </span>
                    </Link>
                    <Link href="/dashboard/reports/daily">
                      <span className={cn("flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground", pathname === "/dashboard/reports/daily" ? "bg-accent text-accent-foreground" : "transparent")}>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        NEGOCIADO DIARIO
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* User Profile Section */}
        <div className="mt-auto px-3 py-2 border-t">
            <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-foreground">
                        {session?.user?.name || "Usuario"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {role === 'business_intelligence' ? 'Inteligencia de Negocios' : role.charAt(0).toUpperCase() + role.slice(1)}
                    </p>
                </div>
                <button 
                    onClick={() => signOut()}
                    className="h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center text-muted-foreground transition-colors"
                    title="Cerrar sesión"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}
