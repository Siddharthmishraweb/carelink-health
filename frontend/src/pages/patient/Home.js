import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store';
import api from '../../services/api';
import { Card, Chip, Loading } from '../../components/ui';
import { t } from '../../utils/i18n';

export default function PatientHome() {
  const { user, extras, locale } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [appts, camps, notes] = await Promise.all([
          api.get('/appointments'),
          api.get('/health-camps'),
          api.get('/notifications'),
        ]);
        setData({
          appointments: appts.data.items || [],
          camps: camps.data.items || [],
          notifications: notes.data.items || [],
        });
      } catch (_error) {
        setData({ appointments: [], camps: [], notifications: [] });
      }
    }
    load();
  }, []);

  if (!data) return <div className="patient-home"><Loading /></div>;
  const today = data.appointments.find((a) => ['confirmed', 'in_queue', 'arrived', 'in_consult'].includes(a.status));
  const upcoming = data.appointments.filter((a) => a !== today).slice(0, 2);

  return (
    <div className="patient-home">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="muted">{t(locale, 'greeting')}</div>
          <h1 style={{ fontSize: 34 }}>{user.name.split(' ')[0]} 👋</h1>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => { dispatch(logout()); navigate('/login'); }}>Sign out</button>
          <Link to="/app/emergency" className="btn btn-danger">Emergency</Link>
        </div>
      </div>
      <p className="muted">How can we help you?</p>
      <Link to="/app/search" className="btn btn-navy w-100 mb-3">🔎 {t(locale, 'findDoctor')}</Link>

      {today ? (
        <Card className="mb-3">
          <div className="muted">Today’s appointment</div>
          <h4 className="mt-2">{today.doctorId?.userId?.name || 'Doctor'}</h4>
          <div>{today.departmentId?.name}</div>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>Token <strong>{today.token}</strong></div>
            <Chip tone="warn">{today.status.replace('_', ' ')}</Chip>
          </div>
          <Link className="btn btn-teal w-100 mt-3" to={`/app/queue/${today._id}`}>{t(locale, 'queue')}</Link>
        </Card>
      ) : (
        <Card className="mb-3"><div className="muted">No visit scheduled today. Book when you are ready.</div></Card>
      )}

      <div className="row g-2 mb-3">
        {[
          ['/app/search', '📅', t(locale, 'appointments')],
          ['/app/records', '📋', t(locale, 'records')],
          ['/app/records', '💊', t(locale, 'prescriptions')],
          ['/app/records', '🧪', t(locale, 'labs')],
        ].map(([to, icon, label]) => (
          <div className="col-6" key={label}>
            <Link to={to}><Card>{icon}<div className="mt-2"><strong>{label}</strong></div></Card></Link>
          </div>
        ))}
      </div>

      {upcoming[0] ? (
        <Card className="mb-3">
          <div className="muted">Upcoming</div>
          <strong>{upcoming[0].doctorId?.userId?.name}</strong>
          <div className="muted">{new Date(upcoming[0].slotStart).toLocaleString()}</div>
        </Card>
      ) : null}

      <Card className="mb-3">
        <div className="d-flex justify-content-between">
          <strong>{t(locale, 'camps')}</strong>
          <Link to="/app/camps">See all</Link>
        </div>
        {(data.camps.slice(0, 2)).map((camp) => (
          <div key={camp._id} className="mt-3">
            <div>❤️ {camp.title}</div>
            <div className="muted">{new Date(camp.date).toDateString()} • {camp.startTime}–{camp.endTime}</div>
          </div>
        ))}
      </Card>

      <div className="d-flex gap-2">
        <Link className="btn btn-ghost flex-grow-1" to="/app/family">{t(locale, 'family')}</Link>
        <Link className="btn btn-ghost flex-grow-1" to="/app/bills">Bills</Link>
        <Link className="btn btn-ghost flex-grow-1" to="/app/documents">Vault</Link>
      </div>
      <div className="muted mt-3" style={{ fontSize: 12 }}>Health ID: {extras.patient?.healthId}</div>
    </div>
  );
}
