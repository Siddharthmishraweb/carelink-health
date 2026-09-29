import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { setAuth } from '../store';
import { Card, Notice } from '../components/ui';

const demos = [
  ['Patient', 'rahul@demo.health'],
  ['Doctor', 'amit.sharma@citycare.health'],
  ['Hospital admin', 'admin@citycare.health'],
  ['Reception', 'reception@citycare.health'],
  ['Nurse', 'nurse@citycare.health'],
  ['Pharmacy', 'pharmacy@citycare.health'],
  ['Lab', 'lab@citycare.health'],
  ['Super admin', 'superadmin@carelink.health'],
];

export default function Login() {
  const [email, setEmail] = useState('rahul@demo.health');
  const [password, setPassword] = useState('Demo@12345');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      dispatch(setAuth({
        token: data.token,
        user: data.user,
        extras: { patient: data.patient, doctor: data.doctor, staff: data.staff },
      }));
      const dest = {
        SUPER_ADMIN: '/super',
        HOSPITAL_ADMIN: '/admin',
        DOCTOR: '/doctor',
        PATIENT: '/app',
        RECEPTIONIST: '/reception',
        NURSE: '/nurse',
        PHARMACIST: '/pharmacy',
        LAB_TECHNICIAN: '/lab',
      }[data.user.role] || '/app';
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in');
    }
  }

  return (
    <div className="page-narrow py-5 px-3">
      <Notice show={!!error} message={error} variant="danger" onClose={() => setError('')} />
      <div className="row g-4">
        <div className="col-md-6">
          <h1>Sign in</h1>
          <p className="muted">Use a demo account or your own credentials.</p>
          <Card>
            <form onSubmit={submit}>
              <label className="form-label">Email</label>
              <input className="form-control mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label className="form-label">Password</label>
              <input type="password" className="form-control mb-3" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="btn btn-navy w-100" type="submit">Continue</button>
            </form>
            <div className="mt-3"><Link to="/register">Create a patient account</Link></div>
          </Card>
        </div>
        <div className="col-md-6">
          <Card>
            <h5>Demo access</h5>
            <p className="muted">Password for all demo users: <strong>Demo@12345</strong></p>
            {demos.map(([role, mail]) => (
              <button key={mail} className="btn btn-ghost w-100 mb-2 text-start" onClick={() => setEmail(mail)}>
                <strong>{role}</strong><div className="muted">{mail}</div>
              </button>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
