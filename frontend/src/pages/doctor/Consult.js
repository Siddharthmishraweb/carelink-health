import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { Card, Chip, Notice } from '../../components/ui';

export default function DoctorConsult() {
  const { appointmentId } = useParams();
  const [consultation, setConsultation] = useState(null);
  const [transcript, setTranscript] = useState('Patient reports fever and cough for 3 days. Doctor: prescribe paracetamol two times a day for 3 days. Follow-up after 7 days.');
  const [record, setRecord] = useState({ complaints: 'Fever, Cough', assessment: '', clinicalNotes: '', medicines: 'Paracetamol | 2 times/day | 3 days', tests: 'CBC', followUp: 'Follow-up after 7 days' });
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(true);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    api.post(`/consultations/start/${appointmentId}`, { consentCaptured: true }).then((r) => setConsultation(r.data.consultation));
  }, [appointmentId]);

  function dictate() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
      setMessage('Voice dictation is not available in this browser. You can still type notes.');
      return;
    }
    const rec = new Speech();
    rec.lang = 'en-IN';
    rec.onresult = (e) => setTranscript((t) => `${t} ${e.results[0][0].transcript}`);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  async function generate() {
    const { data } = await api.post(`/consultations/${consultation._id}/ai-draft`, {
      transcript,
      clinicianNotes: record.clinicalNotes,
    });
    setDraft(data.draft);
  }

  async function approve() {
    const medicines = record.medicines.split('\n').filter(Boolean).map((line) => {
      const [name, frequency, duration] = line.split('|').map((s) => s.trim());
      return { name, dosage: 'As prescribed by doctor', frequency, duration };
    });
    await api.post(`/consultations/${consultation._id}/approve`, {
      record: {
        complaints: record.complaints.split(',').map((s) => s.trim()),
        assessment: record.assessment,
        clinicalNotes: record.clinicalNotes,
        followUpNote: record.followUp,
        followUpDate: new Date(Date.now() + 7 * 86400000),
      },
      medicines,
      tests: record.tests ? record.tests.split(',').map((s) => s.trim()) : [],
      followUp: record.followUp,
      fee: 500,
    });
    setMessage('Consultation saved. Prescription, lab order, invoice and follow-up reminder were created.');
  }

  async function refer() {
    await api.post('/referrals', {
      patientId: consultation.patientId,
      consultationId: consultation._id,
      reason: 'Further evaluation',
      priority: 'normal',
    });
    setMessage('Referral created for the next authorized clinician.');
  }

  if (!consultation) return <Card>Opening consultation…</Card>;

  return (
    <div className="row g-3">
      <Notice show={!!message} message={message} onClose={() => setMessage('')} />
      <div className="col-lg-7">
        <Card>
          <h3>Consultation</h3>
          <label className="form-label">Chief complaints</label>
          <input className="form-control mb-2" value={record.complaints} onChange={(e) => setRecord({ ...record, complaints: e.target.value })} />
          <label className="form-label">Clinical notes / examination</label>
          <textarea className="form-control mb-2" rows={4} value={record.clinicalNotes} onChange={(e) => setRecord({ ...record, clinicalNotes: e.target.value })} />
          <label className="form-label">Assessment</label>
          <textarea className="form-control mb-2" rows={3} value={record.assessment} onChange={(e) => setRecord({ ...record, assessment: e.target.value })} />
          <label className="form-label">Medicines (one per line: name | frequency | duration)</label>
          <textarea className="form-control mb-2" rows={3} value={record.medicines} onChange={(e) => setRecord({ ...record, medicines: e.target.value })} />
          <label className="form-label">Tests</label>
          <input className="form-control mb-2" value={record.tests} onChange={(e) => setRecord({ ...record, tests: e.target.value })} />
          <label className="form-label">Follow-up</label>
          <input className="form-control mb-3" value={record.followUp} onChange={(e) => setRecord({ ...record, followUp: e.target.value })} />
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-navy" onClick={approve}>Approve and complete</button>
            <button className="btn btn-ghost" onClick={refer}>Refer patient</button>
          </div>
        </Card>
      </div>
      <div className="col-lg-5">
        <Card>
          <div className="d-flex justify-content-between">
            <h5>AI assistant</h5>
            <Chip tone="warn">Draft only</Chip>
          </div>
          <label className="form-check mb-2">
            <input type="checkbox" className="form-check-input me-2" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            Patient consent captured
          </label>
          <textarea className="form-control mb-2" rows={6} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
          <div className="d-flex gap-2">
            <button className="btn btn-ghost" onClick={dictate}>{listening ? 'Listening…' : 'Dictate'}</button>
            <button className="btn btn-teal" onClick={generate} disabled={!consent}>Generate draft</button>
          </div>
          {draft ? (
            <div className="mt-3">
              <Chip>AI-generated draft — Doctor review required.</Chip>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{JSON.stringify(draft, null, 2)}</pre>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
