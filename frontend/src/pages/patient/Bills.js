import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Chip } from '../../components/ui';

export default function PatientBills() {
  const [invoices, setInvoices] = useState([]);
  useEffect(() => {
    api.get('/billing/invoices').then((r) => setInvoices(r.data.items || []));
  }, []);

  async function pay(id) {
    await api.post(`/billing/invoices/${id}/pay`, { method: 'upi' });
    const { data } = await api.get('/billing/invoices');
    setInvoices(data.items || []);
  }

  return (
    <div className="patient-home">
      <h2>Bills</h2>
      {invoices.map((inv) => (
        <Card key={inv._id} className="mb-2">
          <div className="d-flex justify-content-between">
            <strong>{inv.number}</strong>
            <Chip tone={inv.status === 'paid' ? 'success' : 'warn'}>{inv.status}</Chip>
          </div>
          <div>₹{inv.total} • paid ₹{inv.paid}</div>
          {inv.status !== 'paid' ? <button className="btn btn-navy btn-sm mt-2" onClick={() => pay(inv._id)}>Pay now</button> : null}
        </Card>
      ))}
    </div>
  );
}
