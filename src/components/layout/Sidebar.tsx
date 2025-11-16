"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Users } from "lucide-react";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/operators", icon: Users, label: "Operators", badge: "NEW" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar(){
  const path = usePathname();
  return (
    <aside className="bg-sidebar text-slate-200 w-64 min-h-screen border-r border-sidebar-border px-4 py-6">
      <div className="text-sm uppercase tracking-[0.2em] text-slate-400 mb-3">Aura</div>
      <div className="text-xl font-semibold text-white mb-8">Minimal Dashboard</div>
      <nav className="flex flex-col gap-1 text-sm font-medium">
        {items.map(({ href, icon: Icon, label, badge }) => {
          const isActive = path ? path.startsWith(href) : false;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 text-slate-300 transition-colors hover:text-white ${
                isActive ? "bg-white/10 text-white" : "hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4" />
                {label}
              </span>
              {badge ? (
                <span className="text-[10px] font-semibold tracking-wide text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
