import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { connectSocket } from '../../services/api';
import { Card, Chip } from '../../components/ui';

export default function PatientQueue() {
  const { appointmentId } = useParams();
  const [view, setView] = useState(null);
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    let socket;
    async function load() {
      try {
        const appts = await api.get('/appointments');
        const current = (appts.data.items || []).find((a) => a._id === appointmentId);
        setAppointment(current);
        if (!current?.doctorId?._id) return;
        await api.post(`/appointments/${appointmentId}/queue`, { priority: current.priority });
        const live = await api.get(`/queues/${current.doctorId._id}`, { params: { token: current.token } });
        setView(live.data);
        socket = connectSocket({ hospitalId: current.hospitalId?._id || current.hospitalId });
        socket.on('queue:update', (payload) => setView((prev) => ({ ...prev, ...payload })));
      } catch (_error) {
        setView({ currentToken: '—', patientsAhead: 0, estimatedWaitMinutes: 0 });
      }
    }
    load();
    return () => socket?.disconnect();
  }, [appointmentId]);

  if (!view) return <div className="patient-home"><Card>Joining your queue…</Card></div>;
  const wait = view.estimatedWaitMinutes || 0;
  const arriveIn = Math.max(wait - 20, 0);
  const progress = Math.max(8, 100 - Math.min(wait, 90));

  return (
    <div className="patient-home">
      <div className="hello-kicker">Wait from home</div>
      <h2>You do not need to stand in line</h2>
      <div className="visit-card">
        <div className="muted">Your token</div>
        <div className="queue-token" style={{ color: '#fff' }}>{appointment?.token || view.token}</div>
        <div className="queue-board">
          <div className="queue-stat">
            <div className="muted">Now serving</div>
            <strong style={{ fontSize: 28 }}>{view.currentToken || '—'}</strong>
          </div>
          <div className="queue-stat">
            <div className="muted">Room</div>
            <strong style={{ fontSize: 28 }}>{view.roomNumber || appointment?.roomNumber || '—'}</strong>
          </div>
        </div>
        <div className="meter mt-3" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <span style={{ width: `${progress}%`, background: '#5eead4' }} />
        </div>
        <div className="d-flex justify-content-between mt-2">
          <span>{view.patientsAhead ?? 0} ahead</span>
          <span>about {wait} min</span>
        </div>
      </div>
      <div className="leave-card mt-3">
        <strong>Leave in about {arriveIn} minutes</strong>
        <div className="muted mt-1">Arrive roughly 20 minutes before your turn. This updates if an emergency is moved ahead of you.</div>
        <Chip tone="info" className="mt-2">{appointment?.doctorId?.userId?.name || 'Your doctor'}</Chip>
      </div>
    </div>
  );
}
