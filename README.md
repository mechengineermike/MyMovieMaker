# Python Movie Maker

A small, entirely client-side browser video editor inspired by the simplicity of early Windows Movie Maker. Import clips, trim and rearrange them, add a music track, and export—without accounts, uploads, tracking, or a backend.

## Run locally

The app uses browser ES modules, so serve the directory with any static web server:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. Chrome or Edge is recommended.

## Features

- Local video and audio import, including drag and drop
- Sequential clip timeline with trimming, splitting, reordering, and deletion
- Synchronized multi-clip preview and scrubbable playhead
- One movable music track plus simple volume and mute controls
- Undo and redo
- Human-readable JSON project files with a relink workflow
- Local WebM export at original/1080p/720p and normal/high quality
- Static hosting with no backend or build step

## Export note

Export uses the browser's native `MediaRecorder` encoder, producing a WebM file in real time. This keeps the initial app small and reliable on static hosting. A future optional FFmpeg/WASM adapter can add MP4 without coupling the editor and project model to a specific render engine.

## GitHub Pages

Push the repository to GitHub and enable **Settings → Pages → Deploy from a branch**, selecting the repository root. The included `.nojekyll` file ensures the static files are served unchanged.

## License

MIT
