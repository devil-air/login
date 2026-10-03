# KINGPIN 5.0 (Auto Bet & Predictor Engine)

⚡ **100% Vercel Serverless & Local/VPS Compatible** ⚡

Complete production-ready project with dual-mode architecture:
1. **Vercel Serverless Deployment**: Runs 100% out of the box on Vercel without persistent WebSocket servers via the autonomous client-side fallback engine & `@vercel/node` serverless functions.
2. **Local / VPS Node.js Hosting**: Full persistent Socket.IO real-time server with multi-client synchronization.

---

## 🚀 How to Deploy on Vercel (101% Working)

### Method 1: Deploy with Vercel CLI (Recommended)
```bash
# 1. Install Vercel CLI (if not installed)
npm install -g vercel

# 2. Deploy directly from the project directory
vercel
```

### Method 2: Deploy via GitHub / GitLab
1. Push this folder to a GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import the repository.
4. Click **Deploy** (No special build settings needed — Vercel detects static files + `api/index.js` automatically!).

---

## 💻 How to Run Locally / on VPS

```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start
# or: node server.js

# 3. Open in browser:
http://localhost:3000
```

---

## 🔑 Access Keys

- **Master Super-User Key** (Unlocks multi-account, developer mode, manual betting, un-restricted source):
  ```
  KP500-ADMIN-SUPER-USER0-99999
  ```
- **Standard User Key**:
  Any 25-character formatted key (e.g. `ABCDE-12345-FGHIJ-67890-KLMNO` or anything containing your custom key code) unlocks standard single-account mode.

---

## 🌐 API Endpoints (Vercel Serverless & Local)

All endpoints are available under `/api/*` and work both on Vercel and local Node.js:

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check & engine status |
| `/api/keys/check` | POST | License key verification & gate unlock |
| `/api/keys/validate` | POST | Key phone binding validation |
| `/api/keys/login-check` | POST | Pre-login phone lock verification |
| `/api/keys/bind` | POST | Session initialization & key binding |
| `/api/keys/session/balance` | POST | Updates active session balance |
| `/api/keys/session/stop` | POST | Stops session & logs final PnL |
| `/api/platforms` | GET | List available gaming platforms |
| `/api/platform/:id/captcha` | POST | Dynamic SVG slider captcha generator |
| `/api/platform/:id/login` | POST | Multi-platform login & lottery token generator |
| `/api/prediction` | GET/POST | WinGo 30S AI prediction & confidence signal |
| `/api/history` | GET/POST | WinGo 30S historical draws & results |
| `/api/quota` | GET/POST | User plan & quota check |
| `/api/profile` | GET/POST | VIP user profile information |
| `/api/status` | GET/POST | Core API & game service status |
| `/api/ref-status` | GET/POST | Referral system status |
| `/api.php` | ALL | Legacy PHP bridge dispatcher (100% backward compatible) |

---

## 📂 Project Structure

```
├── index.html          # SPA Dashboard + Dual-Engine (Live Socket + Vercel Fallback)
├── vercel.json         # Vercel Serverless Routing & CORS configuration
├── .vercelignore       # Vercel deployment exclusions
├── .gitignore          # Git tracking exclusions
├── api/
│   └── index.js        # Universal Vercel Serverless REST API handler
├── server.js           # Local / VPS Express + Socket.IO persistent server
├── css/
│   └── autobet.css     # Dark theme styles & UI layout
├── js/
│   └── socket.io.js    # Socket.IO client library
├── package.json        # Dependencies (cors, express, socket.io)
└── README.md           # Documentation & deployment guide
```
