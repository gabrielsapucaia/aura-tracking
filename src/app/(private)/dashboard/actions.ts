"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { unstable_cache } from "next/cache";

const DASHBOARD_TAG = "dashboard:data";

export const getDashboardData = unstable_cache(
  async () => {
    const supabase = supabaseAdmin();

    // Fetch all data
    const [equipmentRes, operatorsRes, typesRes] = await Promise.all([
      supabase.from("equipment").select("*, equipment_types(name)"),
      supabase.from("operators").select("*"),
      supabase.from("equipment_types").select("*"),
    ]);

    const equipment = equipmentRes.data || [];
    const operators = operatorsRes.data || [];
    const types = typesRes.data || [];

    // Compute KPIs
    const totalEquipment = equipment.length;
    const activeEquipment = equipment.filter(e => e.status === 'active').length;
    const totalOperators = operators.length;
    const activeOperators = operators.filter(o => o.status === 'active').length;
    const totalTypes = types.length;

    // Equipment by type
    const equipmentByType = types.map(type => {
      const count = equipment.filter(e => e.type_id === type.id).length;
      return { name: type.name, count };
    });

    // Equipment status distribution
    const activeEq = activeEquipment;
    const inactiveEq = totalEquipment - activeEq;

    // Operator stats
    const activeOps = activeOperators;
    const inactiveOps = totalOperators - activeOps;

    // Latest updates: recent equipment and operators
    const recentEquipment = equipment
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3)
      .map(e => ({
        title: `Equipment ${e.tag} updated`,
        status: e.status as 'active' | 'inactive' | 'pending',
        time: formatTimeAgo(e.updated_at),
      }));

    const recentOperators = operators
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3)
      .map(o => ({
        title: `Operator ${o.name} updated`,
        status: o.status as 'active' | 'inactive' | 'pending',
        time: formatTimeAgo(o.updated_at),
      }));

    const latestUpdates = [...recentEquipment, ...recentOperators]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()) // Need better sorting
      .slice(0, 3);

    return {
      kpis: [
        { title: "Total Equipment", value: totalEquipment.toString(), delta: "", tone: "info" as const },
        { title: "Active Equipment", value: activeEquipment.toString(), delta: `${totalEquipment > 0 ? ((activeEquipment / totalEquipment) * 100).toFixed(0) : 0}%`, tone: "success" as const },
        { title: "Total Operators", value: totalOperators.toString(), delta: "", tone: "info" as const },
        { title: "Active Operators", value: activeOperators.toString(), delta: `${totalOperators > 0 ? ((activeOperators / totalOperators) * 100).toFixed(0) : 0}%`, tone: "success" as const },
      ],
      equipmentByType,
      equipmentStatus: { active: activeEq, inactive: inactiveEq },
      operatorStats: [
        { label: "Active Operators", value: activeOps.toString(), percent: totalOperators > 0 ? (activeOps / totalOperators) * 100 : 0 },
        { label: "Inactive Operators", value: inactiveOps.toString(), percent: totalOperators > 0 ? (inactiveOps / totalOperators) * 100 : 0 },
        { label: "Total Operators", value: totalOperators.toString(), percent: 100 },
      ],
      latestUpdates,
    };
  },
  [DASHBOARD_TAG],
  { tags: [DASHBOARD_TAG] },
);

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `há ${diffHours}h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays}d`;
}