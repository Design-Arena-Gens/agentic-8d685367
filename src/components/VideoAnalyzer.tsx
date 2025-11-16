'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { detectBallPosition, defaultDetectionSettings, type BallDetectionResult } from '@/lib/ballDetection';
import { estimateMetrics, type TrajectoryPoint, type DerivedMetrics } from '@/lib/trajectory';
import { HawkEyeView } from './HawkEyeView';
import { MetricsPanel } from './MetricsPanel';

interface AnalysisSettings {
  redThreshold: number;
  maxGreen: number;
  maxBlue: number;
  sampleStep: number;
  smoothWindow: number;
}

type AnalysisState = 'idle' | 'processing' | 'complete';

export function VideoAnalyzer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisState>('idle');
  const [framesProcessed, setFramesProcessed] = useState(0);
  const [detections, setDetections] = useState(0);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [metrics, setMetrics] = useState<DerivedMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);

  const [settings, setSettings] = useState<AnalysisSettings>({
    redThreshold: defaultDetectionSettings.redThreshold,
    maxGreen: defaultDetectionSettings.maxGreen,
    maxBlue: defaultDetectionSettings.maxBlue,
    sampleStep: defaultDetectionSettings.sampleStep,
    smoothWindow: 5
  });

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const smoothingBufferRef = useRef<TrajectoryPoint[]>([]);
  const trajectoryRef = useRef<TrajectoryPoint[]>([]);
  const frameCounterRef = useRef<number>(0);

  const reset = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setStatus('idle');
    setFramesProcessed(0);
    setDetections(0);
    setTrajectory([]);
    setMetrics(null);
    setError(null);
    setProcessingTime(0);
    smoothingBufferRef.current = [];
    trajectoryRef.current = [];
    frameCounterRef.current = 0;
  }, []);

  const handleFile = useCallback(
    (file: File | null) => {
      reset();
      if (!file) {
        setVideoURL(null);
        return;
      }
      const url = URL.createObjectURL(file);
      setVideoURL(url);
    },
    [reset]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (videoURL) {
        URL.revokeObjectURL(videoURL);
      }
    };
  }, [videoURL]);

  const drawOverlay = useCallback((detection: BallDetectionResult | null) => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { videoWidth, videoHeight } = video;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detection) return;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 12;
    ctx.arc(detection.x, detection.y, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(detection.x, detection.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const pushTrajectoryPoint = useCallback((point: TrajectoryPoint) => {
    smoothingBufferRef.current.push(point);
    const window = smoothingBufferRef.current;
    if (window.length > settings.smoothWindow) {
      window.shift();
    }

    const averaged = window.reduce(
      (acc, p) => {
        acc.x += p.x;
        acc.y += p.y;
        acc.confidence += p.confidence;
        return acc;
      },
      { x: 0, y: 0, confidence: 0 }
    );

    const len = window.length || 1;

    setTrajectory((prev) => [
      ...prev,
      {
        ...point,
        x: averaged.x / len,
        y: averaged.y / len,
        confidence: averaged.confidence / len
      }
    ]);
  }, [settings.smoothWindow]);

  const performAnalysis = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const processFrame = () => {
      if (!video || video.paused || video.ended) {
        rafRef.current = null;
        video?.pause();
        setStatus('complete');
        setProcessingTime(performance.now() - startTimeRef.current);
        setMetrics(estimateMetrics(trajectoryRef.current));
        return;
      }

      const { videoWidth, videoHeight } = video;
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);
      const detection = detectBallPosition(imageData, {
        redThreshold: settings.redThreshold,
        maxGreen: settings.maxGreen,
        maxBlue: settings.maxBlue,
        sampleStep: settings.sampleStep
      });

      setFramesProcessed((prev) => prev + 1);
      frameCounterRef.current += 1;

      if (detection) {
        setDetections((prev) => prev + 1);
        const nextPoint: TrajectoryPoint = {
          frame: frameCounterRef.current,
          timestamp: video.currentTime * 1000,
          x: detection.x,
          y: detection.y,
          confidence: detection.confidence
        };
        trajectoryRef.current.push(nextPoint);
        pushTrajectoryPoint(nextPoint);
        drawOverlay(detection);
        setMetrics(estimateMetrics(trajectoryRef.current));
      } else {
        drawOverlay(null);
      }

      rafRef.current = requestAnimationFrame(processFrame);
    };

    rafRef.current = requestAnimationFrame(processFrame);
  }, [drawOverlay, pushTrajectoryPoint, settings]);

  const handleStart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.videoWidth) {
      setError('Video metadata not loaded yet. Tap play to buffer, then analyse.');
      return;
    }
    trajectoryRef.current = [];
    smoothingBufferRef.current = [];
    frameCounterRef.current = 0;
    setTrajectory([]);
    setFramesProcessed(0);
    setDetections(0);
    setMetrics(null);
    setStatus('processing');
    setError(null);
    startTimeRef.current = performance.now();
    video.currentTime = 0;

    void video
      .play()
      .then(() => {
        performAnalysis();
      })
      .catch(() => {
        setError('Autoplay blocked by browser. Press play on the video, then run analyse again.');
        setStatus('idle');
      });
  }, [performAnalysis]);

  const formattedProcessing = useMemo(() => {
    if (!processingTime) return '—';
    return `${(processingTime / 1000).toFixed(1)}s`;
  }, [processingTime]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <section className="flex flex-col gap-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-panel">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">
                Bowling Trajectory to Hawk-Eye
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Upload a broadcast angle clip of a delivery. The detector will track the ball, reconstruct a
                trajectory, and render a Hawk-Eye inspired projection for rapid review.
              </p>
            </div>
            <div className="space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-slate-700 bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-500">
                <input
                  className="hidden"
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                {videoURL ? 'Replace delivery' : 'Upload delivery'}
              </label>
              <div className="text-xs text-slate-500">MP4, MOV, WEBM • ideal length 4–8 seconds</div>
            </div>
          </div>
          <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
            {videoURL ? (
              <>
                <video
                  ref={videoRef}
                  src={videoURL}
                  className="h-full w-full object-contain"
                  preload="auto"
                  controls
                  onPlaying={() => setStatus((prev) => (prev === 'processing' ? 'processing' : 'idle'))}
                  onPause={() => {
                    if (status === 'processing') {
                      setStatus('complete');
                    }
                  }}
                />
                <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
                <canvas ref={canvasRef} className="hidden" />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-600">
                Drop a delivery clip to begin analysis
              </div>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-panel backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.3em] text-slate-500">Detection Controls</div>
              <p className="mt-1 text-sm text-slate-400">
                Calibrate the colour thresholds if the ball isn&apos;t being captured cleanly.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="rounded-full bg-slate-800/70 px-3 py-1 font-medium text-slate-300">
                {status === 'processing' ? 'Analysing…' : status === 'complete' ? 'Complete' : 'Ready'}
              </span>
              <span className="rounded-full bg-slate-800/70 px-3 py-1">{formattedProcessing}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <ControlSlider
              label="Red threshold"
              min={80}
              max={220}
              value={settings.redThreshold}
              onChange={(value) => setSettings((prev) => ({ ...prev, redThreshold: value }))}
            />
            <ControlSlider
              label="Max green"
              min={40}
              max={200}
              value={settings.maxGreen}
              onChange={(value) => setSettings((prev) => ({ ...prev, maxGreen: value }))}
            />
            <ControlSlider
              label="Max blue"
              min={40}
              max={200}
              value={settings.maxBlue}
              onChange={(value) => setSettings((prev) => ({ ...prev, maxBlue: value }))}
            />
            <ControlSlider
              label="Smoothing window"
              min={1}
              max={12}
              value={settings.smoothWindow}
              onChange={(value) => setSettings((prev) => ({ ...prev, smoothWindow: value }))}
            />
            <ControlSlider
              label="Sample density"
              min={1}
              max={10}
              step={1}
              value={settings.sampleStep}
              onChange={(value) => setSettings((prev) => ({ ...prev, sampleStep: value }))}
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:bg-slate-700"
              disabled={!videoURL || status === 'processing'}
              onClick={handleStart}
            >
              {status === 'processing' ? 'Analysing…' : 'Analyse delivery'}
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-6 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500"
              onClick={reset}
            >
              Reset
            </button>
            {error ? <span className="text-sm text-rose-400">{error}</span> : null}
          </div>
        </div>
      </section>
      <aside className="flex flex-col gap-6">
        <MetricsPanel metrics={metrics} framesProcessed={framesProcessed} detections={detections} />
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-panel backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Hawk-Eye Projection</h3>
              <p className="text-sm text-slate-500">
                Top-down reconstruction of the tracked trajectory. Final impact marker shown in red.
              </p>
            </div>
          </div>
          <HawkEyeView points={trajectory} />
        </div>
      </aside>
    </div>
  );
}

interface ControlSliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}

function ControlSlider({ label, min, max, value, onChange, step }: ControlSliderProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
        <span>{label}</span>
        <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[0.6rem] text-slate-300">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-sky-500"
      />
    </label>
  );
}
