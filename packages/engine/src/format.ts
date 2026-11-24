export type MetricFormat = "int" | "usd" | "ms" | "pct" | "dec" | undefined;

export function formatMetric(value: number | string, format: MetricFormat, locale = "en-US"): string {
  if (typeof value === "string") return value;
  switch (format) {
    case "usd":
      return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", minimumFractionDigits: value < 1 ? 4 : 2, maximumFractionDigits: value < 1 ? 4 : 2 }).format(value);
    case "pct":
      return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(value);
    case "ms":
      return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} ms`;
    case "dec":
      return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    default:
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  }
}

export type Severity = "ok" | "warn" | "danger";
export function severity(value: number | string, warnAt?: number, dangerAt?: number): Severity {
  if (typeof value !== "number") return "ok";
  if (dangerAt !== undefined && value >= dangerAt) return "danger";
  if (warnAt !== undefined && value >= warnAt) return "warn";
  return "ok";
}
