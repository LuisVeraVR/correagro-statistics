"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatLargeCurrency = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  formatter?: (val: number) => string;
}

function CustomTooltip({
  active,
  payload,
  label,
  formatter = formatCurrency,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatter(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface MonthlyChartsProps {
  data: {
    month: string;
    volume: number;
    commission: number;
    transactions: number;
    ruedas: number;
  }[];
}

export function MonthlyCharts({ data }: MonthlyChartsProps) {
  const chartData = data.map((item) => ({
    ...item,
    monthShort: item.month.substring(0, 3),
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Volume Area Chart */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              Volumen Negociado Mensual
            </CardTitle>
            <span className="text-xs text-muted-foreground">COP</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142, 72%, 29%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(142, 72%, 29%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(140, 10%, 90%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="monthShort"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(150, 5%, 45%)", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(150, 5%, 45%)", fontSize: 11 }}
                  tickFormatter={formatLargeCurrency}
                  width={60}
                />
                <Tooltip
                  content={<CustomTooltip formatter={formatCurrency} />}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  name="Volumen"
                  stroke="hsl(142, 72%, 29%)"
                  strokeWidth={2.5}
                  fill="url(#volumeGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "hsl(142, 72%, 29%)",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Commission Bar Chart */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              Comision Mensual
            </CardTitle>
            <span className="text-xs text-muted-foreground">COP</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(140, 10%, 90%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="monthShort"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(150, 5%, 45%)", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(150, 5%, 45%)", fontSize: 11 }}
                  tickFormatter={formatLargeCurrency}
                  width={60}
                />
                <Tooltip
                  content={<CustomTooltip formatter={formatCurrency} />}
                />
                <Bar
                  dataKey="commission"
                  name="Comision"
                  fill="hsl(150, 10%, 15%)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
