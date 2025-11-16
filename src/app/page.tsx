import { VideoAnalyzer } from '@/components/VideoAnalyzer';

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-10 md:px-8">
      <header className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.4em] text-sky-300/80">Agentic Vision Lab</span>
        <h1 className="text-4xl font-semibold text-slate-50 md:text-5xl">
          Cricket Bowling Analysis &amp; Hawk-Eye Projection
        </h1>
        <p className="max-w-2xl text-base text-slate-400">
          Upload a delivery clip, auto-track the seam, and inspect a reconstructed Hawk-Eye view built for
          high-speed tactical review and coaching. All compute happens in-browser.
        </p>
      </header>
      <VideoAnalyzer />
      <footer className="border-t border-slate-800 pt-6 text-xs text-slate-500">
        Processing happens fully on-device. For best results, provide HD footage with a clear sight of the
        ball against the background.
      </footer>
    </main>
  );
}
