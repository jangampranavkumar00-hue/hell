const router = require('express').Router();
const db = require('../db');

// EWMA of last 5 consultations
function dynamicAvg(doctorId, fallback) {
  const rows = db.prepare(`SELECT duration_min FROM consult_log WHERE doctor_id=? ORDER BY id DESC LIMIT 5`).all(doctorId);
  if (!rows.length) return fallback;
  const alpha = 0.5;
  return rows.reduce((ewma, r, i) => i === 0 ? r.duration_min : alpha * r.duration_min + (1 - alpha) * ewma, 0);
}

// Live queue state for a doctor
router.get('/:doctorId', (req, res) => {
  const doctorId = +req.params.doctorId;
  const doc = db.prepare('SELECT * FROM doctors WHERE id=?').get(doctorId);

  const active = db.prepare(`SELECT * FROM tokens WHERE doctor_id=? AND status='serving' ORDER BY token_no LIMIT 1`).get(doctorId);
  const waiting = db.prepare(`SELECT * FROM tokens WHERE doctor_id=? AND status='waiting' ORDER BY token_no`).all(doctorId);
  const avg = dynamicAvg(doctorId, doc.avg_consult_min);

  res.json({
    doctor: { ...doc, avg_consult_min: +avg.toFixed(1) },
    activeToken: active || null,
    waiting,
    nextToken: waiting[0] || null,
  });
});

// Doctor: Call Next
router.post('/:doctorId/next', (req, res) => {
  const doctorId = +req.params.doctorId;
  const now = new Date().toISOString();

  // Complete current
  const cur = db.prepare(`SELECT * FROM tokens WHERE doctor_id=? AND status='serving'`).get(doctorId);
  if (cur) {
    const dur = (Date.now() - new Date(cur.consulted_at || Date.now()).getTime()) / 60000;
    db.prepare(`UPDATE tokens SET status='completed', duration_min=? WHERE id=?`).run(dur || curDuration(cur), cur.id);
    db.prepare(`INSERT INTO consult_log (doctor_id,duration_min) VALUES (?,?)`).run(doctorId, dur || 12);
  }
  // Serve next
  const nxt = db.prepare(`SELECT * FROM tokens WHERE doctor_id=? AND status='waiting' ORDER BY token_no LIMIT 1`).get(doctorId);
  if (nxt) db.prepare(`UPDATE tokens SET status='serving', consulted_at=? WHERE id=?`).run(now, nxt.id);

  res.json({ ok: true, called: nxt || null });
});

function curDuration(cur) {
  if (!cur.consulted_at) return 12;
  return Math.max(1, (Date.now() - new Date(cur.consulted_at).getTime()) / 60000);
}

// Doctor: Skip absent patient
router.post('/:doctorId/skip/:tokenId', (req, res) => {
  db.prepare(`UPDATE tokens SET status='skipped' WHERE id=?`).run(req.params.tokenId);
  res.json({ ok: true });
});

// Doctor: Delay 10 mins
router.post('/:doctorId/delay', (req, res) => {
  const { minutes = 10 } = req.body;
  db.prepare(`UPDATE doctors SET offset_delay = offset_delay + ? WHERE id=?`).run(minutes, req.params.doctorId);
  res.json({ ok: true });
});

// Emergency escalation
router.post('/:doctorId/emergency', (req, res) => {
  const doctorId = +req.params.doctorId;
  const doc = db.prepare('SELECT * FROM doctors WHERE id=?').get(doctorId);
  const minWaiting = db.prepare(`SELECT MIN(token_no) m FROM tokens WHERE doctor_id=? AND status='waiting'`).get(doctorId);
  const emergencyToken = (minWaiting.m || 1) - 0.5; // jumps ahead
  db.prepare(`INSERT INTO tokens (doctor_id,clinic_id,token_no,shift,patient_name,patient_phone,status)
    VALUES (?,?,?,'morning','EMERGENCY','000','waiting')`).run(doctorId, doc.clinic_id, emergencyToken);
  res.json({ ok: true, token_no: emergencyToken });
});

module.exports = router;