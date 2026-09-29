import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/ui';

export default function AdminPeople({ mode = 'staff' }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', staffType: 'NURSE', specialization: 'General Medicine' });

  useEffect(() => {
    const url = mode === 'patients' ? '/patients' : '/staff';
    api.get(url, { params: { q } }).then((r) => setItems(r.data.items || []));
  }, [mode, q]);

  async function create(e) {
    e.preventDefault();
    if (mode === 'patients') {
      await api.post('/patients/walk-in', form);
    } else {
      await api.post('/staff', form);
    }
    const url = mode === 'patients' ? '/patients' : '/staff';
    const { data } = await api.get(url);
    setItems(data.items || []);
  }

  return (
    <div className="row g-3">
      <div className="col-lg-7">
        <Card>
          <h3>{mode === 'patients' ? 'Patients' : 'Staff'}</h3>
          <input className="form-control mb-3" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <table className="table-modern">
            <thead><tr><th>Name</th><th>Detail</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.userId?.name || item.name}</td>
                  <td>{item.healthId || item.staffType || item.userId?.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="col-lg-5">
        <Card>
          <h4>{mode === 'patients' ? 'Register walk-in' : 'Add staff'}</h4>
          <form onSubmit={create}>
            {['name', 'email', 'phone'].map((k) => (
              <input key={k} className="form-control mb-2" placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            ))}
            {mode !== 'patients' ? (
              <select className="form-select mb-2" value={form.staffType} onChange={(e) => setForm({ ...form, staffType: e.target.value })}>
                {['NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN'].map((r) => <option key={r}>{r}</option>)}
              </select>
            ) : null}
            <button className="btn btn-navy w-100">Save</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
