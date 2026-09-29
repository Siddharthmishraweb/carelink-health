import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { Card, Chip, Stat } from '../../components/ui';

export default function DoctorHome() {
  const { extras, user } = useSelector((s) => s.auth);
  const [appts, setAppts] = useState([]);
  const [queue, setQueue] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const date = new Date().toISOString().slice(0, 10);
    api.get('/appointments', { params: { date } }).then((r) => setAppts(r.data.items || [])).catch(() => setAppts([]));
    api.get('/analytics/doctor').then((r) => setStats(r.data.cards)).catch(() => setStats(null));
    if (extras.doctor?._id) {
      api.get(`/queues/${extras.doctor._id}`).then((r) => setQueue(r.data)).catch(() => setQueue(null));
    }
  }, [extras]);

  const current = (queue?.queue?.items || []).find((i) => i.status === 'serving')
    || appts.find((a) => a.status === 'in_consult')
    || appts.find((a) => a.status === 'in_queue');

  async function next() {
    if (!queue?.queue?._id) return;
    const { data } = await api.post(`/queues/${queue.queue._id}/next`);
    setQueue(data);
  }

  return (
    <div>
      <h1>Good morning, {user?.name || 'Doctor'}</h1>
      <div className="row g-3 my-3">
        <div className="col-md-3"><Stat label="Today" value={stats?.today || appts.length} /></div>
        <div className="col-md-3"><Stat label="Completed" value={appts.filter((a) => a.status === 'completed').length} /></div>
        <div className="col-md-3"><Stat label="Waiting" value={queue?.waitingCount || 0} /></div>
        <div className="col-md-3"><Stat label="No-show rate" value={`${stats?.noShowRate || 0}%`} hint="Operational, not clinical quality" /></div>
      </div>
      <div className="row g-3">
        <div className="col-lg-7">
          <Card>
            <div className="d-flex justify-content-between">
              <h4>Current patient</h4>
              <button className="btn btn-ghost btn-sm" onClick={next}>Call next</button>
            </div>
            {current ? (
              <div className="visit-card mt-3">
                <div className="muted">Now with you</div>
                <div className="queue-token" style={{ color: '#fff', fontSize: 56 }}>{current.token}</div>
                <div>{current.patientId?.userId?.name || 'Patient in queue'}</div>
                <Chip>{current.status}</Chip>
                <Link className="btn btn-teal mt-3" to={`/doctor/consult/${current.appointmentId || current._id}`}>Open consultation</Link>
              </div>
            ) : <p className="muted">No patient is being seen right now.</p>}
          </Card>
        </div>
        <div className="col-lg-5">
          <Card>
            <h4>Queue</h4>
            {(queue?.queue?.items || []).slice(0, 8).map((item) => (
              <div key={item._id} className="d-flex justify-content-between py-2 border-bottom">
                <span>{item.token}</span>
                <Chip tone={item.status === 'serving' ? 'success' : 'warn'}>{item.status}</Chip>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
