# PRANरक्षक (Pran Rakshak) — Smart Medical QR & Emergency Assistance Platform

> **"Your Medical Identity. Your Lifeline."**  
> A mission-critical healthcare platform connecting patients, unknown civilian bystanders, and emergency trauma centers during the golden hour through smart medical QR identification and rapid ambulance assistance.

---

## 🏥 College Hackathon Demonstration Guide

### Quick Start
To launch the platform locally:

```bash
# Start the zero-dependency local static server
node server.js
```
The server will start at: **`http://localhost:3005`** (or port 3000 if available).

Alternatively, you can open any `.html` file directly in a modern browser.

---

## 🌟 Key User Journeys & Routes

| Route | File | Description & Hackathon Walkthrough |
|---|---|---|
| `/` | `index.html` | **Landing Page** with brand identity, digital wallet card preview, features, and 30-second golden hour SOS overview. |
| `/register` | `register.html` | **Patient Registration** with validation, password visibility toggle, consent, and **"Auto-Fill Demo Data"** shortcut. |
| `/login` | `login.html` | **Sign In** featuring **1-Click Test Access** for Evaluators (Sign in as Aarav Sharma or Trauma Dispatcher). |
| `/dashboard` | `dashboard.html` | **Personalized Patient Dashboard** displaying health readiness progress, blood group, critical allergies, medicines, and wallet QR status. |
| `/dashboard/profile` | `profile.html` | **Medical Profile Editor** with real-time age calculation from DOB, dynamic allergy chips with severity, routine medication scheduler, and unsaved changes detector. |
| `/dashboard/contacts` | `contacts.html` | **Emergency Contacts Network** with primary contact assignment, click-to-call testing, and add/edit/delete modals. |
| `/dashboard/qr-card` | `qr-card.html` | **Digital Medical QR Card** with live high-res QR code, **PNG Wallet Image Download**, **Print Wallet Card** (`@media print`), and public link copy. |
| `/emergency/:id` | `emergency.html` | **Public Emergency Profile** viewed by an unknown bystander or medic scanning the QR code (**Zero login required**). One-tap calling to family & 112, high-visibility allergy alerts. |
| `/emergency-assistance` | `emergency-assistance.html` | **Public SOS Dispatch**: Option A (Standard Emergency with GPS auto-detection & form) and Option B (Extreme Emergency with **Call 112 Now** & 1-tap SOS). |
| `/ambulance/request/:id` | `ambulance-tracking.html` | **Live Request Tracking** with 5-stage status timeline, live route visualizer with animated ambulance beacon, ETA countdown, and **Hackathon Judge Simulation Controls**. |
| `/provider-dashboard` | `provider-dashboard.html` | **Hospital & Ambulance Dispatch Desk** to triage incoming emergency tickets, assign ALS/BLS vehicles, and dispatch ambulances in real-time. |

---

## 🎨 Healthcare Brand Identity & Color System

Strictly constructed with the official PRANरक्षक healthcare palette:

* **Teal (`#5AA7A7`)**: Primary buttons, active controls, brand accents, and health identity.
* **Mint Green (`#98D7C6`)**: Secondary panels, supportive highlights, selected information cards.
* **Dusty Blue (`#7895B2`)**: Navigation highlights, secondary actions, informational badges.
* **Sage Green (`#91A88D`)**: Profile completion progress, positive statuses, verified checkmarks.
* **Cool Gray (`#68727D`)**: Secondary text, icons, metadata, and timestamps.
* **Silver (`#D9DEE3`)**: Subtle borders, dividers, and card outlines.
* **Deep Slate (`#273746`)**: High-contrast headings, card surfaces, and bold labels.
* **Off-White (`#F8FAF9`)**: Clean, accessible page backgrounds.
* **White (`#FFFFFF`)**: Card surfaces and contrast elevation.
* **Emergency Red (`#C74343`)**: Life-saving actions, severe allergy warnings, extreme 112 emergency calls.

---

## 🛠 Technology Architecture

* **Pure HTML5**: Semantic markup, accessible inputs, no frontend framework overhead.
* **Vanilla CSS3**: Design system tokens (`variables.css`), responsive layouts (`base.css`), distinct visual cards (`components.css`), and views (`pages.css`).
* **Modular Vanilla ES6+ JavaScript**:
  * `js/vendor/qrcode.js`: High-resolution client-side QR generation to Canvas.
  * `js/vendor/icons.js`: Standalone SVG Lucide-compatible icon registry.
  * `js/data.js`: Unified data layer with localStorage persistence and pre-seeded demonstration data.
  * `js/auth.js`: Session management, route protection, and 1-click evaluator logins.
  * `js/ui.js`: Toast notifications, modal controllers, Web Audio emergency chimes, and clipboard helpers.
  * `js/profile.js`: Dynamic allergy chips, live age calculation, and unsaved changes warnings.
  * `js/contacts.js`: Emergency contacts CRUD with primary contact toggle.
  * `js/qr-card.js`: Canvas drawing engine for wallet PNG export and card printing.
  * `js/emergency.js`: Browser Geolocation API with fallback and 112 SOS dispatcher.
  * `js/tracking.js`: Interactive status timeline and demo progress simulator.
  * `js/provider.js`: Hospital triage queue and ambulance fleet manager.
* **Zero External Dependencies**: Operates 100% offline without broken CDNs or npm installation issues.
