"use client";

import { useFormatter } from "next-intl";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const format = useFormatter();
  const dateTime = new Date();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b mb-6 border-border/40">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-base">{subtitle}</p>
        )}
      </div>
      <div className="text-sm font-medium text-muted-foreground hidden sm:flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full border border-border/50">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        {format.dateTime(dateTime, {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })}
      </div>
    </header>
  );
}
