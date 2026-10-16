// Netlify Function replacing the Express /planes route.
// Credentials come from env vars OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET.

let tokenCache = { value: null, expiresAt: 0 };
let lastKnown  = { planes: [], fetchedAt: null };

async function getToken() {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expiresAt - 60_000) return tokenCache.value;

  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     process.env.OPENSKY_CLIENT_ID,
    client_secret: process.env.OPENSKY_CLIENT_SECRET,
  });
  const r = await fetch(
    "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token",
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
  );
  if (!r.ok) throw new Error(`Token fetch failed: ${r.status}`);
  const data = await r.json();
  if (!data.access_token) throw new Error("No access_token in response");

  tokenCache = { value: data.access_token, expiresAt: now + (data.expires_in || 3600) * 1000 };
  return tokenCache.value;
}

function km(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  const q = new URL(req.url).searchParams;
  const lat = parseFloat(q.get("lat"));
  const lon = parseFloat(q.get("lon"));
  const radius = parseFloat(q.get("radius"));
  if (isNaN(lat) || isNaN(lon) || isNaN(radius))
    return json({ error: "lat, lon and radius are required" }, 400);

  try {
    const access = await getToken();
    const response = await fetch("https://opensky-network.org/api/states/all", {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (response.status === 401) {
      tokenCache = { value: null, expiresAt: 0 };
      throw new Error("OpenSky 401 — token cleared");
    }
    if (!response.ok) throw new Error(`OpenSky returned ${response.status}`);

    const data = await response.json();
    const nearby = [];
    for (const p of data.states || []) {
      if (!p[5] || !p[6]) continue;
      const d = km(lat, lon, p[6], p[5]);
      if (d > radius) continue;
      nearby.push({
        flight:       (p[1] || "").trim(),
        lat:          p[6],
        lon:          p[5],
        distance:     Math.round(d * 10) / 10,
        heading:      p[10],
        altitudeM:    p[7]  != null ? Math.round(p[7])           : null,
        altitudeFt:   p[7]  != null ? Math.round(p[7] * 3.28084) : null,
        speedKmh:     p[9]  != null ? Math.round(p[9] * 3.6)     : null,
        speedMph:     p[9]  != null ? Math.round(p[9] * 2.23694) : null,
        speedKnots:   p[9]  != null ? Math.round(p[9] * 1.94384) : null,
        verticalRate: p[11] != null ? Math.round(p[11] * 196.85) : null,
        onGround:     p[8]  || false,
        icao:         p[0],
        country:      p[2],
        squawk:       p[14] || null,
      });
    }
    lastKnown = { planes: nearby, fetchedAt: new Date().toISOString() };
    return json({ planes: nearby, stale: false });
  } catch (e) {
    console.error("Fetch error — serving last known:", e.message);
    return json({ planes: lastKnown.planes, stale: true, fetchedAt: lastKnown.fetchedAt });
  }
};

export const config = { path: "/planes" };
