import { CropBox } from "./CropOverlay";

export async function cropImage(
  src: string,
  containerWidth: number,
  containerHeight: number,
  cropBox: CropBox,
  imageOffset = { x: 0, y: 0 },
  fillColor = "#000000",
  outputFormat: "image/png" | "image/jpeg" | "image/webp" = "image/png",
  quality = 0.95
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const imgDisplayW = containerWidth - imageOffset.x * 2;
      const imgDisplayH = containerHeight - imageOffset.y * 2;

      const scaleX = img.naturalWidth / imgDisplayW;
      const scaleY = img.naturalHeight / imgDisplayH;

      const outW = Math.round(cropBox.w * scaleX);
      const outH = Math.round(cropBox.h * scaleY);

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D context unavailable"));

      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, outW, outH);

      const imgLeft = imageOffset.x;
      const imgTop = imageOffset.y;
      const imgRight = imgLeft + imgDisplayW;
      const imgBottom = imgTop + imgDisplayH;

      const overlapL = Math.max(cropBox.x, imgLeft);
      const overlapT = Math.max(cropBox.y, imgTop);
      const overlapR = Math.min(cropBox.x + cropBox.w, imgRight);
      const overlapB = Math.min(cropBox.y + cropBox.h, imgBottom);

      if (overlapL < overlapR && overlapT < overlapB) {
        const sx = (overlapL - imgLeft) * scaleX;
        const sy = (overlapT - imgTop) * scaleY;
        const sw = (overlapR - overlapL) * scaleX;
        const sh = (overlapB - overlapT) * scaleY;

        const dx = (overlapL - cropBox.x) * scaleX;
        const dy = (overlapT - cropBox.y) * scaleY;
        const dw = sw;
        const dh = sh;

        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      }

      resolve(canvas.toDataURL(outputFormat, quality));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function downloadDataUrl(dataUrl: string, filename = "crop") {
  const ext = dataUrl.split(";")[0].split("/")[1] ?? "png";
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${filename}.${ext}`;
  a.click();
}
