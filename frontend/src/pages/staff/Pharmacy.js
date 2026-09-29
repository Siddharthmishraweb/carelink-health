import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Chip, Notice } from '../../components/ui';

export default function PharmacyHome() {
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/pharmacy/orders').then((r) => setOrders(r.data.items || []));
    api.get('/pharmacy/medicines').then((r) => setStock(r.data.items || []));
  }, []);

  async function dispense(id) {
    await api.post(`/pharmacy/orders/${id}/dispense`);
    const { data } = await api.get('/pharmacy/orders');
    setOrders(data.items || []);
    setMessage('Medicines dispensed and invoice generated.');
  }

  return (
    <div className="row g-3">
      <Notice show={!!message} message={message} onClose={() => setMessage('')} />
      <div className="col-lg-7">
        <Card>
          <h3>Prescription queue</h3>
          {orders.map((o) => (
            <div key={o._id} className="d-flex justify-content-between py-2 border-bottom">
              <div>{o.items?.map((i) => i.name).join(', ')}</div>
              <div className="d-flex gap-2">
                <Chip>{o.status}</Chip>
                {o.status !== 'dispensed' ? <button className="btn btn-teal btn-sm" onClick={() => dispense(o._id)}>Dispense</button> : null}
              </div>
            </div>
          ))}
        </Card>
      </div>
      <div className="col-lg-5">
        <Card>
          <h4>Stock alerts</h4>
          {stock.map((m) => (
            <div key={m._id} className="d-flex justify-content-between py-2">
              <span>{m.name}</span>
              <Chip tone={m.quantity <= m.reorderLevel ? 'danger' : 'success'}>{m.quantity}</Chip>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
