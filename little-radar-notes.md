# Little Radar
Version: 0.5
Status: Browser Prototype Active — Software Features In Progress

Owner: Rahul

---

# Project Vision

Build a small desktop device that behaves and feels like a radar.

This is not active radar.

The device is a passive aircraft tracker that continuously retrieves real aircraft positions
from the internet and visualises them as a radar experience.

Primary goal:

A magical object on a desk that quietly shows real planes flying overhead.

Device principles:

- Feels like a dedicated object
- Does one thing only
- Minimal interaction
- Beautiful radar visuals
- Continuous operation
- Real-world data

---

# Project Philosophy

Build the magic first.

Do not optimise hardware before the object proves itself.

Goal:

Look at desk.
See aircraft moving.
Smile.

---

# Product Definition

Category:
Desktop appliance

Version:
Personal prototype (V1)

Display:
Landscape touchscreen

Data:
Internet aircraft data

Interaction:
Touch

Power:
USB powered

Network:
Wi-Fi

Runtime:
Always-on radar

---

# Current Tech Stack

## Backend

- Runtime:      Node.js (ES Modules)
- Framework:    Express 5.1.0
- CORS:         enabled
- Endpoint:     GET /planes?lat=&lon=&radius=
- Port:         3000
- Auth:         OpenSky OAuth2 client credentials
- Token:        Auto-refresh with 60s buffer before expiry
- Fallback:     Last-known positions cache on API or network failure
- Credentials:  credentials.json (server-side only, gitignored)

## API Response Shape

    GET /planes?lat=&lon=&radius=
    →
    {
      planes: [
        {
          flight:       string,
          lat:          number,
          lon:          number,
          distance:     number (km),
          heading:      number (degrees),
          altitudeM:    number | null,
          altitudeFt:   number | null,
          speedKmh:     number | null,
          speedMph:     number | null,
          speedKnots:   number | null,
          verticalRate: number | null (ft/min, + = climbing),
          onGround:     boolean,
          icao:         string,
          country:      string,
          squawk:       string | null,
        }
      ],
      stale: boolean
    }

## Frontend

- Single file:  public/little-radar.html
- Rendering:    Browser Canvas API (map layer) + DOM (aircraft dots)
- Language:     Vanilla JavaScript, no frameworks, no build step
- Location:     Browser Geolocation API (watchPosition, persistent)
- Data:         Fetches from localhost:3000/planes every 15 seconds
- Map data:     Overpass API (roads, water, boundaries) — cached per location

## Project Structure

    little-radar/
    ├── server.js
    ├── package.json
    ├── package-lock.json
    ├── credentials.json        ← gitignored, never commit
    ├── little-radar-notes.md
    └── public/
        └── little-radar.html

## Start

    npm start → node server.js → localhost:3000

---

# Reliability (Implemented)

## Token refresh

OpenSky tokens expire after ~1 hour.
Token cache stores expiry timestamp.
Refreshes automatically 60 seconds before expiry.
401 responses clear cache and force immediate re-fetch.

## Last known positions

If OpenSky or network fails:
- Server returns last successful result tagged stale: true
- Frontend handles both { planes, stale } and bare array responses
- Amber banner: "Last known positions — waiting for connection"
- Aircraft dots remain on screen
- Banner clears automatically when live data resumes

Tested: 2 hours continuous operation confirmed stable.

---

# Responsive Layouts (Implemented)

## Desktop / large landscape (> 1200px)

Radar left, fixed info panel right (260px).
Default layout.

## Medium landscape — 1024×600 target (601–1200px landscape)

Radar fills left column.
Collapsible right panel with ◀ ▶ toggle tab.
Panel open by default.
Orb resizes to fill space when panel collapses.

## Mobile portrait (≤ 600px portrait)

Vertical scroll layout.
Controls → Orb (full screen width) → Info cards below.

Note: 320×240 tiny screen layout removed in V0.4.

---

# Features (Implemented)

## Map layer

Overpass API fetched once per location at 100 km radius.
Cached — no re-fetch on radius change, only on location change.
Renders: coastline, rivers, roads (major + minor), admin boundaries.
Clipped to circular disc. Fades in on load.

## Aircraft dots

Dots positioned from true bearing (user → aircraft lat/lon).
Smooth CSS transition on position update (2s linear).
Fade in on appearance, fade out on stale/removal (30s timeout).
Callsign + distance label on each dot.
Label collision avoidance — greedy multi-pass nudge algorithm.

## Aircraft detail panel

Tap any dot or list row → right panel transforms to show:
- Callsign
- Distance
- Altitude (metres and feet)
- Speed (km/h, mph, knots)
- Heading (degrees)
- Vertical movement (climbing / descending / level, ft/min)
- ICAO identifier
- Country of registration
- Squawk code

Detail auto-refreshes on each scan.
Detail auto-dismisses if aircraft leaves radar range.
Tap radar background or Dismiss button to close.

## Sky story message bar

A slim message strip at the bottom of the radar disc.
Fades in/out with each new message.
Generates contextual messages from live flight data.

Priority tiers:
1. Special aircraft — RFDS, rescue helicopter, military, circling
2. Arrivals and departures — new aircraft entering/leaving range
3. Notable behaviour — extreme altitude, fast climb/descent, high speed
4. Sky mood — empty sky, solo aircraft, busier/quieter than average
5. Ambient — time of day, daily count, generic fallback

Display timing:
- Priority 1–2: 10 seconds
- Priority 3–5: 30 seconds

Cooldown logic:
- Same message key: 5 minute cooldown before repeat
- Same aircraft featured: 3 minute cooldown before re-narrating
- Urgent events (RFDS, rescue, military) interrupt current message immediately
- Regular arrivals/departures queue for next cycle

Aircraft classification by callsign pattern:
- RFDS registrations (VH-FDR, VH-IND etc.) and RFDS/CAREFLIGHT prefixes
- Rescue / medical (RSCU, LIFE, HEMS, RESCUE, MEDIC)
- Military / government (RAAF, ARMY, NAVY, A7, AMB, RAN)
- Cargo / freight (FDX, UPS, DHL, TNT etc.)
- Major airlines (QF, VA, JQ, EK, SQ, CX, MH, NZ)
- Helicopter heuristic: speed < 200 km/h AND altitude < 1500m AND not on ground

Circling detection:
- Tracks last 4 lat/lon positions per aircraft
- Flags as circling if total movement < ~2km across 4 consecutive scans

Rolling average count:
- 60-sample history (~15 minutes at 15s scan interval)
- Enables "busier/quieter than usual" messages

---

# Features (Planned / Not Yet Built)

## Aircraft persistence

Target:   Aircraft fade only after 60 seconds of no update
Status:   Approved, not built (currently 30 seconds)

## Aircraft trails

Target:   Store and display last 3–5 positions per aircraft, fading
Status:   Approved, not built

## Sweep illumination

Target:   Radar sweep illuminates aircraft dots as it passes
Decision: Sweep is visual only — aircraft movement remains continuous

## Aircraft icon

Target:   Heading-matched delta/arrow icon replacing circle dot
Status:   Approved, not built

## Day / night mode

Target:   Automatic theme shift at sunrise/sunset for device location
Status:   Approved, not built

## Logging cleanup

Keep:   Last scan time, aircraft count, data source status, network status
Remove: Debug logs, developer information
Status: Not done

---

# User Experience

## Startup (desired)

    Power
    ↓
    Device boots
    ↓
    Radar automatically launches
    ↓
    Connect Wi-Fi (first boot only)
    ↓
    Device remembers
    ↓
    Future boots go directly into radar

User should never:
- open apps
- open browser
- use desktop
- manage operating system

## Future kiosk boot sequence

    Power on
    ↓
    Pi OS boots (~20s)
    ↓
    systemd starts server.js
    ↓
    systemd starts Chromium in kiosk mode
    ↓
    Chromium opens localhost:3000
    ↓
    Fullscreen radar

---

# Hardware

## Current prototype

- Compute:   Raspberry Pi 5
- Display:   Official Raspberry Pi 7" touchscreen, 1024×600, landscape
- Storage:   microSD (use Samsung Pro Endurance or SanDisk Max Endurance for always-on)
- Power:     USB-C

## Recommended display layout

    ┌───────────────────────────┬──────────────┐
    │                           │              │
    │         RADAR             │   PANEL      │
    │                           │              │
    │      [message bar]        │ AIRCRAFT     │
    │                           │ LIST / DETAIL│
    └───────────────────────────┴──────────────┘

## Hardware not used

- GPS module (fixed location used instead)
- ADS-B receiver
- Battery
- Case (V1)
- HATs

## Market research findings

Flight Tracker LED (flighttrackerled.com):
- Closest commercial competitor
- ESP32-S3 + 64×32 LED matrix + handmade maple enclosure
- Sells at $449.99 USD
- One person, hand-built, ships from USA
- Started on Raspberry Pi, rebuilt on ESP32 for reliability
- 19 verified reviews — market is real

Key insight: nobody is doing a circular radar on a proper colour screen.
LED matrix competitors show dots and scrolling text.
Little Radar's orb is a genuinely different and more sophisticated experience.

## Future hardware path

V1:  Pi 5 + 7" display — current, development and personal use
V2:  Pi Zero 2W or Orange Pi Zero 2W + 5" DSI display — ~$150 AUD BOM
V3:  ESP32-S3 or Rockchip SoM — requires rewrite, ~$30–50 AUD BOM

Decision: Validate market before investing in V3 hardware.
Method: Post a video online. See if people want to buy it.

### Hardware economics

Current BOM (Pi 5 + 7" display):     ~$640–700 AUD → not commercially viable
Pi Zero 2W + 5" display:              ~$150 AUD BOM → marginal
ESP32-S3 with display:                ~$30–50 AUD BOM → viable, requires rewrite

---

# Configuration

## V1 — Fixed location

    config.json
    {
      "location": {
        "lat": -34.9285,
        "lng": 138.6007
      },
      "radius": 50
    }

Reason: Simplest build. Device never moves.

## Future

Touchscreen settings page.
Captive portal for WiFi setup on first boot.

---

# Radius Behaviour

Preset values: 5 / 25 / 50 / 100 / 250 km
Default: 25 km

---

# Credentials

Rule: Server-side only. Never in /public.

Current:    credentials.json
Future:     .env file

    OPENSKY_CLIENT_ID=xxx
    OPENSKY_CLIENT_SECRET=yyy

---

# Hardware Deployment Plan (Next)

## Step 1 — Kiosk setup on Pi 5 + 7" display

Install Pi OS Lite.
Configure WiFi via wpa_supplicant.conf.
Install Node.js, npm, Chromium.
Write two systemd unit files:
- radar-server.service   (starts node server.js)
- radar-kiosk.service    (starts Chromium --kiosk localhost:3000)
Disable cursor (unclutter).
Disable screen blanking.
Test auto-boot end to end.

## Step 2 — Harden for always-on

Switch to fixed location in config.json.
Mount filesystem read-only after setup.
Use high-endurance SD card.
Confirm stable after 24 hours.

## Step 3 — Enclosure

V1: Official Raspberry Pi 7" touchscreen case.
V2: Custom 3D printed or laser-cut acrylic.

---

# Deployment — Manual (Current)

    cd little-radar
    npm install
    node server.js

    # Open in browser
    http://localhost:3000

    # From another device on the same network
    http://[PI_IP_ADDRESS]:3000

---

# Testing Checklist

- [ ] 1024×600 layout correct and fills screen
- [ ] Mobile portrait layout (390×844) — orb + cards below
- [ ] Panel collapse toggle works at 1024×600
- [ ] Auto-location works and aircraft appear
- [ ] Aircraft detail panel opens on tap, shows all fields
- [ ] Detail dismisses on background tap and on aircraft leaving range
- [ ] Sky story messages appear and cycle correctly
- [ ] RFDS / rescue / military messages interrupt immediately
- [ ] Graceful failure when internet is off (last known banner)
- [ ] 30 min continuous run — no memory leaks, no crashes
- [x] 2 hour continuous run — token refresh works (confirmed)

---

# Version History

## V0.1 — Initial prototype
Basic radar display. Aircraft dots. Real data.

## V0.2 — Browser prototype complete
Responsive layouts. Panel collapse. Ring labels. Sweep animation.

## V0.3 — Reliability update
Token auto-refresh with expiry tracking.
Last-known positions fallback with stale banner.
2 hours continuous operation confirmed.
Response shape: { planes, stale }.

## V0.4 — Aircraft details + cleanup
Full flight data in API response: altitude (m + ft), speed (km/h + mph + knots),
heading, vertical rate (ft/min), onGround, ICAO, country, squawk.
Aircraft detail panel — tap dot or list row.
Detail auto-refreshes and auto-dismisses.
Aircraft list shows ✈ / ⬤ glyphs.
320×240 tiny screen layout removed.

## V0.5 — Sky story messaging (current)
Message bar added to bottom of radar disc.
5-priority message engine with cooldown and interruption logic.
Aircraft classification by callsign pattern (RFDS, rescue, military, cargo, airlines).
Helicopter heuristic detection (speed + altitude).
Circling detection via lat/lon position history.
Rolling aircraft count average for busy/quiet comparisons.
Arrival and departure event detection per scan.
Daily aircraft count tracking with midnight reset.
Frontend handles both { planes, stale } and bare array server responses.
Full plane data stored per dot — messaging engine reads altitude, speed, verticalRate.

---

# Versioning and Repo

Git repository: github.com/silentpacific/little-radar
Development on laptop.
Deploy to Pi:

    ssh pi@[PI_IP]
    cd little-radar
    git pull
    npm install   # only if package.json changed

credentials.json is never in the repo — copy manually via scp on first deploy:

    scp credentials.json pi@[PI_IP]:~/little-radar/credentials.json

---

# Success Criteria

Prototype is successful if:

- boots automatically
- loads radar
- updates aircraft
- feels smooth
- touch works
- survives 24 hours
- message bar tells a story about the sky
