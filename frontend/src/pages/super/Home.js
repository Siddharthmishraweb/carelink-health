import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Chip, Stat } from '../../components/ui';

export default function SuperHome({ tab = 'overview' }) {
  const [cards, setCards] = useState({});
  const [hospitals, setHospitals] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [audit, setAudit] = useState([]);
  const [camps, setCamps] = useState([]);

  useEffect(() => {
    api.get('/analytics/platform').then((r) => setCards(r.data.cards || {}));
    api.get('/hospitals').then((r) => setHospitals(r.data.items || []));
    api.get('/users').then((r) => setUsers(r.data.items || []));
    api.get('/plans').then((r) => setPlans(r.data.items || []));
    api.get('/tickets').then((r) => setTickets(r.data.items || []));
    api.get('/audit-logs').then((r) => setAudit(r.data.items || []));
    api.get('/health-camps').then((r) => setCamps(r.data.items || []));
  }, []);

  async function decide(id, status) {
    await api.post(`/hospitals/${id}/status`, { status });
    const { data } = await api.get('/hospitals');
    setHospitals(data.items || []);
  }

  if (tab === 'hospitals') {
    return (
      <Card>
        <h3>Hospital onboarding</h3>
        {hospitals.map((h) => (
          <div key={h._id} className="d-flex justify-content-between py-2 border-bottom">
            <div><strong>{h.name}</strong><div className="muted">{h.address?.city} • {h.subscription?.planCode}</div></div>
            <div className="d-flex gap-2">
              <Chip>{h.subscription?.status}</Chip>
              <button className="btn btn-teal btn-sm" onClick={() => decide(h._id, 'active')}>Approve</button>
              <button className="btn btn-ghost btn-sm" onClick={() => decide(h._id, 'rejected')}>Reject</button>
            </div>
          </div>
        ))}
      </Card>
    );
  }

  if (tab === 'users') {
    return (
      <Card>
        <h3>Users</h3>
        {users.map((u) => <div key={u._id} className="py-2 border-bottom">{u.name} • {u.role} • {u.email}</div>)}
      </Card>
    );
  }

  if (tab === 'plans') {
    return (
      <div className="row g-3">
        {plans.map((p) => (
          <div className="col-md-4" key={p._id}>
            <Card>
              <h4>{p.name}</h4>
              <div className="stat-number">₹{p.monthlyPrice}</div>
              <ul>{(p.features || []).map((f) => <li key={f}>{f}</li>)}</ul>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'tickets') return <Card><h3>Support</h3>{tickets.map((t) => <div key={t._id}>{t.subject} • {t.status}</div>)}</Card>;
  if (tab === 'audit') return <Card><h3>Audit logs</h3>{audit.map((a) => <div key={a._id} className="py-2 border-bottom">{a.actorName} {a.action} {a.resource} • {a.reason}</div>)}</Card>;
  if (tab === 'camps') return <Card><h3>Camps</h3>{camps.map((c) => <div key={c._id}>{c.title}</div>)}</Card>;

  return (
    <div>
      <h1>Platform overview</h1>
      <div className="row g-3 my-3">
        <div className="col-md-3"><Stat label="Hospitals" value={cards.hospitals || 0} /></div>
        <div className="col-md-3"><Stat label="Doctors" value={cards.doctors || 0} /></div>
        <div className="col-md-3"><Stat label="Patients" value={cards.patients || 0} /></div>
        <div className="col-md-3"><Stat label="Revenue" value={`₹${cards.revenue || 0}`} /></div>
      </div>
    </div>
  );
}
