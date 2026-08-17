import { logger } from "./logger";

// Country lookup for a request IP. Only ever used to pre-select an entry in
// the shore picker — never to decide where someone lives. A third-party
// service being slow, wrong, or unreachable therefore costs nothing but a
// scroll, which is the whole reason the shore is a choice and not a guess.

export const UNKNOWN_COUNTRY = "Unknown";

const LOOKUP_TIMEOUT_MS = 3000;

// Default to a provider reachable over TLS. Overridable so a deployment with
// restricted egress, or a paid plan, can point somewhere else. `{ip}` is
// substituted with the address being looked up.
const PROVIDER_URL =
  process.env["GEOIP_URL"] ??
  "https://ipwho.is/{ip}?fields=success,country,country_code";

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((p) => Number(p));
  if (octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) return null;
  return octets;
}

/**
 * True for addresses that can never be geolocated: loopback, link-local, and
 * the RFC1918 private ranges. Note 172 is only private within 172.16–172.31 —
 * treating the whole /8 as private wrongly skips real public addresses.
 */
export function isNonRoutableIp(ip: string): boolean {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, "").trim();
  if (!clean) return true;
  if (clean === "::1" || clean === "::") return true;
  // IPv6 unique-local (fc00::/7) and link-local (fe80::/10)
  const lower = clean.toLowerCase();
  if (/^f[cd]/.test(lower) && lower.includes(":")) return true;
  if (lower.startsWith("fe80:")) return true;

  const octets = parseIpv4(clean);
  if (!octets) return false;
  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  // Carrier-grade NAT
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

/**
 * Best-effort ISO 3166-1 alpha-2 code for an address, or null. A code rather
 * than a name because Shore.code is the same standard, so no fuzzy matching
 * of "United States" against "United States of America" is needed.
 */
export async function detectCountryCode(ip: string): Promise<string | null> {
  const clean = ip.replace(/^::ffff:/, "").trim();
  if (isNonRoutableIp(clean)) return null;

  try {
    const res = await fetch(PROVIDER_URL.replace("{ip}", encodeURIComponent(clean)), {
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      success?: boolean;
      status?: string;
      country_code?: string;
      countryCode?: string;
    };
    const ok = data.success === true || data.status === "success";
    const code = data.country_code ?? data.countryCode;
    return ok && typeof code === "string" && code.length === 2
      ? code.toUpperCase()
      : null;
  } catch (err) {
    logger.debug({ err }, "[geoip] lookup failed");
    return null;
  }
}

/** The client address, honouring the proxy header the deployment sits behind. */
export function clientIp(headers: Record<string, unknown>, fallback: string | undefined): string {
  const forwarded = headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof raw === "string" && raw.length > 0) {
    const first = raw.split(",")[0]?.trim();
    if (first) return first;
  }
  return fallback ?? "";
}
