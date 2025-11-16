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

const kpis = [
  { title: "Earnings", value: "$24,500", delta: "+12%", tone: "warning" as const },
  { title: "Page Views", value: "86,230", delta: "+8%", tone: "info" as const },
  { title: "Tasks", value: "142", delta: "-4%", tone: "danger" as const },
  { title: "Downloads", value: "6,213", delta: "+18%", tone: "success" as const },
];

const salesData: ChartData<"bar" | "line"> = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  datasets: [
    {
      type: "bar" as const,
      label: "Revenue",
      backgroundColor: "#4f46e5",
      borderRadius: 12,
      data: [12, 16, 14, 20, 18, 24, 28],
      barThickness: 18,
    },
    {
      type: "line" as const,
      label: "Conversion",
      data: [62, 68, 64, 72, 69, 75, 78],
      borderColor: "#f59e0b",
      backgroundColor: "transparent",
      tension: 0.4,
      pointRadius: 3,
      yAxisID: "percentage",
    },
  ],
};

const salesOptions: ChartOptions<"bar" | "line"> = {
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
    percentage: {
      position: "right" as const,
      ticks: {
        callback: (value: string | number) => `${value}%`,
        color: "#94a3b8",
      },
      grid: { drawOnChartArea: false },
      beginAtZero: true,
      min: 40,
      max: 100,
    },
  },
};

const riskData = {
  labels: ["On Track", "At Risk"],
  datasets: [
    {
      data: [75, 25],
      backgroundColor: ["#16a34a", "#ef4444"],
      borderWidth: 0,
    },
  ],
};

const userActivity = [
  { label: "New Users", value: "1,240", percent: 68 },
  { label: "Active", value: "3,982", percent: 82 },
  { label: "Conversions", value: "486", percent: 45 },
];

const latestUpdates = [
  { title: "New Operator onboarding", status: "active" as const, time: "há 4h" },
  { title: "Equipment audit", status: "pending" as const, time: "há 1d" },
  { title: "Policy sync", status: "inactive" as const, time: "há 3d" },
];

const statusLabels = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
};

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <KpiCard key={item.title} {...item} />
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Sales Analytics" description="Revenue vs conversion" actions={<span className="text-xs text-gray-400">Últimos 7 meses</span>}>
            <div className="h-80">
              <Chart type="bar" data={salesData} options={salesOptions} />
            </div>
          </ChartCard>
        </div>
        <ChartCard title="Project Risk" description="Overall health">
          <div className="flex h-80 flex-col items-center justify-center gap-4">
            <div className="h-48 w-48">
              <Doughnut data={riskData} options={{ cutout: "70%" }} />
            </div>
            <p className="text-sm text-gray-500 text-center">75% of projects are healthy this quarter.</p>
          </div>
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="rounded-xl border border-gray-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">User Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userActivity.map((item) => (
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
            {latestUpdates.map((update) => (
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
