import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../services/api';
import { Card, Stat } from '../../components/ui';

export default function AdminHome() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/analytics/hospital').then((r) => setData(r.data)).catch(() => setData({
      cards: {
        totalPatients: 0, todayPatients: 0, todayAppointments: 0, doctorsAvailable: 0,
        activeQueues: 0, bedOccupancy: 0, todayRevenue: 0,
        beds: { available: 0, occupied: 0 },
      },
      trend: [],
    }));
  }, []);
  if (!data) return <Card>Loading command center…</Card>;
  const c = data.cards;
  const beds = c.beds || { available: 0, occupied: 0 };

  return (
    <div>
      <h1>Good morning, Admin</h1>
      <div className="row g-3 my-3">
        <div className="col-md-3"><Stat label="Total patients" value={c.totalPatients} /></div>
        <div className="col-md-3"><Stat label="Today’s patients" value={c.todayPatients} /></div>
        <div className="col-md-3"><Stat label="Appointments" value={c.todayAppointments} /></div>
        <div className="col-md-3"><Stat label="Doctors available" value={c.doctorsAvailable} /></div>
        <div className="col-md-3"><Stat label="Active queues" value={c.activeQueues} /></div>
        <div className="col-md-3"><Stat label="Bed occupancy" value={`${c.bedOccupancy}%`} /></div>
        <div className="col-md-3"><Stat label="Today’s revenue" value={`₹${c.todayRevenue}`} /></div>
        <div className="col-md-3"><Stat label="Beds available" value={beds.available} hint={`${beds.occupied} occupied`} /></div>
      </div>
      <Card>
        <h4>Patient volume</h4>
        <div style={{ height: 280 }}>
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
  );
}
