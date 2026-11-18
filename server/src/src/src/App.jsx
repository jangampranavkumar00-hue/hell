import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Directory from './pages/Directory';
import PatientQueue from './pages/PatientQueue';
import DoctorConsole from './pages/DoctorConsole';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 bg-blue-600 text-white flex gap-4">
        <Link to="/">Directory</Link>
        <Link to="/patient/1">My Appointment</Link>
        <Link to="/doctor/1">Doctor Console</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Directory />} />
        <Route path="/patient/:tokenId" element={<PatientQueue />} />
        <Route path="/doctor/:doctorId" element={<DoctorConsole />} />
      </Routes>
    </BrowserRouter>
  );
}