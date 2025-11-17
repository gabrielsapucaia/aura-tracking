"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Users, Wrench, Tag } from "lucide-react";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/operators", icon: Users, label: "Operators", badge: "NEW" },
  { href: "/admin/equipment_types", icon: Tag, label: "Tipos de Equipamento" },
  { href: "/admin/equipment", icon: Wrench, label: "Equipamentos" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="bg-sidebar text-sidebar-foreground w-64 min-h-screen border-r border-sidebar-border px-4 py-6">
      <div className="mb-8 space-y-2">
        <Image src="/aura-tracking-logo.svg" alt="Aura Tracking logo" width={140} height={48} />
        <p className="text-xs uppercase tracking-[0.3em] text-sidebar-foreground/80">Monitoramento em tempo real</p>
      </div>
      <nav className="flex flex-col gap-1 text-sm font-medium" aria-label="Menu principal">
        {items.map(({ href, icon: Icon, label, badge }) => {
          // Only mark an item as active if the current path equals the
          // item href, or if it is a deeper route under the item href
          // (e.g. href === '/admin/equipment' should match '/admin/equipment/123')
          const isActive = path ? path === href || path.startsWith(`${href}/`) : false;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sidebar-foreground/75 transition-colors hover:text-sidebar-foreground ${
                isActive ? "bg-sidebar-foreground/10 text-sidebar-foreground" : "hover:bg-sidebar-foreground/5"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4" />
                {label}
              </span>
              {badge ? (
                <span className="text-[10px] font-semibold tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded-full">
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
