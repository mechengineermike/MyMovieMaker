import { timelineAt } from './project.js';

const waitFor = (element, event) => new Promise((resolve, reject) => {
  element.addEventListener(event, resolve, { once: true });
  element.addEventListener('error', reject, { once: true });
});

export class BrowserExporter {
  constructor(store, library) { this.store = store; this.library = library; this.cancelled = false; }
  cancel() { this.cancelled = true; }

  async render({ resolution = 'original', quality = 'normal', format = 'mp4', onProgress = () => {} }) {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error('This browser cannot export video. Use a recent Chrome or Edge release.');
    const state = this.store.state, duration = this.store.duration;
    if (!duration) throw new Error('Add at least one clip before exporting.');
    for (const clip of state.clips) if (clip.kind !== 'blank' && !this.library.get(clip.assetId)) throw new Error(`Reconnect “${clip.name}” before exporting.`);
    this.cancelled = false;
    const firstVideo = state.clips.find(c => c.kind !== 'blank');
    const first = firstVideo ? this.library.get(firstVideo.assetId) : { width: 1920, height: 1080 };
    const target = resolution === '720' ? 720 : 1080, ratio = (first.width || 1920) / (first.height || 1080);
    let height = resolution === 'original' ? Math.min(first.height || 1080, 1080) : target;
    let width = Math.round(height * ratio); width -= width % 2; height -= height % 2;
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'), stream = canvas.captureStream(30);
    const audioCtx = new AudioContext(), destination = audioCtx.createMediaStreamDestination();
    const video = document.createElement('video'), music = document.createElement('audio'); video.volume = 0; music.volume = 0;
    const videoSource = audioCtx.createMediaElementSource(video), musicSource = audioCtx.createMediaElementSource(music);
    const videoGain = audioCtx.createGain(), musicGain = audioCtx.createGain();
    videoGain.gain.value = state.videoMuted ? 0 : state.videoVolume; musicGain.gain.value = state.musicMuted ? 0 : state.musicVolume;
    videoSource.connect(videoGain).connect(destination); musicSource.connect(musicGain).connect(destination);
    for (const track of destination.stream.getAudioTracks()) stream.addTrack(track);
    const mp4 = ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4;codecs="avc1.42E01E"', 'video/mp4'];
    const webm = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mime = (format === 'mp4' ? mp4 : webm).find(type => MediaRecorder.isTypeSupported(type));
    if (!mime) throw new Error(format === 'mp4' ? 'This browser cannot encode MP4 locally. Update Chrome/Edge or choose WebM.' : 'No supported WebM encoder was found.');
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: quality === 'high' ? 12_000_000 : 7_000_000 });
    const chunks = []; recorder.ondataavailable = event => event.data.size && chunks.push(event.data);
    const stopped = new Promise((resolve, reject) => { recorder.onstop = resolve; recorder.onerror = () => reject(new Error('The browser encoder stopped unexpectedly.')); });
    recorder.start(1000); await audioCtx.resume();
    const started = performance.now(); let lastClip = '';
    while (!this.cancelled) {
      const time = (performance.now() - started) / 1000; if (time >= duration) break;
      const hit = timelineAt(state, time); if (!hit) break;
      const clip = hit.clip;
      ctx.fillStyle = clip.kind === 'blank' ? (clip.background || '#111827') : '#000'; ctx.fillRect(0, 0, width, height);
      if (clip.kind !== 'blank') {
        const asset = this.library.get(clip.assetId);
        if (lastClip !== clip.id) { video.src = asset.url; await waitFor(video, 'loadeddata'); video.currentTime = hit.local; video.playbackRate = clip.speed || 1; await video.play(); lastClip = clip.id; }
        if (Math.abs(video.currentTime - hit.local) > .3) video.currentTime = hit.local;
        const rotation = clip.rotation || 0, swap = Math.abs(rotation % 180) === 90;
        const sourceWidth = video.videoWidth || width, sourceHeight = video.videoHeight || height;
        const fit = Math.min((width - 4) / (swap ? sourceHeight : sourceWidth), (height - 4) / (swap ? sourceWidth : sourceHeight));
        ctx.save(); ctx.translate(width / 2, height / 2); ctx.rotate(rotation * Math.PI / 180);
        ctx.drawImage(video, -sourceWidth * fit / 2, -sourceHeight * fit / 2, sourceWidth * fit, sourceHeight * fit); ctx.restore();
      } else video.pause();
      if (clip.text) { ctx.save(); ctx.fillStyle = clip.textColor || '#fff'; ctx.font = `700 ${clip.textSize || 48}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.shadowColor = '#000'; ctx.shadowBlur = 8; ctx.fillText(clip.text, width / 2, height * .9, width * .84); ctx.restore(); }
      if (state.audio) { const asset = this.library.get(state.audio.assetId), local = state.audio.in + time - state.audio.start; if (asset && local >= state.audio.in && local < state.audio.out) { if (music.src !== asset.url) { music.src = asset.url; music.currentTime = local; await music.play(); } else if (music.paused) await music.play(); } else music.pause(); }
      onProgress(time / duration); await new Promise(resolve => requestAnimationFrame(resolve));
    }
    video.pause(); music.pause(); recorder.stop(); await stopped; await audioCtx.close();
    if (this.cancelled) throw new DOMException('Export cancelled', 'AbortError');
    onProgress(1); return new Blob(chunks, { type: mime });
  }
}
