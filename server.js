import express from "express";
import cors    from "cors";
import fs      from "fs";

const app = express();
app.use(cors());
app.use(express.static("public"));

// ── Credentials ──────────────────────────────────────────
const creds = JSON.parse(fs.readFileSync("./credentials.json", "utf8"));

// ── Token cache with expiry ───────────────────────────────
// OpenSky tokens expire after ~1 hour. We store the expiry time
// and refresh 60 s before it lapses so the disc never goes dark.
let tokenCache = { value: null, expiresAt: 0 };

async function getToken() {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expiresAt - 60_000) return tokenCache.value;

  console.log("Fetching new OpenSky token…");
  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     creds.clientId,
    client_secret: creds.clientSecret
  });
  const r = await fetch(
    "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token",
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
  );
  if (!r.ok) throw new Error(`Token fetch failed: ${r.status}`);
  const data = await r.json();
  if (!data.access_token) throw new Error("No access_token in response");

  const expiresIn = (data.expires_in || 3600) * 1000;
  tokenCache = { value: data.access_token, expiresAt: now + expiresIn };
  console.log(`Token refreshed — expires in ${Math.round(expiresIn / 60000)} min`);
  return tokenCache.value;
}

// ── Haversine distance (km) ───────────────────────────────
function km(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180)
             * Math.cos(lat2 * Math.PI / 180)
             * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Last-known cache ──────────────────────────────────────
let lastKnown = { planes: [], fetchedAt: null };

// ── /planes endpoint ─────────────────────────────────────
app.get("/planes", async (req, res) => {
  const lat    = parseFloat(req.query.lat);
  const lon    = parseFloat(req.query.lon);
  const radius = parseFloat(req.query.radius);

  if (isNaN(lat) || isNaN(lon) || isNaN(radius))
    return res.status(400).json({ error: "lat, lon and radius are required" });

  console.log({ lat, lon, radius });

  try {
    const access = await getToken();
    const response = await fetch(
      "https://opensky-network.org/api/states/all",
      { headers: { Authorization: `Bearer ${access}` } }
    );

    if (response.status === 401) {
      tokenCache = { value: null, expiresAt: 0 };
      throw new Error("OpenSky 401 — token cleared");
    }
    if (!response.ok) throw new Error(`OpenSky returned ${response.status}`);

    const data   = await response.json();
    const nearby = [];

    for (const p of data.states || []) {
      if (!p[5] || !p[6]) continue;
      const d = km(lat, lon, p[6], p[5]);
      if (d <= radius) {
        nearby.push({
          flight:       (p[1] || "").trim(),
          lat:          p[6],
          lon:          p[5],
          distance:     Math.round(d * 10) / 10,
          heading:      p[10],
          // Altitude — both metres and feet
          altitudeM:    p[7]  != null ? Math.round(p[7])           : null,
          altitudeFt:   p[7]  != null ? Math.round(p[7] * 3.28084) : null,
          // Speed — km/h, mph, knots
          speedKmh:     p[9]  != null ? Math.round(p[9] * 3.6)     : null,
          speedMph:     p[9]  != null ? Math.round(p[9] * 2.23694) : null,
          speedKnots:   p[9]  != null ? Math.round(p[9] * 1.94384) : null,
          // Vertical rate in ft/min (positive = climbing)
          verticalRate: p[11] != null ? Math.round(p[11] * 196.85) : null,
          onGround:     p[8]  || false,
          icao:         p[0],
          country:      p[2],
          squawk:       p[14] || null,
        });
      }
    }

    console.log("Nearby:", nearby.length);
    lastKnown = { planes: nearby, fetchedAt: new Date().toISOString() };
    res.json({ planes: nearby, stale: false });

  } catch (e) {
    console.error("Fetch error — serving last known:", e.message);
    res.json({ planes: lastKnown.planes, stale: true, fetchedAt: lastKnown.fetchedAt });
  }
});

// ── Start ─────────────────────────────────────────────────
app.listen(3000, () => console.log("Little Radar running on :3000"));