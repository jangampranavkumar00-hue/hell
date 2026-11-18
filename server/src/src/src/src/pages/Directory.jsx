import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Directory() {
  const [doctors, setDoctors] = useState([]);
  const [spec, setSpec] = useState('');
  const [clinic, setClinic] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [clinics, setClinics] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    api.get('/doctors/specialties').then(r => setSpecialties(r.data));
    api.get('/doctors/clinics').then(r => setClinics(r.data));
  }, []);

  useEffect(() => {
    const q = new URLSearchParams();
    if (spec) q.set('specialty', spec);
    if (clinic) q.set('clinic', clinic);
    api.get(`/doctors?${q}`).then(r => setDoctors(r.data));
  }, [spec, clinic]);

  const book = async (d) => {
    const name = prompt('Your name?');
    const phone = prompt('Phone?');
    if (!name || !phone) return;
    const { data } = await api.post('/tokens', { doctor_id: d.id, patient_name: name, patient_phone: phone });
    alert(`Booked Token #${data.token_no} with ${d.name}`);
    nav(`/patient/${data.token_id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Find a Doctor</h1>
      <div className="flex gap-3 mb-6">
        <select onChange={e => setSpec(e.target.value)} className="border p-2 rounded">
          <option value="">All Specialties</option>
          {specialties.map(s => <option key={s}>{s}</option>)}
        </select>
        <select onChange={e => setClinic(e.target.value)} className="border p-2 rounded">
          <option value="">All Clinics</option>
          {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {doctors.map(d => (
          <div key={d.id} className="border rounded p-4 shadow">
            <h2 className="font-bold text-lg">{d.name}</h2>
            <p className="text-gray-600">{d.specialty}</p>
            <p className="text-sm">{d.clinic_name}</p>
            <p className="text-sm">₹{d.fee} · ~{d.avg_consult_min} min/patient</p>
            <button onClick={() => book(d)} className="mt-3 bg-blue-600 text-white px-3 py-1 rounded">
              Book Token
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}