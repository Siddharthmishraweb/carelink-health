import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Notice } from '../../components/ui';

export default function NurseHome() {
  const [appts, setAppts] = useState([]);
  const [vitals, setVitals] = useState({ bloodPressure: '120/80', heartRate: 78, temperature: 98.6, spo2: 98, weight: 70, height: 165, bloodSugar: 96 });
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/appointments', { params: { date: new Date().toISOString().slice(0, 10) } }).then((r) => setAppts(r.data.items || []));
  }, []);

  async function save() {
    await api.post(`/consultations/vitals/${selected._id}`, { vitals, nursingNotes: 'Prepared for doctor.' });
    setMessage('Vitals saved. Patient is ready for the doctor.');
  }

  return (
    <div className="row g-3">
      <Notice show={!!message} message={message} onClose={() => setMessage('')} />
      <div className="col-md-5">
        <Card>
          <h4>Assigned patients</h4>
          {appts.map((a) => (
            <button key={a._id} className="btn btn-ghost w-100 text-start mb-2" onClick={() => setSelected(a)}>
              {a.token} • {a.patientId?.userId?.name}
            </button>
          ))}
        </Card>
      </div>
      <div className="col-md-7">
        <Card>
          <h4>Record vitals</h4>
          {selected ? (
            <>
              {Object.keys(vitals).map((k) => (
                <div key={k} className="mb-2">
                  <label className="form-label text-capitalize">{k}</label>
                  <input className="form-control" value={vitals[k]} onChange={(e) => setVitals({ ...vitals, [k]: e.target.value })} />
                </div>
              ))}
              <button className="btn btn-navy" onClick={save}>Save and prepare</button>
            </>
          ) : <p className="muted">Select a patient.</p>}
        </Card>
      </div>
    </div>
  );
}
