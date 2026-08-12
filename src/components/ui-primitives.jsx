import React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn("border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-30", className)}>
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent mb-3">
            {eyebrow}
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-muted-foreground text-[15px] leading-relaxed text-balance">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function PageBody({ children, className }) {
  return (
    <div className={cn("max-w-5xl mx-auto px-6 lg:px-10 py-8", className)}>
      {children}
    </div>
  );
}

export function Card({ children, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border/80 bg-card shadow-[0_12px_30px_-24px_hsl(var(--accent)/0.45)]",
        onClick && "cursor-pointer transition-all hover:border-accent/35 hover:shadow-[0_18px_44px_-28px_hsl(var(--accent)/0.65)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, className }) {
  return (
    <div className={cn("text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground", className)}>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ConfidenceBar({ value, label }) {
  return (
    <div>
      {label && <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{Math.round(value)}%</span>
      </div>}
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-secondary text-secondary-foreground border-border",
    accent: "bg-accent/10 text-accent border-accent/20",
    locked: "bg-accent/10 text-accent border-accent/30",
    success: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
