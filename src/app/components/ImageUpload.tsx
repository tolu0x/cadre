"use client";

import { useRef, useState, useCallback } from "react";

interface ImageUploadProps {
  onImageLoaded: (dataUrl: string, fileName: string) => void;
}

export default function ImageUpload({ onImageLoaded }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Only image files are supported.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") onImageLoaded(result, file.name);
      };
      reader.readAsDataURL(file);
    },
    [onImageLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const bracketColor = isDragging
    ? "border-accent"
    : "border-subtle/70 group-hover:border-accent/50";

  const bracketSize = isDragging
    ? "w-7 h-7"
    : "w-5 h-5 group-hover:w-6 group-hover:h-6";

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`group relative flex flex-col items-center justify-center gap-7 py-12 px-10 sm:py-20 sm:px-20 cursor-pointer select-none transition-colors duration-200 ${isDragging ? "bg-accent/[3%]" : ""}`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className={`absolute top-0 left-0 border-t border-l transition-all duration-200 ${bracketSize} ${bracketColor}`} />
      <div className={`absolute top-0 right-0 border-t border-r transition-all duration-200 ${bracketSize} ${bracketColor}`} />
      <div className={`absolute bottom-0 left-0 border-b border-l transition-all duration-200 ${bracketSize} ${bracketColor}`} />
      <div className={`absolute bottom-0 right-0 border-b border-r transition-all duration-200 ${bracketSize} ${bracketColor}`} />

      <div className={`relative w-11 h-11 transition-transform duration-200 ${isDragging ? "scale-110" : "group-hover:scale-105"}`}>
        <div className={`absolute top-1/2 inset-x-0 h-px transition-colors duration-200 ${isDragging ? "bg-accent" : "bg-subtle group-hover:bg-accent/50"}`} />
        <div className={`absolute left-1/2 inset-y-0 w-px transition-colors duration-200 ${isDragging ? "bg-accent" : "bg-subtle group-hover:bg-accent/50"}`} />
        <div className={`absolute inset-[5px] rounded-full border transition-colors duration-200 ${isDragging ? "border-accent" : "border-subtle group-hover:border-accent/50"}`} />
      </div>

      <div className="text-center">
        <p className={`m-0 font-display text-[22px] tracking-[0.12em] transition-colors duration-200 ${isDragging ? "text-accent" : "text-foreground group-hover:text-accent/80"}`}>
          {isDragging ? "RELEASE TO LOAD" : "DROP IMAGE HERE"}
        </p>
        <p className="m-0 mt-2 text-[11px] font-mono tracking-[0.08em] text-muted">
          or click to browse &nbsp;·&nbsp; JPG PNG WebP GIF
        </p>
      </div>

      {error && (
        <p className="m-0 text-xs text-danger font-mono">{error}</p>
      )}
    </div>
  );
}
