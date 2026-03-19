/**
 * Minimal Redis REST client for Upstash / Vercel KV.
 * Zero dependencies — uses native fetch().
 *
 * Env vars required:
 *   UPSTASH_REDIS_REST_URL   — e.g. https://xxxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN — Bearer token
 */

const url = () => process.env.UPSTASH_REDIS_REST_URL!;
const token = () => process.env.REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!;

async function exec<T = unknown>(...args: (string | number)[]): Promise<T> {
  const res = await fetch(`${url()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    throw new Error(`KV error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.result as T;
}

export const kv = {
  /** GET key → string | null */
  get: (key: string) => exec<string | null>("GET", key),

  /** SET key value */
  set: (key: string, value: string) => exec("SET", key, value),

  /** SET key value EX seconds (with TTL) */
  setex: (key: string, seconds: number, value: string) =>
    exec("SET", key, value, "EX", seconds),

  /** DEL key */
  del: (key: string) => exec("DEL", key),

  /** KEYS pattern */
  keys: (pattern: string) => exec<string[]>("KEYS", pattern),
};
