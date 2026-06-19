import { useEffect } from 'react';
import Hls from 'hls.js';

// Attaches an HLS source to a <video> when the URL is .m3u8 and the browser
// lacks native HLS (i.e. Chrome / Firefox). On Safari, native HLS is used.
export function useHlsVideo(videoRef: React.RefObject<HTMLVideoElement | null>, src: string) {
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src) return;
    const isHls = /\.m3u8(\?|$)/i.test(src);
    const canNative = el.canPlayType('application/vnd.apple.mpegurl') !== '';
    if (isHls && !canNative && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.attachMedia(el);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) console.log('HLS video fatal error', data);
      });
      return () => { try { hls.destroy(); } catch { /* ignore */ } };
    }
    // For native HLS or progressive MP4, set src directly
    if (el.src !== src) {
      el.src = src;
      el.load();
    }
  }, [src, videoRef]);
}
