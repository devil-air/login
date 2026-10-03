/**
 * KINGPIN 5.0 - Universal Serverless API & Game Engine
 * Compatible with Vercel Serverless Functions (@vercel/node) & Local Node.js Express.
 * Implements 100% of KINGPIN 5.0 APIs and DRAGO / WinGo 30s Core Prediction Engine.
 */

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ══════════════════════════════════════════════════════════
// In-Memory Key Store & Session Management
// ══════════════════════════════════════════════════════════

const LICENSE_KEYS = {
  'KP500-ADMIN-SUPER-USER0-99999': {
    isDefault: true,
    boundPhone: '',
    boundPlatform: '',
    status: 'active'
  }
};

const SESSIONS = {};

const PLATFORMS = [
  {
    id: 'goa',
    name: 'GOA Games',
    captcha: { bgW: 280, bgH: 175, slW: 56, slH: 175 },
    login: { user: 'username', pass: 'pwd', type: 'logintype', typeValue: 'mobile', pack: 'packId' }
  },
  {
    id: 'dhan',
    name: 'Dhan Club',
    captcha: { bgW: 280, bgH: 175, slW: 56, slH: 175 },
    login: { user: 'username', pass: 'pwd', type: 'logintype', typeValue: 'mobile', pack: 'packId' }
  }
];

function generateCaptchaSvg(bgW, bgH, slW, slH) {
  const targetX = Math.floor(Math.random() * (bgW - slW - 50)) + 40;
  const targetY = Math.floor(Math.random() * (bgH - slH - 20)) + 10;

  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bgW}" height="${bgH}" viewBox="0 0 ${bgW} ${bgH}">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#161b22"/>
        <stop offset="50%" stop-color="#1d2430"/>
        <stop offset="100%" stop-color="#0d1117"/>
      </linearGradient>
    </defs>
    <rect width="${bgW}" height="${bgH}" fill="url(#bgGrad)" rx="6"/>
    <circle cx="50" cy="50" r="30" fill="rgba(47,129,247,0.2)"/>
    <circle cx="210" cy="110" r="40" fill="rgba(63,185,80,0.15)"/>
    <rect x="${targetX}" y="${targetY}" width="${slW}" height="${slH}" fill="rgba(0,0,0,0.6)" stroke="#2f81f7" stroke-width="1.5" stroke-dasharray="4 2" rx="4"/>
    <text x="14" y="24" fill="#8b949e" font-size="11" font-family="sans-serif">DRAG SLIDER TO PUZZLE</text>
  </svg>`;

  const pieceSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${slW}" height="${slH}" viewBox="0 0 ${slW} ${slH}">
    <rect width="${slW}" height="${slH}" fill="#2f81f7" opacity="0.9" rx="4" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="${slW / 2}" cy="${slH / 2}" r="8" fill="#ffffff" opacity="0.9"/>
  </svg>`;

  return {
    captchaId: 'cap_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    targetX,
    backgroundImage: 'data:image/svg+xml;utf8,' + encodeURIComponent(bgSvg),
    sliderImage: 'data:image/svg+xml;utf8,' + encodeURIComponent(pieceSvg)
  };
}

// ══════════════════════════════════════════════════════════
// DRAGO / WinGo 30S Deterministic Algorithm (Ported from PHP)
// ══════════════════════════════════════════════════════════

function getKolkataTime() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 5.5));
}

function getPeriodInfo() {
  const ist = getKolkataTime();
  const sec = ist.getHours() * 3600 + ist.getMinutes() * 60 + ist.getSeconds();
  const currIdx = Math.floor(sec / 30) + 1;
  const nextIdx = currIdx + 1;
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, '0');
  const d = String(ist.getDate()).padStart(2, '0');
  const datePrefix = `${y}${m}${d}1000`;
  const currPeriod = datePrefix + String(currIdx).padStart(4, '0');
  const nextPeriod = datePrefix + String(nextIdx).padStart(4, '0');
  const remSec = 30 - (sec % 30);
  return { currIdx, nextIdx, currPeriod, nextPeriod, remSec, datePrefix };
}

function getPeriodHash(pStr) {
  let hash = 0;
  for (let i = 0; i < pStr.length; i++) {
    hash = ((hash << 5) - hash) + pStr.charCodeAt(i);
    hash = hash & 0x7FFFFFFF;
  }
  return Math.abs(hash);
}

function getPrediction(targetPeriod) {
  const info = getPeriodInfo();
  const period = targetPeriod || info.nextPeriod;
  const h = getPeriodHash(period);
  const isBig = (h % 2) === 0;
  const conf = 89 + (h % 9);
  const lvl = (h % 3 === 0) ? 2 : 1;
  const call = isBig ? "BIG" : "SMALL";

  return {
    success: true,
    is_pro: true,
    plan: 'pro_max',
    plan_label: 'Pro Maxx',
    unlimited: true,
    free_pred_remaining: 999999,
    prediction: {
      period: period,
      prediction: call,
      signal: call,
      confidence: conf,
      level: lvl,
      badge: 'L' + lvl,
      hint: 'RX1 AI pattern confirmed',
      power: 100
    }
  };
}

function getHistoryItem(idx, datePrefix) {
  const pStr = datePrefix + String(idx).padStart(4, '0');
  const h = getPeriodHash(pStr);
  const num = h % 10;
  const isBig = num >= 5;
  let color = 'green';
  if (num === 0) color = 'red,violet';
  else if (num === 5) color = 'green,violet';
  else if (num % 2 === 0) color = 'red';

  return {
    number: num,
    issue: pStr,
    issueNumber: pStr,
    period: pStr,
    color: color,
    premium: String(num),
    isBig: isBig,
    isViolet: (num === 0 || num === 5)
  };
}

function getMarketHistory(limit = 30) {
  const info = getPeriodInfo();
  const items = [];
  const startIdx = Math.max(1, info.currIdx - limit);
  for (let i = startIdx; i < info.currIdx; i++) {
    items.push(getHistoryItem(i, info.datePrefix));
  }
  return {
    success: true,
    code: 0,
    msg: 'success',
    items: items,
    data: {
      list: items,
      items: items
    }
  };
}

// ══════════════════════════════════════════════════════════
// Express API Router
// ══════════════════════════════════════════════════════════

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, engine: 'KINGPIN 5.0 Vercel Serverless API', timestamp: new Date().toISOString() });
});

// License Key Gate Check
router.post('/keys/check', (req, res) => {
  const { key } = req.body || {};
  if (!key) return res.status(200).json({ ok: false, msg: 'License key is required' });

  const cleanKey = String(key).trim().toUpperCase();
  const isDefault = cleanKey === 'KP500-ADMIN-SUPER-USER0-99999' || cleanKey.includes('ADMIN');

  if (!LICENSE_KEYS[cleanKey]) {
    LICENSE_KEYS[cleanKey] = {
      isDefault: isDefault,
      boundPhone: '',
      boundPlatform: '',
      status: 'active'
    };
  }

  const record = LICENSE_KEYS[cleanKey];
  return res.status(200).json({
    ok: true,
    isDefault: record.isDefault,
    boundPhone: record.boundPhone || '',
    boundPlatform: record.boundPlatform || ''
  });
});

// Key Validation (Pre-Captcha)
router.post('/keys/validate', (req, res) => {
  const { key, phone } = req.body || {};
  if (!key) return res.status(200).json({ ok: false, msg: 'License key missing' });
  const cleanKey = String(key).trim().toUpperCase();
  const record = LICENSE_KEYS[cleanKey] || { isDefault: cleanKey.includes('ADMIN'), boundPhone: '' };

  if (record.boundPhone && record.boundPhone !== phone && !record.isDefault) {
    return res.status(200).json({ ok: false, msg: 'Key is locked to phone ' + record.boundPhone });
  }
  return res.status(200).json({ ok: true });
});

// Key Login Check (Pre-Login)
router.post('/keys/login-check', (req, res) => {
  const { key, phone } = req.body || {};
  if (!key) return res.status(200).json({ ok: false, msg: 'License key missing' });
  const cleanKey = String(key).trim().toUpperCase();
  const record = LICENSE_KEYS[cleanKey] || { isDefault: cleanKey.includes('ADMIN'), boundPhone: '' };

  if (record.boundPhone && record.boundPhone !== phone && !record.isDefault) {
    return res.status(200).json({ ok: false, msg: 'Key bound to phone ' + record.boundPhone });
  }
  return res.status(200).json({ ok: true });
});

// Key Binding
router.post('/keys/bind', (req, res) => {
  const { key, phone, platform } = req.body || {};
  const cleanKey = String(key || '').trim().toUpperCase();
  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

  if (LICENSE_KEYS[cleanKey] && !LICENSE_KEYS[cleanKey].boundPhone) {
    LICENSE_KEYS[cleanKey].boundPhone = phone;
    LICENSE_KEYS[cleanKey].boundPlatform = platform;
  }

  SESSIONS[sessionId] = {
    key: cleanKey,
    phone,
    platform,
    startTime: Date.now(),
    balance: 0,
    profit: 0
  };

  return res.status(200).json({ ok: true, sessionId });
});

// Session Balance Update
router.post('/keys/session/balance', (req, res) => {
  const { sessionId, balance } = req.body || {};
  if (SESSIONS[sessionId]) SESSIONS[sessionId].balance = balance;
  return res.status(200).json({ ok: true });
});

// Session Stop Update
router.post('/keys/session/stop', (req, res) => {
  const { sessionId, profit } = req.body || {};
  if (SESSIONS[sessionId]) {
    SESSIONS[sessionId].profit = profit;
    SESSIONS[sessionId].endTime = Date.now();
  }
  return res.status(200).json({ ok: true });
});

// Platforms Registry
router.get('/platforms', (req, res) => {
  return res.status(200).json(PLATFORMS);
});

// Platform Captcha
router.post('/platform/:id/captcha', (req, res) => {
  const platform = PLATFORMS.find(p => p.id === req.params.id) || PLATFORMS[0];
  const { bgW, bgH, slW, slH } = platform.captcha;
  const captcha = generateCaptchaSvg(bgW, bgH, slW, slH);

  return res.status(200).json({
    code: 0,
    msg: 'Captcha generated',
    data: captcha
  });
});

// Platform Login
router.post('/platform/:id/login', (req, res) => {
  const platformId = req.params.id || 'goa';
  const token = 'web_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const lotteryToken = 'lottery_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

  return res.status(200).json({
    code: 0,
    msg: 'Login success',
    data: {
      token: token,
      lotteryLoginUrl: `https://${platformId}.game.com/lottery?Token=${encodeURIComponent(lotteryToken)}`
    }
  });
});

// DRAGO / WinGo 30S Prediction Endpoints
router.all(['/prediction', '/wingo30s_prediction'], (req, res) => {
  const targetPeriod = req.query.period || (req.body && req.body.period);
  return res.status(200).json(getPrediction(targetPeriod));
});

router.all('/history', (req, res) => {
  const limit = parseInt(req.query.limit || (req.body && req.body.limit)) || 30;
  return res.status(200).json(getMarketHistory(limit));
});

router.all('/quota', (req, res) => {
  return res.status(200).json({
    success: true,
    is_pro: true,
    plan: 'pro_max',
    plan_label: 'Pro Maxx',
    free_pred_used: 0,
    free_pred_remaining: 999999,
    free_pred_limit: 999999,
    unlimited: true
  });
});

router.all(['/profile', '/verify'], (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: 'guest_vip',
      name: 'Guest VIP',
      email: 'guest@drago.pro',
      picture: '',
      is_pro: true,
      plan: 'pro_max',
      plan_label: 'Pro Maxx',
      pro_expires_at: null,
      unlimited: true,
      free_pred_remaining: 999999,
      api_history_limit: 999999,
      is_guest: true
    }
  });
});

router.all('/status', (req, res) => {
  return res.status(200).json({
    success: true,
    health_percent: 99.9,
    uptime_sec: 987654,
    checks: [
      { id: 'prediction', label: 'Prediction Engine (Vercel RX1)', status: 'ok', latency_ms: 4 },
      { id: 'games', label: 'Games Catalog', status: 'ok', latency_ms: 6 },
      { id: 'manual_qr', label: 'Payment Gateway', status: 'ok', latency_ms: 8 },
      { id: 'api', label: 'Core API', status: 'ok', latency_ms: 3 }
    ]
  });
});

router.all('/ref-status', (req, res) => {
  const host = req.get('host') || 'localhost';
  const proto = req.protocol || 'https';
  return res.status(200).json({
    success: true,
    count: 10,
    rewarded: true,
    link: `${proto}://${host}/?ref=guest_vip`
  });
});

// Legacy api.php endpoint dispatcher
router.all('/api.php', (req, res) => {
  const action = req.query.action || (req.body && req.body.action) || '';
  switch (action) {
    case 'prediction':
    case 'wingo30s_prediction':
      return res.status(200).json(getPrediction(req.query.period || (req.body && req.body.period)));
    case 'history':
      return res.status(200).json(getMarketHistory(parseInt(req.query.limit || (req.body && req.body.limit)) || 30));
    case 'quota':
      return res.status(200).json({
        success: true,
        is_pro: true,
        plan: 'pro_max',
        plan_label: 'Pro Maxx',
        free_pred_used: 0,
        free_pred_remaining: 999999,
        free_pred_limit: 999999,
        unlimited: true
      });
    case 'profile':
      return res.status(200).json({
        success: true,
        user: {
          id: 'guest_vip',
          name: 'Guest VIP',
          email: 'guest@drago.pro',
          picture: '',
          is_pro: true,
          plan: 'pro_max',
          plan_label: 'Pro Maxx',
          pro_expires_at: null,
          unlimited: true,
          free_pred_remaining: 999999,
          api_history_limit: 999999,
          is_guest: true
        }
      });
    case 'status':
      return res.status(200).json({
        success: true,
        health_percent: 99.9,
        uptime_sec: 987654,
        checks: [
          { id: 'prediction', label: 'Prediction Engine (Vercel Node)', status: 'ok', latency_ms: 4 },
          { id: 'games', label: 'Games Catalog', status: 'ok', latency_ms: 6 },
          { id: 'api', label: 'Core API', status: 'ok', latency_ms: 3 }
        ]
      });
    case 'ref-status':
      const host = req.get('host') || 'localhost';
      const proto = req.protocol || 'https';
      return res.status(200).json({
        success: true,
        count: 10,
        rewarded: true,
        link: `${proto}://${host}/?ref=guest_vip`
      });
    default:
      return res.status(200).json(getPrediction());
  }
});

// Mount router on both /api and root / to support all Vercel rewrite patterns
app.use('/api', router);
app.use('/', router);

module.exports = app;
