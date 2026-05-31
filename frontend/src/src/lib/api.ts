const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? "https://api.gamevault.es";

export async function fetchJSON(path: string) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} -> ${url}`);
  return res.json();
}
