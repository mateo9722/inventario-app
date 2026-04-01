import React from "react";
import { Droplets, Users, Truck, RotateCcw } from "lucide-react";
import KPIItem from "./KPIItem";

type KPIGridProps = {
  capacityAvailable: number;
  reserved: number;
  borrowed: number;
  deliveredToday: number;
  rotation: number;
  salesYesterday?: number;
};

export default function KPIGrid({
  capacityAvailable,
  reserved,
  borrowed,
  deliveredToday,
  rotation,
}: KPIGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPIItem
        title="Disponibles"
        value={capacityAvailable + reserved}
        subtitle={
          reserved > 0
            ? `${capacityAvailable} listos + ${reserved} preparados`
            : "Botellones listos para vender"
        }
        icon={<Droplets className="w-5 h-5" />}
        color="primary"
      />
      <KPIItem
        title="En Clientes"
        value={borrowed}
        subtitle="Envases fuera de planta"
        icon={<Users className="w-5 h-5" />}
        color="orange-500"
        trend={
          borrowed > 0
            ? { value: borrowed, label: "pendientes retorno" }
            : undefined
        }
      />
      <KPIItem
        title="Entregados Hoy"
        value={deliveredToday}
        subtitle="Botellones despachados este turno"
        icon={<Truck className="w-5 h-5" />}
        color="secondary"
      />
      <KPIItem
        title="Rotación"
        value={`${rotation}x`}
        subtitle="Veces que circuló tu inventario hoy"
        icon={<RotateCcw className="w-5 h-5" />}
        color="primary"
      />
    </div>
  );
}
