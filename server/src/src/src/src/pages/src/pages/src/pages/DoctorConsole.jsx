import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

export default function DoctorConsole() {
  const { doctorId } = useParams();
  const [q, setQ] = useState(null);

  const load = () => api.get(`/queue/${doctorId}`).then(r => setQ(r.data));

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [doctorId]);

  const next = async () => { await api.post(`/queue/${doctorId}/next`); load(); };
  const skip = async (id) => { await api.post(`/queue/${doctorId}/skip/${id}`); load(); };
  const delay = async () => { await api.post(`/queue/${doctorId}/delay`, { minutes: 10 }); load(); };
  const emergency = async () => { await api.post(`/queue/${doctorId}/emergency`); load(); };

  if (!q) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">{q.doctor.name} · {q.doctor.specialty}</h1>
      <p className="text-gray-600 mb-4">
        Avg: {q.doctor.avg_consult_min} min · Delay offset: {q.doctor.offset_delay} min
      </p>

      <div className="bg-indigo-600 text-white p-4 rounded mb-4">
        <div className="text-xs">Currently Serving</div>
        <div className="text-4xl font-black">
          {q.activeToken ? `#${q.activeToken.token_no} — ${q.activeToken.patient_name}` : '—'}
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={next} className="bg-green-600 text-white px-4 py-2 rounded">Call Next Patient</button>
        <button onClick={delay} className="bg-yellow-500 text-white px-4 py-2 rounded">Delay 10 mins</button>
        <button onClick={emergency} className="bg-red-600 text-white px-4 py-2 rounded">Emergency Insert</button>
      </div>

      <h2 className="font-bold mb-2">Waiting Queue</h2>
      <table className="w-full text-sm">
        <thead><tr className="bg-gray-100"><th className="p-2 text-left">Token</th><th className="text-left">Patient</th><th></th></tr></thead>
        <tbody>
          {q.waiting.map(t => (
            <tr key={t.id} className="border-b">
              <td className="p-2">#{t.token_no}</td>
              <td>{t.patient_name}</td>
              <td className="text-right">
                <button onClick={() => skip(t.id)} className="text-red-600 text-xs">Mark Absent</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}