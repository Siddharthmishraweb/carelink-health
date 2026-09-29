import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Chip, Notice } from '../../components/ui';

export default function LabHome() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/labs/orders').then((r) => setOrders(r.data.items || []));
  }, []);

  async function collect(id) {
    await api.post(`/labs/orders/${id}/collect`);
    refresh();
  }
  async function result(id) {
    await api.post(`/labs/orders/${id}/result`, {
      results: [{ analyte: 'Hemoglobin', value: 13.2, unit: 'g/dL', low: 12, high: 16 }],
    });
    await api.post(`/labs/orders/${id}/approve`);
    setMessage('Result entered, approved and patient notified.');
    refresh();
  }
  async function refresh() {
    const { data } = await api.get('/labs/orders');
    setOrders(data.items || []);
  }

  return (
    <Card>
      <Notice show={!!message} message={message} onClose={() => setMessage('')} />
      <h3>Laboratory worklist</h3>
      {orders.map((o) => (
        <div key={o._id} className="d-flex justify-content-between py-2 border-bottom">
          <div>
            {o.sampleCode || o._id}
            <div className="muted">{o.status}</div>
          </div>
          <div className="d-flex gap-2">
            <Chip>{o.status}</Chip>
            <button className="btn btn-ghost btn-sm" onClick={() => collect(o._id)}>Collect</button>
            <button className="btn btn-teal btn-sm" onClick={() => result(o._id)}>Enter + release</button>
          </div>
        </div>
      ))}
    </Card>
  );
}
