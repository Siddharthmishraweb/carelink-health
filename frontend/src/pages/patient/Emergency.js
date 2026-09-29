import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { Card } from '../../components/ui';

export default function PatientEmergency() {
  const extras = useSelector((s) => s.auth.extras);
  const [card, setCard] = useState(null);
  const [pass, setPass] = useState(null);

  useEffect(() => {
    if (extras.patient?.healthId) {
      api.get(`/emergency/${extras.patient.healthId}`).then((r) => setCard(r.data.card)).catch(() => {});
      api.get('/health-id').then((r) => setPass(r.data.card)).catch(() => {});
    }
  }, [extras]);

  return (
    <div className="patient-home">
      <h2>Emergency</h2>
      <a className="btn btn-danger w-100 mb-3" href="tel:108">Call emergency number</a>
      <Card className="mb-3">
        <h5>Critical information you chose to share</h5>
        <div>Blood group: {card?.bloodGroup || '—'}</div>
        <div>Allergies: {(card?.allergies || []).join(', ') || 'None recorded'}</div>
        <div>Medications: {(card?.medications || []).join(', ') || 'None recorded'}</div>
        <div className="muted mt-2">Contact: {card?.emergencyContact?.name} {card?.emergencyContact?.phone}</div>
      </Card>
      {pass ? (
        <Card>
          <h5>Digital Health ID</h5>
          <div>{pass.healthId}</div>
          <img alt="Health ID QR" src={pass.qr} style={{ width: 180 }} />
          <p className="muted">Scanning only identifies you. It does not open full medical records.</p>
        </Card>
      ) : null}
    </div>
  );
}
