import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../services/api';
import { Card, Chip, Stat } from '../../components/ui';

export default function AdminHome() {
  const [data, setData] = useState(null);
  const [attention, setAttention] = useState({ stock: [], bills: [], queues: [] });

  useEffect(() => {
    api.get('/analytics/hospital').then((r) => setData(r.data)).catch(() => setData({
      cards: {
        totalPatients: 0, todayPatients: 0, todayAppointments: 0, doctorsAvailable: 0,
        activeQueues: 0, bedOccupancy: 0, todayRevenue: 0, todayCompleted: 0,
        beds: { available: 0, occupied: 0, total: 0 },
      },
      trend: [],
    }));
    Promise.all([
      api.get('/inventory').catch(() => ({ data: { items: [] } })),
      api.get('/billing/invoices').catch(() => ({ data: { items: [] } })),
      api.get('/appointments', { params: { date: new Date().toISOString().slice(0, 10) } }).catch(() => ({ data: { items: [] } })),
    ]).then(([stock, bills, appts]) => {
      setAttention({
        stock: (stock.data.items || []).filter((item) => Number(item.quantity) <= Number(item.reorderLevel || 0)).slice(0, 4),
        bills: (bills.data.items || []).filter((item) => item.status !== 'paid').slice(0, 4),
        waiting: (appts.data.items || []).filter((item) => ['in_queue', 'arrived', 'confirmed'].includes(item.status)).length,
        completed: (appts.data.items || []).filter((item) => item.status === 'completed').length,
      });
    });
  }, []);

  if (!data) return <Card>Loading command center…</Card>;
  const c = data.cards;
  const beds = c.beds || { available: 0, occupied: 0, total: 0 };
  const occupancy = c.bedOccupancy || 0;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3">
        <div>
          <div className="hello-kicker">Hospital command</div>
          <h1 className="mb-0">Today at a glance</h1>
        </div>
        <Link className="btn btn-navy" to="/display">Open queue display</Link>
      </div>

      <div className="row g-3 my-3">
        <div className="col-md-3"><Stat label="Patients on record" value={c.totalPatients} /></div>
        <div className="col-md-3"><Stat label="Seen today" value={c.todayPatients} hint={`${attention.completed || c.todayCompleted || 0} completed`} /></div>
        <div className="col-md-3"><Stat label="Still in flow" value={attention.waiting || 0} hint="Booked, arrived, or waiting" /></div>
        <div className="col-md-3"><Stat label="Doctors on floor" value={c.doctorsAvailable} /></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-7">
          <Card className="mb-3">
            <div className="d-flex justify-content-between">
              <h4 className="mb-1">Bed pressure</h4>
              <Chip tone={occupancy > 85 ? 'danger' : 'success'}>{occupancy}% occupied</Chip>
            </div>
            <div className="meter mt-3"><span style={{ width: `${Math.min(occupancy, 100)}%` }} /></div>
            <div className="d-flex justify-content-between mt-2 muted">
              <span>{beds.available} free</span>
              <span>{beds.occupied} occupied</span>
              <span>{beds.total || beds.available + beds.occupied} total</span>
            </div>
            <Link className="btn btn-ghost btn-sm mt-3" to="/admin/beds">Manage beds</Link>
          </Card>
          <Card>
            <h4>Patient volume</h4>
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <AreaChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="patients" stroke="#0d9488" fill="#e6f7f5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="col-lg-5">
          <Card className="mb-3">
            <div className="muted">Collected today</div>
            <div className="stat-number">₹{c.todayRevenue}</div>
            <Link to="/admin/billing">Open billing</Link>
          </Card>
          <Card>
            <h4>Needs attention</h4>
            {attention.stock.map((item) => (
              <div className="attention-item" key={item._id}>
                <div>
                  <strong>{item.name}</strong>
                  <div className="muted">Stock {item.quantity}</div>
                </div>
                <Chip tone="danger">Low</Chip>
              </div>
            ))}
            {attention.bills.map((item) => (
              <div className="attention-item" key={item._id}>
                <div>
                  <strong>{item.number}</strong>
                  <div className="muted">₹{item.total - (item.paid || 0)} outstanding</div>
                </div>
                <Chip tone="warn">{item.status}</Chip>
              </div>
            ))}
            {!attention.stock.length && !attention.bills.length ? <p className="muted mb-0">Nothing urgent right now.</p> : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
