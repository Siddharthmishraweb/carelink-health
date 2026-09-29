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
      const appts = await api.get('/appointments');
      const current = (appts.data.items || []).find((a) => a._id === appointmentId);
      setAppointment(current);
      if (!current?.doctorId?._id) return;
      const joined = await api.post(`/appointments/${appointmentId}/queue`, { priority: current.priority });
      setView(joined.data);
      const live = await api.get(`/queues/${current.doctorId._id}`, { params: { token: current.token } });
      setView(live.data);
      socket = connectSocket({ hospitalId: current.hospitalId?._id || current.hospitalId });
      socket.on('queue:update', (payload) => setView((prev) => ({ ...prev, ...payload })));
    }
    load();
    return () => socket?.disconnect();
  }, [appointmentId]);

  if (!view) return <div className="patient-home"><Card>Joining queue…</Card></div>;
  const arriveIn = Math.max((view.estimatedWaitMinutes || 0) - 20, 0);

  return (
    <div className="patient-home">
      <h2>Wait from home</h2>
      <Card className="text-center">
        <div className="muted">Your token</div>
        <div className="queue-token">{appointment?.token || view.token}</div>
        <div className="muted">Now serving</div>
        <h2>{view.currentToken || '—'}</h2>
        <div className="d-flex justify-content-between mt-3">
          <div>Patients ahead<br /><strong>{view.patientsAhead ?? 0}</strong></div>
          <div>Est. wait<br /><strong>{view.estimatedWaitMinutes ?? 0} min</strong></div>
        </div>
        <Chip tone="info" className="mt-3">Room {view.roomNumber || appointment?.roomNumber}</Chip>
      </Card>
      <Card className="mt-3">
        You can arrive approximately <strong>{arriveIn} minutes</strong> before your estimated turn.
        The estimate updates if the queue changes.
      </Card>
    </div>
  );
}
