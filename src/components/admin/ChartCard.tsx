import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ReactNode } from "react";

export type ChartCardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function ChartCard({ title, description, actions, children }: ChartCardProps) {
  return (
    <Card className="h-full rounded-xl border border-gray-100 shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold text-gray-900">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs uppercase tracking-widest text-gray-400">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
