import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { Card, Chip, Empty } from '../../components/ui';

export default function PatientRecords() {
  const patient = useSelector((s) => s.auth.extras.patient);
  const [bundle, setBundle] = useState(null);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!patient?._id) {
      setBundle({ missing: true });
      return;
    }
    api.get(`/patients/${patient._id}`, { params: { reason: 'Self record view' } }).then((r) => setBundle(r.data)).catch(() => setBundle({ missing: true }));
    api.get(`/patients/${patient._id}/timeline`).then((r) => setEvents(r.data.events || [])).catch(() => setEvents([]));
  }, [patient]);

  if (!bundle) return <div className="patient-home"><Card>Loading records…</Card></div>;
  if (bundle.missing) return <div className="patient-home"><Empty title="Records unavailable" body="Sign in again if this continues." /></div>;

  return (
    <div className="patient-home">
      <h2>Health journey</h2>
      <Card className="mb-3">
        <strong>{bundle.patient.userId?.name}</strong>
        <div className="muted">{bundle.patient.healthId} • {bundle.patient.bloodGroup}</div>
        <div className="mt-2">{(bundle.patient.medical?.allergies || []).map((a) => <Chip key={a} tone="danger">{a}</Chip>)}</div>
      </Card>
      <div className="timeline">
        {events.length === 0 ? <Empty title="No clinical events yet" /> : events.map((event, i) => (
          <button key={i} className="timeline-item btn-ghost w-100 text-start mb-2" onClick={() => setSelected(event)}>
            <div className="muted">{new Date(event.date).toDateString()}</div>
            <strong>{event.title}</strong>
            <div className="muted">{event.subtitle}</div>
          </button>
        ))}
      </div>
      {selected ? (
        <Card className="mt-3">
          <h5>{selected.title}</h5>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{JSON.stringify(selected.data, null, 2).slice(0, 1200)}</pre>
          {selected.type === 'consultation' ? (
            <button
              className="btn btn-ghost mt-2"
              onClick={async () => {
                await api.post('/second-opinions', {
                  hospitalId: selected.data.hospitalId,
                  consultationId: selected.data._id,
                  records: ['diagnosis', 'prescription', 'reports'],
                  note: 'Requesting another authorized review of this visit.',
                });
              }}
            >
              Request second opinion
            </button>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
