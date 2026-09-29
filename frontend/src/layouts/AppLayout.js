import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setLocale } from '../store';

const LINKS = {
  SUPER_ADMIN: [
    ['/super', 'Overview'],
    ['/super/hospitals', 'Hospitals'],
    ['/super/users', 'Users'],
    ['/super/plans', 'Plans'],
    ['/super/camps', 'Health camps'],
    ['/super/tickets', 'Support'],
    ['/super/audit', 'Audit logs'],
  ],
  HOSPITAL_ADMIN: [
    ['/admin', 'Command center'],
    ['/admin/staff', 'Staff'],
    ['/admin/appointments', 'Appointments'],
    ['/admin/patients', 'Patients'],
    ['/admin/beds', 'Beds'],
    ['/admin/pharmacy', 'Pharmacy'],
    ['/admin/labs', 'Laboratory'],
    ['/admin/billing', 'Billing'],
    ['/admin/camps', 'Health camps'],
    ['/admin/inventory', 'Inventory'],
    ['/admin/announcements', 'Announcements'],
    ['/display', 'Queue display'],
  ],
  DOCTOR: [
    ['/doctor', 'Today'],
    ['/doctor/queue', 'Live queue'],
    ['/doctor/patients', 'Patients'],
    ['/doctor/referrals', 'Referrals'],
  ],
  RECEPTIONIST: [
    ['/reception', 'Reception'],
    ['/reception/patients', 'Patients'],
    ['/reception/billing', 'Payments'],
  ],
  NURSE: [
    ['/nurse', 'Assigned patients'],
    ['/nurse/beds', 'Beds'],
  ],
  PHARMACIST: [
    ['/pharmacy', 'Prescription queue'],
    ['/pharmacy/stock', 'Inventory'],
  ],
  LAB_TECHNICIAN: [
    ['/lab', 'Lab orders'],
    ['/lab/catalog', 'Test catalog'],
  ],
};

export default function AppLayout() {
  const { user, locale } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const links = LINKS[user?.role] || [];

  return (
    <div className="d-flex app-shell">
      <aside className="sidebar">
        <div className="brand">CareLink</div>
        <div className="mb-4" style={{ fontSize: 13, opacity: 0.85 }}>
          {user?.name}
          <div className="role-pill">{(user?.role || '').replaceAll('_', ' ')}</div>
        </div>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to.split('/').length === 2}>{label}</NavLink>
        ))}
        <button
          className="btn btn-ghost w-100 mt-4"
          onClick={() => { dispatch(logout()); navigate('/'); }}
        >
          Sign out
        </button>
      </aside>
      <div className="main-col">
        <div className="topbar">
          <div>
            <div className="hello-kicker">CareLink</div>
            <div className="muted">Live hospital workspace</div>
          </div>
          <button className="btn btn-ghost btn-sm lang-toggle" onClick={() => dispatch(setLocale(locale === 'en' ? 'hi' : 'en'))}>
            {locale === 'en' ? 'हिंदी' : 'English'}
          </button>
        </div>
        <div className="page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
