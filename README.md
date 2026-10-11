# Micro-Influencer Discovery & Outreach Automation System
### Assignment 1: Full-Stack Influencer Automation Platform

A comprehensive, production-ready system for discovering, filtering, enriching, and orchestrating personalized outreach campaigns to micro-influencers across Instagram and YouTube.

---

## 🌟 Key Features

1. **Automated Discovery Engine**:
   - Discovers 50+ micro-influencers per niche (e.g., Fashion & Beauty, Fitness, Tech).
   - Multi-platform aggregation (Instagram, YouTube, Curated Creator Directory).
   - Strict follower range validation (10,000 – 100,000 micro-tier).

2. **Multi-Factor Filtering & Quality Scoring**:
   - Minimum engagement rate enforcement (default ≥ 2.0%).
   - Quality score calculation factoring in reach, audience engagement, and niche relevance.
   - Filter by platform, follower ranges, and engagement metrics.

3. **Creator Profile Enrichment**:
   - Deep-dive metadata extraction (recent content focus, bio highlights, top tags, audience location).
   - Contact resolution (business email extraction, platform handles).
   - Direct link verification for profile auditing.

4. **AI-Powered Outreach Personalization**:
   - Generates bespoke email pitches tailored to each creator's recent posts and tone.
   - Custom collaboration hooks, product offer alignment, and call-to-action (CTA).
   - Support for multiple campaign styles: Paid Sponsorship, Product Gifting, and Affiliate/Ambassador.

5. **Outreach Dispatch Layer**:
   - Safe simulation mode and production SMTP mailer support.
   - Subject line generation, status tracking (`Sent`, `Pending`, `Follow-up Required`, `Replied`).
   - Detailed delivery logging and real-time activity feed.

6. **Analytics & CSV Exporting**:
   - One-click CSV export for Discovered Influencers Dataset and Outreach Status Tracker.
   - Activity audit trail with real-time log viewer.
   - Interactive React dashboard with dark-mode aesthetic, live filters, and modal inspector.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind-compatible modern CSS design system, Lucide React icons.
- **Backend**: Node.js, Express 5, CORS, Axios, Cheerio, Dotenv, Nodemailer.
- **Data Persistence**: JSON-based stateful datastore with CSV export utilities.

---

## 📂 Project Architecture

```
exdso/
├── client/                     # Frontend React + Vite application
│   ├── src/
│   │   ├── App.jsx             # Main dashboard & interactive workflow
│   │   ├── App.css             # Glassmorphic dark styling & animations
│   │   └── index.css           # Global typography & layout tokens
│   ├── package.json
│   └── vite.config.js          # Dev proxy configured to port 5000
├── server/                     # Backend API & Automation Engine
│   ├── index.js                # Express REST API routes & static server
│   ├── services/
│   │   ├── discoveryService.js # Creator discovery & scraping
│   │   ├── filteringService.js # Tier & engagement filter logic
│   │   ├── enrichmentService.js# Profile enrichment & bio analysis
│   │   ├── aiService.js        # Personalization & pitch generation
│   │   ├── sendingService.js   # Email dispatcher & simulator
│   │   └── storageService.js   # Local file storage & CSV export
│   └── data/                   # Data storage & CSV reports
│       ├── curated_creators.json
│       ├── influencers.json
│       ├── outreach_tracker.json
│       └── exports/            # Generated CSV reports
├── scripts/
│   └── run_pipeline.js         # Headless CLI pipeline runner
├── .gitignore
├── package.json                # Root orchestration scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ or v20+ / v22+
- **npm** v9+

### 2. Installation
Clone the repository and install root and client dependencies:
```bash
git clone <YOUR_PUBLIC_REPO_URL>
cd exdso
npm install
npm --prefix client install
```

### 3. Run Development Server
Run both Express backend (Port 5000) and React frontend (Port 5173) concurrently:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 4. Run Headless Automation Pipeline (CLI)
To run the automated discovery, filtering, enrichment, and AI pitch generation pipeline in the terminal:
```bash
npm run pipeline
```

### 5. Production Build & Run
To test the production build served entirely from Express:
```bash
npm run build
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and services operational status |
| `POST` | `/api/pipeline/run` | Execute complete end-to-end pipeline in one step |
| `GET` | `/api/influencers` | Retrieve filtered & enriched creators list |
| `GET` | `/api/influencers/:id` | Retrieve single creator details |
| `POST` | `/api/ai/pitch` | Generate custom AI outreach pitch for a creator |
| `POST` | `/api/outreach/send` | Dispatch personalized email pitch (simulation or live) |
| `GET` | `/api/outreach/tracker` | Get all dispatched outreach records & metrics |
| `GET` | `/api/export/:type` | Download dataset or outreach records as CSV |
| `GET` | `/api/logs` | Fetch real-time system activity logs |
| `POST` | `/api/reset` | Reset dataset to initial curated creator state |

---

## 📄 License
ISC
