import React from "react";

export default function Button({
  children, onClick, variant = "ghost", danger = false, loading = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "ghost" | "primary";
  danger?: boolean;
  loading?: boolean;
}) {
  const base = "inline-flex items-center h-7 px-3.5 rounded text-[10px] font-mono tracking-[0.1em] transition-all duration-[120ms] border cursor-pointer";

  const cls =
    variant === "primary"
      ? `bg-accent text-canvas border-transparent font-medium ${loading ? "opacity-60 cursor-wait" : "hover:bg-accent-dim"}`
      : danger
        ? "bg-transparent text-danger border-danger/30 hover:border-danger/60"
        : "bg-transparent text-muted border-border hover:text-foreground hover:border-border-hover";

  return (
    <button onClick={onClick} disabled={loading} className={`${base} ${cls}`}>
      {loading ? "EXPORTING…" : children}
    </button>
  );
}
