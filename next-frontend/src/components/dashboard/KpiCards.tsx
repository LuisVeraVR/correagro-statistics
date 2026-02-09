"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  accentClass: string;
  iconBgClass: string;
}

function KpiCard({ title, value, icon: Icon, accentClass, iconBgClass }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-border bg-card hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className={cn("text-2xl font-bold tracking-tight", accentClass)}>
              {value}
            </p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              iconBgClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {/* Subtle bottom accent line */}
        <div
          className={cn(
            "absolute bottom-0 left-0 h-0.5 w-full",
            accentClass.includes("primary") ? "bg-primary/30" : "",
            accentClass.includes("foreground") && !accentClass.includes("primary") ? "bg-foreground/10" : ""
          )}
        />
      </CardContent>
    </Card>
  );
}

interface KpiCardsProps {
  kpis: {
    total_transactions: number;
    total_volume: number;
    total_commission: number;
    total_ruedas: number;
  };
  widgets: Record<string, boolean>;
}

export function KpiCards({ kpis, widgets }: KpiCardsProps) {
  const formatLargeCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = [
    {
      key: "kpi_registros",
      title: "Total Registros",
      value: kpis.total_transactions.toLocaleString("es-CO"),
      icon: FileText,
      accentClass: "text-primary",
      iconBgClass: "bg-primary/10 text-primary",
    },
    {
      key: "kpi_negociado",
      title: "Total Negociado",
      value: formatLargeCurrency(kpis.total_volume),
      icon: DollarSign,
      accentClass: "text-foreground",
      iconBgClass: "bg-foreground/5 text-foreground",
    },
    {
      key: "kpi_comision",
      title: "Total Comision",
      value: formatLargeCurrency(kpis.total_commission),
      icon: TrendingUp,
      accentClass: "text-primary",
      iconBgClass: "bg-primary/10 text-primary",
    },
    {
      key: "kpi_ruedas",
      title: "Total Ruedas",
      value: kpis.total_ruedas.toLocaleString("es-CO"),
      icon: Calendar,
      accentClass: "text-foreground",
      iconBgClass: "bg-foreground/5 text-foreground",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(
        (card) =>
          widgets[card.key] && (
            <KpiCard
              key={card.key}
              title={card.title}
              value={card.value}
              icon={card.icon}
              accentClass={card.accentClass}
              iconBgClass={card.iconBgClass}
            />
          )
      )}
    </div>
  );
}
