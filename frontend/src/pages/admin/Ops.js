import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Chip } from '../../components/ui';

const CONFIG = {
  appointments: { url: '/appointments', title: 'Appointments' },
  beds: { url: '/beds', title: 'Beds' },
  pharmacy: { url: '/pharmacy/orders', title: 'Pharmacy queue' },
  labs: { url: '/labs/orders', title: 'Lab orders' },
  billing: { url: '/billing/invoices', title: 'Billing' },
  camps: { url: '/health-camps', title: 'Health camps' },
  inventory: { url: '/inventory', title: 'Inventory' },
  announcements: { url: '/announcements', title: 'Announcements' },
};

export default function AdminOps({ mode }) {
  const cfg = CONFIG[mode];
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    api.get(cfg.url).then((r) => setItems(r.data.items || []));
  }, [cfg.url]);

  async function createAnnouncement(e) {
    e.preventDefault();
    await api.post('/announcements', { title, body, audience: 'all' });
    const { data } = await api.get(cfg.url);
    setItems(data.items || []);
  }

  async function createCamp(e) {
    e.preventDefault();
    await api.post('/health-camps', {
      title,
      description: body,
      date: new Date(),
      startTime: '09:00',
      endTime: '13:00',
      location: 'Main lobby',
      slots: 80,
      status: 'open',
    });
    const { data } = await api.get(cfg.url);
    setItems(data.items || []);
  }

  return (
    <Card>
      <h3>{cfg.title}</h3>
      {mode === 'announcements' ? (
        <form className="mb-3" onSubmit={createAnnouncement}>
          <input className="form-control mb-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="form-control mb-2" placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} />
          <button className="btn btn-navy">Send announcement</button>
        </form>
      ) : null}
      {mode === 'camps' ? (
        <form className="mb-3" onSubmit={createCamp}>
          <input className="form-control mb-2" placeholder="Camp title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="form-control mb-2" placeholder="Description" value={body} onChange={(e) => setBody(e.target.value)} />
          <button className="btn btn-navy">Create camp</button>
        </form>
      ) : null}
      <table className="table-modern">
        <thead><tr><th>Record</th><th>Status</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.title || item.number || item.name || item.code || item.token || item.sku}</td>
              <td><Chip>{item.status || item.category || '—'}</Chip></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
