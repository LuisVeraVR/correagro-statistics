"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface RankingCardProps {
  title: string;
  data: { name: string; value: number }[];
  type?: "currency" | "number";
}

const barColors = [
  "bg-primary",
  "bg-primary/70",
  "bg-primary/50",
  "bg-primary/30",
  "bg-primary/20",
];

const badgeColors = [
  "bg-primary text-primary-foreground",
  "bg-primary/80 text-primary-foreground",
  "bg-primary/60 text-primary-foreground",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
];

export function RankingCard({ title, data, type = "currency" }: RankingCardProps) {
  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold",
                      badgeColors[idx] || badgeColors[4]
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="truncate text-sm font-medium text-foreground"
                    title={item.name}
                  >
                    {item.name}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                  {type === "currency"
                    ? formatCurrency(item.value)
                    : item.value.toLocaleString("es-CO")}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    barColors[idx] || barColors[4]
                  )}
                  style={{
                    width: `${
                      data[0]?.value > 0
                        ? (item.value / data[0].value) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RankingGridProps {
  rankings: {
    clients_by_volume: { name: string; value: number }[];
    clients_by_commission: { name: string; value: number }[];
    traders_by_commission: { name: string; value: number }[];
    traders_by_volume: { name: string; value: number }[];
  };
  widgets: Record<string, boolean>;
}

export function RankingGrid({ rankings, widgets }: RankingGridProps) {
  const cards = [
    {
      key: "ranking_clientes_trans",
      title: "Clientes por Volumen",
      data: rankings.clients_by_volume,
      type: "currency" as const,
    },
    {
      key: "ranking_clientes_comi",
      title: "Clientes por Comision",
      data: rankings.clients_by_commission,
      type: "currency" as const,
    },
    {
      key: "ranking_traders_comi",
      title: "Traders por Comision",
      data: rankings.traders_by_commission,
      type: "currency" as const,
    },
    {
      key: "ranking_traders_vol",
      title: "Traders por Volumen",
      data: rankings.traders_by_volume,
      type: "currency" as const,
    },
  ];

  const visibleCards = cards.filter((c) => widgets[c.key]);

  if (visibleCards.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {visibleCards.map((card) => (
        <RankingCard
          key={card.key}
          title={card.title}
          data={card.data}
          type={card.type}
        />
      ))}
    </div>
  );
}
