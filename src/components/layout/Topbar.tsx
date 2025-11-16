"use client";
export function Topbar(){
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="text-lg font-semibold tracking-tight text-gray-900">Minimal Dashboard</div>
      <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">v0.1.0</div>
    </header>
  );
}
