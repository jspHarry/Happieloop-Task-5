// Simple WebSocket chat client
const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
let username = '';
let currentRoom = 'general';

const $ = id => document.getElementById(id);
const roomsEl = $('rooms');
const messagesEl = $('messages');
const chatTitle = $('chat-title');
const chatSub = $('chat-sub');
const userTag = $('user-tag');
const modal = $('modal-username');

function formatTime(ts){
  const d = new Date(ts);
  return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

function renderRooms(list){
  roomsEl.innerHTML = '';
  list.forEach(r=>{
    const div = document.createElement('div');
    div.className = 'room-item' + (r===currentRoom ? ' active' : '');
    div.innerHTML = `<div class="room-avatar">${r[0].toUpperCase()}</div>
      <div class="room-meta"><div class="room-name">${r}</div><div class="room-last">Click to join</div></div>`;
    div.onclick = ()=> switchRoom(r);
    roomsEl.appendChild(div);
  });
}

function addMessage(msg, me=false){
  if(msg.type === 'notice'){
    const n = document.createElement('div'); n.className='notice'; n.textContent = msg.text;
    messagesEl.appendChild(n);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return;
  }
  const row = document.createElement('div');
  row.className = 'message-row' + (me ? ' me' : '');
  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + (me ? 'outgoing' : 'incoming');
  bubble.innerHTML = `<div class="text">${escapeHtml(msg.text)}</div>
    <span class="meta">${escapeHtml(msg.username)} • ${formatTime(msg.ts)}</span>`;
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

ws.addEventListener('open', ()=> console.log('WS open'));
ws.addEventListener('message', (ev)=>{
  let data;
  try{ data = JSON.parse(ev.data); } catch(e){ return; }
  if(data.type === 'init'){
    renderRooms(data.rooms || ['general']);
    currentRoom = data.room || 'general';
    chatTitle.textContent = capitalize(currentRoom);
    renderHistory(data.history || []);
  } else if(data.type === 'joined' || data.type === 'switched'){
    currentRoom = data.room;
    chatTitle.textContent = capitalize(currentRoom);
    renderHistory(data.history || []);
  } else if(data.type === 'message'){
    addMessage(data.message, data.message.username === username);
  } else if(data.type === 'notice'){
    addMessage({type:'notice', text: data.text});
  }
});

function renderHistory(arr){
  messagesEl.innerHTML = '';
  arr.forEach(m => addMessage(m, m.username === username));
}

function switchRoom(r){
  if(r === currentRoom) return;
  ws.send(JSON.stringify({type:'switch', room: r}));
}

function sendMessage(text){
  if(!text) return;
  ws.send(JSON.stringify({type:'message', text}));
  $('message-input').value = '';
}

$('send-btn').addEventListener('click', ()=> sendMessage($('message-input').value));
$('message-input').addEventListener('keydown', (e)=> { if(e.key === 'Enter') sendMessage(e.target.value); });

$('enter-btn').addEventListener('click', ()=> {
  const name = $('username').value.trim() || ('User' + Math.floor(Math.random()*900+100));
  username = name;
  userTag.textContent = 'You: ' + username;
  modal.style.display = 'none';
  ws.send(JSON.stringify({type:'join', username, room: currentRoom}));
});

function capitalize(s){ return s[0].toUpperCase() + s.slice(1); }
// simple escape shown earlier

function initUI(){
  modal.style.display = 'flex';
  $('username').focus();
  // default room buttons will be populated from server init
}

initUI();
