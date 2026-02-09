"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface WidgetConfigProps {
  widgets: Record<string, boolean>;
  toggleWidget: (key: string) => void;
}

function ConfigGroup({
  title,
  items,
  widgets,
  toggleWidget,
}: {
  title: string;
  items: { id: string; label: string }[];
  widgets: Record<string, boolean>;
  toggleWidget: (key: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-2.5">
            <Checkbox
              id={item.id}
              checked={widgets[item.id]}
              onCheckedChange={() => toggleWidget(item.id)}
            />
            <Label
              htmlFor={item.id}
              className="text-sm font-normal text-foreground cursor-pointer"
            >
              {item.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WidgetConfig({ widgets, toggleWidget }: WidgetConfigProps) {
  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground">
          Personalizar Dashboard
        </CardTitle>
        <CardDescription>
          Selecciona los elementos que deseas ver en tu dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <ConfigGroup
            title="KPIs"
            items={[
              { id: "kpi_registros", label: "Total Operaciones" },
              { id: "kpi_negociado", label: "Total Negociado" },
              { id: "kpi_comision", label: "Total Comision" },
              { id: "kpi_ruedas", label: "Total Ruedas" },
            ]}
            widgets={widgets}
            toggleWidget={toggleWidget}
          />
          <ConfigGroup
            title="Rankings"
            items={[
              { id: "ranking_clientes_trans", label: "Clientes por Volumen" },
              { id: "ranking_clientes_comi", label: "Clientes por Comision" },
              { id: "ranking_traders_comi", label: "Traders por Comision" },
              { id: "ranking_traders_vol", label: "Traders por Volumen" },
            ]}
            widgets={widgets}
            toggleWidget={toggleWidget}
          />
          <ConfigGroup
            title="Visualizaciones"
            items={[
              { id: "charts", label: "Graficas Mensuales" },
              { id: "resumen_mensual", label: "Tabla Resumen Mensual" },
            ]}
            widgets={widgets}
            toggleWidget={toggleWidget}
          />
        </div>
      </CardContent>
    </Card>
  );
}
