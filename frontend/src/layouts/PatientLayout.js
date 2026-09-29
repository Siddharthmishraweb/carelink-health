import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { t } from '../utils/i18n';

export default function PatientLayout() {
  const locale = useSelector((s) => s.auth.locale);
  return (
    <div className="app-shell patient-shell">
      <Outlet />
      <nav className="bottom-nav">
        <NavLink to="/app" end>Home</NavLink>
        <NavLink to="/app/records">{t(locale, 'records')}</NavLink>
        <NavLink to="/app/family">{t(locale, 'family')}</NavLink>
        <NavLink to="/app/emergency">{t(locale, 'emergency')}</NavLink>
      </nav>
    </div>
  );
}
