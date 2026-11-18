const router = require('express').Router();
const db = require('../db');

// Book a token
router.post('/', (req, res) => {
  const { doctor_id, patient_name, patient_phone } = req.body;
  const doc = db.prepare('SELECT * FROM doctors WHERE id=?').get(doctor_id);
  if (!doc) return res.status(404).json({ error: 'doctor not found' });

  const last = db.prepare(`SELECT MAX(token_no) m FROM tokens WHERE doctor_id=? AND shift='morning'`).get(doctor_id);
  const next = (last.m || 0) + 1;

  const info = db.prepare(`INSERT INTO tokens (doctor_id,clinic_id,token_no,shift,patient_name,patient_phone,status)
    VALUES (?,?,?,'morning',?,?,'waiting')`).run(doctor_id, doc.clinic_id, next, patient_name, patient_phone);
  res.json({ token_id: info.lastInsertRowid, token_no: next, doctor: doc });
});

// My appointment + live estimate
router.get('/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tokens WHERE id=?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'not found' });
  res.json(t);
});

module.exports = router;