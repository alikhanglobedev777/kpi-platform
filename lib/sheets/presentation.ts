import {departments, type Department, type Field} from "./schema";
import {previousSaturday} from "./values";
import type {Row} from "./records";

const numberFormat = new Intl.NumberFormat("en-US", {maximumFractionDigits: 2});
const currencyFormat = new Intl.NumberFormat("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 2});
export function formatCell(field: Field, value: string | undefined): string {
  if (value === undefined || value === "") return "—";
  if (field.kind === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isFinite(date.getTime())) return new Intl.DateTimeFormat("en-US", {month: "short", day: "numeric", year: "numeric", timeZone: "UTC"}).format(date);
  }
  if (["integer", "decimal", "money", "cash", "percent"].includes(field.kind) && Number.isFinite(Number(value))) {
    if (field.kind === "money" || field.kind === "cash") return currencyFormat.format(Number(value));
    return numberFormat.format(Number(value)) + (field.kind === "percent" ? "%" : "");
  }
  return value;
}
export const summaryColumns: Partial<Record<Department, string[]>> = {
  hr: ["B", "C", "D", "E"], business_development: ["G", "B", "E", "F"], scheduling: ["B", "C", "D"], financial: ["B", "D", "E", "J"], clinical: ["F", "G", "H", "I"], founder_transition: ["B", "D"],
};
export function latestCompletedRecord(rows: Row[], cutoff = previousSaturday()): Row | undefined {
  return rows.filter(r => r.filled && r.id <= cutoff).sort((a,b) => b.id.localeCompare(a.id))[0];
}
export function entryRecord(rows: Row[], cutoff = previousSaturday()): Row | undefined {
  return rows.find(r => r.id === cutoff);
}
export function numericFields(tab: Department): Field[] {
  return departments[tab].fields.filter(f => ["integer", "decimal", "money", "cash", "percent"].includes(f.kind));
}
export function numericValue(value: string | undefined): number | null {
  return value === undefined || value.trim() === "" || !Number.isFinite(Number(value)) ? null : Number(value);
}
