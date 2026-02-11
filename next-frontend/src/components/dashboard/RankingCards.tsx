"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { handleAuthError } from "@/utils/auth-helper";

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
  initialData: { name: string; value: number }[];
  type?: "currency" | "number";
  apiType: string;
  year: number;
  withGroups?: boolean;
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

export function RankingCard({ title, initialData, type = "currency", apiType, year, withGroups = true }: RankingCardProps) {
  const { data: session } = useSession();
  const [data, setData] = useState(initialData);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(false);

  // Update data when initialData or year changes (reset to desc)
  useEffect(() => {
    setData(initialData);
    setSortOrder("desc");
  }, [initialData, year, withGroups]);

  const handleSort = async (order: "asc" | "desc") => {
    if (order === sortOrder) return;
    
    setLoading(true);
    setSortOrder(order);

    try {
      const token = (session?.user as { accessToken?: string })?.accessToken;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const res = await fetch(
        `${API_URL}/dashboard/ranking?type=${apiType}&order=${order}&year=${year}&withGroups=${withGroups}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      handleAuthError(res);

      if (!res.ok) throw new Error('Failed to fetch');
      
      const newData = await res.json();
      setData(newData);
    } catch (error) {
      console.error("Error fetching ranking:", error);
      // Revert sort order on error
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold text-foreground">
          {title}
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6",
              sortOrder === "desc" ? "bg-blue-100 text-blue-600 hover:bg-blue-200" : "text-muted-foreground hover:text-blue-600"
            )}
            onClick={() => handleSort("desc")}
            disabled={loading}
            title="Mayor a Menor"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6",
              sortOrder === "asc" ? "bg-red-100 text-red-600 hover:bg-red-200" : "text-muted-foreground hover:text-red-600"
            )}
            onClick={() => handleSort("asc")}
            disabled={loading}
            title="Menor a Mayor"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
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
                        data[0]?.value && data[0].value !== 0
                          ? Math.abs((item.value / data[0].value) * 100)
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
        )}
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
  year: number;
  withGroups?: boolean;
}

export function RankingGrid({ rankings, widgets, year, withGroups = true }: RankingGridProps) {
  const cards = [
    {
      key: "ranking_clientes_trans",
      title: "Clientes por Volumen",
      data: rankings.clients_by_volume,
      type: "currency" as const,
      apiType: "clients_volume"
    },
    {
      key: "ranking_clientes_comi",
      title: "Clientes por Comision",
      data: rankings.clients_by_commission,
      type: "currency" as const,
      apiType: "clients_commission"
    },
    {
      key: "ranking_traders_comi",
      title: "Traders por Comision",
      data: rankings.traders_by_commission,
      type: "currency" as const,
      apiType: "traders_commission"
    },
    {
      key: "ranking_traders_vol",
      title: "Traders por Volumen",
      data: rankings.traders_by_volume,
      type: "currency" as const,
      apiType: "traders_volume"
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
          initialData={card.data}
          type={card.type}
          apiType={card.apiType}
          year={year}
          withGroups={withGroups}
        />
      ))}
    </div>
  );
}
