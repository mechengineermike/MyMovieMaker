Test it out: https://mechengineermike.github.io/MyMovieMaker/

# My Movie Maker

A small, entirely client-side browser video editor inspired by the simplicity of early Windows Movie Maker. Import clips, trim and rearrange them, add a music track, and export—without accounts, uploads, tracking, or a backend.

## Features

- Local video and audio import, including drag and drop
- Sequential clip timeline with trimming, splitting, reordering, and deletion
- Synchronized multi-clip preview and scrubbable playhead
- One movable music track plus simple volume and mute controls
- Undo and redo
- Human-readable JSON project files with a relink workflow
- Native MP4 export where supported, with WebM fallback, at original/1080p/720p
- Per-clip playback speed and 90-degree rotation
- Per-clip overlay text plus configurable blank color scenes
- In-browser microphone voice-over recording synchronized to the playhead
- Right-side editing ribbon and built-in help
- Static hosting with no backend or build step

## Export note

Export uses the browser's native `MediaRecorder` encoder in real time. MP4 is offered when the browser exposes an H.264/MP4 encoder; WebM remains the broadly available fallback. This keeps the GitHub Pages app small and entirely local.

Project JSON files contain edit instructions and source filenames, not the source media itself. Browsers generally require you to choose the original files again after reopening a project; the relink dialog handles that safely.

## License

MIT
