"use client";

export type AspectRatioPreset = "1:1" | "16:9" | "4:3" | "3:4" | "3:1" | "9:16" | "free";

interface AspectRatioSelectorProps {
  value: AspectRatioPreset;
  onChange: (ratio: AspectRatioPreset) => void;
}

const PRESETS: { label: string; value: AspectRatioPreset }[] = [
  { label: "1:1",  value: "1:1"  },
  { label: "16:9", value: "16:9" },
  { label: "3:1",  value: "3:1"  },
  { label: "4:3",  value: "4:3"  },
  { label: "3:4",  value: "3:4"  },
  { label: "9:16", value: "9:16" },
  { label: "FREE", value: "free" },
];

export function getAspectRatioValue(preset: AspectRatioPreset): number | null {
  switch (preset) {
    case "1:1":  return 1;
    case "16:9": return 16 / 9;
    case "4:3":  return 4 / 3;
    case "3:1":  return 3;
    case "3:4":  return 3 / 4;
    case "9:16": return 9 / 16;
    case "free": return null;
  }
}


function RatioShape({ preset, active }: { preset: AspectRatioPreset; active: boolean }) {
  const W = 32, H = 22;
  const pad = 2;
  const maxW = W - pad * 2;
  const maxH = H - pad * 2;
  const ratio = getAspectRatioValue(preset);

  if (!ratio) {
    // Diagonal Lines to represent "free" mode
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
        <line x1={pad + 4} y1={pad + 2} x2={W - pad - 4} y2={H - pad - 2} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={W - pad - 4} y1={pad + 2} x2={pad + 4} y2={H - pad - 2} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  let w: number, h: number;
  if (ratio >= maxW / maxH) {
    w = maxW;
    h = maxW / ratio;
  } else {
    h = maxH;
    w = maxH * ratio;
  }
  const x = (W - w) / 2;
  const y = (H - h) / 2;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
      <rect
        x={x} y={y}
        width={w} height={h}
        stroke="currentColor"
        strokeWidth="1.5"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.1 : 0}
      />
    </svg>
  );
}

export default function AspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
  return (
    <div className="flex items-center gap-0.5">
      {PRESETS.map((preset) => {
        const active = value === preset.value;
        return (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            title={preset.label}
            className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded transition-all duration-[100ms] ${
              active
                ? "text-accent bg-accent/8"
                : "text-subtle hover:text-muted"
            }`}
          >
            <RatioShape preset={preset.value} active={active} />
            <span className="text-[10px] font-mono tracking-[0.04em]">{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}
