// Singleton HTMLAudioElement + tiny subscription model.
// Lets multiple components share one playing audio source.

import { useEffect, useState, useSyncExternalStore, useRef } from 'react';
import Hls from 'hls.js';

export const DEMO_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';

function isHls(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url);
}

type Listener = () => void;

class AudioEngine {
  private el: HTMLAudioElement | null = null;
  private hls: Hls | null = null;
  private listeners = new Set<Listener>();
  src = '';
  playing = false;
  currentTime = 0;
  duration = 0;
  loading = false;

  private ensure(): HTMLAudioElement {
    if (typeof window === 'undefined') throw new Error('AudioEngine on server');
    if (!this.el) {
      this.el = new Audio();
      this.el.preload = 'metadata';
      this.el.crossOrigin = 'anonymous';
      this.el.addEventListener('play', () => { this.playing = true; this.emit(); });
      this.el.addEventListener('pause', () => { this.playing = false; this.emit(); });
      this.el.addEventListener('timeupdate', () => {
        this.currentTime = this.el!.currentTime;
        this.emit();
      });
      this.el.addEventListener('loadedmetadata', () => {
        this.duration = this.el!.duration || 0;
        this.loading = false;
        this.emit();
      });
      this.el.addEventListener('waiting', () => { this.loading = true; this.emit(); });
      this.el.addEventListener('playing', () => { this.loading = false; this.emit(); });
      this.el.addEventListener('ended', () => { this.playing = false; this.emit(); });
      this.el.addEventListener('error', () => {
        this.loading = false; this.playing = false; this.emit();
        console.log('AudioEngine error on source', this.src);
      });
    }
    return this.el;
  }

  setSource(url: string, autoplay = true) {
    const el = this.ensure();
    if (this.src === url) {
      if (autoplay) void el.play().catch((e) => console.log('audio play rejected:', e));
      return;
    }
    this.src = url;
    this.currentTime = 0;
    this.duration = 0;
    this.loading = true;
    // Tear down previous HLS instance if any
    if (this.hls) { try { this.hls.destroy(); } catch { /* ignore */ } this.hls = null; }
    if (isHls(url) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.attachMedia(el);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(url));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) console.log('HLS audio fatal error', data);
      });
      this.hls = hls;
    } else {
      el.src = url;
      el.load();
    }
    if (autoplay) void el.play().catch((e) => console.log('audio play rejected:', e));
    this.emit();
  }

  play() {
    const el = this.ensure();
    void el.play().catch((e) => console.log('audio play rejected:', e));
  }

  pause() {
    if (!this.el) return;
    this.el.pause();
  }

  toggle() {
    if (this.playing) this.pause(); else this.play();
  }

  seek(seconds: number) {
    const el = this.ensure();
    if (!isFinite(seconds)) return;
    el.currentTime = Math.max(0, Math.min(seconds, this.duration || seconds));
    this.currentTime = el.currentTime;
    this.emit();
  }

  stop() {
    if (this.hls) { try { this.hls.destroy(); } catch { /* ignore */ } this.hls = null; }
    if (!this.el) return;
    this.el.pause();
    this.el.removeAttribute('src');
    this.el.load();
    this.src = '';
    this.playing = false;
    this.currentTime = 0;
    this.duration = 0;
    this.emit();
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private emit() { this.listeners.forEach((l) => l()); }
}

export const audioEngine = new AudioEngine();

/**
 * @deprecated High-frequency. Rerenders on every `timeupdate` (5×/s). Prefer
 * `useAudioSelector` to subscribe only to the slice you actually read, or
 * call `audioEngine.play()/.pause()` imperatively for fire-and-forget actions.
 */
export function useAudioEngine() {
  const [, force] = useState(0);
  useEffect(() => audioEngine.subscribe(() => force((n) => n + 1)), []);
  return audioEngine;
}

/**
 * Re-renders only when the selected slice changes. Use this when you read
 * just one or two fields (e.g. `playing`, or `src`) — avoids the 5×/s tick
 * from `timeupdate` that `useAudioEngine` triggers.
 *
 * Example:
 *   const playing = useAudioSelector(e => e.playing);
 *   const { src, loading } = useAudioSelector(e => ({ src: e.src, loading: e.loading }), shallowEqual);
 */
export function useAudioSelector<T>(
  selector: (e: AudioEngine) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;
  const lastRef = useRef<{ value: T }>({ value: selector(audioEngine) });

  const subscribe = (cb: () => void) =>
    audioEngine.subscribe(() => {
      const next = selectorRef.current(audioEngine);
      if (!isEqualRef.current(lastRef.current.value, next)) {
        lastRef.current = { value: next };
        cb();
      }
    });
  const getSnapshot = () => lastRef.current.value;
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  if (a === b) return true;
  const ka = Object.keys(a); const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!Object.is(a[k], b[k])) return false;
  return true;
}

export function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}
