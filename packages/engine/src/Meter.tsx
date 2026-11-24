"use client";
import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import type { Metric } from "@tbt/content";
import { formatMetric, severity } from "./format";

export function Meter({ metric, reduced }: { metric: Metric; reduced?: boolean }) {
  const [shown, setShown] = useState<number | string>(metric.value);
  const prev = useRef<number | string>(metric.value);
  useEffect(() => {
    const from = prev.current;
    const to = metric.value;
    prev.current = to;
    if (typeof from !== "number" || typeof to !== "number" || reduced || from === to) {
      setShown(to);
      return;
    }
    const controls = animate(from, to, { duration: 0.6, ease: "easeOut", onUpdate: setShown });
    return () => controls.stop();
  }, [metric.value, reduced]);
  const sev = severity(metric.value, metric.warnAt, metric.dangerAt);
  return (
    <div className="tbt-meter" data-severity={sev} data-testid={`meter-${metric.id}`}>
      <div className="tbt-meter-label">{metric.label}</div>
      <div className="tbt-meter-value" data-final={formatMetric(metric.value, metric.format)}>
        {formatMetric(shown, metric.format)}
        {metric.unit ? <span className="tbt-meter-unit"> {metric.unit}</span> : null}
      </div>
    </div>
  );
}

export function MetricList({ metrics, reduced }: { metrics?: Metric[]; reduced?: boolean }) {
  if (!metrics?.length) return null;
  return (
    <div className="tbt-meters">
      {metrics.map((m) => <Meter key={m.id} metric={m} reduced={reduced} />)}
    </div>
  );
}
