const router = require('express').Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { specialty, clinic } = req.query;
  let q = `SELECT d.*, c.name as clinic_name FROM doctors d JOIN clinics c ON c.id=d.clinic_id WHERE 1=1`;
  const p = [];
  if (specialty) { q += ' AND d.specialty=?'; p.push(specialty); }
  if (clinic) { q += ' AND d.clinic_id=?'; p.push(clinic); }
  res.json(db.prepare(q).all(...p));
});

router.get('/clinics', (_, res) => res.json(db.prepare('SELECT * FROM clinics').all()));
router.get('/specialties', (_, res) =>
  res.json(db.prepare('SELECT DISTINCT specialty FROM doctors').all().map(r => r.specialty)));

module.exports = router;