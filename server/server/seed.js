const db = require('./db');

const clinics = [
  [1,'City Care Clinic','MG Road',12.97,77.59],
  [2,'Green Valley Clinic','Indiranagar',12.98,77.64],
  [3,'Sunrise Health Center','Koramangala',12.93,77.62],
  [4,'Metro Medical','Whitefield',12.97,77.75],
];
const specialties = ['General Medicine','Pediatrics','Orthopedics','Cardiology'];
const doctors = [];
let id = 1;
clinics.forEach(c => {
  ['General Medicine','Cardiology'].forEach((s, i) => {
    doctors.push([id++, `Dr. ${['Mehta','Rao','Iyer','Shah','Khan','Patel','Nair','Reddy'][id-2]}`, s, c[0], 400 + id*50, 12]);
  });
});

const insC = db.prepare('INSERT OR IGNORE INTO clinics VALUES (?,?,?,?,?)');
clinics.forEach(c => insC.run(...c));
const insD = db.prepare('INSERT OR IGNORE INTO doctors (id,name,specialty,clinic_id,fee,avg_consult_min) VALUES (?,?,?,?,?,?)');
doctors.forEach(d => insD.run(...d));

// 20 sample tokens for doctor 1 (Dr. Mehta, Cardiology)
const insT = db.prepare('INSERT INTO tokens (doctor_id,clinic_id,token_no,shift,patient_name,patient_phone,status) VALUES (?,?,?,?,?,?,?)');
for (let i = 1; i <= 20; i++) {
  insT.run(1, 1, i, 'morning', `Patient ${i}`, '9999999999', i === 1 ? 'serving' : 'waiting');
}
console.log('Seeded.');