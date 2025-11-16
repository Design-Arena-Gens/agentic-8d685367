'use client';

import type { DerivedMetrics } from '@/lib/trajectory';

interface MetricsPanelProps {
  metrics: DerivedMetrics | null;
  framesProcessed: number;
  detections: number;
}

const metricOrder: { key: keyof DerivedMetrics; label: string; unit?: string }[] = [
  { key: 'releaseVelocityKph', label: 'Release Velocity', unit: 'km/h' },
  { key: 'lengthCategory', label: 'Length Category' },
  { key: 'projectedPitchMeters', label: 'Pitch Length', unit: 'm' },
  { key: 'apexHeightMeters', label: 'Apex Height', unit: 'm' },
  { key: 'predictedImpact', label: 'Impact Prediction' }
];

export function MetricsPanel({ metrics, framesProcessed, detections }: MetricsPanelProps) {
  return (
    <div className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-panel backdrop-blur">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-semibold tracking-wide text-slate-200">Delivery Insights</h2>
          <p className="text-sm text-slate-400">
            Frames {framesProcessed.toLocaleString()} • Detections {detections.toLocaleString()}
          </p>
        </div>
        <div className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300">
          {metrics ? 'Trajectory locked' : 'Awaiting detection'}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metricOrder.map(({ key, label, unit }) => (
          <div key={key} className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {metrics ? (
                <>
                  {metrics[key]}
                  {unit && typeof metrics[key] === 'number' ? (
                    <span className="ml-1 text-base text-slate-400">{unit}</span>
                  ) : null}
                </>
              ) : (
                <span className="text-slate-700">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
