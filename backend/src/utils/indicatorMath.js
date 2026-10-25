import { ApiError } from "./ApiError.js";
export function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}
export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b),
    m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}
export function percentage(part, total) {
  return total ? 100 * part / total : null;
}
export function variation(current, previous) {
  return previous ? 100 * (current - previous) / previous : null;
}
export function group(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const value = String(key(row) ?? "Não informado");
    map.set(value, (map.get(value) || 0) + 1);
  }
  return [...map].map(([name, total]) => ({
    name,
    total
  })).sort((a, b) => b.total - a.total);
}
function calendarDay(value, timezone) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}
function boundary(day, timezone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new ApiError("Data inválida.", 422);
  const target = Date.parse(day + "T00:00:00Z");
  if (!Number.isFinite(target) || new Date(target).toISOString().slice(0, 10) !== day) throw new ApiError("Data inválida.", 422);
  let guess = target;
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(format.formatToParts(new Date(guess)).filter(x => x.type !== "literal").map(x => [x.type, x.value]));
    const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    guess += target - local;
  }
  return new Date(guess);
}
export function period(query, now = new Date(), timezone = "America/Recife") {
  try {
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: timezone
    }).format(now);
  } catch {
    throw new ApiError("Fuso horário do condomínio inválido.", 422);
  }
  const endDay = query.end || calendarDay(now, timezone);
  boundary(endDay, timezone);
  const startDay = query.start || new Date(Date.parse(endDay + "T00:00:00Z") - 29 * 86400000).toISOString().slice(0, 10);
  const start = boundary(startDay, timezone),
    nextDay = new Date(Date.parse(endDay + "T00:00:00Z") + 86400000).toISOString().slice(0, 10),
    end = new Date(boundary(nextDay, timezone).getTime() - 1);
  boundary(endDay, timezone);
  if (start > end || end - start > 90 * 86400000) throw new ApiError("Informe um período válido de até 90 dias.", 422);
  return {
    start,
    end,
    previousStart: new Date(start.getTime() - (end - start + 1)),
    previousEnd: new Date(start.getTime() - 1),
    timezone
  };
}
export function secondsBetween(a, b) {
  if (!a || !b) return null;
  const v = (new Date(b) - new Date(a)) / 1000;
  return Number.isFinite(v) && v >= 0 ? v : null;
}
