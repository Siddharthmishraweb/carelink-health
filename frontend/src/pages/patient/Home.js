import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store';
import api from '../../services/api';
import { Card, Chip, Loading } from '../../components/ui';
import { t } from '../../utils/i18n';

const STEPS = [
  ['confirmed', 'Booked'],
  ['in_queue', 'Queue'],
  ['in_consult', 'Doctor'],
  ['completed', 'Done'],
];

function stepIndex(status) {
  if (status === 'arrived') return 1;
  const index = STEPS.findIndex(([key]) => key === status);
  return index === -1 ? 0 : index;
}

export default function PatientHome() {
  const { user, extras, locale } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [appts, camps, notes, family] = await Promise.all([
          api.get('/appointments'),
          api.get('/health-camps'),
          api.get('/notifications'),
          api.get('/family'),
        ]);
        setData({
          appointments: appts.data.items || [],
          camps: camps.data.items || [],
          notifications: notes.data.items || [],
          family: family.data.items || [],
        });
      } catch (_error) {
        setData({ appointments: [], camps: [], notifications: [], family: [] });
      }
    }
    load();
  }, []);

  if (!data) return <div className="patient-home"><Loading /></div>;
  const today = data.appointments.find((a) => ['confirmed', 'in_queue', 'arrived', 'in_consult', 'completed'].includes(a.status) && new Date(a.slotStart).toDateString() === new Date().toDateString())
    || data.appointments.find((a) => ['confirmed', 'in_queue', 'arrived', 'in_consult'].includes(a.status));
  const upcoming = data.appointments.filter((a) => a !== today).slice(0, 2);
  const unread = data.notifications.filter((n) => !n.read).slice(0, 3);
  const activeStep = today ? stepIndex(today.status) : -1;
  const slot = today ? new Date(today.slotStart) : null;
  const leaveAt = slot ? new Date(slot.getTime() - 20 * 60000) : null;

  return (
    <div className="patient-home">
      <div className="home-head d-flex justify-content-between align-items-start">
        <div>
          <div className="hello-kicker">{t(locale, 'greeting')}</div>
          <h1 style={{ fontSize: 36, margin: '4px 0 0' }}>{user.name.split(' ')[0]}</h1>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => { dispatch(logout()); navigate('/login'); }}>Sign out</button>
          <Link to="/app/emergency" className="btn btn-danger btn-sm">Emergency</Link>
        </div>
      </div>

      {today ? (
        <div className="visit-card mt-3">
          <div className="d-flex justify-content-between">
            <div className="muted">Today’s visit</div>
            <Chip>{today.token}</Chip>
          </div>
          <h3 className="mt-2 mb-1" style={{ color: '#fff' }}>{today.doctorId?.userId?.name || 'Your doctor'}</h3>
          <div>{today.departmentId?.name || 'OPD'} · Room {today.roomNumber || '—'}</div>
          <div className="journey">
            {STEPS.map(([key, label], index) => (
              <div key={key} className={`journey-step ${index <= activeStep ? 'on' : ''}`}>
                <i />
                <small>{label}</small>
              </div>
            ))}
          </div>
          <Link className="btn btn-teal w-100 mt-3" to={`/app/queue/${today._id}`}>Track from home</Link>
        </div>
      ) : (
        <Card className="mt-3">
          <strong>No visit today</strong>
          <p className="muted mb-2">Find a doctor and book a slot. You can wait from home once you have a token.</p>
          <Link className="btn btn-navy" to="/app/search">{t(locale, 'findDoctor')}</Link>
        </Card>
      )}

      {leaveAt && today?.status !== 'completed' ? (
        <div className="leave-card mt-3">
          <div className="muted">Leave-home window</div>
          <strong>Aim to reach the hospital by {leaveAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
          <div className="muted mt-1">That is about 20 minutes before your {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} slot, so you are not standing in a physical line.</div>
        </div>
      ) : null}

      <div className="action-grid mt-3">
        {[
          ['/app/search', 'Find care', 'Doctors and slots'],
          ['/app/records', 'My records', 'Timeline and reports'],
          ['/app/bills', 'Bills', 'Pay what is due'],
          ['/app/documents', 'Vault', 'Store reports safely'],
        ].map(([to, title, hint]) => (
          <Link key={to} to={to} className="action-tile">
            <strong>{title}</strong>
            <div className="muted" style={{ fontSize: 13 }}>{hint}</div>
          </Link>
        ))}
      </div>

      <div className="pass-card mt-3">
        <div>
          <div className="muted">Digital Health ID</div>
          <strong>{extras.patient?.healthId || '—'}</strong>
          <div className="muted" style={{ fontSize: 12 }}>Show this at reception. It identifies you only.</div>
        </div>
        <Link className="btn btn-ghost btn-sm" to="/app/emergency">Open card</Link>
      </div>

      <Card className="mt-3">
        <div className="d-flex justify-content-between">
          <strong>Family pulse</strong>
          <Link to="/app/family">Manage</Link>
        </div>
        {data.family.length === 0 ? <p className="muted mb-0 mt-2">Add a family member to book and track care for them.</p> : data.family.slice(0, 4).map((member) => (
          <div className="family-row" key={member._id}>
            <div>
              <strong>{member.name}</strong>
              <div className="muted">{member.relationship}</div>
            </div>
            <Chip>{member.healthId?.slice(-6)}</Chip>
          </div>
        ))}
      </Card>

      {upcoming[0] ? (
        <Card className="mt-3">
          <div className="muted">Coming up</div>
          <strong>{upcoming[0].doctorId?.userId?.name}</strong>
          <div className="muted">{new Date(upcoming[0].slotStart).toLocaleString()}</div>
        </Card>
      ) : null}

      <Card className="mt-3">
        <div className="d-flex justify-content-between">
          <strong>Reminders</strong>
          <span className="muted">{unread.length} new</span>
        </div>
        {unread.length === 0 ? <p className="muted mb-0 mt-2">You are caught up.</p> : unread.map((note) => (
          <div className="note-row" key={note._id}>
            <div>
              <strong>{note.title}</strong>
              <div className="muted">{note.body}</div>
            </div>
            <Chip tone="info">{note.category}</Chip>
          </div>
        ))}
      </Card>

      <Card className="mt-3 mb-2">
        <div className="d-flex justify-content-between">
          <strong>Camps near you</strong>
          <Link to="/app/camps">See all</Link>
        </div>
        {data.camps.slice(0, 2).map((camp) => (
          <div className="note-row" key={camp._id}>
            <div>
              <strong>{camp.title}</strong>
              <div className="muted">{new Date(camp.date).toDateString()} · {camp.startTime}–{camp.endTime}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
