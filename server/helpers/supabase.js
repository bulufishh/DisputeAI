
const { createClient } = require('@supabase/supabase-js');


function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in .env');
  }

  return createClient(url, key);
}

async function saveCase(report) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('cases')
    .insert({
      case_id:           report.caseId,
      victim:            report.victim,
      platform:          report.platform,
      fraud_type:        report.fraudType,
      amount:            parseFloat(report.amount) || 0,
      ref:               report.ref,
      merchant:          report.merchant,
      scammer_contact:   report.scammerContact,
      summary:           report.summary,
      risk_level:        report.riskLevel,
      timeline:          report.timeline,      
      submission_routes: report.submissionRoutes, 
      status:            'submitted',
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase insert error: ${error.message}`);
  console.log(`[db] Case saved: ${report.caseId}`);
  return data;
}

async function getCase(caseId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('case_id', caseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; 
    throw new Error(`Supabase select error: ${error.message}`);
  }

  return {
    caseId:           data.case_id,
    victim:           data.victim,
    platform:         data.platform,
    fraudType:        data.fraud_type,
    amount:           data.amount,
    ref:              data.ref,
    merchant:         data.merchant,
    scammerContact:   data.scammer_contact,
    summary:          data.summary,
    riskLevel:        data.risk_level,
    timeline:         data.timeline,
    submissionRoutes: data.submission_routes,
    status:           data.status,
    createdAt:        data.created_at,
  };
}

async function saveNotification(notification) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      notification_id: notification.notificationId,
      recipient:       notification.recipient,
      amount:          parseFloat(notification.amount) || 0,
      ref:             notification.ref,
      message:         notification.message,
      status:          notification.status,
      expires_at:      notification.expiresAt,
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase notification error: ${error.message}`);
  console.log(`[db] Notification saved: ${notification.notificationId}`);
  return data;
}


async function updateCaseStatus(caseId, status) {
  const supabase = getClient();

  const { error } = await supabase
    .from('cases')
    .update({ status })
    .eq('case_id', caseId);

  if (error) throw new Error(`Supabase update error: ${error.message}`);
  console.log(`[db] Case ${caseId} status → ${status}`);
}

module.exports = { saveCase, getCase, saveNotification, updateCaseStatus };
