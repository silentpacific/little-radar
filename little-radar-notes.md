# Little Radar
Version: 0.2
Status: Browser Prototype Complete → Hardware Prototype Planned

Owner: Rahul

---

# Project Vision

Build a small desktop device that behaves and feels like a radar.

This is not active radar.

The device is a passive aircraft tracker that continuously retrieves real aircraft positions from the internet and visualises them as a radar experience.

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

---

# Architecture

## Software

Browser UI
↓
Node server
↓
Aircraft API
↓
Radar renderer

Current implementation:

little-radar/

├── server.js  
├── package.json  
├── package-lock.json  
├── credentials.json  
└── public/  
  └── little-radar.html

Current startup:

node server.js
↓
localhost:3000

Future hardware startup:

Power
↓
Pi boots
↓
server.js starts
↓
Browser launches
↓
Open localhost:3000
↓
Fullscreen radar

---

# Browser Prototype — Already Completed

## Radar Display

Completed:

- Circular radar
- Crosshairs
- Range rings
- Dynamic ring labels
- N / E / W / S directions

---

## Aircraft Rendering

Completed:

- Real aircraft positions
- Aircraft dots
- Aircraft persistence
- Smooth refresh

---

## Data + State

Completed:

- Auto refresh
- Scan logs
- Aircraft found count
- Aircraft list

---

## Inputs

Completed:

- Browser location
- Radius control

---

# Browser Improvements (Next)

## Radar Behaviour

### Aircraft persistence

Current:
Persistence exists

Target:
Aircraft fade only after 60 seconds

Decision:
Approved

---

### Sweep illumination

Target:
Radar sweep illuminates aircraft

Decision:
Sweep is visual only

Aircraft movement remains continuous.

---

### Aircraft trails

Target:
Store and display last 3 positions

Decision:
Approved

---

### Ring labels

Target:
Move labels to lower-right

Decision:
Approved

---

# Aircraft Details

Browser:

Hover to show:

- Altitude
- Speed
- Direction
- Distance

---

Hardware:

Touch interaction

Tap aircraft
↓
Open details

Tap list item
↓
Highlight aircraft

Tap outside
↓
Return

Decision:
Expanded details panel

Aircraft details replace logs temporarily.

---

# Hardware Decisions

## Compute

Prototype:

Raspberry Pi 5

Recommended:
8GB

Reason:
Not required for radar performance.

Chosen because:
- future projects
- experimentation
- comfortable development

---

## Display

Target:

5–7 inch

Requirements:

- HDMI
- Capacitive touch
- Landscape

Layout:

┌───────────────────────────┬──────────────┐
│                           │              │
│         RADAR             │   LOGS       │
│                           │              │
│                           │ AIRCRAFT     │
│                           │ LIST         │
└───────────────────────────┴──────────────┘

---

## Power

USB-C

No battery.

---

## Storage

microSD

Recommended:
64GB

Contains:

- OS
- Browser
- Server
- Config
- Credentials

---

# Configuration

Decision:

Fixed location for V1

Reason:

Fastest build.

Configuration stored locally.

Example:

config.json

{
  "location": {
    "lat": -34.9285,
    "lng": 138.6007
  },
  "radius": 50
}

Future:
Touchscreen settings page.

---

# Radius Behaviour

Decision:

Preset values

5
25
50
100
250 km

500 removed for now.

Reason:
Simpler UI.

---

# Logging Behaviour

Keep visible:

- Last scan time
- Aircraft found
- Data source status
- Network status

Remove:

- Debug logs
- FPS
- Developer information

---

# Credentials

Current:

credentials.json

Rule:

Keep server-side only.

Allowed:

little-radar/

├── server.js  
├── credentials.json  
└── public/

Not allowed:

public/credentials.json

Future improvement:

.env

Example:

OPENSKY_USER=xxx
OPENSKY_PASS=yyy

---

# Deployment

## First deployment

Install:

- Raspberry Pi OS
- Node
- npm

Copy:

little-radar/

Run:

cd little-radar

npm install

node server.js

Open:

http://localhost:3000

Expected result:

Radar appears.

---

# Hardware Shopping List

Required:

- Raspberry Pi 5 (8GB)
- 7 inch HDMI touchscreen
- 64GB microSD
- USB-C power

Recommended:

- Pi cooler
- Temporary keyboard + mouse

Skip:

- GPS
- Sensors
- ADS-B hardware
- Battery
- Case
- HATs

---

# Future Versions

V1

Personal radar

↓

V2

Friend build

↓

V3

Product

Possible future changes:

- smaller compute
- hidden settings
- custom enclosure
- custom board

Do not optimise yet.

---

# Success Criteria

Prototype is successful if:

- boots automatically
- loads radar
- updates aircraft
- feels smooth
- touch works
- survives 24 hours

---

# Project Philosophy

Build the magic first.

Do not optimise hardware before the object proves itself.

Goal:

Look at desk.
See aircraft moving.
Smile.