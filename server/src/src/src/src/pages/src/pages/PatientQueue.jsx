import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

export default function PatientQueue() {
  const { tokenId } = useParams();
  const [me, setMe] = useState(null);
  const [queue, setQueue] = useState(null);
  const [alerted, setAlerted] = useState(false);

  useEffect(() => {
    const load = async () => {
      const t = await api.get(`/tokens/${tokenId}`);
      setMe(t.data);
      const q = await api.get(`/queue/${t.data.doctor_id}`);
      setQueue(q.data);
    };
    load();
    const id = setInterval(load, 3000); // polling every 3s
    return () => clearInterval(id);
  }, [tokenId]);

  if (!me || !queue) return <p className="p-6">Loading…</p>;

  const active = queue.activeToken?.token_no ?? 0;
  const myPos = Math.max(0, me.token_no - active - 1);
  const avg = queue.doctor.avg_consult_min;
  const delay = queue.doctor.offset_delay;
  const eta = Math.round(myPos * avg + delay);

  // Simulated SMS alert
  useEffect(() => {
    if (myPos === 2 && !alerted) {
      setAlerted(true);
      alert('SMS: Please arrive at the clinic now! You are 2 tokens away.');
    }
  }, [myPos, alerted]);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Your Token</h1>
      <div className="bg-blue-600 text-white p-6 rounded-xl text-center mb-6">
        <div className="text-5xl font-black">#{me.token_no}</div>
        <div>{queue.doctor.name} · {queue.doctor.specialty}</div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <Stat label="Now Serving" value={`#${active}`} />
        <Stat label="Next" value={`#${queue.nextToken?.token_no ?? '—'}`} />
        <Stat label="Status" value={queue.doctor.status} />
      </div>
      <div className={`p-4 rounded-xl text-center text-lg font-bold ${
        myPos <= 2 ? 'bg-amber-200 text-amber-900' : 'bg-green-100 text-green-900'
      }`}>
        {myPos === 0 ? "You're up next!" : `${myPos} patients ahead · Est. wait ≈ ${eta} mins`}
      </div>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div className="border rounded p-3">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-xl font-bold">{value}</div>
  </div>
);