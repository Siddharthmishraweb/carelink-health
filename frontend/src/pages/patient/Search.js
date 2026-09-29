import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Chip, Notice } from '../../components/ui';

export default function PatientSearch() {
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/hospitals').then((r) => setHospitals(r.data.items || []));
    api.get('/doctors').then((r) => setDoctors(r.data.items || []));
  }, []);

  async function loadSlots(doctor) {
    setSelected(doctor);
    const date = new Date().toISOString().slice(0, 10);
    const { data } = await api.get(`/doctors/${doctor._id}/slots`, { params: { date } });
    setSlots(data.available || []);
  }

  async function book(slot) {
    await api.post('/appointments', { doctorId: selected._id, slotStart: slot, type: 'OPD' });
    setMessage('Appointment confirmed. A digital pass is ready in your appointments.');
  }

  return (
    <div className="patient-home">
      <Notice show={!!message} message={message} onClose={() => setMessage('')} />
      <h2>Find care</h2>
      <h5 className="mt-4">Hospitals</h5>
      {hospitals.map((h) => (
        <Card key={h._id} className="mb-2">
          <strong>{h.name}</strong>
          <div className="muted">{h.address?.city} • {h.subscription?.planCode}</div>
        </Card>
      ))}
      <h5 className="mt-4">Doctors</h5>
      {doctors.map((d) => (
        <Card key={d._id} className="mb-2">
          <div className="d-flex justify-content-between">
            <div>
              <strong>{d.userId?.name}</strong>
              <div className="muted">{d.specialization} • Room {d.roomNumber}</div>
            </div>
            <Chip>₹{d.consultationFee}</Chip>
          </div>
          <button className="btn btn-teal btn-sm mt-2" onClick={() => loadSlots(d)}>View slots</button>
        </Card>
      ))}
      {selected ? (
        <Card className="mt-3">
          <h5>Today with {selected.userId?.name}</h5>
          <div className="d-flex flex-wrap gap-2 mt-2">
            {slots.slice(0, 12).map((slot) => (
              <button key={slot} className="btn btn-ghost btn-sm" onClick={() => book(slot)}>
                {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </button>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
