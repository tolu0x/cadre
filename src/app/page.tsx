"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import ImageUpload from "./components/ImageUpload";
import AspectRatioSelector, {
  AspectRatioPreset,
  getAspectRatioValue,
} from "./components/AspectRatioSelector";
import CropOverlay, { CropBox } from "./components/CropOverlay";
import { cropImage, downloadDataUrl, shareImageFile, canShareFiles } from "./components/CropEngine";
import ThemeToggle from "./components/ThemeToggle";
import Button from "./components/Button";

const DEFAULT_RATIO: AspectRatioPreset = "1:1";
const EXTEND_PAD = 280;

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [ratio, setRatio] = useState<AspectRatioPreset>(DEFAULT_RATIO);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [exporting, setExporting] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [extendMode, setExtendMode] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [fileName, setFileName] = useState<string>("image");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cadre-theme") as "dark" | "light" | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle("light", stored === "light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    localStorage.setItem("cadre-theme", next);
  };

  const resetCropBox = useCallback(
    (cw: number, ch: number, aspectRatio: number | null) => {
      const pad = 24;
      if (aspectRatio) {
        let w = cw - pad * 2;
        let h = w / aspectRatio;
        if (h > ch - pad * 2) { h = ch - pad * 2; w = h * aspectRatio; }
        setCropBox({ x: (cw - w) / 2, y: (ch - h) / 2, w, h });
      } else {
        setCropBox({ x: pad, y: pad, w: cw - pad * 2, h: ch - pad * 2 });
      }
    },
    []
  );

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!containerRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = containerRef.current;
    setContainerSize({ w, h });
    resetCropBox(w, h, getAspectRatioValue(ratio));
    setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  }, [ratio, resetCropBox]);

  useEffect(() => {
    if (containerSize.w && containerSize.h)
      resetCropBox(containerSize.w, containerSize.h, getAspectRatioValue(ratio));
  }, [ratio]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (!imageSrc || !containerRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = containerRef.current;
    setContainerSize({ w, h });
    resetCropBox(w, h, getAspectRatioValue(ratio));
  }, [extendMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result;
            if (typeof result === "string") {
              setImageSrc(result);
              setFileName("paste");
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const buildCroppedDataUrl = async () => {
    if (!imageSrc || !cropBox || !containerSize.w) return null;
    const imageOffset = extendMode ? { x: EXTEND_PAD, y: EXTEND_PAD } : { x: 0, y: 0 };
    return cropImage(imageSrc, containerSize.w, containerSize.h, cropBox, imageOffset);
  };

  const handleCrop = async () => {
    setExporting(true);
    try {
      const dataUrl = await buildCroppedDataUrl();
      if (!dataUrl) return;
      const base = fileName.replace(/\.[^.]+$/, "");
      downloadDataUrl(dataUrl, `${base}-cadre`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportToFiles = async () => {
    setShowExportSheet(false);
    setExporting(true);
    try {
      const dataUrl = await buildCroppedDataUrl();
      if (!dataUrl) return;
      const base = fileName.replace(/\.[^.]+$/, "");
      downloadDataUrl(dataUrl, `${base}-cadre`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportToCameraRoll = async () => {
    setShowExportSheet(false);
    setExporting(true);
    try {
      const dataUrl = await buildCroppedDataUrl();
      if (!dataUrl) return;
      const base = fileName.replace(/\.[^.]+$/, "");
      await shareImageFile(dataUrl, `${base}-cadre`);
    } catch {
      // user cancelled share sheet or sharing failed — fall back to download
      const dataUrl = await buildCroppedDataUrl();
      if (!dataUrl) return;
      const base = fileName.replace(/\.[^.]+$/, "");
      downloadDataUrl(dataUrl, `${base}-cadre`);
    } finally {
      setExporting(false);
    }
  };

  const handleMobileExport = () => {
    if (canShareFiles()) {
      setShowExportSheet(true);
    } else {
      handleCrop();
    }
  };

  const handleReset = useCallback(() => {
    if (containerSize.w && containerSize.h)
      resetCropBox(containerSize.w, containerSize.h, getAspectRatioValue(ratio));
  }, [containerSize, ratio, resetCropBox]);

  const handleClear = () => {
    setImageSrc(null);
    setCropBox(null);
    setContainerSize({ w: 0, h: 0 });
    setRatio(DEFAULT_RATIO);
    setExtendMode(false);
    setFileName("image");
  };

  return (
    <main className="min-h-screen flex flex-col">

      <header className="flex items-stretch h-[52px] bg-surface border-b border-border shrink-0">
        <div className="fade-up flex items-center pl-6 pr-7 border-r border-border shrink-0">
          <span className="font-display text-[30px] leading-none text-accent tracking-[0.1em]">
            CADRE
          </span>
        </div>

        <div className="fade-up delay-1 flex-1 flex items-center justify-end px-3 sm:px-5 gap-2">
          {!imageSrc && (
            <span className="hidden sm:inline text-[10px] font-mono tracking-[0.14em] text-subtle uppercase">
              Image Cropping Tool
            </span>
          )}
          {imageSrc && (
            <div className="hidden sm:flex items-center gap-2">
              <Button onClick={handleReset} variant="ghost">RESET</Button>
              <Button onClick={handleClear} variant="ghost" danger>CLEAR</Button>
              <Button onClick={handleCrop} variant="primary" loading={exporting}>
                <svg width="9" height="10" viewBox="0 0 9 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                  <path d="M4.5 1v6M1.5 5.5l3 3 3-3" />
                </svg>
                EXPORT
              </Button>
            </div>
          )}
          <div className="w-px h-5 bg-border mx-1 shrink-0" />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      {imageSrc && (
        <div className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border shrink-0">
          <Button onClick={handleReset} variant="ghost">RESET</Button>
          <Button onClick={handleClear} variant="ghost" danger>CLEAR</Button>
          <div className="flex-1" />
          <Button onClick={handleMobileExport} variant="primary" loading={exporting}>
            <svg width="9" height="10" viewBox="0 0 9 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M4.5 1v6M1.5 5.5l3 3 3-3" />
            </svg>
            EXPORT
          </Button>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {!imageSrc ? (

          <div className="flex-1 flex items-center justify-center bg-canvas dot-grid">
            <div className="fade-up delay-2 flex flex-col items-center gap-0">
              <p className="m-0 mb-5 text-[9px] font-mono tracking-[0.2em] text-subtle uppercase">
                Select a file to begin
              </p>
              <ImageUpload onImageLoaded={(dataUrl, name) => { setImageSrc(dataUrl); setFileName(name); }} />
            </div>
          </div>

        ) : (

          <div className="flex-1 flex flex-col fade-in">

            <div className="flex items-stretch h-[54px] border-b border-border bg-surface shrink-0 min-w-0">
              <div className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 overflow-x-auto min-w-0">
                <span className="hidden sm:inline text-[9px] font-mono tracking-[0.18em] text-subtle uppercase shrink-0">
                  Ratio
                </span>
                <AspectRatioSelector value={ratio} onChange={setRatio} />
              </div>

              <div className="flex items-center gap-3 sm:gap-5 px-3 sm:px-5 shrink-0 border-l border-border">
                <button
                  role="switch"
                  aria-checked={extendMode}
                  onClick={() => setExtendMode(v => !v)}
                  className={`flex items-center gap-2.5 cursor-pointer transition-colors duration-150 ${extendMode ? "text-accent" : "text-muted hover:text-foreground"}`}
                >
                  <div className={`relative w-7 h-3.5 rounded-full transition-colors duration-200 ${extendMode ? "bg-accent" : "bg-surface-2 border border-border"}`}>
                    <div className={`absolute w-[10px] h-[10px] rounded-full transition-all duration-200 ${extendMode ? "top-[2px] left-[14px] bg-canvas" : "top-[1px] left-[2px] bg-muted"}`} />
                  </div>
                  <span className="text-[10px] font-mono tracking-[0.1em] uppercase">
                    Extend canvas
                  </span>
                </button>

                {cropBox && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono tracking-[0.18em] text-subtle uppercase">out</span>
                    <span className="text-[11px] font-mono tracking-[0.04em] tabular-nums">
                      {Math.round(cropBox.w)} &times; {Math.round(cropBox.h)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-3 sm:p-8 bg-canvas dot-grid overflow-hidden">
              <div className="relative inline-block leading-[0] shadow-[0_12px_48px_rgba(0,0,0,0.7)] max-w-full">
                <div className="absolute inset-0 checkerboard" />

                <div
                  ref={containerRef}
                  className={`relative ${extendMode ? "p-[280px] bg-black [outline:1px_dashed_rgba(212,135,10,0.2)]" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt="Uploaded"
                    onLoad={(e) => handleImageLoad(e)}
                    className="block max-w-[min(900px,calc(100vw-24px))] sm:max-w-[min(900px,calc(100vw-120px))] max-h-[calc(100vh-200px)] object-contain"
                    draggable={false}
                  />

                  {cropBox && containerSize.w > 0 && (() => {
                    const pad = extendMode ? EXTEND_PAD : 0;
                    const imgDisplayW = containerSize.w - pad * 2;
                    const imgDisplayH = containerSize.h - pad * 2;
                    const scaleX = imgDisplayW > 0 ? naturalSize.w / imgDisplayW : 1;
                    const scaleY = imgDisplayH > 0 ? naturalSize.h / imgDisplayH : 1;
                    return (
                      <CropOverlay
                        containerWidth={containerSize.w}
                        containerHeight={containerSize.h}
                        cropBox={cropBox}
                        onChange={setCropBox}
                        aspectRatio={getAspectRatioValue(ratio)}
                        outputScaleX={scaleX}
                        outputScaleY={scaleY}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {showExportSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShowExportSheet(false)}
        >
          <div
            className="bg-surface border-t border-border rounded-t-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 pt-4 pb-1 text-center">
              <span className="text-[9px] font-mono tracking-[0.2em] text-subtle uppercase">Export Image</span>
            </div>

            <div className="flex flex-col gap-1 p-3">
              <button
                onClick={handleExportToCameraRoll}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-accent text-canvas text-[11px] font-mono tracking-[0.12em] uppercase font-medium active:opacity-75 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="12" height="9" rx="1.5" />
                  <circle cx="7" cy="7.5" r="2.2" />
                  <path d="M4.5 3V2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5V3" />
                </svg>
                Save to Camera Roll
              </button>

              <button
                onClick={handleExportToFiles}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface-2 text-foreground text-[11px] font-mono tracking-[0.12em] uppercase active:opacity-75 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 1v8M4 6.5l3 3 3-3" />
                  <path d="M2 10v1.5A1.5 1.5 0 0 0 3.5 13h7A1.5 1.5 0 0 0 12 11.5V10" />
                </svg>
                Save to Files
              </button>
            </div>

            <div className="px-3 pb-3">
              <button
                onClick={() => setShowExportSheet(false)}
                className="w-full px-4 py-3.5 rounded-xl bg-surface-2 text-subtle text-[11px] font-mono tracking-[0.12em] uppercase active:opacity-75 transition-opacity"
              >
                Cancel
              </button>
            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}
    </main>
  );
}
