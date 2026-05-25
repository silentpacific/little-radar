# Little Radar
Version: 0.3
Status: Browser Prototype Complete → Hardware Prototype In Progress

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

## Frontend

- Single file:  public/little-radar.html
- Rendering:    Browser Canvas API
- Language:     Vanilla JavaScript, no frameworks, no build step
- Location:     Browser Geolocation API (V1 will use fixed config.json)
- Data:         Fetches from localhost:3000/planes

## Project Structure

    little-radar/
    ├── server.js
    ├── package.json
    ├── package-lock.json
    ├── credentials.json        ← gitignored, never commit
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
- Frontend shows amber banner: "Last known positions — waiting for connection"
- Aircraft dots remain on screen
- Banner clears automatically when live data resumes

Tested: 2 hours continuous operation confirmed stable.

---

# Responsive Layouts (Implemented)

## Desktop / large landscape (> 1200px)

Radar left, fixed info panel right (260px).
Default layout, unchanged from V0.2.

## Medium landscape — 1024×600 target (321–1200px landscape)

Radar fills left column.
Collapsible right panel with ◀ ▶ toggle tab.
Panel open by default.
Orb resizes to fill space when panel collapses.

## Mobile portrait (≤ 600px portrait)

Vertical scroll layout.
Controls → Orb (full screen width) → Info cards below.
No panel — everything inline.

## Tiny screen — 320×240 (≤ 320px wide or ≤ 260px tall landscape)

Orb fills entire screen.
All other UI hidden.
Floating ⓘ button bottom-right.
Tap opens semi-transparent overlay with aircraft count, location, list.
✕ closes overlay.

---

# User Experience

## Startup

Desired experience:

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

## Future startup sequence (kiosk mode)

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

- Compute:   Raspberry Pi 5 (chosen for development comfort and future projects)
- Display:   Official Raspberry Pi 7" touchscreen, 1024×600, landscape
- Storage:   microSD (use Samsung Pro Endurance or SanDisk Max Endurance for always-on)
- Power:     USB-C

## Recommended display layout

    ┌───────────────────────────┬──────────────┐
    │                           │              │
    │         RADAR             │   LOGS       │
    │                           │              │
    │                           │ AIRCRAFT     │
    │                           │ LIST         │
    └───────────────────────────┴──────────────┘

## Hardware not used

- GPS module (fixed location used instead)
- ADS-B receiver
- Battery
- Case (V1)
- HATs

## Future hardware options (V3 product)

- Raspberry Pi Zero 2W (~$38 AUD) — runs existing code unchanged, cheapest Pi
- Orange Pi Zero 2W (~$45 AUD) — 1GB RAM, USB-C power, slightly better Chromium performance
- ESP32-S3 with built-in display (~$30 AUD) — requires full rewrite in MicroPython or C++
- Custom PCB — V3 only, requires 12–18 months electronics work, not now

### Hardware economics (honest)

Current BOM (Pi 5 + 7" display):   ~$640–700 AUD
Minimum viable sale price:          ~$900–1,100 AUD
Verdict:                            Not commercially viable at this BOM

Pi Zero 2W + 4" Waveshare display:  ~$143 AUD
Potential sale price:               ~$200–250 AUD
Verdict:                            Marginal but possible for V2

ESP32-S3 with display:              ~$30–50 AUD BOM
Potential sale price:               ~$120–150 AUD
Verdict:                            Viable — requires full rewrite

Decision: V1 is a passion project. Do not optimise for cost yet.

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
500 km removed — simpler UI.

---

# Credentials

Rule: Server-side only. Never in /public.

Current:    credentials.json
Future:     .env file

    OPENSKY_CLIENT_ID=xxx
    OPENSKY_CLIENT_SECRET=yyy

---

# Browser Improvements (Approved, Not Yet Built)

## Aircraft persistence

Target:   Aircraft fade only after 60 seconds of no update
Status:   Approved

## Aircraft trails

Target:   Store and display last 3 positions per aircraft
Status:   Approved

## Sweep illumination

Target:   Radar sweep illuminates aircraft dots as it passes
Decision: Sweep is visual only — aircraft movement remains continuous

## Aircraft details — browser

Hover to show:
- Altitude
- Speed
- Direction
- Distance

## Aircraft details — hardware (touch)

    Tap aircraft dot → open details panel
    Tap list item    → highlight aircraft on radar
    Tap outside      → return to radar

Details panel replaces logs temporarily.
Status: Approved

## Logging — visible on device

Keep:
- Last scan time
- Aircraft found
- Data source status (live / last known)
- Network status

Remove:
- Debug logs
- Developer information

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

    # On Pi or dev machine
    cd little-radar
    npm install
    node server.js

    # Open in browser
    http://localhost:3000

---

# Testing Checklist

- [ ] 1024×600 layout correct and fills screen
- [ ] Mobile portrait layout (390×844) — orb + cards below
- [ ] 320×240 layout — orb only + ⓘ overlay
- [ ] Panel collapse toggle works at 1024×600
- [ ] Auto-location works and aircraft appear
- [ ] Graceful failure when internet is off (last known banner)
- [ ] 30 min continuous run — no memory leaks, no crashes
- [ ] 2 hour continuous run — token refresh works ✓ (confirmed)

---

# Version History

## V0.1 — Initial prototype
Basic radar display. Aircraft dots. Real data.

## V0.2 — Browser prototype complete
Responsive layouts. Panel collapse. 320×240 overlay.
Ring labels. Sweep animation. Aircraft persistence.

## V0.3 — Reliability update (current)
Token auto-refresh with expiry tracking.
Last-known positions fallback.
Stale data banner.
2 hours continuous operation confirmed.
Response shape updated: { planes, stale } from /planes endpoint.

---

# Versioning and Repo

Git repository on GitHub.
Development on laptop.
Deploy to Pi via git pull or scp.

---

# Success Criteria

Prototype is successful if:

- boots automatically
- loads radar
- updates aircraft
- feels smooth
- touch works
- survives 24 hours