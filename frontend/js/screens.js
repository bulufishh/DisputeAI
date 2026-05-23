'use strict';


function screenNotif() {
  const alerts = state.flagged.map(txn => `
    <div class="notif danger fade-in">
      <div style="display:flex;align-items:flex-start;gap:9px;">
        <span style="font-size:20px;">🚨</span>
        <div style="flex:1;">
          <div class="notif-time">${fmtDate(txn.time).split(',')[1].trim()}</div>
          <div class="notif-title" style="color:#B00;">High-risk transaction detected</div>
          <div class="notif-body" style="color:#700;">${fmt(txn.amount)} sent to <strong>${txn.merchant}</strong> — first-time unregistered merchant. Did you authorise this?</div>
          <div class="notif-actions">
            <button class="nbtn danger" onclick="startFraudReport('${txn.id}')">🚩 Report fraud</button>
            <button class="nbtn ghost">Yes, it's mine</button>
          </div>
        </div>
      </div>
    </div>`).join('');

  const t1 = new Date(Date.now() - 2*60000).toLocaleTimeString('en-MY',{hour:'2-digit',minute:'2-digit'});
  const t2 = new Date(Date.now() - 8*60000).toLocaleTimeString('en-MY',{hour:'2-digit',minute:'2-digit'});
  const t3 = new Date(Date.now() - 11*60000).toLocaleTimeString('en-MY',{hour:'2-digit',minute:'2-digit'});

  const staticAlerts = `
    <div class="notif warn fade-in">
      <div style="display:flex;align-items:flex-start;gap:9px;">
        <span style="font-size:20px;">⚠️</span>
        <div style="flex:1;">
          <div class="notif-time">${t1}</div>
          <div class="notif-title" style="color:#7A5000;">First-time recipient</div>
          <div class="notif-body" style="color:#6B4A00;">You are transferring to <strong>+60 11-8821 4490</strong> for the first time. Please verify before confirming.</div>
          <div class="notif-actions">
            <button class="nbtn mag" onclick="showOverlay('confirmTransfer')">Confirm transfer</button>
            <button class="nbtn ghost">Cancel</button>
          </div>
        </div>
      </div>
    </div>
    <div class="notif grn fade-in">
      <div style="display:flex;align-items:flex-start;gap:9px;">
        <span style="font-size:20px;">✅</span>
        <div style="flex:1;">
          <div class="notif-time">${t2}</div>
          <div class="notif-title" style="color:#005C39;">Transfer confirmed</div>
          <div class="notif-body" style="color:#1A4A30;">RM 50.00 sent to <strong>Ahmad Faris</strong>. Made a mistake? You have 10 minutes.</div>
          <div class="notif-actions">
            <button class="nbtn ghost" onclick="startWrongTransfer()">↩ Report wrong transfer</button>
          </div>
        </div>
      </div>
    </div>
    <div class="notif gold fade-in">
      <div style="display:flex;align-items:flex-start;gap:9px;">
        <span style="font-size:20px;">🌙</span>
        <div style="flex:1;">
          <div class="notif-time">${t3}</div>
          <div class="notif-title" style="color:#7D5A00;">Be U Shariah reminder</div>
          <div class="notif-body" style="color:#6B4A00;">Large transfers may fall under Islamic consumer protection guidelines. DisputeAI is fully BNM Shariah-compliant.</div>
        </div>
      </div>
    </div>`;

  return `
    ${statusBar()}
    <div class="hdr hdr-mag">
      <div class="hdr-nav">
        <span></span>
        ${beuLogo()}
        <span class="hdr-pill">${state.flagged.length + 2} alerts</span>
      </div>
      <div style="font-size:13px;font-weight:800;margin-bottom:1px;">Smart Alerts</div>
      <div style="font-size:10px;opacity:.7;">AI-powered real-time risk detection</div>
    </div>
    <div class="scroll"><div class="body">
      ${state.flagged.length ? alerts : ''}
      ${staticAlerts}
    </div></div>
    ${bottomNav('notif')}
    ${overlay('confirmTransfer', `
      <div style="font-size:56px;margin-bottom:1rem;">✅</div>
      <div style="font-size:18px;font-weight:800;color:var(--grn);margin-bottom:.5rem;">Transfer Confirmed</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:.4rem;line-height:1.6;">RM 50.00 has been sent to <strong style="color:var(--text);">+60 11-8821 4490</strong>.</div>
      <div style="font-size:12px;color:var(--grn);font-weight:700;margin-bottom:1.5rem;">The recipient will receive the funds shortly.</div>
      <button class="btn-mag" style="width:auto;padding:10px 28px;" onclick="hideOverlay('confirmTransfer')">Done</button>`)}`;
}

// SCREEN 2 — TRANSACTION HISTORY
function screenHistory() {
  const rows = state.transactions.map(txn => {
    const {bg, icon} = txnIcon(txn);
    const isFlag = txn.flagged;
    return `
      <div class="txn ${isFlag ? 'fade-in' : ''}" style="${isFlag ? 'background:#FFF5FB;border-radius:9px;padding:9px;margin:-2px;' : ''}">
        <div class="txn-top">
          <div class="txn-ico" style="background:${bg};">${icon}</div>
          <div>
            <div class="txn-name" style="${isFlag ? 'color:var(--red);' : ''}">${txn.merchant}</div>
            <div class="txn-sub">${fmtDate(txn.time).split(',')[1].trim()} · ${txn.method}${isFlag ? ' · 🚩 Flagged' : ''}</div>
          </div>
          <div class="txn-amt ${txn.amount<0 ? (isFlag?'sus':'out') : 'inp'}">${txn.amount>0?'+':'–'}${fmt(txn.amount)}</div>
        </div>
        <button class="report-btn" onclick="onReport('${txn.id}')">↩ Report</button>
      </div>`;
  }).join('');

  // Find the flagged transaction to show the expanded card
  const flagged = state.flagged[0];
  const flagCard = flagged ? `
    <div class="flag-card fade-in">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:9px;">
        <span style="font-size:17px;">🚩</span>
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:800;color:#B00;">${flagged.merchant}</div>
          <div style="font-size:9px;color:var(--muted);">${fmtDate(flagged.time)} · ${flagged.method} · Flagged</div>
        </div>
        <div style="font-size:14px;font-weight:900;color:var(--red);">–${fmt(flagged.amount)}</div>
      </div>
      <div class="row"><span class="rl">Ref no.</span><span class="rv mono">${flagged.ref}</span></div>
      <div class="row" style="border:none;padding-bottom:0;"><span class="rl">Method</span><span class="rv">${flagged.method}</span></div>
      <div style="display:flex;gap:7px;margin-top:10px;">
        <button style="flex:1;background:var(--red);color:white;border:none;border-radius:9px;padding:9px;font-size:10px;font-weight:800;"
          onclick="startFraudReport('${flagged.id}')">🚩 Report as fraud</button>
        <button style="flex:1;background:var(--mag-light);color:var(--mag);border:1px solid var(--mag-mid);border-radius:9px;padding:9px;font-size:10px;font-weight:800;"
          onclick="startWrongTransfer()">↩ Wrong transfer</button>
      </div>
    </div>` : '';
  return `
    ${statusBar()}
    <div class="hdr hdr-mag">
      <div class="hdr-nav">
        <button class="back-btn" onclick="navigate('notif')">←</button>
        <span class="hdr-title">Transaction History</span>
        <span class="hdr-pill">${new Date().toLocaleDateString('en-MY',{month:'short',year:'numeric'})}</span>
      </div>
      <div style="font-size:11px;opacity:.75;margin-bottom:2px;">Total balance</div>
      <div style="font-size:22px;font-weight:900;">${state.user ? fmt(state.user.balance) : 'RM —'}</div>
      <div class="prog-bar"><div class="prog-fill" style="width:60%;"></div></div>
    </div>
    <div class="scroll"><div class="body">
      ${flagCard}
      <div class="card">
        <div class="card-lbl">Recent — tap Report on any transaction</div>
        ${rows || '<div style="text-align:center;color:var(--muted);padding:20px;font-size:13px;">Loading transactions…</div>'}
      </div>
    </div></div>
    ${bottomNav('')}`;
}


// SCREEN 3 — WRONG TRANSFER (SENDER)
function screenWrongSender() {
  const txn = state.activeTransaction;
  if (!txn) return navigate('history'), '';
  return `
    ${statusBar()}
    <div class="hdr hdr-mag">
      <div class="hdr-nav">
        <button class="back-btn" onclick="navigate('history')">←</button>
        <span class="hdr-title">Report Wrong Transfer</span>
        <span class="hdr-pill">Accidental</span>
      </div>
      <div style="font-size:10px;opacity:.75;margin-bottom:2px;">No police report needed for accidental transfers</div>
      <div class="prog-bar"><div class="prog-fill" style="width:50%;"></div></div>
    </div>
    <div class="scroll"><div class="body">
      <div class="info-strip" style="background:var(--mag-light);gap:8px;">
        <span style="font-size:15px;">⚡</span>
        <div style="font-size:11px;color:var(--mag-dark);font-weight:700;line-height:1.4;">Transaction details auto-extracted from your Be U history</div>
      </div>
      <div class="hero-box hero-mag">
        <div style="font-size:30px;margin-bottom:7px;">↩️</div>
        <div style="font-size:12px;font-weight:800;color:var(--mag-dark);margin-bottom:5px;">Accidental Transfer</div>
        <div style="font-size:24px;font-weight:900;color:var(--mag);">${fmt(txn.amount)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px;">to ${txn.merchant} · ${fmtDate(txn.time)}</div>
      </div>
      <div class="card">
        <div class="card-lbl">Auto-extracted details</div>
        <div class="row"><span class="rl">Recipient</span><span class="rv">${txn.merchant}</span></div>
        <div class="row"><span class="rl">Amount</span><span class="rv mag">${fmt(txn.amount)}</span></div>
        <div class="row"><span class="rl">Ref no.</span><span class="rv mono">${txn.ref}</span></div>
        <div class="row"><span class="rl">Time</span><span class="rv">${fmtDate(txn.time)}</span></div>
      </div>
      <div class="card">
        <div class="card-lbl">What happens next</div>
        <div class="tl"><div class="tl-left"><div class="tl-dot mag"></div><div class="tl-line"></div></div>
          <div><div class="tl-title">Recipient notified instantly</div><div class="tl-desc">They get an alert to return ${fmt(txn.amount)}</div></div></div>
        <div class="tl"><div class="tl-left"><div class="tl-dot amber"></div><div class="tl-line"></div></div>
          <div><div class="tl-title">24 hours to respond</div><div class="tl-desc">They can return it with one tap</div></div></div>
        <div class="tl"><div class="tl-left"><div class="tl-dot grn"></div></div>
          <div><div class="tl-title">Case logged with Bank Islam</div><div class="tl-desc">On record if escalation is needed</div></div></div>
      </div>
      <button class="btn-mag" onclick="notifyRecipient()">📨 Notify recipient now</button>
    </div></div>
    ${bottomNav('')}
    ${overlay('notifyDone', `
      <div style="font-size:56px;margin-bottom:1rem;">📨</div>
      <div style="font-size:18px;font-weight:800;color:var(--mag);margin-bottom:.5rem;">Recipient Notified</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:.4rem;line-height:1.6;"><strong style="color:var(--text);">${txn.merchant}</strong> has been sent a return request for ${fmt(txn.amount)}.</div>
      <div style="font-size:12px;color:var(--grn);font-weight:700;margin-bottom:1.5rem;">They have 24 hours to respond.</div>
      <button class="btn-mag" style="width:auto;padding:10px 28px;" onclick="navigate('recipient')">See recipient view →</button>`)}`;
}
// SCREEN 4 — RECIPIENT SIDE

function screenRecipient() {
  const txn = state.activeTransaction;
  const sender = state.user?.name || 'Amirah binti Razak';
  const amount = txn ? fmt(txn.amount) : 'RM 50.00';
  return `
    ${statusBar('sbar grn')}
    <div class="hdr hdr-grn">
      <div class="hdr-nav">
        <button class="back-btn" onclick="navigate('wrongSender')">←</button>
        ${beuLogo()}
        <span class="hdr-pill">Action needed</span>
      </div>
      <div style="font-size:13px;font-weight:800;margin-bottom:1px;">You received a wrong transfer</div>
      <div style="font-size:10px;opacity:.7;">The sender is requesting a return</div>
    </div>
    <div class="scroll"><div class="body">
      <div class="hero-box hero-grn">
        <div style="font-size:28px;margin-bottom:7px;">💸</div>
        <div style="font-size:11px;font-weight:700;color:var(--grn-dark);margin-bottom:5px;">Wrong transfer received</div>
        <div style="font-size:24px;font-weight:900;color:var(--grn);">${amount}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px;">from ${sender}</div>
        <div style="font-size:11px;color:var(--grn-dark);margin-top:7px;font-weight:600;">This was sent by mistake. Returning it keeps your Be U account in good standing.</div>
      </div>
      <div class="card">
        <div class="card-lbl">Transfer details</div>
        <div class="row"><span class="rl">Sender</span><span class="rv">${sender}</span></div>
        <div class="row"><span class="rl">Amount received</span><span class="rv grn">${amount}</span></div>
        <div class="row"><span class="rl">Ref no.</span><span class="rv mono">${txn?.ref || 'BISLM-****'}</span></div>
        <div class="row"><span class="rl">Sender note</span><span class="rv">"Sent to wrong number, sorry!"</span></div>
      </div>
      <div class="info-strip grn-strip">
        <span style="font-size:18px;">🌙</span>
        <div>
          <div style="font-size:11px;font-weight:800;color:#005C39;">Islamic finance principle</div>
          <div style="font-size:10px;color:var(--grn);margin-top:2px;">Returning mistaken funds reflects the principle of <em>amanah</em> (trustworthiness) in Islamic finance.</div>
        </div>
      </div>
      <button class="btn-grn" onclick="showOverlay('returnDone')">✅ Return ${amount} now</button>
      <button class="btn-outline" style="margin-top:4px;" onclick="showOverlay('disputeRequest')">Dispute this request</button>
      <div style="font-size:10px;color:var(--muted);text-align:center;line-height:1.5;">If you do not respond within 24 hours, Bank Islam may contact you directly.</div>
    </div></div>
    ${bottomNav('')}
    ${overlay('returnDone', `
      <div style="font-size:56px;margin-bottom:1rem;">💸</div>
      <div style="font-size:18px;font-weight:800;color:var(--grn);margin-bottom:.5rem;">${amount} Returned</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:.4rem;line-height:1.6;"><strong style="color:var(--text);">${sender}</strong> has been notified. Funds are on their way back.</div>
      <div style="font-size:12px;color:var(--grn);font-weight:700;margin-bottom:1.5rem;">Case resolved · Logged with Bank Islam</div>
      <button class="btn-grn" style="width:auto;padding:10px 28px;" onclick="navigate('notif')">Back to home</button>`)}
    ${overlay('disputeRequest', `
      <div style="font-size:56px;margin-bottom:1rem;">⚖️</div>
      <div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:.5rem;">Dispute Submitted</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:.6rem;line-height:1.7;">Your dispute has been logged with <strong style="color:var(--text);">Bank Islam</strong>. A case officer will review your claim within <strong style="color:var(--text);">3–5 business days</strong>.</div>
      <div style="background:var(--amber-light);border:1px solid var(--amber);border-radius:10px;padding:10px 14px;margin-bottom:1.5rem;">
        <div style="font-size:12px;font-weight:800;color:#7A5000;margin-bottom:3px;">⚠️ Please note</div>
        <div style="font-size:11px;color:#6B4A00;line-height:1.5;">Disputing a legitimate return request may result in a flag on your Be U account. Ensure you have valid grounds before proceeding.</div>
      </div>
      <button class="btn-mag" style="width:auto;padding:10px 28px;" onclick="hideOverlay('disputeRequest')">OK, understood</button>`)}`;
}

// SCREEN 5 — AI CHAT INTAKE

function screenChat() {
  const txn = state.activeTransaction;
  const strip = txn
    ? `<div class="info-strip" style="background:var(--mag-light);gap:8px;margin-bottom:4px;">
        <span style="font-size:14px;">⚡</span>
        <div style="font-size:10px;color:var(--mag-dark);font-weight:700;line-height:1.4;">
          Auto-extracted — ref ${txn.ref}, ${fmt(txn.amount)}
        </div>
      </div>` : '';

  const bubbles = state.chatHistory.map(m => {
    if (m.role === 'user') return `
      <div class="brow user fade-in">
        <div class="av usr">A</div>
        <div class="bubble user">${m.content}</div>
      </div>`;
    return `
      <div class="brow fade-in">
        <div class="av ai">AI</div>
        <div class="bubble ai"><div class="blabel">DisputeAI</div>${m.content}</div>
      </div>`;
  }).join('');

  const chips = state.chatHistory.length <= 2 ? `
    <div id="chipRow" style="padding-left:33px;">
      <div class="chips">
        <div class="chip" onclick="selectChip('Scanned QR code')">Scanned QR</div>
        <div class="chip" onclick="selectChip('Clicked a suspicious link')">Clicked link</div>
        <div class="chip" onclick="selectChip('Gave my OTP to someone')">Gave OTP</div>
        <div class="chip" onclick="selectChip('Someone called me')">Called me</div>
      </div>
    </div>` : '';

  const evidenceBtn = state.aiReplyCount >= 3
    ? `<button class="btn-mag fade-in" style="margin-top:10px;" onclick="navigate('evidence')">View evidence organiser →</button>`
    : '';

  // Show upload card after first AI reply, hide once a screenshot has been uploaded
  const hasUpload  = state.evidence.some(e => e.fromScreenshot);
  const uploadCard = state.aiReplyCount >= 1 && !hasUpload ? `
    <div style="margin-left:33px;margin-top:2px;" class="fade-in">
      <div style="background:var(--mag-light);border:1.5px dashed var(--mag);border-radius:12px;
        padding:11px 13px;text-align:center;cursor:pointer;"
        onclick="document.getElementById('imgInput').click()">
        <div style="font-size:22px;margin-bottom:4px;">📷</div>
        <div style="font-size:11px;font-weight:800;color:var(--mag);">Upload WhatsApp screenshot</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px;">I'll extract the scammer's number automatically</div>
      </div>
    </div>` : '';

  return `
    ${statusBar()}
    <div class="hdr hdr-mag" style="flex-shrink:0;">
      <div class="hdr-nav">
        <button class="back-btn" onclick="navigate('history')">←</button>
        <span class="hdr-title">DisputeAI Assistant</span>
        <span class="hdr-pill">Step 1/4</span>
      </div>
      <div style="font-size:10px;opacity:.75;margin-bottom:3px;">Case in progress · Details auto-loaded</div>
      <div class="prog-bar"><div class="prog-fill" style="width:25%;"></div></div>
      <div class="step-dots"><div class="sdot on"></div><div class="sdot"></div><div class="sdot"></div><div class="sdot"></div></div>
    </div>
    <div class="scroll" id="chatScroll">
      <div class="body" style="gap:5px;" id="chatBody">
        ${strip}
        ${bubbles}
        ${chips}
        ${uploadCard}
        ${evidenceBtn}
      </div>
    </div>
    <div class="ibar-wrap">
      <div class="ibar">
        <input type="text" id="chatInput" placeholder="Type your reply…">
        <button class="cam-btn" onclick="document.getElementById('imgInput').click()" title="Upload screenshot">📷</button>
        <button class="send-btn" onclick="sendChat()">
          <svg viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </div>
    </div>
    ${bottomNav('chat')}`;
}

// SCREEN 6 — EVIDENCE ORGANISER
function screenEvidence() {
  const txn = state.activeTransaction;
  const baseEvidence = txn ? [
    {label:'Transaction reference', status:'done', note:`${txn.ref} — auto-extracted`},
    {label:'Amount & date', status:'done', note:`${fmt(txn.amount)} · ${fmtDate(txn.time)}`},
  ] : [];

  const allEvidence = [...baseEvidence, ...state.evidence,
    {label:'Police report (optional)', status:'miss', note:'Raises recovery chance significantly'}
  ];

  const evItems = allEvidence.map(ev => `
    <div class="ev">
      <div class="ev-ico" style="background:${ev.status==='done' ? 'var(--grn-light)' : 'var(--amber-light)'};">
        ${ev.status==='done' ? '✅' : '⚠️'}
      </div>
      <div style="flex:1;">
        <div class="ev-title">${ev.label}</div>
        <div class="ev-sub">${ev.note}</div>
      </div>
      <div class="ev-badge ${ev.status}">${ev.status==='done' ? 'Done' : ev.status==='miss' ? 'Missing' : 'Optional'}</div>
    </div>`).join('');

  const timeline = txn ? `
    <div class="card">
      <div class="card-lbl">Auto-generated timeline</div>
      <div class="tl"><div class="tl-left"><div class="tl-dot red"></div><div class="tl-line"></div></div>
        <div><div class="tl-time">Approx. 20 min before</div><div class="tl-title">First contact via WhatsApp</div><div class="tl-desc">Lucky draw / phishing message sent by scammer</div></div></div>
      <div class="tl"><div class="tl-left"><div class="tl-dot amber"></div><div class="tl-line"></div></div>
        <div><div class="tl-time">Approx. 6 min before</div><div class="tl-title">Malicious QR code scanned</div><div class="tl-desc">Sent via WhatsApp image attachment</div></div></div>
      <div class="tl"><div class="tl-left"><div class="tl-dot red"></div></div>
        <div><div class="tl-time">${fmtDate(txn.time).split(',')[1].trim()}</div><div class="tl-title">Unauthorised payment executed</div><div class="tl-desc">${fmt(txn.amount)} → ${txn.merchant} via Be U QR Pay</div></div></div>
    </div>` : '';

  return `
    ${statusBar()}
    <div class="hdr hdr-mag">
      <div class="hdr-nav">
        <button class="back-btn" onclick="navigate('chat')">←</button>
        <span class="hdr-title">Evidence Organiser</span>
        <span class="hdr-pill">Step 3/4</span>
      </div>
      <div style="font-size:10px;opacity:.75;margin-bottom:3px;">${allEvidence.filter(e=>e.status==='done').length} of ${allEvidence.length} items collected</div>
      <div class="prog-bar"><div class="prog-fill" style="width:80%;"></div></div>
      <div class="step-dots"><div class="sdot"></div><div class="sdot"></div><div class="sdot on"></div><div class="sdot"></div></div>
    </div>
    <div class="scroll"><div class="body">
      <div class="card"><div class="card-lbl">Evidence checklist</div>${evItems}</div>
      ${timeline}
      <button class="btn-mag" onclick="generateReport()">Generate dispute report →</button>
    </div></div>
    ${bottomNav('evidence')}`;
}

// SCREEN 7 — REPORT + SUBMIT
function screenReport() {
  const r = state.generatedReport;
  if (!r) return navigate('evidence'), '';

  const routes = (r.submissionRoutes || []).map((rt, i) => {
    const cls = i === 0 ? 'primary' : rt.priority === 'gold' ? 'gold-card' : 'secondary';
    const icoCls = i === 0 ? 'white' : rt.id === 'ifsb' ? 'gold-bg' : 'grn-bg';
    const labelStyle = i === 0 ? 'color:white;' : rt.id === 'ifsb' ? 'color:#7D5A00;' : '';
    const subStyle = i === 0 ? 'color:rgba(255,255,255,.7);' : rt.id === 'ifsb' ? 'color:#A07030;' : 'color:var(--muted);';
    const arrowStyle = i === 0 ? 'color:rgba(255,255,255,.7);' : rt.id === 'ifsb' ? 'color:var(--gold);' : '';
    return `<div class="agency ${cls}">
      <div class="ag-ico ${icoCls}">${rt.icon}</div>
      <div style="flex:1;"><div class="ag-label" style="${labelStyle}">${rt.name}</div>
        <div class="ag-sub" style="${subStyle}">${rt.note}</div></div>
      <div class="ag-arrow" style="${arrowStyle}">→</div>
    </div>`;
  }).join('');

  return `
    ${statusBar()}
    <div class="hdr hdr-mag">
      <div class="hdr-nav">
        <button class="back-btn" onclick="navigate('evidence')">←</button>
        <span class="hdr-title">Report + Submit</span>
        <span class="hdr-pill">Step 4/4</span>
      </div>
      <div style="font-size:10px;opacity:.75;">Shariah-compliant dispute report ready</div>
      <div class="prog-bar" style="margin-top:6px;"><div class="prog-fill" style="width:98%;"></div></div>
    </div>
    <div class="scroll"><div class="body">
      <div class="rpt-hdr">
        <div class="rpt-case">CASE ID: ${r.caseId}</div>
        <div class="rpt-title">${r.fraudType} — ${fmt(r.amount)}</div>
        <div class="rpt-sub">${r.victim} · ${r.platform}</div>
        <div class="rpt-chips">
          <div class="rc rc-mag">Be U / Bank Islam</div>
          <div class="rc rc-red">${r.riskLevel} severity</div>
          <div class="rc rc-grn">${r.evidenceCount} evidence items</div>
          <div class="rc rc-gold">🌙 Shariah report</div>
        </div>
      </div>
      <div class="card">
        <div class="card-lbl">Incident summary</div>
        <div class="row"><span class="rl">Victim</span><span class="rv">${r.victim}</span></div>
        <div class="row"><span class="rl">Platform</span><span class="rv">${r.platform}</span></div>
        <div class="row"><span class="rl">Fraud type</span><span class="rv">${r.fraudType}</span></div>
        <div class="row"><span class="rl">Amount lost</span><span class="rv red">${fmt(r.amount)}</span></div>
        <div class="row"><span class="rl">Ref no.</span><span class="rv mono">${r.ref}</span></div>
        <div class="row"><span class="rl">Scammer contact</span><span class="rv mono red">${r.scammerContact || 'Unknown'}</span></div>
      </div>
      <div class="ai-strip">
        <div style="font-size:9px;font-weight:800;color:var(--mag);margin-bottom:3px;letter-spacing:.05em;">AI CASE SUMMARY</div>
        <div style="font-size:11px;color:#3A0A28;line-height:1.6;">${r.summary}</div>
      </div>
      <div class="grn-strip" style="display:flex;gap:8px;align-items:center;">
        <span style="font-size:17px;">📨</span>
        <div>
          <div style="font-size:12px;font-weight:800;color:#005C39;">Both parties notified</div>
          <div style="font-size:10px;color:var(--grn);margin-top:1px;">Bank Islam fraud team + flagged merchant alerted simultaneously</div>
        </div>
      </div>
      <div class="card-lbl" style="margin-top:4px;">Submit to authorities</div>
      ${routes}
      <div style="background:var(--grn-light);border:1px solid rgba(16,185,129,.3);border-radius:var(--rsm);padding:10px 12px;display:flex;gap:9px;align-items:center;">
        <span style="font-size:18px;">📬</span>
        <div>
          <div style="font-size:12px;font-weight:800;color:#065F46;">Case tracker activated</div>
          <div style="font-size:10px;color:#047857;margin-top:1px;">Follow-up reminders at 3, 7, and 14 days</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button style="flex:1;background:white;color:var(--mag);border:1.5px solid var(--mag);border-radius:var(--r);padding:11px;font-size:11px;font-weight:800;" onclick="downloadPDF()">📥 Save PDF</button>
        <button style="flex:2;background:var(--mag);color:white;border:none;border-radius:var(--r);padding:11px;font-size:12px;font-weight:800;" onclick="submitAll()">✅ Submit all reports</button>
      </div>
    </div></div>
    ${bottomNav('evidence')}
    ${overlay('submitted', `
      <div style="font-size:56px;margin-bottom:1rem;">🎉</div>
      <div style="font-size:18px;font-weight:800;color:var(--mag);margin-bottom:.5rem;">Reports Submitted!</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:.5rem;line-height:1.5;">Case ${r.caseId} sent to Bank Islam, NSRC, PDRM, and IFSB.</div>
      <div style="font-size:12px;color:var(--grn);font-weight:700;margin-bottom:1.5rem;">You'll be updated in 3–5 business days.</div>
      <button class="btn-mag" style="width:auto;padding:10px 28px;" onclick="navigate('notif')">Back to home</button>`)}`;
}