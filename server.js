/**
 * KINGPIN 5.0 - Local / VPS Development Server
 * Runs static frontend + API + Socket.IO real-time engine
 */

const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');

const apiApp = require('./api/index.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3000;

// Mount API serverless handler
app.use(apiApp);

// Serve static frontend files
app.use(express.static(path.join(__dirname)));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// ══════════════════════════════════════════════════════════
// Socket.IO Real-time Engine
// ══════════════════════════════════════════════════════════

let currentIssue = 2026100310001000;
let countdownSecs = 30;
const TOTAL_CYCLE = 30;
let lastDraw = { issue: String(currentIssue), number: 7, bs: 'B', color: 'green' };

const ACCOUNTS = {};
const SOCKET_SESSIONS = new Map();

function getOrCreateAccount(platform, phone) {
  const id = (platform || 'goa') + ':' + phone;
  if (!ACCOUNTS[id]) {
    ACCOUNTS[id] = {
      id: id,
      phone: phone,
      platform: platform || 'goa',
      loggedIn: true,
      engine: 'stopped',
      balance: 1000.00,
      pnl: 0,
      wins: 0,
      losses: 0,
      level: 1,
      highestLevel: 1,
      levels: [2, 4, 9, 19, 41, 88, 189, 406, 873, 1877],
      formula: 'ny_prime',
      gameMode: 'WinGo_30S',
      prediction: { pred: 'BIG', displayPred: 'BIG', issue: String(currentIssue + 1) },
      betHistory: [],
      predHistory: [],
      layers: {
        layer2: null
      }
    };
  }
  return ACCOUNTS[id];
}

function processDrawOutcome(draw) {
  Object.values(ACCOUNTS).forEach(acct => {
    const nextPred = Math.random() > 0.5 ? 'BIG' : 'SMALL';
    acct.prediction = { pred: nextPred, displayPred: nextPred, issue: draw.nextIssue };

    const predResultWon = (draw.bs === 'B' && acct.prediction.pred === 'BIG') || (draw.bs === 'S' && acct.prediction.pred === 'SMALL');
    acct.predHistory.unshift({
      forIssue: draw.issue,
      issue: draw.issue,
      formula: acct.formula,
      pred: acct.prediction.pred,
      displayPred: acct.prediction.displayPred,
      result: draw.bs === 'B' ? 'BIG' : 'SMALL',
      actualResult: draw.bs === 'B' ? 'BIG' : 'SMALL',
      correct: predResultWon
    });
    if (acct.predHistory.length > 50) acct.predHistory.pop();

    if (acct.engine === 'running') {
      const betAmt = acct.levels[acct.level - 1] || acct.levels[0] || 2;
      const won = predResultWon;

      if (won) {
        const netWin = betAmt * 0.96;
        acct.balance += netWin;
        acct.pnl += netWin;
        acct.wins++;
        acct.level = 1;
        acct.betHistory.unshift({
          issue: draw.issue,
          pred: acct.prediction.pred,
          displayPred: acct.prediction.displayPred,
          level: acct.level,
          amount: betAmt,
          won: true,
          pnl: netWin
        });
      } else {
        acct.balance -= betAmt;
        acct.pnl -= betAmt;
        acct.losses++;
        acct.level = Math.min(acct.levels.length, acct.level + 1);
        acct.highestLevel = Math.max(acct.highestLevel, acct.level);
        acct.betHistory.unshift({
          issue: draw.issue,
          pred: acct.prediction.pred,
          displayPred: acct.prediction.displayPred,
          level: acct.level - 1,
          amount: betAmt,
          won: false,
          pnl: -betAmt
        });
      }

      if (acct.betHistory.length > 50) acct.betHistory.pop();
    }

    io.emit('state', acct);
  });
}

// Global game tick
setInterval(() => {
  countdownSecs--;
  if (countdownSecs < 0) {
    countdownSecs = TOTAL_CYCLE - 1;
    currentIssue++;

    const num = Math.floor(Math.random() * 10);
    const isBig = num >= 5;
    const bs = isBig ? 'B' : 'S';
    let color = 'green';
    if (num === 0) color = 'red,violet';
    else if (num === 5) color = 'green,violet';
    else if (num % 2 === 0) color = 'red';

    lastDraw = {
      issue: String(currentIssue),
      number: num,
      bs: bs,
      color: color,
      nextIssue: String(currentIssue + 1)
    };

    io.emit('newDraw', lastDraw);
    processDrawOutcome(lastDraw);
  }

  io.emit('countdown', {
    secs: countdownSecs,
    total: TOTAL_CYCLE,
    issue: String(currentIssue + 1),
    layerId: 'layer1'
  });
}, 1000);

io.on('connection', (socket) => {
  SOCKET_SESSIONS.set(socket.id, { viewingId: null, accounts: new Set() });

  socket.on('auth', (data) => {
    const { phone, platform } = data || {};
    if (!phone) return socket.emit('authError', { msg: 'Missing phone' });

    const acct = getOrCreateAccount(platform, phone);
    const session = SOCKET_SESSIONS.get(socket.id);
    if (session) {
      session.accounts.add(acct.id);
      session.viewingId = acct.id;
    }

    socket.emit('state', acct);
    socket.emit('accountList', Array.from(session.accounts).map(id => ACCOUNTS[id]));
  });

  socket.on('switchView', (data) => {
    const { phone, platform } = data || {};
    const id = (platform || 'goa') + ':' + phone;
    if (ACCOUNTS[id]) {
      const session = SOCKET_SESSIONS.get(socket.id);
      if (session) session.viewingId = id;
      socket.emit('state', ACCOUNTS[id]);
    }
  });

  socket.on('start', () => {
    const session = SOCKET_SESSIONS.get(socket.id);
    if (!session || !session.viewingId) return;
    const acct = ACCOUNTS[session.viewingId];
    if (acct) {
      acct.engine = 'running';
      socket.emit('state', acct);
      socket.emit('toast', { title: 'Engine Started', msg: `Autobet active for ${acct.phone}`, type: 'success' });
    }
  });

  socket.on('stop', () => {
    const session = SOCKET_SESSIONS.get(socket.id);
    if (!session || !session.viewingId) return;
    const acct = ACCOUNTS[session.viewingId];
    if (acct) {
      acct.engine = 'stopped';
      socket.emit('state', acct);
      socket.emit('toast', { title: 'Engine Stopped', msg: `Autobet stopped for ${acct.phone}`, type: 'info' });
    }
  });

  socket.on('setGameMode', (data) => {
    const session = SOCKET_SESSIONS.get(socket.id);
    if (!session || !session.viewingId) return;
    const acct = ACCOUNTS[session.viewingId];
    if (acct && data && data.gameMode) {
      acct.gameMode = data.gameMode;
      socket.emit('state', acct);
    }
  });

  socket.on('setLevels', (data) => {
    const session = SOCKET_SESSIONS.get(socket.id);
    if (!session || !session.viewingId) return;
    const acct = ACCOUNTS[session.viewingId];
    if (acct && data && Array.isArray(data.custom)) {
      acct.levels = data.custom;
      socket.emit('state', acct);
    }
  });

  socket.on('setCompounding', (data) => {
    const session = SOCKET_SESSIONS.get(socket.id);
    if (!session || !session.viewingId) return;
    const acct = ACCOUNTS[session.viewingId];
    if (acct && data) {
      acct.compounding = data;
      socket.emit('state', acct);
    }
  });

  socket.on('setLevelJump', (data) => {
    const session = SOCKET_SESSIONS.get(socket.id);
    if (!session || !session.viewingId) return;
    const acct = ACCOUNTS[session.viewingId];
    if (acct && data) {
      acct.levelJump = data;
      socket.emit('state', acct);
    }
  });

  socket.on('setTargetLevelBet', (data) => {
    const session = SOCKET_SESSIONS.get(socket.id);
    if (!session || !session.viewingId) return;
    const acct = ACCOUNTS[session.viewingId];
    if (acct && data) {
      acct.targetLevelBetEnabled = data.enabled;
      acct.targetLevel = data.targetLevel;
      socket.emit('state', acct);
    }
  });

  socket.on('addLayer2', () => {
    const session = SOCKET_SESSIONS.get(socket.id);
    if (!session || !session.viewingId) return;
    const acct = ACCOUNTS[session.viewingId];
    if (acct) {
      acct.layers.layer2 = {
        engine: 'stopped',
        level: 1,
        levels: [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024],
        pnl: 0,
        wins: 0,
        losses: 0,
        betHistory: []
      };
      socket.emit('state', acct);
    }
  });

  socket.on('removeLayer2', () => {
    const session = SOCKET_SESSIONS.get(socket.id);
    if (!session || !session.viewingId) return;
    const acct = ACCOUNTS[session.viewingId];
    if (acct) {
      acct.layers.layer2 = null;
      socket.emit('state', acct);
    }
  });

  socket.on('resetStats', () => {
    const session = SOCKET_SESSIONS.get(socket.id);
    if (!session || !session.viewingId) return;
    const acct = ACCOUNTS[session.viewingId];
    if (acct) {
      acct.wins = 0;
      acct.losses = 0;
      acct.pnl = 0;
      acct.level = 1;
      acct.highestLevel = 1;
      socket.emit('state', acct);
    }
  });

  socket.on('getBetRecord', (data) => {
    const session = SOCKET_SESSIONS.get(socket.id);
    if (!session || !session.viewingId) return;
    const acct = ACCOUNTS[session.viewingId];
    socket.emit('betRecord', {
      page: data.page || 1,
      total: acct ? acct.betHistory.length : 0,
      list: acct ? acct.betHistory : []
    });
  });

  socket.on('exportHistory', (data) => {
    const count = Math.min(500, parseInt(data.totalRecords) || 100);
    const records = [];
    let issueNum = currentIssue;
    for (let i = 0; i < count; i++) {
      const n = Math.floor(Math.random() * 10);
      records.push({
        issueNumber: String(issueNum - i),
        number: n,
        bs: n >= 5 ? 'B' : 'S',
        colour: n === 0 ? 'red,violet' : n === 5 ? 'green,violet' : n % 2 === 0 ? 'red' : 'green',
        openTime: new Date(Date.now() - i * 30000).toISOString()
      });
    }
    socket.emit('exportHistoryProgress', { page: 1, maxPages: 1, total: count });
    socket.emit('exportHistoryResult', { ok: true, list: records });
  });

  socket.on('disconnect', () => {
    SOCKET_SESSIONS.delete(socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[KINGPIN 5.0] Local server running at http://localhost:${PORT}`);
  console.log(`[KINGPIN 5.0] Master Superuser Key: KP500-ADMIN-SUPER-USER0-99999`);
});
