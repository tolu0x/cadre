"use client";

import { useRef, useEffect, useCallback } from "react";

export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CropOverlayProps {
  containerWidth: number;
  containerHeight: number;
  cropBox: CropBox;
  onChange: (box: CropBox) => void;
  aspectRatio: number | null;
  outputScaleX?: number;
  outputScaleY?: number;
}

type Handle =
  | "n" | "s" | "e" | "w"
  | "nw" | "ne" | "sw" | "se"
  | "move";

const HANDLE_VIS = 10;  // visual size 
const HANDLE_HIT = 28;  // touch hit area 
const MIN_SIZE = 24;

const HANDLES: { id: Handle; cursor: string; x: number; y: number }[] = [
  { id: "nw", cursor: "nw-resize", x: 0,   y: 0   },
  { id: "n",  cursor: "n-resize",  x: 0.5, y: 0   },
  { id: "ne", cursor: "ne-resize", x: 1,   y: 0   },
  { id: "e",  cursor: "e-resize",  x: 1,   y: 0.5 },
  { id: "se", cursor: "se-resize", x: 1,   y: 1   },
  { id: "s",  cursor: "s-resize",  x: 0.5, y: 1   },
  { id: "sw", cursor: "sw-resize", x: 0,   y: 1   },
  { id: "w",  cursor: "w-resize",  x: 0,   y: 0.5 },
];

export default function CropOverlay({
  containerWidth,
  containerHeight,
  cropBox,
  onChange,
  aspectRatio,
  outputScaleX = 1,
  outputScaleY = 1,
}: CropOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    startBox: CropBox;
  } | null>(null);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const applyAspectRatio = useCallback(
    (w: number, h: number, anchor: Handle): { w: number; h: number } => {
      if (!aspectRatio) return { w, h };
      if (anchor === "n" || anchor === "s") return { w: h * aspectRatio, h };
      return { w, h: w / aspectRatio };
    },
    [aspectRatio]
  );

  const startDrag = useCallback(
    (clientX: number, clientY: number, handle: Handle) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      dragging.current = {
        handle,
        startX: clientX - rect.left,
        startY: clientY - rect.top,
        startBox: { ...cropBox },
      };
    },
    [cropBox]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent, handle: Handle) => {
      e.preventDefault();
      e.stopPropagation();
      startDrag(e.clientX, e.clientY, handle);
    },
    [startDrag]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent, handle: Handle) => {
      e.preventDefault();
      e.stopPropagation();
      startDrag(e.touches[0].clientX, e.touches[0].clientY, handle);
    },
    [startDrag]
  );

  useEffect(() => {
    const processMove = (clientX: number, clientY: number) => {
      if (!dragging.current || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const dx = (clientX - rect.left) - dragging.current.startX;
      const dy = (clientY - rect.top)  - dragging.current.startY;
      const { handle, startBox } = dragging.current;

      // eslint-disable-next-line prefer-const
      let { x, y, w, h } = startBox;

      if (handle === "move") {
        x = clamp(startBox.x + dx, 0, containerWidth - w);
        y = clamp(startBox.y + dy, 0, containerHeight - h);
        onChange({ x, y, w, h });
        return;
      }

      // eslint-disable-next-line prefer-const
      let newX = x, newY = y, newW = w, newH = h;

      if (handle.includes("e")) newW = clamp(startBox.w + dx, MIN_SIZE, containerWidth - startBox.x);
      if (handle.includes("s")) newH = clamp(startBox.h + dy, MIN_SIZE, containerHeight - startBox.y);
      if (handle.includes("w")) {
        const maxDx = startBox.w - MIN_SIZE;
        const clampedDx = clamp(dx, -startBox.x, maxDx);
        newX = startBox.x + clampedDx;
        newW = startBox.w - clampedDx;
      }
      if (handle.includes("n")) {
        const maxDy = startBox.h - MIN_SIZE;
        const clampedDy = clamp(dy, -startBox.y, maxDy);
        newY = startBox.y + clampedDy;
        newH = startBox.h - clampedDy;
      }

      if (aspectRatio) {
        if (handle === "e" || handle === "w") {
          newH = newW / aspectRatio;
          if (handle.includes("n")) newY = startBox.y + startBox.h - newH;
        } else if (handle === "n" || handle === "s") {
          newW = newH * aspectRatio;
          if (handle.includes("w")) newX = startBox.x + startBox.w - newW;
        } else {
          const dw = Math.abs(newW - startBox.w);
          const dh = Math.abs(newH - startBox.h);
          if (dw >= dh) {
            newH = newW / aspectRatio;
            if (handle.includes("n")) newY = startBox.y + startBox.h - newH;
          } else {
            newW = newH * aspectRatio;
            if (handle.includes("w")) newX = startBox.x + startBox.w - newW;
          }
        }

        if (newX < 0) { newW += newX; if (aspectRatio) newH = newW / aspectRatio; newX = 0; }
        if (newY < 0) { newH += newY; if (aspectRatio) newW = newH * aspectRatio; newY = 0; }
        if (newX + newW > containerWidth)  { newW = containerWidth  - newX; if (aspectRatio) newH = newW / aspectRatio; }
        if (newY + newH > containerHeight) { newH = containerHeight - newY; if (aspectRatio) newW = newH * aspectRatio; }
      }

      if (newW >= MIN_SIZE && newH >= MIN_SIZE) {
        onChange({ x: newX, y: newY, w: newW, h: newH });
      }
    };

    const onMouseMove = (e: MouseEvent) => processMove(e.clientX, e.clientY);

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      processMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const stopDrag = () => { dragging.current = null; };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", stopDrag);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [containerWidth, containerHeight, aspectRatio, onChange, applyAspectRatio]);

  const { x, y, w, h } = cropBox;

  const scrimPath = `M0,0 H${containerWidth} V${containerHeight} H0 Z M${x},${y} H${x + w} V${y + h} H${x} Z`;

  return (
    <svg
      ref={svgRef}
      width={containerWidth}
      height={containerHeight}
      className="absolute inset-0 overflow-visible select-none touch-none"
    >
      <path d={scrimPath} fill="rgba(0,0,0,0.55)" fillRule="evenodd" />

      <rect x={x} y={y} width={w} height={h} fill="transparent" stroke="var(--accent)" strokeWidth="1" />

      {[1, 2].map((n) => (
        <g key={n} stroke="rgba(232,213,176,0.2)" strokeWidth="0.5">
          <line x1={x + w * n / 3} y1={y} x2={x + w * n / 3} y2={y + h} />
          <line x1={x} y1={y + h * n / 3} x2={x + w} y2={y + h * n / 3} />
        </g>
      ))}

      <rect
        x={x + HANDLE_HIT / 2} y={y + HANDLE_HIT / 2}
        width={w - HANDLE_HIT} height={h - HANDLE_HIT}
        fill="transparent"
        cursor="move"
        onMouseDown={(e) => onMouseDown(e, "move")}
        onTouchStart={(e) => onTouchStart(e, "move")}
      />


      {HANDLES.map(({ id, cursor, x: hx, y: hy }) => (
        <g key={id}>
          <rect
            x={x + w * hx - HANDLE_HIT / 2}
            y={y + h * hy - HANDLE_HIT / 2}
            width={HANDLE_HIT}
            height={HANDLE_HIT}
            fill="transparent"
            cursor={cursor}
            onMouseDown={(e) => onMouseDown(e, id)}
            onTouchStart={(e) => onTouchStart(e, id)}
          />
          <rect
            x={x + w * hx - HANDLE_VIS / 2}
            y={y + h * hy - HANDLE_VIS / 2}
            width={HANDLE_VIS}
            height={HANDLE_VIS}
            fill="var(--accent)"
            stroke="var(--bg)"
            strokeWidth="1"
            rx="1"
            className="pointer-events-none"
          />
        </g>
      ))}

      {w > 80 && h > 36 && (() => {
        const outW = Math.round(w * outputScaleX);
        const outH = Math.round(h * outputScaleY);
        const label = `${outW} × ${outH}`;
        const charW = 7;
        const pillW = label.length * charW + 18;
        const pillH = 20;
        const px = x + w / 2;
        const py = y + h - 14;
        return (
          <g className="pointer-events-none">
            <rect
              x={px - pillW / 2} y={py - pillH / 2}
              width={pillW} height={pillH}
              rx={4}
              fill="rgba(0,0,0,0.72)"
              stroke="rgba(232,213,176,0.18)"
              strokeWidth="1"
            />
            <text
              x={px} y={py + 4.5}
              textAnchor="middle"
              fill="#e8d5b0"
              fontSize={11}
              fontFamily="monospace"
              letterSpacing="0.02em"
            >
              {label}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
