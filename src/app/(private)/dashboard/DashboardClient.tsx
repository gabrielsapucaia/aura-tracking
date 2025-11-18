"use client";

import { ChartCard } from "@/components/admin/ChartCard";
import { KpiCard } from "@/components/admin/KpiCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Chart, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

interface DashboardData {
  kpis: Array<{ title: string; value: string; delta: string; tone: "warning" | "info" | "danger" | "success" }>;
  equipmentByType: Array<{ name: string; count: number }>;
  equipmentStatus: { active: number; inactive: number };
  operatorStats: Array<{ label: string; value: string; percent: number }>;
  latestUpdates: Array<{ title: string; status: "active" | "inactive" | "pending"; time: string }>;
}

interface DashboardClientProps {
  data: DashboardData;
}

const statusLabels = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
};

export default function DashboardClient({ data }: DashboardClientProps) {
  const equipmentByTypeData: ChartData<"bar"> = {
    labels: data.equipmentByType.map(t => t.name),
    datasets: [
      {
        type: "bar" as const,
        label: "Equipment Count",
        backgroundColor: "#4f46e5",
        borderRadius: 12,
        data: data.equipmentByType.map(t => t.count),
        barThickness: 18,
      },
    ],
  };

  const equipmentByTypeOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { color: "#6b7280", usePointStyle: true } },
      tooltip: { intersect: false, mode: "index" as const },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148,163,184,0.2)" },
      },
    },
  };

  const equipmentStatusData = {
    labels: ["Active", "Inactive"],
    datasets: [
      {
        data: [data.equipmentStatus.active, data.equipmentStatus.inactive],
        backgroundColor: ["#16a34a", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((item) => (
          <KpiCard key={item.title} {...item} />
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Equipment by Type" description="Distribution of equipment across types" actions={<span className="text-xs text-gray-400">Current data</span>}>
            <div className="h-80">
              <Chart type="bar" data={equipmentByTypeData} options={equipmentByTypeOptions} />
            </div>
          </ChartCard>
        </div>
        <ChartCard title="Equipment Status" description="Active vs Inactive">
          <div className="flex h-80 flex-col items-center justify-center gap-4">
            <div className="h-48 w-48">
              <Doughnut data={equipmentStatusData} options={{ cutout: "70%" }} />
            </div>
            <p className="text-sm text-gray-500 text-center">
              {data.equipmentStatus.active} active, {data.equipmentStatus.inactive} inactive
            </p>
          </div>
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="rounded-xl border border-gray-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Operator Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.operatorStats.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100 shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Latest Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.latestUpdates.map((update) => (
              <div key={update.title} className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 px-4 py-3">
                <div>
                  <p className="font-medium text-gray-900">{update.title}</p>
                  <p className="text-xs uppercase tracking-widest text-gray-400">{update.time}</p>
                </div>
                <StatusBadge status={update.status} label={statusLabels[update.status]} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}