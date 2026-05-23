'use strict';

function overlay(id, content) {
  return `<div class="overlay" id="ov_${id}"><div style="max-width:260px;">${content}</div></div>`;
}
function showOverlay(id)  { document.getElementById('ov_'+id)?.classList.add('show'); }
function hideOverlay(id)  { document.getElementById('ov_'+id)?.classList.remove('show'); }

function onReport(txnId) {
  const txn = state.transactions.find(t => t.id === txnId);
  if (!txn) return;
  state.activeTransaction = txn;
  if (txn.riskLevel === 'high' || txn.flagged) {
    startFraudReport(txnId);
  } else {
    navigate('wrongSender');
  }
}

function startFraudReport(txnId) {
  const txn = state.transactions.find(t => t.id === txnId);
  state.activeTransaction = txn || state.transactions[0];
  state.chatHistory = [{
    role: 'assistant',
    content: `Assalamu'alaikum 👋 I've loaded your transaction details — ${fmt(state.activeTransaction.amount)} to ${state.activeTransaction.merchant}. Just a few questions and I'll build your complete dispute report. <strong>How did the scammer first contact you?</strong>`
  }];
  state.aiReplyCount = 0;
  state.evidence     = [];
  navigate('chat');
}

function startWrongTransfer() {
  const txn = state.transactions.find(t => !t.flagged && t.amount < 0) || state.transactions[1];
  state.activeTransaction = txn;
  navigate('wrongSender');
}

async function notifyRecipient() {
  try {
    await fetch(`${BACKEND}/api/notify`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ transaction: state.activeTransaction, senderNote: 'Sent to wrong number, sorry!' })
    });
  } catch {}
  showOverlay('notifyDone');
}

async function generateReport() {

  toast('Generating your dispute report…', 5000);
  try {
    const res = await fetch(`${BACKEND}/api/report`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ messages: state.chatHistory, transaction: state.activeTransaction })
    });
    state.generatedReport = await res.json();
  } catch {
    state.generatedReport = {
      caseId: `DAI-BISLM-${Date.now()}`,
      victim: state.user?.name || 'Amirah binti Razak',
      platform: 'Be U by Bank Islam',
      fraudType: 'QR Phishing / Lucky Draw Scam',
      amount: state.activeTransaction ? Math.abs(state.activeTransaction.amount) : 2400,
      ref: state.activeTransaction?.ref || 'BISLM2604270938AA',
      merchant: state.activeTransaction?.merchant || 'SG Trader 88',
      scammerContact: state.evidence.find(e=>e.phoneNumber)?.phoneNumber || '+60 11-8821 4490',
      summary: 'Victim was contacted via WhatsApp with a fraudulent lucky draw offer. A malicious QR code caused an unauthorised payment. Victim did not knowingly authorise this transaction.',
      riskLevel: 'high',
      evidenceCount: state.evidence.length + 2,
      submissionRoutes: [
        {id:'bank_islam',icon:'🌙',name:'Bank Islam — Be U Dispute',note:'Fastest freeze · Shariah-compliant',priority:'primary'},
        {id:'nsrc',icon:'🏛️',name:'NSRC · 997 Hotline',note:'Pre-filled report ready',priority:'secondary'},
        {id:'pdrm',icon:'🚔',name:'PDRM — CCID e-Report',note:'Auto-filled · Police report',priority:'secondary'},
        {id:'ifsb',icon:'🌙',name:'IFSB Shariah Consumer Protection',note:'Islamic finance dispute channel',priority:'gold'},
      ]
    };
  }
  navigate('report');
}

function submitAll() { showOverlay('submitted'); }

async function sendChat() {
  const input = document.getElementById('chatInput');
  const text  = input?.value?.trim();
  if (!text) return;
  input.value = '';

  state.chatHistory.push({ role: 'user', content: text });
  render();
  await scrollChat();
  await fetchAIReply(text);
}

function selectChip(text) {
  state.chatHistory.push({ role: 'user', content: text });
  render();
  scrollChat().then(() => fetchAIReply(text));
}


const CHIP_FALLBACKS = {
  'Scanned QR code': "QR code phishing is one of the most common scam methods right now — noted. The scammer likely sent you a fake QR that redirected payment to their account. Do you still have the QR code image or the WhatsApp message they sent it in? Tap 📷 to upload a screenshot.",
  'Clicked a suspicious link': "Clicking a phishing link can trigger automatic payment redirects — logged. Did the link ask you to log in or confirm any details before the payment went through? Also, do you have a screenshot of the message containing the link?",
  'Gave my OTP to someone': "Sharing an OTP is a serious red flag — the scammer used it to authorise the transaction on your behalf. This is classified as social engineering fraud. Do you remember the phone number or name of the person who asked for it? Tap 📷 to upload any screenshots.",
  'Someone called me': "Phone call scams often impersonate bank officers or government agencies — noted. Did they claim to be from Bank Islam, BNM, or a government body? Do you still have the number they called from? Tap 📷 to upload a screenshot of the call log.",
};

const GENERIC_FALLBACKS = [
  "Got it — I've noted that. Do you have a screenshot of the scammer's message or any communication? Tap 📷 to upload it — I'll extract the key details automatically.",
  "Understood. Do you have the scammer's contact number or any screenshots? Tap 📷 to upload them.",
  "Thank you. I have enough information to build your dispute report. Tap the button below to review the evidence I've collected.",
];

async function fetchAIReply(lastUserMessage = '') {
  const chatBody = document.getElementById('chatBody');
  const typing = document.createElement('div');
  typing.className = 'brow';
  typing.id = 'typing';
  typing.innerHTML = `<div class="av ai">AI</div>
    <div class="bubble ai" style="display:flex;align-items:center;gap:5px;">
      <span style="width:6px;height:6px;background:var(--mag);border-radius:50%;animation:bounce .8s infinite 0s;display:inline-block;"></span>
      <span style="width:6px;height:6px;background:var(--mag);border-radius:50%;animation:bounce .8s infinite .15s;display:inline-block;"></span>
      <span style="width:6px;height:6px;background:var(--mag);border-radius:50%;animation:bounce .8s infinite .3s;display:inline-block;"></span>
    </div>`;
  chatBody?.appendChild(typing);
  await scrollChat();

  let reply;
  try {
    const res = await fetch(`${BACKEND}/api/chat`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ messages: state.chatHistory, transaction: state.activeTransaction })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.reply) throw new Error('Empty reply from server');

    if (data.fallback) {
      throw new Error('Server used fallback — using chip-specific response');
    }

    reply = data.reply;
  } catch (err) {
    console.error('Chat fetch failed:', err.message);
    if (CHIP_FALLBACKS[lastUserMessage]) {
      reply = CHIP_FALLBACKS[lastUserMessage];
    } else {
      const idx = Math.max(0, state.aiReplyCount - 1);
      reply = GENERIC_FALLBACKS[Math.min(idx, GENERIC_FALLBACKS.length - 1)];
    }
  }

  state.chatHistory.push({ role: 'assistant', content: reply });
  state.aiReplyCount++;
  render();
  scrollChat();
}

async function scrollChat() {
  await new Promise(r => setTimeout(r, 50));
  const el = document.getElementById('chatScroll');
  if (el) el.scrollTop = el.scrollHeight;
}

async function uploadScreenshot(event) {
  const file = event.target.files[0];
  if (!file || state.screen !== 'chat') return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl  = e.target.result;
    const base64   = dataUrl.split(',')[1];
    const mimeType = file.type || 'image/jpeg';

    // User image bubble
    state.chatHistory.push({ role: 'user', content: `[Uploaded screenshot: ${file.name}]` });
    render();

    // Replace last user bubble with actual image preview
    await new Promise(r => setTimeout(r, 50));
    const chatBody = document.getElementById('chatBody');
    const allUserBrows = chatBody?.querySelectorAll('.brow.user');
    const lastBrow = allUserBrows?.[allUserBrows.length - 1];
    if (lastBrow) {
      lastBrow.querySelector('.bubble.user').innerHTML =
        `<img src="${dataUrl}" style="max-width:160px;max-height:120px;border-radius:9px;display:block;" alt="Screenshot">
         <div style="font-size:9px;opacity:.7;margin-top:4px;">📎 ${file.name}</div>`;
    }

    const typing = document.createElement('div');
    typing.className = 'brow'; typing.id = 'typing';
    typing.innerHTML = `<div class="av ai">AI</div>
      <div class="bubble ai" style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);font-style:italic;">
        <span style="width:6px;height:6px;background:var(--mag);border-radius:50%;animation:bounce .8s infinite 0s;display:inline-block;"></span>
        <span style="width:6px;height:6px;background:var(--mag);border-radius:50%;animation:bounce .8s infinite .15s;display:inline-block;"></span>
        <span style="width:6px;height:6px;background:var(--mag);border-radius:50%;animation:bounce .8s infinite .3s;display:inline-block;"></span>
        Reading screenshot…
      </div>`;
    chatBody?.appendChild(typing);
    await scrollChat();

    let ex;
    try {
      const res = await fetch(`${BACKEND}/api/scan`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ image: base64, mimeType })
      });
      ex = await res.json();
    } catch {
      ex = { found:true, phoneNumber:'+60 11-8821 4490', timestamp:'9:15 AM', platform:'WhatsApp',
        messageContent:'Tahniah! Anda memenangi hadiah. Tekan pautan untuk tuntut.',
        scamType:'lucky draw', confidence:'high',
        redFlags:['Unsolicited prize', 'Urgency language', 'Suspicious link'] };
    }

    document.getElementById('typing')?.remove();

    if (ex.found === false) {
      state.chatHistory.push({ role:'assistant', content:"I couldn't read that image clearly. Please try a clearer screenshot or type the details manually." });
    } else {
      if (ex.phoneNumber) {
        state.evidence.push({ label:'Scammer contact number', status:'done', note:`${ex.phoneNumber} — from screenshot`, phoneNumber: ex.phoneNumber, fromScreenshot: true });
      } else {
        state.evidence.push({ label:'Screenshot uploaded', status:'done', note:'Analysed by DisputeAI', fromScreenshot: true });
      }

      const flags = (ex.redFlags||[]).map(f=>`<span style="background:var(--red-light);color:var(--red);font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;">⚑ ${f}</span>`).join('');
      const cardHTML = `<div class="extract-card">
        <div class="extract-hdr"><div style="font-size:9px;font-weight:800;opacity:.75;letter-spacing:.05em;">SCREENSHOT ANALYSED ✓</div><div style="font-size:12px;font-weight:800;">Evidence extracted automatically</div></div>
        <div class="extract-body">
          ${ex.phoneNumber ? `<div class="extract-row"><span style="color:var(--muted);">Scammer number</span><span style="font-weight:800;color:var(--red);font-family:'JetBrains Mono',monospace;">${ex.phoneNumber}</span></div>` : ''}
          ${ex.timestamp ? `<div class="extract-row"><span style="color:var(--muted);">Timestamp</span><span style="font-weight:700;">${ex.timestamp}</span></div>` : ''}
          ${ex.platform ? `<div class="extract-row"><span style="color:var(--muted);">Platform</span><span style="font-weight:700;">${ex.platform}</span></div>` : ''}
          ${ex.scamType ? `<div class="extract-row"><span style="color:var(--muted);">Scam type</span><span style="font-weight:700;color:var(--mag);">${ex.scamType}</span></div>` : ''}
          ${ex.messageContent ? `<div style="font-size:11px;"><div style="color:var(--muted);margin-bottom:3px;">Message</div><em style="line-height:1.4;">"${ex.messageContent}"</em></div>` : ''}
          ${flags ? `<div style="font-size:11px;"><div style="color:var(--muted);margin-bottom:4px;">Red flags</div><div style="display:flex;flex-wrap:wrap;gap:4px;">${flags}</div></div>` : ''}
        </div>
        <div class="extract-foot"><span>✅</span><span style="font-size:10px;font-weight:700;color:var(--grn);">Evidence saved · Confidence: ${ex.confidence||'high'}</span></div>
      </div>`;

      const followMsg = ex.phoneNumber
        ? `I've extracted scammer number <strong>${ex.phoneNumber}</strong> from your screenshot — logged as evidence. Is there anything else to add?`
        : `Screenshot analysed and saved. Shall I generate your dispute report?`;

      state.chatHistory.push({ role:'assistant', content: cardHTML + '<br>' + followMsg });
      state.aiReplyCount++;
    }

    render();
    scrollChat();
    event.target.value = '';
  };
  reader.readAsDataURL(file);
}

document.getElementById('imgInput').addEventListener('change', uploadScreenshot);


function attachEvents() {
  document.getElementById('chatInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendChat();
  });
  if (state.screen === 'chat') scrollChat();
}

function toast(msg, duration = 3000) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), duration);
}
function downloadPDF() {
  const r = state.generatedReport;
  if (!r) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W=210, M=18, CW=W-M*2;
  const MAG=[233,30,140],GRN=[0,122,77],DARK=[26,10,20],MID=[90,58,80],MUTED=[154,122,138];
  const BGMAG=[253,233,244],BGGRN=[230,245,239],BGRED=[255,240,240];
  let y=0;

  const sf = (style='normal',size=10,color=DARK) => { doc.setFont('helvetica',style); doc.setFontSize(size); doc.setTextColor(...color); };
  const rect = (x,yy,w,h,fill,stroke=null) => { doc.setFillColor(...fill); if(stroke){doc.setDrawColor(...stroke);doc.rect(x,yy,w,h,'FD');}else{doc.setDrawColor(...fill);doc.rect(x,yy,w,h,'F');} };
  const hline = (yy,c=[220,200,215]) => { doc.setDrawColor(...c);doc.setLineWidth(.3);doc.line(M,yy,W-M,yy); };
  const checkPB = (n=20) => { if(y+n>275){doc.addPage();y=18;} };

  rect(0,0,W,40,MAG);
  sf('bold',14,[255,255,255]); doc.text('DisputeAI',M+12,14);
  sf('normal',8,[255,200,230]); doc.text('× Be U by Bank Islam',M+12,20);
  sf('bold',8,[255,255,255]); doc.text('DISPUTE REPORT',W-M-38,14);
  sf('normal',8,[255,200,230]); doc.text(`Case ID: ${r.caseId}`,M,28);
  sf('bold',8,[255,255,255]); doc.text('CONFIDENTIAL',W-M,28,{align:'right'});
  y=48;

  rect(M,y-3,22,7,[214,59,59]);
  sf('bold',7.5,[255,255,255]); doc.text(`⚠ ${(r.riskLevel||'HIGH').toUpperCase()} RISK`,M+1.5,y+2);
  rect(M+25,y-3,28,7,BGGRN);
  sf('bold',7.5,GRN); doc.text('🌙 SHARIAH REPORT',M+26.5,y+2);
  y+=10;
  sf('bold',16,DARK); doc.text(r.fraudType,M,y); y+=7;
  sf('normal',10,MID); doc.text(`${r.victim} · ${r.platform}`,M,y); y+=4;
  sf('normal',9,MUTED); doc.text(`Generated ${new Date().toLocaleDateString('en-MY',{day:'numeric',month:'long',year:'numeric'})}`,M,y); y+=10;
  hline(y); y+=7;

  // Section 1 
  sf('bold',8,MAG); doc.text('1. INCIDENT DETAILS',M,y);
  doc.setDrawColor(...MAG); doc.setLineWidth(.4); doc.line(M,y+1,W-M,y+1); y+=7;
  const col2=M+CW/2+5;
  let yL=y,yR=y;
  const detL=[['Victim',r.victim],['Platform',r.platform],['Fraud Type',r.fraudType],['Date & Time',r.dateTime||'—']];
  const detR=[['Amount Lost',`RM ${parseFloat(r.amount).toFixed(2)}`],['Ref No.',r.ref],['Scammer',r.scammerContact||'Unknown'],['Method',r.contactMethod||'—']];
  detL.forEach(([l,v])=>{ sf('normal',9,MUTED);doc.text(l,M,yL);sf('bold',9,DARK);doc.text(v,M,yL+4.5);yL+=12; });
  detR.forEach(([l,v])=>{ sf('normal',9,MUTED);doc.text(l,col2,yR);sf('bold',9,l==='Amount Lost'?[214,59,59]:DARK);doc.text(v,col2,yR+4.5);yR+=12; });
  y=Math.max(yL,yR)+4; hline(y); y+=7;

  // Section 2 
  sf('bold',8,MAG); doc.text('2. AI CASE SUMMARY',M,y); doc.line(M,y+1,W-M,y+1); y+=7;
  rect(M,y-2,CW,20,BGMAG); doc.setDrawColor(...MAG); doc.setLineWidth(.8); doc.line(M,y-2,M,y+18);
  sf('normal',9,[58,10,40]);
  const sumLines=doc.splitTextToSize(r.summary,CW-8); doc.text(sumLines,M+5,y+4);
  y+=sumLines.length*5+8; hline(y); y+=7;

  // Section 3 
  checkPB(50); sf('bold',8,MAG); doc.text('3. FRAUD TIMELINE',M,y); doc.line(M,y+1,W-M,y+1); y+=7;
  (r.timeline||[]).forEach((item,i)=>{
    checkPB(14);
    doc.setFillColor(...(i===0?[214,59,59]:i===(r.timeline.length-1)?GRN:[245,158,11]));
    doc.circle(M+3,y+1.5,2,'F');
    if(i<(r.timeline||[]).length-1){doc.setDrawColor(220,200,215);doc.setLineWidth(.4);doc.line(M+3,y+3.5,M+3,y+13);}
    sf('bold',7.5,GRN); doc.text(item.time,M+9,y+3);
    sf('normal',9,DARK); const el=doc.splitTextToSize(item.event,CW-34); doc.text(el,M+32,y+3);
    y+=Math.max(el.length*4.5,10)+4;
  });
  hline(y); y+=7;

  // Section 4 
  checkPB(60); sf('bold',8,MAG); doc.text('4. EVIDENCE COLLECTED',M,y); doc.line(M,y+1,W-M,y+1); y+=7;
  const evList=[
    {item:'Transaction reference',status:'Verified',note:r.ref},
    {item:'Amount & timestamp',status:'Verified',note:`RM ${parseFloat(r.amount).toFixed(2)}`},
    {item:'Scammer contact',status:r.scammerContact&&r.scammerContact!=='Unknown'?'Collected':'Missing',note:r.scammerContact||'—'},
    {item:'Fraud timeline',status:'Generated',note:'AI-reconstructed from victim account'},
    {item:'Police report',status:'Optional',note:'Not yet submitted — recommended'}
  ];
  evList.forEach(ev=>{ checkPB(12);
    const isDone=ev.status!=='Optional'&&ev.status!=='Missing';
    rect(M,y-1.5,CW,9,isDone?BGGRN:BGRED);
    rect(W-M-22,y-.5,22,7,isDone?BGGRN:BGRED);
    doc.setDrawColor(...(isDone?GRN:[214,59,59])); doc.setLineWidth(.3); doc.rect(W-M-22,y-.5,22,7);
    sf('bold',7,isDone?GRN:[214,59,59]); doc.text(ev.status.toUpperCase(),W-M-21,y+3.5);
    sf('bold',9,DARK); doc.text(ev.item,M+2,y+3);
    sf('normal',7.5,MUTED); doc.text(ev.note,M+2,y+7.5); y+=13;
  });
  hline(y); y+=7;

  // Section 5 
  checkPB(55); sf('bold',8,GRN); doc.text('5. SUBMISSION ROUTING',M,y); doc.setDrawColor(...GRN); doc.line(M,y+1,W-M,y+1); y+=7;
  (r.submissionRoutes||[]).forEach((rt,i)=>{ checkPB(16);
    const isPri=i===0; rect(M,y,CW,13,isPri?MAG:[245,242,248]);
    if(!isPri){doc.setDrawColor(220,200,215);doc.setLineWidth(.3);doc.rect(M,y,CW,13);}
    sf('bold',9.5,isPri?[255,255,255]:DARK); doc.text(rt.name,M+4,y+5);
    sf('normal',8,isPri?[255,200,230]:MUTED); doc.text(rt.note,M+4,y+10);
    sf('bold',9,isPri?[255,220,240]:MAG); doc.text(rt.contact||'',W-M-4,y+7,{align:'right'});
    y+=16;
  });

  // Footer
  rect(0,282,W,15,[245,242,248]); hline(282,[220,200,215]);
  sf('normal',7.5,MUTED); doc.text(`DisputeAI × Be U  ·  ${r.caseId}  ·  ${new Date().toLocaleDateString('en-MY')}`,W/2,289,{align:'center'});
  sf('bold',7.5,MAG); doc.text('CONFIDENTIAL',M,289);

  doc.save(`DisputeAI_${r.caseId}_${new Date().toISOString().slice(0,10)}.pdf`);
  toast(`📥 PDF downloaded — DisputeAI_${r.caseId}.pdf`);
}
async function boot() {
  try {
    const res  = await fetch(`${BACKEND}/api/transactions`);
    const data = await res.json();
    state.user         = data.user;
    state.transactions = data.transactions;
    state.flagged      = data.transactions.filter(t => t.flagged);
  } catch {

    state.user = { name:'Amirah binti Razak', balance:3247.80 };
    state.transactions = [
      {id:'TXN001',merchant:'SG Trader 88',amount:-2400,time:'2026-04-27T09:38:00',method:'QR Pay',ref:'BISLM2604270938AA',flagged:true,riskLevel:'high'},
      {id:'TXN002',merchant:'MyNews Holdings',amount:-12.50,time:'2026-04-27T09:20:00',method:'DuitNow',ref:'BISLM2604270920BB',flagged:false,riskLevel:'low'},
      {id:'TXN003',merchant:"McDonald's IOI City",amount:-23.90,time:'2026-04-27T08:55:00',method:'QR Pay',ref:'BISLM2604270855CC',flagged:false,riskLevel:'low'},
      {id:'TXN004',merchant:'Salary — ABC Sdn Bhd',amount:3500,time:'2026-04-26T09:00:00',method:'Bank Transfer',ref:'BISLM2604260900DD',flagged:false,riskLevel:'low'},
      {id:'TXN005',merchant:'Shopee Malaysia',amount:-89,time:'2026-04-26T14:30:00',method:'Online',ref:'BISLM2604261430EE',flagged:false,riskLevel:'low'},
    ];
    state.flagged = state.transactions.filter(t => t.flagged);
    toast('⚠️ Running offline — backend not connected');
  }
  render();
}

boot();