export function formatJsonPretty(raw: string): { ok: true; text: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, text: "" };
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return { ok: true, text: JSON.stringify(parsed, null, 2) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "JSON invalide" };
  }
}

export function minifyJson(raw: string): { ok: true; text: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, text: "" };
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return { ok: true, text: JSON.stringify(parsed) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "JSON invalide" };
  }
}

export function encodeBase64(text: string): string {
  if (typeof btoa === "undefined") return "";
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export function decodeBase64(text: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const binary = atob(text.trim());
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return { ok: true, text: new TextDecoder().decode(bytes) };
  } catch {
    return { ok: false, error: "Base64 invalide" };
  }
}

export function encodeURIComponentSafe(text: string): string {
  return encodeURIComponent(text);
}

export function decodeURIComponentSafe(text: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    return { ok: true, text: decodeURIComponent(text.trim()) };
  } catch {
    return { ok: false, error: "Encodage URL invalide" };
  }
}

export type JwtParts = {
  header: unknown;
  payload: unknown;
  signature: string;
};

export function decodeJwt(token: string): { ok: true; parts: JwtParts } | { ok: false; error: string } {
  const parts = token.trim().split(".");
  if (parts.length < 2) return { ok: false, error: "Jeton JWT incomplet" };
  try {
    const header = JSON.parse(decodeBase64Url(parts[0]!));
    const payload = JSON.parse(decodeBase64Url(parts[1]!));
    return {
      ok: true,
      parts: { header, payload, signature: parts.slice(2).join(".") },
    };
  } catch {
    return { ok: false, error: "Impossible de décoder le JWT" };
  }
}

function decodeBase64Url(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? padded : padded + "=".repeat(4 - (padded.length % 4));
  const binary = atob(pad);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function testRegex(
  pattern: string,
  flags: string,
  sample: string,
): { ok: true; matches: string[] } | { ok: false; error: string } {
  try {
    const re = new RegExp(pattern, flags);
    const matches: string[] = [];
    if (re.global) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(sample)) !== null) {
        matches.push(m[0]);
        if (m[0].length === 0) re.lastIndex++;
      }
    } else {
      const m = re.exec(sample);
      if (m) matches.push(m[0]);
    }
    return { ok: true, matches };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Expression invalide" };
  }
}

export function randomUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function hashText(text: string, algo: "SHA-256" | "SHA-1" = "SHA-256"): Promise<string> {
  if (!text || typeof crypto?.subtle?.digest !== "function") return "";
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function parseTimestampInput(raw: string): { ok: true; ms: number } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: "Saisie vide" };
  if (/^\d+$/.test(t)) {
    const n = Number(t);
    const ms = t.length <= 10 ? n * 1000 : n;
    if (Number.isNaN(ms)) return { ok: false, error: "Nombre invalide" };
    return { ok: true, ms };
  }
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return { ok: false, error: "Date invalide" };
  return { ok: true, ms: d.getTime() };
}

export function formatTimestampMs(ms: number, locale = "fr-FR"): string {
  return new Date(ms).toLocaleString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export type ParsedColor = {
  hex: string;
  rgb: string;
  hsl: string;
};

export function parseColorInput(raw: string): { ok: true; color: ParsedColor } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: "Couleur vide" };
  let r = 0;
  let g = 0;
  let b = 0;
  if (t.startsWith("#")) {
    const hex = t.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0]! + hex[0], 16);
      g = parseInt(hex[1]! + hex[1], 16);
      b = parseInt(hex[2]! + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return { ok: false, error: "Hex invalide" };
    }
  } else if (t.startsWith("rgb")) {
    const m = t.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return { ok: false, error: "RGB invalide" };
    r = Number(m[1]);
    g = Number(m[2]);
    b = Number(m[3]);
  } else {
    return { ok: false, error: "Format non reconnu (hex ou rgb)" };
  }
  if ([r, g, b].some((v) => Number.isNaN(v) || v < 0 || v > 255)) {
    return { ok: false, error: "Valeurs RGB hors plage" };
  }
  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  const { h, s, l } = rgbToHsl(r, g, b);
  return {
    ok: true,
    color: {
      hex,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
    },
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}
