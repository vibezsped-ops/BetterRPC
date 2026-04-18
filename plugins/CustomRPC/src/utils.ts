import type { RPCProfile } from "./types";
import { ActivityType } from "./types";

function isValid(val: any): boolean {
  if (val === false || val === 0) return true;
  if (val === null || val === undefined) return false;
  if (typeof val === "string") return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "object") return Object.keys(val).length > 0;
  return true;
}

export function cloneAndFilter<T extends object>(obj: T): T {
  const filter = (_key: PropertyKey, value: any) => {
    if (value === obj) return value;
    if (typeof _key === "string" && (_key as string).startsWith("_")) return undefined;
    return isValid(value) ? value : undefined;
  };
  return JSON.parse(JSON.stringify(obj, filter));
}

export function makeDefaultProfile(): RPCProfile {
  return {
    name: "Discord",
    application_id: "1054951789318909972",
    type: ActivityType.PLAYING,
    details: "",
    state: "",
    assets: {},
    buttons: [{}, {}],
    timestamps: { _enabled: false, start: Date.now() },
    playlist: {
      enabled: false,
      loop: true,
      tracks: [],
      _currentIndex: 0,
    },
  };
}

// Czy obrazek to URL czy asset key
export function isUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

// Generuje unikalny klucz dla profilu
export function uniqueKey(base: string, existing: string[]): string {
  let key = base.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  let i = 1;
  while (existing.includes(key)) key = `${key}_${i++}`;
  return key;
}
