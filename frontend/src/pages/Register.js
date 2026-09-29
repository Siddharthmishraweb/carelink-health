import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { setAuth } from '../store';
import { Card } from '../components/ui';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', gender: 'male' });
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/register', form);
      dispatch(setAuth({ token: data.token, user: data.user, extras: { patient: data.patient } }));
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to register');
    }
  }

  return (
    <div className="page-narrow py-5 px-3" style={{ maxWidth: 560 }}>
      <h1>Create your health account</h1>
      <p className="muted">Simple registration for you and later, your family.</p>
      <Card>
        {error ? <div className="text-danger mb-2">{error}</div> : null}
        <form onSubmit={submit}>
          {[['name', 'Full name'], ['email', 'Email'], ['phone', 'Mobile'], ['password', 'Password']].map(([k, label]) => (
            <div key={k} className="mb-3">
              <label className="form-label">{label}</label>
              <input type={k === 'password' ? 'password' : 'text'} className="form-control" value={form[k]} onChange={(e) => set(k, e.target.value)} required />
            </div>
          ))}
          <button className="btn btn-navy w-100">Get started</button>
        </form>
      </Card>
    </div>
  );
}
