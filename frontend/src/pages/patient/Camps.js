import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Notice } from '../../components/ui';

export default function PatientCamps() {
  const [camps, setCamps] = useState([]);
  const [mine, setMine] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/health-camps').then((r) => setCamps(r.data.items || []));
    api.get('/health-camps/mine').then((r) => setMine(r.data.items || []));
  }, []);

  async function register(id) {
    const { data } = await api.post(`/health-camps/${id}/register`, {});
    setMine((m) => [data.registration, ...m]);
    setMessage('Registered. Your QR pass is ready.');
  }

  return (
    <div className="patient-home">
      <Notice show={!!message} message={message} onClose={() => setMessage('')} />
      <h2>Free health camps near you</h2>
      {camps.map((camp) => (
        <Card key={camp._id} className="mb-3">
          <h5>{camp.title}</h5>
          <div className="muted">{new Date(camp.date).toDateString()} • {camp.startTime}–{camp.endTime}</div>
          <p>{camp.description}</p>
          <button className="btn btn-teal" onClick={() => register(camp._id)}>Register</button>
        </Card>
      ))}
      {mine[0]?.qrCode ? (
        <Card>
          <h5>Your camp pass</h5>
          <img alt="QR" src={mine[0].qrCode} style={{ width: 160 }} />
        </Card>
      ) : null}
    </div>
  );
}
