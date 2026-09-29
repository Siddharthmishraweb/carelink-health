import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/ui';

const emoji = { Spouse: '👩', Wife: '👩', Daughter: '👧', Father: '👴', Mother: '👵', Son: '👦' };

export default function PatientFamily() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ name: '', relationship: 'Daughter', gender: 'female' });

  useEffect(() => {
    api.get('/family').then((r) => setMembers(r.data.items || []));
  }, []);

  async function add(e) {
    e.preventDefault();
    const { data } = await api.post('/family', form);
    setMembers((m) => [data.member, ...m]);
  }

  return (
    <div className="patient-home">
      <h2>My family</h2>
      {members.map((m) => (
        <Card key={m._id} className="mb-2">
          <strong>{emoji[m.relationship] || '👤'} {m.name}</strong>
          <div className="muted">{m.relationship} • {m.healthId}</div>
        </Card>
      ))}
      <Card className="mt-3">
        <h5>Add a family member</h5>
        <form onSubmit={add}>
          <input className="form-control mb-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="form-control mb-2" placeholder="Relationship" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} />
          <button className="btn btn-navy w-100">Save</button>
        </form>
      </Card>
    </div>
  );
}
