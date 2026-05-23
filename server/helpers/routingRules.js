function getSubmissionRoutes(report) {
  const routes = [];

  routes.push({
    id: 'bank_islam', icon: '🌙', priority: 'primary',
    name: 'Bank Islam — Be U Dispute Team',
    note: 'Fastest freeze · Shariah-compliant',
    contact: '1-300-88-2265', url: 'https://www.bankislam.com/dispute',
  });

  routes.push({
    id: 'nsrc', icon: '🏛️', priority: 'secondary',
    name: 'NSRC — National Scam Response Centre',
    note: 'Call 997 · Pre-filled report ready',
    contact: '997', url: 'https://semakmule.rmp.gov.my',
  });

  if (Math.abs(report.amount) >= 500) {
    routes.push({
      id: 'pdrm', icon: '🚔', priority: 'secondary',
      name: 'PDRM — Commercial Crime Division',
      note: 'e-Report portal · CCID reference',
      contact: '03-2266 2222', url: 'https://www.rmp.gov.my',
    });
  }

  routes.push({
    id: 'ifsb', icon: '🌙', priority: 'gold',
    name: 'IFSB Shariah Consumer Protection',
    note: 'Islamic finance dispute channel',
    contact: '03-9195 1400', url: 'https://ifsb.org',
  });

  return routes;
}

module.exports = { getSubmissionRoutes };
