import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Chip, Notice } from '../../components/ui';

export default function ReceptionHome() {
  const [patients, setPatients] = useState([]);
  const [appts, setAppts] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/patients', { params: { q } }).then((r) => setPatients(r.data.items || []));
    api.get('/appointments', { params: { date: new Date().toISOString().slice(0, 10) } }).then((r) => setAppts(r.data.items || []));
  }, [q]);

  async function register(e) {
    e.preventDefault();
    await api.post('/patients/walk-in', form);
    setMessage('Patient registered. You can now create an appointment.');
  }

  async function checkIn(id) {
    await api.post(`/appointments/${id}/queue`, { priority: 'scheduled' });
    setMessage('Token assigned and patient added to queue.');
  }

  async function noShow(id) {
    await api.patch(`/appointments/${id}`, { status: 'no_show' });
    setMessage('Marked as no-show.');
  }

  return (
    <div className="row g-3">
      <Notice show={!!message} message={message} onClose={() => setMessage('')} />
      <div className="col-lg-4">
        <Card>
          <h4>Walk-in registration</h4>
          <form onSubmit={register}>
            {['name', 'phone', 'email'].map((k) => (
              <input key={k} className="form-control mb-2" placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            ))}
            <button className="btn btn-navy w-100">Register</button>
          </form>
        </Card>
      </div>
      <div className="col-lg-8">
        <Card className="mb-3">
          <h4>Find patient</h4>
          <input className="form-control" placeholder="Name, phone or Health ID" value={q} onChange={(e) => setQ(e.target.value)} />
          {patients.slice(0, 6).map((p) => (
            <div key={p._id} className="d-flex justify-content-between py-2 border-bottom">
              <span>{p.userId?.name} • {p.healthId}</span>
              <span className="muted">{p.userId?.phone}</span>
            </div>
          ))}
        </Card>
        <Card>
          <h4>Today’s patients</h4>
          {appts.map((a) => (
            <div key={a._id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
              <div>
                <strong>{a.token}</strong> {a.patientId?.userId?.name}
                <div className="muted">{a.doctorId?.userId?.name}</div>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <Chip>{a.status}</Chip>
                <button className="btn btn-teal btn-sm" onClick={() => checkIn(a._id)}>Arrive</button>
                <button className="btn btn-ghost btn-sm" onClick={() => noShow(a._id)}>No-show</button>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
