# Cadre

A minimal, web-based image cropping tool. Made with love for my friends while listening to [Love Me Not](https://open.spotify.com/track/1UNEuG9DYOWiikf00ayr52).

## Features

- **Upload** images via drag-and-drop, file picker, or clipboard paste (accepts JPG, PNG, WebP & GIF)
- **Crop** with a draggable, resizable box. 8 handles and a move button
- **Aspect ratio presets** — 1:1, 16:9, 4:3, 3:4, 3:1, 9:16, or free-form
- **Extend canvas mode** pads the image with a black border
- **Live output dimensions** shown as you resize
- **Export** the cropped result as a PNG download
- **Dark / light theme** toggle

## Stack

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS 
- Canvas API for image processing

## Getting Started

```bash
pnpm install && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

