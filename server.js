const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8080;
const PERSISTENCE_FILE = path.join(__dirname, 'messages.json');
const MAX_HISTORY = 200;

// Default rooms and in-memory data
const rooms = ['general', 'random', 'tech'];
const clients = new Map(); // ws -> {id, username, room}
const history = {}; // room -> [{id, username, text, ts}]
rooms.forEach(r => history[r] = []);

// Load persisted messages if file exists
if (fs.existsSync(PERSISTENCE_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(PERSISTENCE_FILE));
    for (const r of rooms) {
      if (data[r] && Array.isArray(data[r])) history[r] = data[r].slice(-MAX_HISTORY);
    }
    console.log('Loaded persisted messages.');
  } catch (e) {
    console.warn('Failed to load persistence file:', e.message);
  }
}

app.use(express.static(path.join(__dirname, 'public')));

function persistMessages() {
  const payload = {};
  for (const r of rooms) payload[r] = history[r];
  fs.writeFile(PERSISTENCE_FILE, JSON.stringify(payload, null, 2), err => {
    if (err) console.error('Error persisting messages:', err);
  });
}

function broadcastToRoom(room, data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      const meta = clients.get(client);
      if (meta && meta.room === room) {
        client.send(msg);
      }
    }
  });
}

wss.on('connection', (ws) => {
  const id = uuidv4();
  clients.set(ws, { id, username: 'Anonymous', room: 'general' });
  console.log('Client connected', id);

  // Send initial room list and current history for 'general'
  ws.send(JSON.stringify({ type: 'init', rooms, room: 'general', history: history['general'] }));

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (e) {
      console.warn('Invalid JSON received');
      return;
    }

    const meta = clients.get(ws);
    if (!meta) return;

    if (msg.type === 'join') {
      // {type: 'join', username, room}
      meta.username = msg.username || meta.username;
      meta.room = rooms.includes(msg.room) ? msg.room : 'general';
      // Send updated history for that room
      ws.send(JSON.stringify({ type: 'joined', room: meta.room, history: history[meta.room] }));
      // announce to room
      const notice = { type: 'notice', text: `${meta.username} joined ${meta.room}`, ts: Date.now() };
      broadcastToRoom(meta.room, notice);

    } else if (msg.type === 'message') {
      // {type: 'message', text}
      const item = { id: uuidv4(), username: meta.username, text: String(msg.text || ''), ts: Date.now() };
      history[meta.room].push(item);
      if (history[meta.room].length > MAX_HISTORY) history[meta.room].shift();
      // persist asynchronously
      persistMessages();
      broadcastToRoom(meta.room, { type: 'message', message: item });

    } else if (msg.type === 'switch') {
      // {type: 'switch', room}
      const oldRoom = meta.room;
      meta.room = rooms.includes(msg.room) ? msg.room : 'general';
      ws.send(JSON.stringify({ type: 'switched', room: meta.room, history: history[meta.room] }));
      broadcastToRoom(oldRoom, { type: 'notice', text: `${meta.username} left to ${meta.room}`, ts: Date.now() });
      broadcastToRoom(meta.room, { type: 'notice', text: `${meta.username} joined ${meta.room}`, ts: Date.now() });
    }
  });

  ws.on('close', () => {
    const meta = clients.get(ws) || {};
    console.log('Client disconnected', meta.id || '');
    if (meta.room) {
      broadcastToRoom(meta.room, { type: 'notice', text: `${meta.username || 'Someone'} left`, ts: Date.now() });
    }
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
