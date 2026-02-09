"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface MonthlyTableProps {
  data: {
    month: string;
    volume: number;
    commission: number;
    transactions: number;
    ruedas: number;
  }[];
  year: number;
}

export function MonthlyTable({ data, year }: MonthlyTableProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Resumen Mensual {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sidebar text-sidebar-foreground">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Mes
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                  Ruedas
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                  Transacciones
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                  Negociado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                  Comision
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((item, idx) => (
                <tr
                  key={idx}
                  className="bg-card transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.month}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {item.ruedas}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {item.transactions.toLocaleString("es-CO")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                    {formatCurrency(item.volume)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-primary">
                    {formatCurrency(item.commission)}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No hay datos para este periodo
                  </td>
                </tr>
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td className="px-4 py-3 text-foreground">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {data.reduce((acc, i) => acc + i.ruedas, 0)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {data
                      .reduce((acc, i) => acc + i.transactions, 0)
                      .toLocaleString("es-CO")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {formatCurrency(
                      data.reduce((acc, i) => acc + i.volume, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-primary">
                    {formatCurrency(
                      data.reduce((acc, i) => acc + i.commission, 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
