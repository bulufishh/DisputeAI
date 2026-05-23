function getFallbackReply(messageCount) {
  const replies = [
    "Got it — I've noted how the scammer contacted you. Do you have a WhatsApp screenshot? Tap 📷 to upload it — I'll extract the scammer's number automatically.",
    "Do you have a screenshot of the scammer's message? Tap 📷 to upload it and I'll read it for you.",
    "Thank you. I now have enough to build your dispute report. Tap the button below to review the evidence.",
    "Your evidence is ready. Let me take you to the Evidence Organiser.",
  ];
  return replies[Math.min(Math.floor(messageCount / 2), replies.length - 1)];
}

function buildFallbackReport(transaction) {
  return {
    caseId:         `DAI-BISLM-${Date.now()}`,
    victim:         'Amirah binti Razak',
    platform:       'Be U by Bank Islam',
    fraudType:      'QR Phishing / Lucky Draw Scam',
    amount:         transaction?.amount ? Math.abs(transaction.amount) : 2400,
    ref:            transaction?.ref      || 'BISLM2604270938AA',
    merchant:       transaction?.merchant || 'SG Trader 88',
    dateTime:       transaction?.time     || '2026-04-27T09:38:00',
    scammerContact: '+60 11-8821 4490',
    contactMethod:  'WhatsApp',
    scamMethod:     'QR code',
    timeline: [
      { time: '9:15 AM', event: 'Scammer contacted victim via WhatsApp with lucky draw offer' },
      { time: '9:32 AM', event: 'Victim scanned malicious QR code sent by scammer' },
      { time: '9:38 AM', event: 'Unauthorised payment executed to SG Trader 88' },
    ],
    summary:
      'Victim was contacted via WhatsApp with a fraudulent lucky draw offer. ' +
      'A malicious QR code caused an unauthorised payment of RM 2,400.00. ' +
      'Victim did not knowingly authorise this payment.',
    riskLevel:     'high',
    evidenceCount: 3,
  };
}

function getFallbackScan() {
  return {
    found:          true,
    phoneNumber:    '+60 11-8821 4490',
    timestamp:      '27 Apr 2026, 9:15 AM',
    platform:       'WhatsApp',
    senderName:     'Unknown',
    messageContent: 'Tahniah! Anda memenangi hadiah istimewa. Tekan pautan untuk tuntut.',
    scamKeywords:   ['lucky draw', 'prize', 'urgent', 'link'],
    scamType:       'lucky draw',
    confidence:     'high',
    redFlags:       ['Unsolicited prize', 'Urgency language', 'Suspicious link'],
    rawText:        '(fallback — OCR not available)',
  };
}

module.exports = { getFallbackReply, buildFallbackReport, getFallbackScan };
