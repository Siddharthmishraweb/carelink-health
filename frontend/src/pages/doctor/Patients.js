import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Empty } from '../../components/ui';

export default function DoctorPatients({ mode }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (mode === 'referrals') api.get('/referrals').then((r) => setItems(r.data.items || []));
    else api.get('/patients', { params: { q } }).then((r) => setItems(r.data.items || []));
  }, [mode, q]);

  async function open(id) {
    const { data } = await api.get(`/patients/${id}`, { params: { reason: 'Consultation' } });
    const timeline = await api.get(`/patients/${id}/timeline`);
    setSelected({ ...data, events: timeline.data.events });
  }

  return (
    <div className="row g-3">
      <div className="col-md-5">
        <Card>
          <h4>{mode === 'referrals' ? 'Referrals' : 'Patients'}</h4>
          {mode !== 'referrals' ? <input className="form-control mb-3" placeholder="Search name, phone or Health ID" value={q} onChange={(e) => setQ(e.target.value)} /> : null}
          {items.length === 0 ? <Empty /> : items.map((item) => (
            <button key={item._id} className="btn btn-ghost w-100 text-start mb-2" onClick={() => open(item.patientId?._id || item._id)}>
              <strong>{item.userId?.name || item.patientId?.userId?.name || 'Patient'}</strong>
              <div className="muted">{item.healthId || item.reason}</div>
            </button>
          ))}
        </Card>
      </div>
      <div className="col-md-7">
        <Card>
          {!selected ? <Empty title="Select a patient" body="Authorized record access is audited." /> : (
            <>
              <h3>{selected.patient.userId?.name}</h3>
              <div className="muted">{selected.patient.healthId}</div>
              <div className="timeline mt-4">
                {(selected.events || []).map((event, i) => (
                  <div key={i} className="timeline-item">
                    <div className="muted">{new Date(event.date).toDateString()}</div>
                    <strong>{event.title}</strong>
                    <div>{event.subtitle}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
