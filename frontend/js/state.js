'use strict';

const BACKEND = '';
const TIME    = () => new Date().toLocaleTimeString('en-MY',{hour:'2-digit',minute:'2-digit'});

const state = {
  screen:            'notif',   
  user:              null,      
  transactions:      [],       
  flagged:           [],       
  activeTransaction: null,     
  chatHistory:       [],      
  aiReplyCount:      0,
  evidence:          [],        
  generatedReport:   null,      
};

// ROUTER 
function navigate(screenId, data = {}) {
  Object.assign(state, data);
  state.screen = screenId;
  render();
  document.getElementById('app')?.querySelector('.scroll')?.scrollTo(0, 0);
}

function render() {
  const app = document.getElementById('app');
  const screens = {
    notif:       screenNotif,
    history:     screenHistory,
    wrongSender: screenWrongSender,
    recipient:   screenRecipient,
    chat:        screenChat,
    evidence:    screenEvidence,
    report:      screenReport,
  };
  const fn = screens[state.screen] || screenNotif;
  app.innerHTML = fn();
  attachEvents();
}

// HELPERS — HTML building blocks
const fmt = (n) => `RM ${Math.abs(n).toFixed(2)}`;
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-MY',{day:'numeric',month:'short',year:'numeric'}) +
    ', ' + d.toLocaleTimeString('en-MY',{hour:'2-digit',minute:'2-digit'});
};

const statusBar = (cls='sbar-bg-mag') =>
  `<div class="sbar ${cls}"><span style="font-family:'JetBrains Mono',monospace">${TIME()}</span><div class="sbar-icons"><span>📶</span><span>🔋</span></div></div>`;

const beuLogo = () =>
  `<div class="logo-row"><div class="logo-box">🌙</div><div><div class="logo-name">Be U</div><div class="logo-sub">by Bank Islam</div></div></div>`;

const bottomNav = (active) => {
  const tabs = [
    {id:'notif', icon:'🔔', label:'Smart Notif'},
    {id:'chat',  icon:'🤖', label:'AI Chat'},
    {id:'evidence', icon:'📎', label:'Evidence Organizer'},
  ];
  return `<div class="bnav">${tabs.map(t=>
    `<button class="bni ${active===t.id?'on':''}" onclick="navigate('${t.id}')" >
      <span>${t.icon}</span><span>${t.label}</span>
    </button>`
  ).join('')}</div>`;
};

const txnIcon = (txn) => {
  if (txn.flagged) return {bg:'#FFD6EF', icon:'⚠️'};
  if (txn.amount > 0) return {bg:'#E6F5EF', icon:'💼'};
  const map = {'McDonald\'s':'#FEE2E2,🍔','Shopee':'#E0F2FE,🛒','MyNews':'#EDE9FE,🏪','Salary':'#E6F5EF,💼'};
  for (const k in map) {
    if (txn.merchant.includes(k)) { const [bg,icon]=map[k].split(','); return {bg,icon}; }
  }
  return {bg:'#F0F4FA', icon:'💳'};
};